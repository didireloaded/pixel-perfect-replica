import React from "react";
import { activitySeries, reportPages, shortText } from "./report-model";
import "./report.css";
const date = (value) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Undated";
const number = (value) => value.toLocaleString();
function Activity({ days }) {
  const bars = activitySeries(days),
    peak = Math.max(1, ...bars.map((b) => b.count));
  return (
    <div className="deck-activity">
      <div className="deck-chart-title">
        <b>Activity over time</b>
        <span>
          {bars.length && bars.some((b) => b.from !== b.to)
            ? "Grouped by date range"
            : "Messages per day"}
        </span>
      </div>
      {bars.length ? (
        <>
          <div
            className="deck-bars"
            role="img"
            aria-label={bars.map((b) => `${b.from}: ${b.count} messages`).join("; ")}
          >
            {bars.map((b) => (
              <div className="deck-bar-column" key={b.from}>
                <span>{number(b.count)}</span>
                <i style={{ height: `${Math.max(b.count ? 3 : 0, (b.count / peak) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="deck-axis">
            <span>{date(bars[0].from)}</span>
            <span>{date(bars.at(-1).to)}</span>
          </div>
        </>
      ) : (
        <div className="deck-chart-empty">No dated messages in this history.</div>
      )}
    </div>
  );
}
function Pattern({ finding, index, quotes, total }) {
  const sources = (finding.excerpts || []).filter(Boolean).slice(0, 2);
  return (
    <article className={`deck-pattern deck-tone-${index % 2}`}>
      <div className="deck-pattern-number">
        {String(index + 1).padStart(2, "0")}
        <span>OBSERVATION</span>
      </div>
      <h3>{finding.title}</h3>
      <p className="deck-pattern-body">{finding.body}</p>
      {!quotes && Number.isFinite(finding.matchedCount) && (
        <div className="deck-pattern-metric">
          <strong>{number(finding.matchedCount)}</strong>
          <div>
            <b>matching messages</b>
            <span>
              {Math.round((finding.matchedCount / Math.max(total, 1)) * 100)}% of this text history
            </span>
          </div>
        </div>
      )}
      {quotes && sources.length > 0 ? (
        <div className="deck-quotes">
          {sources.map((m) => (
            <blockquote key={m.id}>
              <p>“{shortText(m.body, 180)}”</p>
              <cite>
                {shortText(m.speaker, 48)} · {date(m.date)}
              </cite>
            </blockquote>
          ))}
        </div>
      ) : (
        <div className="deck-source-status">
          {quotes ? "No source excerpt available" : "Source quotes excluded from this export"}
        </div>
      )}
      <div className="deck-caveat">
        <b>Context matters</b>
        <p>{finding.limit}</p>
      </div>
    </article>
  );
}
export default function ReportDocument({ data }) {
  const s = data.statistics,
    pages = reportPages(data),
    active = Object.keys(s.days).length;
  const starts = Object.values(s.starts).reduce((sum, n) => sum + n, 0);
  let patternIndex = 0;
  return (
    <div className="report-document">
      {pages.map((page, i) => (
        <section className={`deck-page deck-${page.kind}`} key={i}>
          <div className="deck-top">
            <b>
              between<span> / </span>
            </b>
            <span>CONVERSATION REPORT</span>
            <span>{data.connection}</span>
          </div>
          <div className="deck-body">
            {page.kind === "snapshot" && (
              <>
                <div className="deck-intro">
                  <span className="deck-kicker">YOUR CONVERSATION, AT A GLANCE</span>
                  <h1>{shortText(data.title, 110)}</h1>
                  <p>
                    {date(data.coverage.first)} — {date(data.coverage.last)}
                  </p>
                </div>
                <div className="deck-snapshot-grid">
                  <div className="deck-hero-metric">
                    <span className="deck-kicker">THE HISTORY</span>
                    <strong>{number(s.total)}</strong>
                    <span>text messages</span>
                    <div className="deck-small-metrics">
                      <div>
                        <b>{number(active)}</b>
                        <span>active days</span>
                      </div>
                      <div>
                        <b>{number(s.people.length)}</b>
                        <span>participants</span>
                      </div>
                    </div>
                  </div>
                  <Activity days={s.days} />
                </div>
              </>
            )}
            {page.kind === "participation" && (
              <>
                <div className="deck-heading">
                  <span className="deck-kicker">PARTICIPATION</span>
                  <h2>
                    Who brings what
                    <br />
                    to the conversation.
                  </h2>
                  <p>Message volume and conversation starts.</p>
                </div>
                <div className="deck-participation-layout">
                  <div className="deck-people">
                    {page.people.map((person, j) => (
                      <div className="deck-person" key={person}>
                        <div className="deck-person-label">
                          <b>{shortText(person, 55)}</b>
                          <span>
                            {number(s.counts[person])}{" "}
                            <small>
                              messages ·{" "}
                              {Math.round((s.counts[person] / Math.max(s.total, 1)) * 100)}%
                            </small>
                          </span>
                        </div>
                        <div className="deck-track">
                          <i
                            className={`deck-fill-${j % 3}`}
                            style={{
                              width: `${(s.counts[person] / Math.max(s.total, 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="deck-starts">
                          {number(s.starts[person])} conversation starts
                        </div>
                      </div>
                    ))}
                  </div>
                  <aside className="deck-side-note">
                    <strong>{number(starts)}</strong>
                    <h3>conversation starts</h3>
                    <p>A start is the first dated message, or a message after an eight-hour gap.</p>
                    <div className="deck-note-rule" />
                    <p>
                      Counts describe activity. They do not measure affection, effort or
                      relationship quality.
                    </p>
                  </aside>
                </div>
              </>
            )}
            {page.kind === "patterns" && (
              <>
                <div className="deck-heading deck-heading-compact">
                  <span className="deck-kicker">PATTERNS & EVIDENCE</span>
                  <h2>Worth a closer look.</h2>
                </div>
                <div className="deck-pattern-grid">
                  {page.findings.map((f) => (
                    <Pattern
                      key={f.id}
                      finding={f}
                      index={patternIndex++}
                      quotes={!!data.messages}
                      total={s.total}
                    />
                  ))}
                </div>
              </>
            )}
            {page.kind === "goals" && (
              <>
                <div className="deck-heading">
                  <span className="deck-kicker">YOUR NEXT STEPS</span>
                  <h2>Intentions into action.</h2>
                  <p>Goals you saved in this conversation.</p>
                </div>
                <div className="deck-goals">
                  {page.goals.map((g) => (
                    <div key={g.id}>
                      <span>{g.done ? "DONE" : "OPEN"}</span>
                      <p>{shortText(g.text, 280)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {page.kind === "reflection" && (
              <>
                <div className="deck-heading">
                  <span className="deck-kicker">TAKE IT FORWARD</span>
                  <h2>
                    A little clarity.
                    <br />A better next conversation.
                  </h2>
                </div>
                <div className="deck-reflection-grid">
                  {[
                    ["01", "Look back", "Which exchange would you like to understand better?"],
                    [
                      "02",
                      "Add context",
                      "What happened outside this chat that could change your reading?",
                    ],
                    [
                      "03",
                      "Choose a next step",
                      "What would you like to say, ask or do differently?",
                    ],
                  ].map(([n, t, q]) => (
                    <div key={n}>
                      <span>{n}</span>
                      <h3>{t}</h3>
                      <p>{q}</p>
                      <div className="deck-writing-line" />
                    </div>
                  ))}
                </div>
                <div className="deck-method">
                  <b>How to read this report</b>
                  <p>
                    Based on imported text; attachments excluded. Patterns are keyword observations,
                    not conclusions about intent.{" "}
                    {data.coverage.missing
                      ? `${data.coverage.missing} messages have no timestamp. `
                      : ""}
                    Quotes{" "}
                    {data.messages
                      ? "included as selected excerpts; long excerpts shortened"
                      : "excluded"}
                    . Full data is available separately in the app. Review names and details before
                    sharing.
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="deck-footer">
            <span>{shortText(data.title, 65)}</span>
            <span>
              {i === 0
                ? "Text history · Offline context not included"
                : "between / Conversation report"}
            </span>
            <b>
              {String(i + 1).padStart(2, "0")}{" "}
              <span>/ {String(pages.length).padStart(2, "0")}</span>
            </b>
          </div>
        </section>
      ))}
    </div>
  );
}
