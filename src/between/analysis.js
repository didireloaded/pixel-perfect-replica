export const sample = `[12/10/2026, 09:10] Alex: Morning! How did your presentation go?
[12/10/2026, 09:14] Jamie: Really well actually. Thanks for remembering 💛
[12/10/2026, 09:15] Alex: Of course. I know how much work you put into it.
[12/10/2026, 18:20] Jamie: Want to make dinner together tonight?
[12/10/2026, 18:32] Alex: Yes! I'll grab groceries on the way.
[13/10/2026, 08:40] Jamie: Good morning ☀️ coffee later?
[13/10/2026, 09:02] Alex: Absolutely. After my meeting?
[13/10/2026, 19:12] Alex: I felt a bit unheard yesterday when I was talking about work.
[13/10/2026, 19:25] Jamie: I'm sorry. I was distracted, but I should have said so. Can we talk tonight?
[13/10/2026, 19:27] Alex: Thank you for saying that. Yes, I'd like that.
[14/10/2026, 10:00] Alex: Saw this and thought of you 😂
[14/10/2026, 10:05] Jamie: Our exact sense of humour haha
[14/10/2026, 18:00] Jamie: How are you feeling about yesterday?
[14/10/2026, 18:08] Alex: Better. I appreciated you making time to listen.
[15/10/2026, 08:30] Jamie: Good luck with your meeting today!
[15/10/2026, 08:34] Alex: Thanks! That means a lot.
[15/10/2026, 20:20] Alex: Can we make Sunday a phone-free afternoon?
[15/10/2026, 20:24] Jamie: Love that idea. A walk and lunch?
[16/10/2026, 12:00] Alex: I'll be offline this afternoon, big deadline.
[16/10/2026, 12:06] Jamie: No worries. Let me know if I can help.
[17/10/2026, 09:00] Jamie: We did it. Weekend at last!
[17/10/2026, 09:12] Alex: Finally! Looking forward to our walk.
[18/10/2026, 16:10] Alex: Today was lovely. We should do this more often.
[18/10/2026, 16:12] Jamie: Agreed 💛 Same time next week?`;
export function parseChat(text, order = "AUTO") {
  const messages = [],
    warnings = [];
  let skipped = 0;
  const lines = text.replace(/\r/g, "").split("\n");
  let dateOrder = order;
  let hasDMY = false,
    hasMDY = false,
    hasAmbiguous = false;
  if (order === "AUTO") {
    for (const raw of lines) {
      const prefix = raw
        .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
        .match(/^\[?(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})(?:,?\s)/);
      if (!prefix) continue;
      const a = +prefix[1],
        b = +prefix[2],
        y = +prefix[3] < 100 ? 2000 + +prefix[3] : +prefix[3];
      const valid = (m, d) => {
        const date = new Date(y, m - 1, d);
        return (
          m >= 1 &&
          d >= 1 &&
          date.getFullYear() === y &&
          date.getMonth() === m - 1 &&
          date.getDate() === d
        );
      };
      const dmy = valid(b, a),
        mdy = valid(a, b);
      if (dmy && !mdy) hasDMY = true;
      if (mdy && !dmy) hasMDY = true;
      if (dmy && mdy && a !== b) hasAmbiguous = true;
    }
    dateOrder = hasMDY && !hasDMY ? "MDY" : "DMY";
    if (hasDMY && hasMDY)
      warnings.push(
        "Mixed date orders detected. Select the matching date format and review excluded timestamps.",
      );
    else if (!hasDMY && !hasMDY && hasAmbiguous)
      warnings.push("Dates are ambiguous. Assuming day/month/year; confirm the date format below.");
  }
  let lineNumber = 0;
  for (const raw of lines) {
    lineNumber++;
    const line = raw.replace(/[\u200e\u200f\u202a-\u202e]/g, "");
    const match = line.match(
      /^\[?(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?\]?\s*(?:-\s*)?([^:]+):\s?(.*)$/i,
    );
    const plain = line.match(/^([^:\[\]\d][^:]{0,60}):\s+(.+)$/);
    if (match) {
      let [, a, b, c, h, min, seconds, amp, speaker, body] = match;
      let y, m, d;
      if (a.length === 4) [y, m, d] = [+a, +b, +c];
      else {
        y = +c < 100 ? 2000 + +c : +c;
        [m, d] = dateOrder === "MDY" ? [+a, +b] : [+b, +a];
      }
      h = +h;
      const invalidHour = amp ? h < 1 || h > 12 : h > 23;
      if (amp) h = (h % 12) + (/pm/i.test(amp) ? 12 : 0);
      const date = new Date(y, m - 1, d, h, +min, +(seconds || 0));
      if (
        date.getFullYear() !== y ||
        date.getMonth() !== m - 1 ||
        date.getDate() !== d ||
        invalidHour ||
        +min > 59 ||
        +(seconds || 0) > 59
      ) {
        warnings.push(
          `Invalid timestamp on line ${lineNumber}; check the date format. Message excluded.`,
        );
        skipped++;
        continue;
      }
      messages.push({
        id: `m${messages.length + 1}`,
        speaker: speaker.trim(),
        body,
        date: date.toISOString(),
      });
    } else if (plain)
      messages.push({
        id: `m${messages.length + 1}`,
        speaker: plain[1].trim(),
        body: plain[2],
        date: null,
      });
    else if (line.trim() && /^\[?\d+[/.\-]\d+[/.\-]\d+/.test(line)) {
      skipped++;
    } else if (line.trim() && messages.length) messages[messages.length - 1].body += "\n" + line;
    else if (line.trim()) skipped++;
  }
  const deleted = messages.filter((m) =>
    /^(?:this message was deleted|you deleted this message)\.?$/i.test(
      m.body.replace(/[\u200e\u200f]/g, "").trim(),
    ),
  );
  const deletedSet = new Set(deleted);
  const content = messages.filter((m) => !deletedSet.has(m));
  const valid = content.filter(
    (m) =>
      !/(?:<media omitted>|image omitted|video omitted|audio omitted|sticker omitted|\(file attached\))/i.test(
        m.body,
      ),
  );
  if (valid.length !== content.length)
    warnings.push(`${content.length - valid.length} attachment placeholder(s) excluded.`);
  if (deleted.length) warnings.push(`${deleted.length} deleted-message placeholder(s) excluded.`);
  if (skipped) warnings.push(`${skipped} unrecognised or system line(s) excluded.`);
  if (valid.some((m) => !m.date))
    warnings.push("Some timestamps are missing. Timing metrics exclude these messages.");
  const dated = valid.filter((m) => m.date);
  if (dated.some((m, i) => i && m.date < dated[i - 1].date))
    warnings.push("Timing uses chronological order. Source messages keep their original order.");
  return { messages: valid, warnings, dateOrder };
}
export function redact(messages, names = {}, contacts = true) {
  const replace = (s) => {
    let out = s;
    for (const [a, b] of Object.entries(names).sort((a, b) => b[0].length - a[0].length))
      if (a && b) out = out.split(a).join(b);
    return contacts
      ? out
          .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]")
          .replace(/\+?\d[\d ()-]{7,}\d/g, "[phone]")
      : out;
  };
  return messages.map((m) => ({
    ...m,
    speaker: names[m.speaker] || m.speaker,
    body: replace(m.body),
  }));
}
export function dayKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function statistics(messages) {
  const people = [...new Set(messages.map((m) => m.speaker))];
  const counts = Object.fromEntries(people.map((p) => [p, 0]));
  const starts = { ...counts };
  const replies = Object.fromEntries(people.map((p) => [p, []]));
  const days = {};
  messages.forEach((m) => {
    counts[m.speaker]++;
  });
  const timeline = messages
    .filter((m) => m.date && Number.isFinite(Date.parse(m.date)))
    .slice()
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  timeline.forEach((m, i) => {
    const day = dayKey(m.date);
    days[day] = (days[day] || 0) + 1;
    const prev = timeline[i - 1];
    const gap = prev ? (Date.parse(m.date) - Date.parse(prev.date)) / 60000 : null;
    if (i === 0 || gap >= 480) starts[m.speaker]++;
    if (prev && prev.speaker !== m.speaker && gap < 480) replies[m.speaker].push(gap);
  });
  return { people, counts, starts, replies, days, total: messages.length };
}
export function findings(messages) {
  const s = statistics(messages);
  const items = [];
  if (messages.length)
    items.push({
      title: "A closer look at the conversation",
      kind: "Measured observation",
      body: `${s.people.length} participants contributed ${s.total} messages in the selected history. Message volume describes participation, not how much someone cares.`,
      ids: messages.slice(0, 2).map((m) => m.id),
      limit: "These messages cannot show what happened in person or in other conversations.",
    });
  const support = messages.filter((m) =>
    /thank|appreciat|good luck|help|proud|remember/i.test(m.body),
  );
  if (support.length)
    items.push({
      title: "Small moments of support",
      kind: "Language match · review context",
      body: `${support.length} messages include words associated with gratitude or support. The excerpts let you check whether that reading fits the conversation.`,
      ids: support.slice(0, 3).map((m) => m.id),
      limit:
        "Keyword matches can include sarcasm, negation, or quoted text. They are not a judgement of intent.",
    });
  const repair = messages.filter((m) =>
    /sorry|apologi|my fault|should have|can we talk/i.test(m.body),
  );
  if (repair.length)
    items.push({
      title: "Room to reconnect",
      kind: "Language match · review context",
      body: `${repair.length} messages contain apology or discussion language. These may be openings for repair; the surrounding exchange matters.`,
      ids: repair.slice(0, 3).map((m) => m.id),
      limit: "An apology alone does not establish accountability, resolution, or lasting change.",
    });
  const questions = messages.filter((m) => m.body.includes("?"));
  if (questions.length)
    items.push({
      title: "Questions invite a response",
      kind: "Measured observation",
      body: `${questions.length} messages contain a question mark. Explore the surrounding messages before deciding whether an answer was given.`,
      ids: questions.slice(0, 3).map((m) => m.id),
      limit: "Questions may be rhetorical, and replies can happen offline.",
    });
  return items;
}

export function conversationMetrics(messages) {
  const stats = statistics(messages);
  const dated = messages
    .filter((m) => m.date && Number.isFinite(Date.parse(m.date)))
    .slice()
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const hours = Array(24).fill(0);
  const daily = Object.entries(stats.days);
  let streak = 0,
    longestStreak = 0,
    previousDay = null,
    longestGap = 0;
  for (const [day] of daily) {
    const [y, m, d] = day.split("-").map(Number);
    const ordinal = Date.UTC(y, m - 1, d) / 86400000;
    streak = previousDay !== null && ordinal === previousDay + 1 ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);
    previousDay = ordinal;
  }
  dated.forEach((m, i) => {
    hours[new Date(m.date).getHours()]++;
    if (i) longestGap = Math.max(longestGap, Date.parse(m.date) - Date.parse(dated[i - 1].date));
  });
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length
      ? sorted.length % 2
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2
      : null;
  };
  const tokens = (body) => body.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
  const stop = new Set(
    "the a an and or to of in is it i you we he she they me my your our this that for on at be am are was were have has do did with so but not just".split(
      " ",
    ),
  );
  const longest = {},
    words = {},
    emojis = {};
  for (const p of stats.people) {
    let best = null;
    const wf = new Map(),
      ef = new Map();
    for (const m of messages.filter((m) => m.speaker === p)) {
      const parts = tokens(m.body);
      if (!best || parts.length > best.words) best = { message: m, words: parts.length };
      for (const t of parts) {
        const w = t.toLocaleLowerCase();
        if (w.length > 2 && !stop.has(w)) wf.set(w, (wf.get(w) || 0) + 1);
      }
      for (const e of m.body.match(
        /(?:\p{Regional_Indicator}{2}|[\p{Extended_Pictographic}](?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D[\p{Extended_Pictographic}](?:\uFE0F|\p{Emoji_Modifier})?)*|[0-9#*]\uFE0F?\u20E3)/gu,
      ) || [])
        ef.set(e, (ef.get(e) || 0) + 1);
    }
    const rank = (m) =>
      [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);
    longest[p] = best;
    words[p] = rank(wf);
    emojis[p] = rank(ef);
  }
  return {
    stats,
    hours,
    longestStreak,
    longestGap,
    medianReplies: Object.fromEntries(stats.people.map((p) => [p, median(stats.replies[p])])),
    busiest: daily.reduce((best, entry) => (!best || entry[1] > best[1] ? entry : best), null),
    first: dated.slice(0, 4),
    latest: dated.slice(-4),
    longest,
    words,
    emojis,
  };
}
export function messagePage(
  messages,
  { query = "", participant = "", from = "", to = "", page = 1 } = {},
) {
  const needle = query.trim().toLocaleLowerCase();
  const filtered = messages.filter(
    (m) =>
      (!needle || m.body.toLocaleLowerCase().includes(needle)) &&
      (!participant || m.speaker === participant) &&
      (!from || (m.date && dayKey(m.date) >= from)) &&
      (!to || (m.date && dayKey(m.date) <= to)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 30));
  const current = Math.min(pages, Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1));
  return {
    items: filtered.slice((current - 1) * 30, current * 30),
    total: filtered.length,
    pages,
    page: current,
  };
}
