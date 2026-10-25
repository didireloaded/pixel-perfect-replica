import React, { useState } from "react";
import { Quote, ArrowUpRight, Check, Flag, Bookmark } from "lucide-react";
import { revise } from "./workspace";
export default function PatternsView({ findings, onEvidence, conversation, onUpdate }) {
  const [correction, setCorrection] = useState(""),
    [target, setTarget] = useState(""),
    [error, setError] = useState("");
  async function update(change) {
    try {
      await onUpdate(change);
      setError("");
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }
  return (
    <section className="patterns-view">
      <div className="browser-top">
        <h2>Patterns & evidence</h2>
        <span>Source-linked observations</span>
      </div>
      {findings.map((f, i) => (
        <article className="finding" key={f.id || f.title}>
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
            {f.counterIds?.length > 0 && (
              <button className="text-button" onClick={() => onEvidence(f.counterIds)}>
                What complicates this?
              </button>
            )}
            <details>
              <summary>Limitations & alternatives</summary>
              <p>{f.limit}</p>
            </details>
            <div className="finding-actions">
              <button
                className={conversation.feedback[f.id]?.useful ? "selected" : ""}
                onClick={() =>
                  update((c) => ({
                    ...c,
                    feedback: {
                      ...c.feedback,
                      [f.id]: { ...c.feedback[f.id], useful: !c.feedback[f.id]?.useful },
                    },
                  }))
                }
              >
                <Check size={14} />
                Useful
              </button>
              <button
                onClick={() => {
                  setTarget(f.id);
                  setCorrection(conversation.feedback[f.id]?.correction || "");
                }}
              >
                <Flag size={14} />
                Correct context
              </button>
              <button
                onClick={() =>
                  update((c) => ({ ...c, bookmarks: [...new Set([...c.bookmarks, ...f.ids])] }))
                }
              >
                <Bookmark size={14} />
                Bookmark sources
              </button>
            </div>
            {conversation.feedback[f.id]?.correction && (
              <p className="context-correction">
                <strong>Your correction:</strong> {conversation.feedback[f.id].correction}
                <small>Recorded context; the source observation remains unchanged.</small>
              </p>
            )}
            {target === f.id && (
              <form
                className="correction-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await update((c) =>
                      revise(
                        c,
                        {
                          feedback: {
                            ...c.feedback,
                            [f.id]: { ...c.feedback[f.id], correction: correction.trim() },
                          },
                          context: [c.context, correction.trim()].filter(Boolean).join("\n"),
                        },
                        `Context correction: ${f.title}`,
                      ),
                    )
                  ) {
                    setTarget("");
                    setCorrection("");
                  }
                }}
              >
                <label>
                  What did we miss?
                  <textarea
                    required
                    value={correction}
                    maxLength={3000}
                    onChange={(e) => setCorrection(e.target.value)}
                  />
                </label>
                <button className="secondary" disabled={!correction.trim()}>
                  Save correction & version
                </button>
                <button className="text-button" type="button" onClick={() => setTarget("")}>
                  Cancel
                </button>
              </form>
            )}
          </div>
        </article>
      ))}
      <details className="context-box">
        <summary>Conversation context</summary>
        <p>{conversation.context || "No additional context."}</p>
        <p className="import-note">
          These findings use documented keyword rules. Semantic interpretation and context-based
          regeneration require a configured analysis service.
        </p>
      </details>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
