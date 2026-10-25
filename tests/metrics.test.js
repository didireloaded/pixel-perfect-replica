import { test } from "node:test";
import assert from "node:assert/strict";
import { conversationMetrics, parseChat, messagePage } from "../src/between/analysis.js";
import { readChatFile } from "../src/between/import.js";
import { zipSync, strToU8 } from "fflate";
test("visual metrics calculate medians, streaks, gaps, busiest day and highlights", () => {
  const { messages } = parseChat(
    "[01/10/2026, 09:00] A: Hello hello 💛\n[01/10/2026, 09:04] B: Hi!\n[02/10/2026, 10:00] A: Thank you very much\n[02/10/2026, 10:08] B: Thanks\n[04/10/2026, 10:00] A: Hey",
    "DMY",
  );
  const before = JSON.stringify(messages);
  const m = conversationMetrics(messages);
  assert.equal(m.longestStreak, 2);
  assert.equal(m.longestGap, 47 * 3600000 + 52 * 60000);
  assert.equal(m.medianReplies.B, 6);
  assert.equal(m.medianReplies.A, null);
  assert.deepEqual(m.busiest, ["2026-10-01", 2]);
  assert.equal(m.hours[9], 2);
  assert.equal(m.hours[10], 3);
  assert.equal(m.longest.A.words, 4);
  assert.deepEqual(m.words.A[0], ["hello", 2]);
  assert.deepEqual(m.emojis.A, [["💛", 1]]);
  assert.equal(m.first[0].id, "m1");
  assert.equal(m.latest.at(-1).id, "m5");
  assert.equal(JSON.stringify(messages), before);
});
test("missing dates do not fabricate calendar or highlight data", () => {
  const m = conversationMetrics(parseChat("A: Hi\nB: Hello").messages);
  assert.equal(m.longestStreak, 0);
  assert.equal(m.longestGap, 0);
  assert.equal(m.busiest, null);
  assert.equal(m.first.length, 0);
  assert.equal(
    m.hours.reduce((a, b) => a + b),
    0,
  );
});
test("pagination bounds rendering and filters source messages without mutation", () => {
  const messages = Array.from({ length: 95 }, (_, i) => ({
    id: `m${i}`,
    speaker: i % 2 ? "B" : "A",
    body: i % 3 ? "hello" : "coffee",
    date: new Date(2026, 9, i < 60 ? 1 : 2, 9, i).toISOString(),
  }));
  const original = JSON.stringify(messages);
  assert.equal(messagePage(messages).items.length, 30);
  assert.equal(messagePage(messages, { page: 4 }).items.length, 5);
  assert.equal(messagePage(messages, { page: 999 }).page, 4);
  const r = messagePage(messages, {
    query: "COFFEE",
    participant: "A",
    from: "2026-10-02",
    to: "2026-10-02",
  });
  assert.equal(r.total, 6);
  assert.equal(r.items[0].id, "m60");
  assert.equal(messagePage(messages, { query: "unmatched", page: 3 }).page, 1);
  assert.equal(JSON.stringify(messages), original);
});
test("ZIP import returns original archive filename separately from extracted text", async () => {
  const file = new File(
    [zipSync({ "nested/_chat.txt": strToU8("A: Hi\nB: Hello") })],
    "My chat.zip",
  );
  const r = await readChatFile(file);
  assert.equal(r.archiveName, "My chat.zip");
  assert.equal(r.name, "_chat.txt");
});
test("reply metrics preserve timestamp seconds and reject impossible seconds", () => {
  const { messages } = parseChat(
    "[25/10/2026, 09:00:15] A: Hi\n[25/10/2026, 09:01:45] B: Hello",
    "DMY",
  );
  assert.equal(conversationMetrics(messages).medianReplies.B, 1.5);
  assert.equal(parseChat("[25/10/2026, 09:00:99] A: Invalid", "DMY").messages.length, 0);
});
