import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { zipSync, strToU8 } from "fflate";
import { readChatFile } from "../src/between/import.js";
import { parseChat, statistics } from "../src/between/analysis.js";
import { explorePatterns } from "../src/between/insights.js";
for (const [name, count, order] of [
  ["ios-mdy-anonymized", 58, "MDY"],
  ["android-dmy", 3, "DMY"],
  ["ios-dotted-24h", 3, "DMY"],
]) {
  test(`${name}: ZIP extraction → parsing → source-linked insights`, async () => {
    const text = await readFile(new URL(`./fixtures/${name}.txt`, import.meta.url), "utf8");
    const archive = zipSync({ "_chat.txt": strToU8(text) });
    const imported = await readChatFile(new File([archive], `${name}.zip`));
    const result = parseChat(imported.text);
    assert.equal(result.messages.length, count);
    assert.equal(result.dateOrder, order);
    assert.equal(statistics(result.messages).people.length, 2);
    assert.ok(result.messages.every((m) => m.date && Number.isFinite(Date.parse(m.date))));
    const patterns = explorePatterns({ messages: result.messages, connection: "Friendship" });
    assert.ok(patterns.length);
    for (const p of patterns)
      for (const id of p.ids) assert.ok(result.messages.some((m) => m.id === id));
  });
}
