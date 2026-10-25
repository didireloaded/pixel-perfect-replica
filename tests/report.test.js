import { test } from "node:test";
import assert from "node:assert/strict";
import { activitySeries, reportPages, shortText } from "../src/between/report-model.js";
test("activity bins preserve counts and account for silent calendar days", () => {
  const bars = activitySeries({ "2026-10-01": 3, "2026-10-03": 9 });
  assert.deepEqual(
    bars.map((b) => b.count),
    [3, 0, 9],
  );
  const year = activitySeries({ "2025-01-01": 7, "2026-10-03": 11 });
  assert.ok(year.length <= 16);
  assert.equal(
    year.reduce((n, b) => n + b.count, 0),
    18,
  );
  assert.equal(year[0].from, "2025-01-01");
  assert.equal(year.at(-1).to, "2026-10-03");
  assert.deepEqual(activitySeries({}), []);
});
test("deck pagination bounds variable content without dropping participants, findings or goals", () => {
  const people = Array.from({ length: 19 }, (_, i) => `Person ${i}`),
    findings = Array.from({ length: 7 }, (_, id) => ({ id })),
    goals = Array.from({ length: 11 }, (_, id) => ({ id }));
  const pages = reportPages({
    statistics: { people, counts: Object.fromEntries(people.map((p) => [p, 3])) },
    findings,
    goals,
  });
  assert.deepEqual(
    pages.flatMap((p) => p.people || []),
    people,
  );
  assert.deepEqual(
    pages.flatMap((p) => p.findings || []),
    findings,
  );
  assert.deepEqual(
    pages.flatMap((p) => p.goals || []),
    goals,
  );
  for (const p of pages) {
    assert.ok((p.people || []).length <= 6);
    assert.ok((p.findings || []).length <= 2);
    assert.ok((p.goals || []).length <= 5);
  }
});
test("excerpts explicitly indicate truncation and preserve source content elsewhere", () => {
  const source = "A very long message ".repeat(30);
  const excerpt = shortText(source, 180);
  assert.equal(excerpt.length <= 180, true);
  assert.ok(excerpt.endsWith("…"));
  assert.ok(source.length > 180);
  assert.equal(shortText("Short message"), "Short message");
});
