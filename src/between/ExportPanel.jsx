import React, { useState } from "react";
import { createPortal } from "react-dom";
import { exportConversation, redactedInsight } from "./workspace";
import { explorePatterns } from "./insights";
export function downloadText(text, name, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadJSON(data, name) {
  downloadText(JSON.stringify(data, null, 2), name, "application/json");
}
export default function ExportPanel({ conversation }) {
  const [quotes, setQuotes] = useState(false),
    [selected, setSelected] = useState(""),
    [error, setError] = useState("");
  const findings = explorePatterns(conversation);
  const insight = findings.find((f) => f.id === selected);
  const data = exportConversation(conversation, { quotes });
  return (
    <section className="export-panel">
      <h3>Export</h3>
      <label className="checkbox">
        <input type="checkbox" checked={quotes} onChange={(e) => setQuotes(e.target.checked)} />
        Include source messages and quotes
      </label>
      <p className="import-note">
        Names and personal context may still appear in a report. Review before sharing.
      </p>
      <div className="action-row">
        <button className="secondary" onClick={() => downloadJSON(data, "between-report.json")}>
          Download report
        </button>
        <button className="secondary" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <button
          className="secondary"
          onClick={() => downloadJSON(conversation, "between-conversation-backup.json")}
        >
          Export all conversation data
        </button>
      </div>
      <label>
        Share a selected insight
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Choose an insight</option>
          {findings.map((f) => (
            <option value={f.id} key={f.id}>
              {f.title}
            </option>
          ))}
        </select>
      </label>
      {insight && (
        <article className="share-preview">
          <small>SHARING PREVIEW · NO SOURCE MESSAGES</small>
          <h3>{insight.title}</h3>
          <p>{insight.body}</p>
          <small>{insight.limit}</small>
          <div className="action-row">
            <button
              className="secondary"
              onClick={() => downloadJSON(redactedInsight(insight), "between-insight.json")}
            >
              Download insight
            </button>
            {!!navigator.share && (
              <button
                className="secondary"
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: insight.title,
                      text: `${insight.body}\n\n${insight.limit}`,
                    });
                  } catch (e) {
                    if (e.name !== "AbortError")
                      setError("Sharing was unavailable. Download the insight instead.");
                  }
                }}
              >
                Share…
              </button>
            )}
          </div>
        </article>
      )}
      {error && <p role="alert">{error}</p>}
      {createPortal(
        <section className="printable-report">
          <h1>{data.title}</h1>
          <p>
            {data.connection} · {data.coverage.count} messages
          </p>
          <p>
            Source coverage: {data.coverage.first || "No date"} — {data.coverage.last || "No date"}
          </p>
          <p>Calculated statistics and keyword observations. Not a determination of intent.</p>
          {data.findings.map((f) => (
            <article key={f.title}>
              <h2>{f.title}</h2>
              <p>{f.body}</p>
              {f.excerpts?.map((m) => (
                <blockquote key={m.id}>
                  {m.speaker} · {m.date || "No timestamp"}
                  <p>{m.body}</p>
                </blockquote>
              ))}
              <p>{f.limit}</p>
            </article>
          ))}
        </section>,
        document.body,
      )}
    </section>
  );
}
