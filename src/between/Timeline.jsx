import React, { useMemo, useState } from "react";
import { statistics, dayKey } from "./analysis";
import { periodSummary, newId } from "./workspace";
export default function Timeline({ conversation, onUpdate, onEvidence, onBrowse }) {
  const [selected, setSelected] = useState(""),
    [periods, setPeriods] = useState({ aFrom: "", aTo: "", bFrom: "", bTo: "" }),
    [milestone, setMilestone] = useState({ date: "", title: "" }),
    [error, setError] = useState("");
  const stats = useMemo(() => statistics(conversation.messages), [conversation.messages]);
  const days = Object.entries(stats.days);
  const selectedMessages = conversation.messages.filter(
    (m) => m.date && dayKey(m.date) === selected,
  );
  const comparisons =
    Object.entries(periods).every(([, v]) => v) &&
    periods.aFrom <= periods.aTo &&
    periods.bFrom <= periods.bTo
      ? [
          periodSummary(conversation.messages, periods.aFrom, periods.aTo),
          periodSummary(conversation.messages, periods.bFrom, periods.bTo),
        ]
      : null;
  async function add(e) {
    e.preventDefault();
    try {
      await onUpdate((c) => ({
        ...c,
        milestones: [...c.milestones, { ...milestone, id: newId() }],
      }));
      setMilestone({ date: "", title: "" });
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <section className="timeline-view">
      <h2>Timeline</h2>
      <p className="section-caption">Choose a day to explore its messages.</p>
      <div className="interactive-days">
        {days.map(([date, n]) => (
          <button
            className={selected === date ? "selected" : ""}
            key={date}
            aria-pressed={selected === date}
            title={`${date}: ${n} messages`}
            onClick={() => setSelected(date)}
          >
            <span>
              {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </span>
            <strong>{n}</strong>
          </button>
        ))}
      </div>
      {selected && (
        <article className="context-box">
          <div className="browser-top">
            <h3>{selected}</h3>
            <button className="secondary" onClick={() => onBrowse(selected)}>
              All {selectedMessages.length} messages
            </button>
          </div>
          {selectedMessages.slice(0, 3).map((m) => (
            <button className="timeline-excerpt" key={m.id} onClick={() => onEvidence([m.id])}>
              <strong>{m.speaker}</strong>
              <span>{m.body.slice(0, 180)}</span>
            </button>
          ))}
        </article>
      )}
      <details className="context-box">
        <summary>Compare two periods</summary>
        <div className="two-fields">
          {[
            ["aFrom", "Period A · from"],
            ["aTo", "Period A · to"],
            ["bFrom", "Period B · from"],
            ["bTo", "Period B · to"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="date"
                value={periods[key]}
                onChange={(e) => setPeriods({ ...periods, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        {((periods.aFrom > periods.aTo && periods.aTo) ||
          (periods.bFrom > periods.bTo && periods.bTo)) && (
          <p className="warning">Start dates must precede end dates.</p>
        )}
        {comparisons && (
          <>
            <div className="highlight-grid">
              {comparisons.map((s, i) => (
                <article className="highlight-card" key={i}>
                  <h3>Period {i ? "B" : "A"}</h3>
                  <strong>{s.total} messages</strong>
                  <p>{s.coverage}</p>
                  {s.people.map((p) => (
                    <div className="metric" key={p}>
                      <span>{p}</span>
                      <strong>{s.counts[p]}</strong>
                    </div>
                  ))}
                </article>
              ))}
            </div>
            <p className="import-note">
              Coverage differs between periods. Changes in volume do not establish a change in
              relationship quality or its cause.
            </p>
          </>
        )}
      </details>
      <section className="context-box">
        <h3>Milestones</h3>
        {conversation.milestones.map((m) => (
          <div className="note-row" key={m.id}>
            <div>
              <strong>{m.title}</strong>
              <small>{m.date} · your context</small>
            </div>
            <button
              className="text-button"
              onClick={() =>
                onUpdate((c) => ({
                  ...c,
                  milestones: c.milestones.filter((x) => x.id !== m.id),
                })).catch((e) => setError(e.message))
              }
            >
              Remove
            </button>
          </div>
        ))}
        <form onSubmit={add}>
          <div className="two-fields">
            <label>
              Date
              <input
                type="date"
                required
                value={milestone.date}
                onChange={(e) => setMilestone({ ...milestone, date: e.target.value })}
              />
            </label>
            <label>
              Event
              <input
                required
                maxLength={120}
                value={milestone.title}
                onChange={(e) => setMilestone({ ...milestone, title: e.target.value })}
                placeholder="A call, a change, a shared plan"
              />
            </label>
          </div>
          <button className="secondary" type="submit">
            Add milestone
          </button>
        </form>
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
