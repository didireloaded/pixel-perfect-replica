// Local-only aggregate measurement. Never print bodies, names, filenames or warnings.
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { readChatFile } from "../src/between/import.js";
import { parseChat, statistics } from "../src/between/analysis.js";
import { explorePatterns } from "../src/between/insights.js";
const target = process.argv[2];
if (!target) throw new Error("Pass a local WhatsApp ZIP or TXT path.");
const bytes = await readFile(target);
const start = performance.now();
try {
  const result = await readChatFile(
    new File([bytes], target.endsWith(".zip") ? "export.zip" : "export.txt"),
  );
  const extracted = performance.now(),
    parsed = parseChat(result.text),
    done = performance.now();
  const stats = statistics(parsed.messages),
    patterns = explorePatterns({ messages: parsed.messages, connection: "Other" });
  console.log(
    JSON.stringify({
      archiveBytes: bytes.length,
      textBytes: Buffer.byteLength(result.text),
      messages: stats.total,
      participants: stats.people.length,
      dateOrder: parsed.dateOrder,
      patterns: patterns.length,
      extractMs: +(extracted - start).toFixed(1),
      parseMs: +(done - extracted).toFixed(1),
      insightsMs: +(performance.now() - done).toFixed(1),
      runtime: process.version,
    }),
  );
} catch (error) {
  console.log(JSON.stringify({ bytes: bytes.length, rejected: error.message }));
  process.exitCode = 1;
}
