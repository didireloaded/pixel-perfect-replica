import { explorePatterns } from "./insights.js";
import { statistics, dayKey } from "./analysis.js";
export const connectionTypes = [
  "Relationship",
  "Dating",
  "Friendship",
  "Family",
  "Work",
  "Group",
  "Other",
];
export const newId = () => crypto.randomUUID();
export function createConversation(input) {
  if (!connectionTypes.includes(input.connection)) throw new Error("Choose a connection type.");
  if (!input.self || !input.messages.some((m) => m.speaker === input.self))
    throw new Error("Choose which participant is you.");
  const now = new Date().toISOString();
  return {
    ...input,
    id: newId(),
    title:
      input.title?.trim() ||
      input.messages
        .map((m) => m.speaker)
        .filter((p, i, a) => a.indexOf(p) === i)
        .join(" & "),
    messages: input.messages.map((m) => ({ ...m, id: newId() })),
    createdAt: now,
    updatedAt: now,
    saved: false,
    revision: 0,
    expiresAt: null,
    bookmarks: [],
    notes: [],
    goals: [],
    milestones: [],
    answers: [],
    feedback: {},
    versions: [],
  };
}
export function isExpired(c, now = Date.now()) {
  return !!c.expiresAt && Date.parse(c.expiresAt) <= now;
}
export function revise(c, changes, reason = "Updated context") {
  const changed = {
    ...c,
    ...changes,
    updatedAt: new Date().toISOString(),
    revision: c.revision + 1,
  };
  const snapshot = {
    id: newId(),
    at: changed.updatedAt,
    reason,
    context: c.context || "",
    focus: c.focus,
    findings: explorePatterns(c),
    messageCount: c.messages.length,
    feedback: { ...c.feedback },
  };
  return { ...changed, versions: [...(c.versions || []), snapshot] };
}
const fingerprint = (m) => JSON.stringify([m.speaker, m.date || null, m.body]);
export function mergeImport(c, incoming) {
  const existingPeople = new Set(c.messages.map((m) => m.speaker));
  if (incoming.messages.some((m) => !existingPeople.has(m.speaker)))
    throw new Error(
      "Participant names don’t match. Use the same name replacements, or import as a new conversation.",
    );
  const oldCounts = new Map();
  for (const m of c.messages)
    oldCounts.set(fingerprint(m), (oldCounts.get(fingerprint(m)) || 0) + 1);
  const seen = new Map();
  const additions = [];
  for (const m of incoming.messages) {
    const key = fingerprint(m),
      n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    if (n > (oldCounts.get(key) || 0)) additions.push({ ...m, id: newId() });
  }
  if (!additions.length) return { conversation: c, added: 0 };
  return {
    conversation: revise(
      c,
      {
        messages: [...c.messages, ...additions],
        filename: incoming.filename,
        warnings: [...new Set([...(c.warnings || []), ...(incoming.warnings || [])])],
      },
      `Imported ${additions.length} new messages`,
    ),
    added: additions.length,
  };
}
export function periodSummary(messages, from, to) {
  const selected = messages.filter(
    (m) => m.date && (!from || dayKey(m.date) >= from) && (!to || dayKey(m.date) <= to),
  );
  const s = statistics(selected);
  return {
    ...s,
    from,
    to,
    coverage: `${selected.length} dated messages across ${Object.keys(s.days).length} active days`,
  };
}
export function coverage(messages) {
  const dated = messages
    .filter((m) => m.date)
    .map((m) => m.date)
    .sort();
  return {
    first: dated[0] || null,
    last: dated.at(-1) || null,
    missing: messages.filter((m) => !m.date).length,
    count: messages.length,
  };
}
export function exportConversation(c, { quotes = true } = {}) {
  return {
    title: c.title,
    connection: c.connection,
    createdAt: c.createdAt,
    coverage: coverage(c.messages),
    statistics: statistics(c.messages),
    findings: explorePatterns(c).map((f) => ({
      ...f,
      ...(!quotes ? { ids: [] } : {}),
      ...(quotes ? { excerpts: f.ids.map((id) => c.messages.find((m) => m.id === id)) } : {}),
    })),
    context: c.context || "",
    notes: c.notes,
    goals: c.goals,
    versions: c.versions?.map((v) => ({
      ...v,
      findings: v.findings?.map((f) => (quotes ? f : { ...f, ids: [] })),
    })),
    ...(quotes ? { messages: c.messages } : {}),
  };
}
export function redactedInsight(finding) {
  return {
    title: finding.title,
    observation: finding.body.replace(/\b(?:your|you)\b/gi, "the participants"),
    limitation: finding.limit,
    createdAt: new Date().toISOString(),
    source: "Between · keyword observation",
  };
}

export function checkInCalendar({ date, title }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !title.trim())
    throw new Error("Choose a date and title.");
  const clean = (s) =>
    s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const day = date.replace(/-/g, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Between//Check-in//EN",
    "BEGIN:VEVENT",
    `UID:${newId()}@between`,
    `DTSTAMP:${timestamp}`,
    `DTSTART;VALUE=DATE:${day}`,
    `SUMMARY:${clean(title)}`,
    "DESCRIPTION:A check-in you chose in Between. No chat content is included.",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
