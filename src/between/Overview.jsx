import React, { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { conversationMetrics } from "./analysis";
const colors = ["#4f78df", "#aa7cce", "#4d9b8b", "#d39070"];
export const calculationRules =
  "Counts include selected text messages; attachment placeholders and system events are excluded. Timing uses a stable chronological copy; equal timestamps retain source order. Missing dates are excluded from timing. A conversation starts at the earliest dated message or after an 8-hour gap. Reply times count speaker changes with gaps below 8 hours, including zero-minute replies. Median is the middle value (or the average of the two middle values). Days and hours use your device timezone. Streak counts consecutive active calendar days; silence is the largest timestamp gap within this selected history. Word counts use letter/number tokens; common English filler words are omitted from frequent words. Emoji sequences are counted as displayed sequences. These metrics don’t establish feelings or intent.";
const duration = (minutes) =>
  minutes === null
    ? "—"
    : minutes < 1
      ? "<1 min"
      : minutes >= 1440
        ? `${(minutes / 1440).toFixed(1)} days`
        : minutes >= 60
          ? `${(minutes / 60).toFixed(1)} hr`
          : `${Math.round(minutes)} min`;
const dateLabel = (day) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};
function PeopleValues({ people, value }) {
  return (
    <div className="people-values">
      {people.map((p, i) => (
        <div key={p}>
          <span className="person-label">
            <i style={{ background: colors[i % colors.length] }} />
            {p}
          </span>
          <strong>{value(p)}</strong>
        </div>
      ))}
    </div>
  );
}
export default function Overview({ messages, onEvidence, onBrowse }) {
  const m = useMemo(() => conversationMetrics(messages), [messages]);
  const s = m.stats;
  const days = Object.entries(s.days);
  const maxDay = Math.max(1, ...days.map(([, n]) => n));
  const maxHour = Math.max(1, ...m.hours);
  const shares = s.people.map((p, i) => ({
    p,
    color: colors[i % colors.length],
    share: s.total ? (s.counts[p] / s.total) * 100 : 0,
  }));
  let running = 0;
  const gradient = shares
    .map((x) => {
      const start = running;
      running += x.share;
      return `${x.color} ${start}% ${running}%`;
    })
    .join(",");
  return (
    <section className="visual-overview">
      <div className="overview-head">
        <h2>Overview</h2>
        <span>
          {s.total.toLocaleString()} messages · {days.length} active days
        </span>
      </div>
      <div className="insight-grid">
        <article className="visual-card tint-mint">
          <h3>Who talks</h3>
          <PeopleValues people={s.people} value={(p) => s.counts[p].toLocaleString()} />
        </article>
        <article className="visual-card tint-lilac">
          <h3>Share of voice</h3>
          <div className="share-card">
            <div
              className="share-ring"
              role="img"
              aria-label={shares.map((x) => `${x.p}: ${x.share.toFixed(1)}%`).join(", ")}
              style={{ background: s.total ? `conic-gradient(${gradient})` : "#ddd" }}
            >
              <span>
                {s.people.length}
                <small>people</small>
              </span>
            </div>
            <div>
              {shares.map((x) => (
                <p key={x.p}>
                  <strong>{Math.round(x.share)}%</strong>
                  <span className="person-label">
                    <i style={{ background: x.color }} />
                    {x.p}
                  </span>
                </p>
              ))}
            </div>
          </div>
        </article>
        <article className="visual-card tint-rose">
          <h3>Who starts</h3>
          {s.people.map((p, i) => {
            const total = Object.values(s.starts).reduce((a, b) => a + b, 0);
            const share = total ? (s.starts[p] / total) * 100 : 0;
            return (
              <div className="start-row" key={p}>
                <span>{p}</span>
                <div>
                  <i style={{ width: `${share}%`, background: colors[i % colors.length] }} />
                </div>
                <strong>{s.starts[p]}</strong>
              </div>
            );
          })}
        </article>
        <article className="visual-card tint-blue">
          <h3>Median reply time</h3>
          <PeopleValues people={s.people} value={(p) => duration(m.medianReplies[p])} />
        </article>
        <article className="visual-card tint-peach">
          <h3>Busiest day</h3>
          <div className="feature-number">
            {m.busiest?.[1] ?? "—"}
            <small>
              {m.busiest ? `messages · ${dateLabel(m.busiest[0])}` : "No dated messages"}
            </small>
          </div>
        </article>
        <div className="mini-stats">
          <article className="visual-card tint-mint">
            <h3>Longest streak</h3>
            <div className="feature-number">
              {m.longestStreak}
              <small>consecutive days</small>
            </div>
          </article>
          <article className="visual-card tint-rose">
            <h3>Longest gap</h3>
            <div className="feature-number gap-number">
              {m.longestGap ? duration(m.longestGap / 60000) : "—"}
              <small>between messages</small>
            </div>
          </article>
        </div>
        <article className="visual-card tint-yellow wide-card">
          <h3>By hour</h3>
          <div
            className="hour-chart"
            role="img"
            aria-label="Messages by hour in your device timezone"
          >
            {m.hours.map((n, h) => (
              <div key={h} title={`${h}:00 · ${n} messages`}>
                <span style={{ height: `${(n / maxHour) * 90}px` }} />
                <small>{h % 6 === 0 ? String(h).padStart(2, "0") : ""}</small>
              </div>
            ))}
          </div>
          <p className="card-caption">
            {m.hours.some(Boolean)
              ? `Peak at ${String(m.hours.indexOf(Math.max(...m.hours))).padStart(2, "0")}:00`
              : "No timestamps available"}
          </p>
        </article>
        <article className="visual-card activity-calendar wide-card">
          <h3>Day by day</h3>
          <div className="day-grid">
            {days.map(([day, n]) => (
              <span
                key={day}
                role="button"
                tabIndex={0}
                onClick={() => onBrowse?.(day)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onBrowse?.(day);
                  }
                }}
                title={`${dateLabel(day)} · ${n} messages`}
                aria-label={`${dateLabel(day)}: ${n} messages`}
                style={{ background: `rgba(83,122,224,${0.15 + (n / maxDay) * 0.85})` }}
              />
            ))}
          </div>
          <p className="card-caption">
            {days.length
              ? `${dateLabel(days[0][0])} – ${dateLabel(days.at(-1)[0])} · one square per active day`
              : "No dated messages"}
          </p>
        </article>
      </div>
      <div className="overview-section-title">
        <h2>Highlights</h2>
      </div>
      <div className="highlight-grid">
        {[
          ["First exchange", m.first],
          ["Latest exchange", m.latest],
        ].map(([title, items]) => (
          <button
            className="highlight-card"
            disabled={!items.length}
            key={title}
            onClick={() => onEvidence(items.map((x) => x.id))}
          >
            <span>
              {title}
              <ArrowUpRight size={17} />
            </span>
            <strong>
              {items.length
                ? new Date(items[0].date).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "No timestamps"}
            </strong>
            <small>{items.length} messages</small>
          </button>
        ))}
      </div>
      <details className="highlight-details">
        <summary>Longest messages</summary>
        <div className="highlight-grid">
          {s.people.map((p) => (
            <button
              className="highlight-card"
              key={p}
              onClick={() => onEvidence([m.longest[p].message.id])}
            >
              <span>
                {p}
                <ArrowUpRight size={16} />
              </span>
              <strong>{m.longest[p]?.words || 0} words</strong>
              <small className="highlight-quote">{m.longest[p]?.message.body.slice(0, 100)}</small>
            </button>
          ))}
        </div>
      </details>
      <details className="highlight-details">
        <summary>Words & emojis</summary>
        <div className="highlight-grid">
          {s.people.map((p) => (
            <article className="highlight-card" key={p}>
              <h3>{p}</h3>
              <div className="word-tags">
                {m.words[p].map(([w, n]) => (
                  <span key={w}>
                    {w}
                    <small> {n}</small>
                  </span>
                ))}
              </div>
              <div className="emoji-tags">
                {m.emojis[p].length ? (
                  m.emojis[p].map(([e, n]) => (
                    <span key={e} title={`${n} uses`}>
                      {e}
                      <small>{n}</small>
                    </span>
                  ))
                ) : (
                  <small>No emojis</small>
                )}
              </div>
            </article>
          ))}
        </div>
      </details>
      <details className="calculation-details">
        <summary>How these numbers are calculated</summary>
        <p>{calculationRules}</p>
      </details>
    </section>
  );
}
