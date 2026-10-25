import React from "react";
import { Quote, ArrowUpRight } from "lucide-react";
export default function PatternsView({ findings, onEvidence, context, onContext }) {
  return (
    <section className="patterns-view">
      <div className="browser-top">
        <h2>Patterns & evidence</h2>
        <span>Keyword observations</span>
      </div>
      {findings.map((f, i) => (
        <article className="finding" key={f.title}>
          <span className="finding-number">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <span className="tiny-label">{f.kind}</span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
            <button className="evidence-link" onClick={() => onEvidence(f.ids)}>
              <Quote size={14} />
              {f.ids.length} source excerpts
              <ArrowUpRight size={14} />
            </button>
            <details>
              <summary>Limitations & alternatives</summary>
              <p>{f.limit}</p>
            </details>
          </div>
        </article>
      ))}
      <details className="context-box">
        <summary>Add context</summary>
        <label>
          Anything missing?
          <textarea value={context || ""} onChange={(e) => onContext(e.target.value)} />
        </label>
        <small>
          Saved with this session. These keyword findings aren’t regenerated from context.
        </small>
      </details>
    </section>
  );
}
