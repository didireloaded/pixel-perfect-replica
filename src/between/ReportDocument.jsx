import React from "react";
import "./report.css";
const date = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No date";
export default function ReportDocument({ data }) {
  const s = data.statistics;
  const page = (number, title, children, extra = "") => (
    <section className={`document-page ${extra}`} key={number}>
      <header className="document-header">
        <b>between</b>
        <span>{data.connection} / Conversation report</span>
      </header>
      <div className="document-content">
        <span className="document-eyebrow">
          {String(number).padStart(2, "0")} / {title}
        </span>
        {children}
      </div>
      <footer className="document-footer">
        <span>{data.title}</span>
        <span>{String(number).padStart(2, "0")}</span>
      </footer>
    </section>
  );
  return (
    <div className="report-document">
      {page(
        1,
        "Your conversation",
        <>
          <div className="document-cover-title">
            <h1>{data.title}</h1>
            <p>A closer look at your conversation.</p>
          </div>
          <div className="document-cover-stat">
            <strong>{s.total.toLocaleString()}</strong>
            <span>
              messages
              <br />
              across {Object.keys(s.days).length} active days
            </span>
          </div>
          <div className="document-range">
            {date(data.coverage.first)} — {date(data.coverage.last)}
          </div>
          <p className="document-caption">
            Calculated from your imported text history. Gaps and offline conversations are outside
            this report.
          </p>
        </>,
        "document-cover",
      )}
      {page(
        2,
        "At a glance",
        <>
          <h2>
            The conversation
            <br />
            in numbers.
          </h2>
          <div className="document-stat-grid">
            <div className="document-stat mint">
              <strong>{s.people.length}</strong>
              <span>participants</span>
            </div>
            <div className="document-stat lilac">
              <strong>{Object.keys(s.days).length}</strong>
              <span>active days</span>
            </div>
          </div>
          <h3>Share of messages</h3>
          <div className="document-share" aria-label="Share of messages">
            {s.people.map((person, i) => (
              <div
                key={person}
                style={{
                  width: `${(s.counts[person] / Math.max(s.total, 1)) * 100}%`,
                  background: ["#bde8d8", "#d8ccf2", "#ffd9bd", "#bfd9f5"][i % 4],
                }}
              />
            ))}
          </div>
          {s.people.map((person, i) => (
            <div className="document-person" key={person}>
              <span>
                <i style={{ background: ["#bde8d8", "#d8ccf2", "#ffd9bd", "#bfd9f5"][i % 4] }} />
                {person}
              </span>
              <b>
                {s.counts[person].toLocaleString()}{" "}
                <small>{Math.round((s.counts[person] / Math.max(s.total, 1)) * 100)}%</small>
              </b>
            </div>
          ))}
          <p className="document-caption">
            Message volume describes participation, not care, interest or relationship quality.
            Attachments are excluded.
          </p>
        </>,
      )}
      {data.findings.map((f, i) =>
        page(
          i + 3,
          "Patterns & evidence",
          <>
            <span className="document-pattern-index">PATTERN {String(i + 1).padStart(2, "0")}</span>
            <h2>{f.title}</h2>
            <p className="document-observation">{f.body}</p>
            {f.excerpts?.filter(Boolean).map((m) => (
              <blockquote key={m.id}>
                <p>{m.body}</p>
                <cite>
                  {m.speaker} · {date(m.date)}
                </cite>
              </blockquote>
            ))}
            <aside className="document-limitation">
              <b>Keep in mind</b>
              <p>{f.limit}</p>
            </aside>
          </>,
        ),
      )}
      {page(
        data.findings.length + 3,
        "Reflection",
        <>
          <h2>
            Make room for
            <br />
            what comes next.
          </h2>
          {data.goals?.length > 0 ? (
            <>
              <h3>Your goals</h3>
              {data.goals.map((g) => (
                <div className="document-reflection" key={g.id}>
                  <span>{g.done ? "✓" : "○"}</span>
                  <p>{g.text}</p>
                </div>
              ))}
            </>
          ) : (
            <>
              <h3>Questions to take with you</h3>
              {[
                "Which exchange would you like to understand better?",
                "What context might be missing?",
                "What would you like to communicate next?",
              ].map((q) => (
                <div className="document-reflection" key={q}>
                  <p>{q}</p>
                </div>
              ))}
            </>
          )}
          <div className="document-method">
            <h3>About this report</h3>
            <p>
              Statistics are calculated from the imported messages. Patterns use documented keyword
              rules and cannot establish intentions. Timing uses chronological order; excerpts
              retain their source text. {data.coverage.missing} messages have no timestamp.
            </p>
            <p>
              Source quotes {data.messages ? "included" : "excluded"}. Review names and personal
              details before sharing.
            </p>
          </div>
        </>,
      )}
    </div>
  );
}
