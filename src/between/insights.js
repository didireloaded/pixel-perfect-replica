import { statistics } from "./analysis.js";
export function explorePatterns(conversation) {
  const messages = conversation.messages;
  const stats = statistics(messages);
  const result = [];
  const add = (
    id,
    title,
    body,
    support,
    contradictions = [],
    limit = "Words alone cannot establish intent. Check the surrounding exchange.",
  ) => {
    if (!support.length) return;
    result.push({
      id,
      title,
      body,
      kind: "Source-linked observation",
      ids: support.slice(0, 4).map((m) => m.id),
      counterIds: contradictions.slice(0, 3).map((m) => m.id),
      limit,
    });
  };
  const positive = messages.filter((m) =>
    /\b(thank\w*|appreciat\w*|proud|good luck|love you|help you)\b/i.test(m.body),
  );
  const difficulties = messages.filter((m) =>
    /\b(hurt|upset|ignored|unheard|angry|disappoint\w*)\b/i.test(m.body),
  );
  add(
    "support",
    "Support & appreciation",
    `${positive.length} messages use appreciation or support language.`,
    positive,
    difficulties,
    "Sarcasm and negation can change meaning. Difficult exchanges are included as possible counterexamples, not proof that support is absent.",
  );
  const repair = messages.filter((m) =>
    /\b(sorry|apologi\w*|my fault|take responsibility|should have)\b/i.test(m.body),
  );
  add(
    "repair",
    "Apologies & repair",
    `${repair.length} messages include apology or accountability language.`,
    repair,
    difficulties,
    "An apology does not establish that the issue was resolved. Open the subsequent messages.",
  );
  const requests = messages.filter((m) =>
    /\b(can (we|you)|could (we|you)|please|i need|i would like)\b/i.test(m.body),
  );
  add(
    "requests",
    "Requests worth revisiting",
    `${requests.length} messages contain request language.`,
    requests,
    [],
    "Similar wording can concern different requests. This is a shortlist for review, not a claim that a request was ignored.",
  );
  const unanswered = messages.filter(
    (m, i) =>
      m.body.includes("?") &&
      !messages
        .slice(i + 1, i + 6)
        .some(
          (n) =>
            n.speaker !== m.speaker &&
            (!m.date || !n.date || Math.abs(Date.parse(n.date) - Date.parse(m.date)) < 28800000),
        ),
  );
  add(
    "questions",
    "Questions to check",
    `${unanswered.length} questions have no nearby reply from another person under the stated review rule.`,
    unanswered,
    [],
    "Nearby means the next five source messages within eight hours when timestamps exist. Replies can be indirect, rhetorical, or happen offline.",
  );
  const boundaries = messages.filter((m) =>
    /\b(stop|space|boundary|boundaries|not comfortable|don.t want|leave me|offline)\b/i.test(
      m.body,
    ),
  );
  add(
    "boundaries",
    "Boundaries & availability",
    `${boundaries.length} messages mention limits, space or availability.`,
    boundaries,
    positive,
    "Some matches are ordinary scheduling, quoted words or jokes. Review the specific request and response.",
  );
  const plans = messages.filter((m) =>
    /\b(i.ll|we.ll|i will|we will|let.s|tomorrow|next week|meet|agreed|decided)\b/i.test(m.body),
  );
  add(
    "plans",
    conversation.connection === "Work" ? "Decisions & action candidates" : "Plans & follow-through",
    `${plans.length} messages mention plans, agreement or future action.`,
    plans,
    [],
    "A later absence of discussion does not prove an action was not completed. Treat these as candidates to confirm.",
  );
  if (!result.length)
    add(
      "coverage",
      "Conversation coverage",
      `${stats.total} messages from ${stats.people.length} participants are available for review.`,
      messages,
      [],
      "No supported keyword pattern was found. This does not mean there are no meaningful patterns.",
    );
  return result;
}
export function answerQuestion(c, question) {
  const q = question.trim();
  if (!q) return null;
  const patterns = explorePatterns(c);
  let selected = [];
  const lower = q.toLowerCase();
  if (/responsib|apolog|sorry|repair/.test(lower))
    selected = patterns.filter((p) => p.id === "repair");
  else if (/argu|disagree|conflict|hurt/.test(lower))
    selected = patterns.filter((p) => ["boundaries", "requests"].includes(p.id));
  else if (/positive|support|thank|healthy/.test(lower))
    selected = patterns.filter((p) => p.id === "support");
  else if (/plan|decision|action|promise/.test(lower))
    selected = patterns.filter((p) => p.id === "plans");
  else if (/unanswer|question/.test(lower)) selected = patterns.filter((p) => p.id === "questions");
  else if (/counter|contradict|overlook|my behav|contributing/.test(lower))
    selected = patterns.filter((p) => p.counterIds.length);
  const words = lower.match(/[\p{L}\p{N}]+/gu) || [];
  const stops = new Set(
    "what when why how this that with from about does have they there their would could should which were your you are the for and can our".split(
      " ",
    ),
  );
  const terms = words.filter((w) => w.length > 2 && !stops.has(w));
  const ids = [...new Set(selected.flatMap((p) => [...p.ids, ...p.counterIds]))];
  const ranked = c.messages
    .map((m) => ({
      m,
      score: terms.reduce((n, t) => n + (m.body.toLowerCase().includes(t) ? 1 : 0), 0),
    }))
    .filter((x) => x.score)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.m.id);
  const sources = [...new Set([...ids, ...ranked])].slice(0, 8);
  return {
    id: crypto.randomUUID(),
    question: q,
    at: new Date().toISOString(),
    text: selected.length
      ? selected.map((p) => p.body).join(" ")
      : sources.length
        ? "These excerpts match words in your question. Review their context before drawing a conclusion."
        : "There isn’t enough matching evidence to answer that from this history.",
    ids: sources,
    limitations:
      "This answer uses source retrieval and documented keyword rules. It cannot interpret hidden intentions or explain offline events.",
    counterIds: [...new Set(selected.flatMap((p) => p.counterIds))],
  };
}
export function createDraft({ goal, tone = "Gentle", kind = "Reply", ownDraft = "" }) {
  const value = goal.trim();
  if (!value) throw new Error("Describe what you want to communicate.");
  if (kind === "Rewrite" && ownDraft.trim()) {
    const clean = ownDraft.trim().replace(/\s+/g, " ");
    return tone === "Brief"
      ? clean
          .split(/(?<=[.!?])\s+/)
          .slice(0, 2)
          .join(" ")
      : clean;
  }
  if (kind === "Apology")
    return `I'm sorry for ${value}. I take responsibility for my part. I'd like to hear how it affected you and what I can do differently.`;
  if (kind === "Boundary")
    return `I need to be clear about ${value}. This is important to me. Can we talk about an arrangement that respects that?`;
  if (kind === "Talking points")
    return `• What I want to discuss: ${value}\n• One specific example, without guessing intentions\n• How it affected me\n• Your perspective and anything I may have missed\n• One next step we can agree on`;
  if (tone === "Brief") return `Can we talk about ${value}? I'd like to hear your perspective.`;
  return tone === "Direct"
    ? `I'd like to discuss ${value}. It matters to me, and I want to understand your perspective. When can we talk?`
    : `I've been thinking about ${value}. Could we make some time to talk? I'd like to understand how you see it, too.`;
}
