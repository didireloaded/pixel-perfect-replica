import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createConversation,
  mergeImport,
  revise,
  isExpired,
  exportConversation,
  periodSummary,
  checkInCalendar,
} from "../src/between/workspace.js";
import { explorePatterns, answerQuestion } from "../src/between/insights.js";
const message = (body, speaker = "Alex", date = "2026-10-01T09:00:00.000Z") => ({
  body,
  speaker,
  date,
});
const input = () => ({
  connection: "Friendship",
  self: "Alex",
  messages: [message("Thank you"), message("Sorry", "Jamie")],
  filename: "chat.zip",
});
test("import requires connection and participant identity; source IDs are fresh", () => {
  assert.throws(() => createConversation({ ...input(), connection: "" }));
  assert.throws(() => createConversation({ ...input(), self: "Unknown" }));
  const data = input(),
    c = createConversation(data);
  assert.equal(c.filename, "chat.zip");
  assert.equal(c.saved, false);
  assert.equal(new Set(c.messages.map((m) => m.id)).size, 2);
  assert.equal(data.messages[0].id, undefined);
});
test("incremental import preserves IDs and duplicate multiplicity without mutating originals", () => {
  const c = createConversation(input());
  const result = mergeImport(c, {
    messages: [...input().messages, message("Thank you")],
    filename: "updated.zip",
  });
  assert.equal(result.added, 1);
  assert.equal(result.conversation.messages.length, 3);
  assert.equal(result.conversation.messages[0].id, c.messages[0].id);
  assert.equal(c.messages.length, 2);
  assert.equal(result.conversation.versions.length, 1);
  assert.equal(
    mergeImport(result.conversation, { messages: [...input().messages, message("Thank you")] })
      .added,
    0,
  );
  assert.throws(() => mergeImport(c, { messages: [message("Hi", "Other")] }), /names/);
});
test("versions snapshot the same patterns shown in the report", () => {
  const c = createConversation(input()),
    next = revise(c, { context: "Offline context" });
  assert.equal(c.versions.length, 0);
  assert.equal(next.versions[0].context, "");
  assert.deepEqual(next.versions[0].findings, explorePatterns(c));
});
test("pattern and answer evidence references only imported messages", () => {
  const c = createConversation(input()),
    ids = new Set(c.messages.map((m) => m.id));
  for (const p of explorePatterns(c))
    for (const id of [...p.ids, ...p.counterIds]) assert.ok(ids.has(id));
  const a = answerQuestion(c, "Was there support?");
  assert.ok(a.ids.length);
  for (const id of a.ids) assert.ok(ids.has(id));
  assert.match(answerQuestion(c, "Zebras").text, /enough matching evidence/);
});
test("quote-free report omits messages and excerpt sources", () => {
  const c = createConversation(input());
  const report = exportConversation(c, { quotes: false });
  assert.equal(report.messages, undefined);
  for (const f of report.findings) {
    assert.deepEqual(f.ids, []);
    assert.equal(f.excerpts, undefined);
  }
  assert.equal(exportConversation(c).messages.length, 2);
});
test("periods exclude undated messages; expiry includes boundary", () => {
  const messages = [...input().messages, message("Unknown", "Alex", null)];
  assert.equal(periodSummary(messages, "2026-10-01", "2026-10-01").total, 2);
  assert.equal(periodSummary(messages, "2026-10-02", "2026-10-03").total, 0);
  assert.equal(
    isExpired({ expiresAt: "2026-10-01T00:00:00Z" }, Date.parse("2026-10-01T00:00:00Z")),
    true,
  );
  assert.equal(isExpired({ expiresAt: null }), false);
});
test("calendar escapes title and includes no conversation text", () => {
  const ics = checkInCalendar({ date: "2026-10-26", title: "Check, reflect\nTomorrow" });
  assert.ok(ics.includes("SUMMARY:Check\\, reflect\\nTomorrow\r\n"));
  assert.throws(() => checkInCalendar({ date: "bad", title: "Review" }));
});
