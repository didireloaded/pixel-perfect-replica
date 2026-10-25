import React, { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { messagePage } from "./analysis";
export default function ConversationView({ messages, onEvidence, initialDate = "" }) {
  const [filters, setFilters] = useState({
    query: "",
    participant: "",
    from: initialDate,
    to: initialDate,
    page: 1,
  });
  const result = useMemo(() => messagePage(messages, filters), [messages, filters]);
  const update = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  return (
    <section className="message-browser">
      <div className="browser-top">
        <h2>Messages</h2>
        <span aria-live="polite">{result.total.toLocaleString()} results</span>
      </div>
      <label className="home-search">
        <Search size={18} />
        <input
          aria-label="Search messages"
          placeholder="Search messages"
          value={filters.query}
          onChange={(e) => update("query", e.target.value)}
        />
      </label>
      <div className="browser-filters">
        <label>
          Participant
          <select
            value={filters.participant}
            onChange={(e) => update("participant", e.target.value)}
          >
            <option value="">Everyone</option>
            {[...new Set(messages.map((m) => m.speaker))].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            value={filters.from}
            onChange={(e) => update("from", e.target.value)}
          />
        </label>
        <label>
          To
          <input type="date" value={filters.to} onChange={(e) => update("to", e.target.value)} />
        </label>
      </div>
      <div className="message-results">
        {result.items.length ? (
          result.items.map((m) => (
            <button className="message-result" key={m.id} onClick={() => onEvidence([m.id])}>
              <span className="avatar">{m.speaker[0]}</span>
              <span>
                <strong>{m.speaker}</strong>
                <time>{m.date ? new Date(m.date).toLocaleString() : "No timestamp"}</time>
                <span className="message-snippet">{m.body}</span>
              </span>
              <ChevronRight size={15} />
            </button>
          ))
        ) : (
          <p className="empty-results">No messages match these filters.</p>
        )}
      </div>
      <nav className="pagination" aria-label="Message pages">
        <button
          className="secondary"
          disabled={result.page === 1}
          onClick={() => setFilters((f) => ({ ...f, page: result.page - 1 }))}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <span>
          Page {result.page} of {result.pages}
        </span>
        <button
          className="secondary"
          disabled={result.page === result.pages}
          onClick={() => setFilters((f) => ({ ...f, page: result.page + 1 }))}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </nav>
    </section>
  );
}
