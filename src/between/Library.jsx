import React, { useState } from "react";
import { Bookmark, ChevronRight, Upload, MessageCircle } from "lucide-react";
import { coverage } from "./workspace";
export default function Library({
  conversations,
  onOpen,
  onImport,
  onEvidence,
  savedOnly = false,
}) {
  const [mode, setMode] = useState("Conversations");
  const [query, setQuery] = useState(""),
    [type, setType] = useState("All");
  const list = conversations.filter(
    (c) =>
      (!savedOnly || c.saved) &&
      (type === "All" || c.connection === type) &&
      `${c.title} ${c.connection} ${c.filename}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section>
      <div className="page-intro">
        <h1>{savedOnly ? "Saved" : "Conversations"}</h1>
        <button className="secondary" onClick={onImport}>
          <Upload size={16} />
          Import
        </button>
      </div>
      {savedOnly && (
        <div className="segmented-control">
          {["Conversations", "Bookmarks", "Answers"].map((m) => (
            <button key={m} className={mode === m ? "selected" : ""} onClick={() => setMode(m)}>
              {m}
            </button>
          ))}
        </div>
      )}
      <label className="home-search">
        <input
          aria-label="Search conversations"
          placeholder="Search conversations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="filter-tabs">
        {["All", ...new Set(conversations.map((c) => c.connection))].map((t) => (
          <button key={t} className={t === type ? "selected" : ""} onClick={() => setType(t)}>
            {t}
          </button>
        ))}
      </div>
      {mode === "Bookmarks" ? (
        <section>
          {conversations
            .flatMap((c) =>
              c.bookmarks.map((id) => ({ c, m: c.messages.find((m) => m.id === id) })),
            )
            .filter(
              (x) => x.m && `${x.c.title} ${x.m.body}`.toLowerCase().includes(query.toLowerCase()),
            )
            .map(({ c, m }) => (
              <button
                className="library-row"
                key={`${c.id}-${m.id}`}
                onClick={() => onEvidence?.(c.id, [m.id])}
              >
                <Bookmark size={20} />
                <span>
                  <strong>
                    {c.title} · {m.speaker}
                  </strong>
                  <small className="saved-snippet">{m.body.slice(0, 180)}</small>
                  <small>{c.saved ? "On device" : "Temporary"}</small>
                </span>
              </button>
            ))}
        </section>
      ) : mode === "Answers" ? (
        <section>
          {conversations
            .flatMap((c) => c.answers.map((a) => ({ c, a })))
            .filter(({ c, a }) =>
              `${c.title} ${a.question} ${a.text}`.toLowerCase().includes(query.toLowerCase()),
            )
            .map(({ c, a }) => (
              <details className="context-box" key={a.id}>
                <summary>
                  {c.title} · {a.question}
                </summary>
                <p>{a.text}</p>
                <button className="secondary" onClick={() => onOpen(c.id)}>
                  Open conversation
                </button>
              </details>
            ))}
        </section>
      ) : list.length ? (
        list.map((c) => {
          const cov = coverage(c.messages);
          return (
            <button className="library-row" key={c.id} onClick={() => onOpen(c.id)}>
              <span className="feature-icon">
                {c.saved ? <Bookmark size={21} /> : <MessageCircle size={21} />}
              </span>
              <span>
                <strong>{c.title}</strong>
                <small>
                  {c.connection} · {cov.count.toLocaleString()} messages
                </small>
                <small>
                  {cov.first ? new Date(cov.first).toLocaleDateString() : "No dated messages"} —{" "}
                  {cov.last ? new Date(cov.last).toLocaleDateString() : ""} ·{" "}
                  {c.saved ? "Saved on device" : "Temporary"}
                </small>
              </span>
              <ChevronRight size={17} />
            </button>
          );
        })
      ) : (
        <div className="empty">
          <Bookmark size={30} />
          <h3>{savedOnly ? "No saved conversations" : "No conversations yet"}</h3>
          <p>
            {savedOnly
              ? "Save a conversation from its report to keep it on this device."
              : "Import a WhatsApp export to get started."}
          </p>
        </div>
      )}
    </section>
  );
}
