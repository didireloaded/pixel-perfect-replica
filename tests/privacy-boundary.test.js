import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";
import { privacyPolicy } from "../src/privacy-policy.js";
test("chat-processing modules cannot introduce network clients or automatic telemetry", async () => {
  const root = new URL("../src/between/", import.meta.url);
  const allowedPackages = new Set(["react", "react-dom", "lucide-react", "fflate"]);
  const forbidden = new Set([
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "sendBeacon",
    "captureException",
    "track",
    "importScripts",
  ]);
  for (const file of await readdir(root)) {
    if (!/\.(jsx?|tsx?)$/.test(file)) continue;
    const text = await readFile(new URL(file, root), "utf8");
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isImportDeclaration(node)) {
        const name = node.moduleSpecifier.text;
        assert.ok(
          name.startsWith(".") || allowedPackages.has(name),
          `${file}: unreviewed package ${name}`,
        );
      }
      if (ts.isIdentifier(node))
        assert.ok(
          !forbidden.has(node.text),
          `${file}: prohibited network/telemetry capability ${node.text}`,
        );
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "postMessage"
      ) {
        assert.ok(
          ["import-task.js", "import.worker.js", "useWorkspace.js"].includes(file),
          `${file}: unreviewed messaging boundary`,
        );
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.match(privacyPolicy, /connect-src 'none'/);
  assert.match(privacyPolicy, /form-action 'none'/);
  const rootRoute = await readFile(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");
  assert.ok(rootRoute.includes("privacyPolicy"));
  assert.ok(!rootRoute.includes("console.error("));
  const reporter = await readFile(
    new URL("../src/lib/lovable-error-reporting.ts", import.meta.url),
    "utf8",
  );
  assert.ok(!reporter.includes("captureException"));
  assert.ok(!reporter.includes("__lovableReportRuntimeError"));
});
