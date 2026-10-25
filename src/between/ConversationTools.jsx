import React, { useState } from "react";
import { coverage, revise } from "./workspace";
import ExportPanel from "./ExportPanel";
export default function ConversationTools({ conversation, onUpdate, onImportUpdate, onDelete }) {
  const [title, setTitle] = useState(conversation.title),
    [retention, setRetention] = useState("7"),
    [error, setError] = useState("");
  const cov = coverage(conversation.messages);
  async function act(transform) {
    try {
      await onUpdate(transform);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <details className="conversation-tools">
      <summary>Manage conversation</summary>
      <section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            act((c) => ({ ...c, title: title.trim() }));
          }}
        >
          <label>
            Conversation name
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </label>
          <button className="secondary" disabled={!title.trim()}>
            Rename
          </button>
        </form>
        <div className="coverage-details">
          <strong>Coverage</strong>
          <p>
            {cov.count} messages · {cov.missing} without timestamps
          </p>
          <p>
            {cov.first ? new Date(cov.first).toLocaleDateString() : "No dates"} —{" "}
            {cov.last ? new Date(cov.last).toLocaleDateString() : ""}
          </p>
          {conversation.warnings?.map((w, i) => (
            <p className="import-note" key={i}>
              {w}
            </p>
          ))}
        </div>
        <button className="secondary" onClick={onImportUpdate}>
          Import newer messages
        </button>
        <p className="import-note">
          Overlapping imports match exact speaker, timestamp and text. Use the same name
          replacements. Undated repeated messages can be indistinguishable.
        </p>
        <h3>Device storage</h3>
        <p className="import-note">
          {conversation.saved
            ? "Saved in this browser."
            : "Temporary: closing or refreshing loses this conversation."}{" "}
          Device storage is not an encrypted vault; other people using this browser profile may
          access it.
        </p>
        {conversation.saved ? (
          <>
            <p className="import-note">
              {conversation.expiresAt
                ? `Expires ${new Date(conversation.expiresAt).toLocaleString()}. Expired data is removed when the app is opened or while it is active.`
                : "No automatic expiry selected."}
            </p>
            <button
              className="secondary"
              onClick={() => act((c) => ({ ...c, saved: false, expiresAt: null }))}
            >
              Keep session-only instead
            </button>
          </>
        ) : (
          <>
            <label>
              Keep on this device
              <select value={retention} onChange={(e) => setRetention(e.target.value)}>
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="forever">Until I delete it</option>
              </select>
            </label>
            <button
              className="primary"
              onClick={() =>
                act((c) => ({
                  ...c,
                  saved: true,
                  expiresAt:
                    retention === "forever"
                      ? null
                      : new Date(Date.now() + Number(retention) * 86400000).toISOString(),
                }))
              }
            >
              Save on this device
            </button>
          </>
        )}
        <ExportPanel conversation={conversation} />
        <button className="danger-button" onClick={onDelete}>
          Delete conversation & reports
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
    </details>
  );
}
