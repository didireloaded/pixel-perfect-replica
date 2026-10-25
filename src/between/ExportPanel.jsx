import React, { useState } from "react";
import ReportDocument from "./ReportDocument";
import Sheet from "./Sheet";
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
  const [preview, setPreview] = useState(false);
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
          Download report data
        </button>
        <button className="primary" onClick={() => setPreview(true)}>
          Preview report / Save PDF
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
      {preview && (
        <Sheet label="Your report" onClose={() => setPreview(false)}>
          <div className="document-preview-toolbar">
            <p>
              Choose “Save as PDF” in the print dialog. Use the landscape page size, turn off
              browser headers and footers, and enable background graphics for full colour.
            </p>
            <button className="primary" onClick={() => window.print()}>
              Print / Save PDF
            </button>
          </div>
          <ReportDocument data={data} />
        </Sheet>
      )}
      {createPortal(
        <div className="printable-report">
          <ReportDocument data={data} />
        </div>,
        document.body,
      )}
    </section>
  );
}
