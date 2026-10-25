import { test } from "node:test";
import assert from "node:assert/strict";
import { processImport } from "../src/between/import-task.js";
import { exportStatisticsCSV } from "../src/between/workspace.js";
test("import worker success, failure and cancellation always terminate processing", async () => {
  const original = globalThis.Worker;
  let instance;
  globalThis.Worker = class {
    constructor() {
      instance = this;
      this.terminated = false;
    }
    postMessage(input) {
      this.input = input;
    }
    terminate() {
      this.terminated = true;
    }
  };
  try {
    const stages = [];
    const task = processImport({ text: "hello" }, { onStage: (s) => stages.push(s) });
    instance.onmessage({ data: { stage: "Reading messages…" } });
    instance.onmessage({ data: { result: { parsed: { messages: [] } } } });
    assert.deepEqual((await task).parsed.messages, []);
    assert.equal(instance.terminated, true);
    assert.equal(stages.length, 1);
    const failing = processImport({});
    instance.onmessage({ data: { error: "Invalid ZIP" } });
    await assert.rejects(failing, /Invalid ZIP/);
    assert.equal(instance.terminated, true);
    const controller = new AbortController();
    const pending = processImport({}, { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(instance.terminated, true);
  } finally {
    globalThis.Worker = original;
  }
});
test("statistics CSV escapes names and prevents spreadsheet formulas", () => {
  const csv = exportStatisticsCSV({
    messages: [
      { speaker: '=HYPERLINK("bad")', date: null, body: "Hi" },
      { speaker: "Sam, Friend", date: null, body: "Hello" },
    ],
  });
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"Sam, Friend","1","50","0"'));
});
