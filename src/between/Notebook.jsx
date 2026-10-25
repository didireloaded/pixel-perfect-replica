import React, { useState } from "react";
import { newId, checkInCalendar } from "./workspace";
import { downloadText } from "./ExportPanel";
export default function Notebook({ conversation, onUpdate, onEvidence }) {
  const [checkDate, setCheckDate] = useState("");
  const [note, setNote] = useState(""),
    [goal, setGoal] = useState(""),
    [error, setError] = useState("");
  const act = async (change) => {
    try {
      await onUpdate(change);
      setError("");
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  return (
    <section className="notebook">
      <h2>Saved in this conversation</h2>
      <section className="context-box">
        <h3>Bookmarks</h3>
        {conversation.bookmarks.length ? (
          conversation.bookmarks.map((id) => {
            const m = conversation.messages.find((x) => x.id === id);
            return (
              m && (
                <button key={id} className="timeline-excerpt" onClick={() => onEvidence([id])}>
                  <strong>{m.speaker}</strong>
                  <span>{m.body.slice(0, 160)}</span>
                </button>
              )
            );
          })
        ) : (
          <p className="section-caption">Bookmark a message from its source view.</p>
        )}
      </section>
      <section className="context-box">
        <h3>My notes</h3>
        {conversation.notes.map((n) => (
          <div className="note-row" key={n.id}>
            <div>
              <p>{n.text}</p>
              <small>{new Date(n.at).toLocaleDateString()}</small>
            </div>
            <button
              className="text-button"
              onClick={() => act((c) => ({ ...c, notes: c.notes.filter((x) => x.id !== n.id) }))}
            >
              Remove
            </button>
          </div>
        ))}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await act((c) => ({
                ...c,
                notes: [
                  ...c.notes,
                  { id: newId(), text: note.trim(), at: new Date().toISOString() },
                ],
              }))
            )
              setNote("");
          }}
        >
          <label>
            Add a note
            <textarea
              required
              maxLength={3000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button className="secondary" disabled={!note.trim()}>
            Save note
          </button>
        </form>
      </section>
      <section className="context-box">
        <h3>Communication goals</h3>
        <p className="section-caption">
          Track actions you choose, rather than a relationship score.
        </p>
        {conversation.goals.map((g) => (
          <div className="goal-row" key={g.id}>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={g.done}
                onChange={() =>
                  act((c) => ({
                    ...c,
                    goals: c.goals.map((x) =>
                      x.id === g.id
                        ? { ...x, done: !x.done, changedAt: new Date().toISOString() }
                        : x,
                    ),
                  }))
                }
              />
              {g.text}
            </label>
            <button
              className="text-button"
              onClick={() => act((c) => ({ ...c, goals: c.goals.filter((x) => x.id !== g.id) }))}
            >
              Remove
            </button>
          </div>
        ))}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await act((c) => ({
                ...c,
                goals: [
                  ...c.goals,
                  { id: newId(), text: goal.trim(), done: false, at: new Date().toISOString() },
                ],
              }))
            )
              setGoal("");
          }}
        >
          <label>
            New goal
            <input
              required
              maxLength={240}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ask one clear question before assuming"
            />
          </label>
          <button className="secondary" disabled={!goal.trim()}>
            Add goal
          </button>
        </form>
      </section>
      <section className="context-box">
        <h3>Plan a check-in</h3>
        <label>
          Date
          <input type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
        </label>
        <button
          className="secondary"
          disabled={!checkDate}
          onClick={() => {
            try {
              downloadText(
                checkInCalendar({ date: checkDate, title: "Conversation check-in" }),
                "between-check-in.ics",
                "text/calendar",
              );
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Add to calendar
        </button>
        <p className="import-note">
          Downloads a calendar event for you to import. Between does not send notifications or
          include chat content.
        </p>
      </section>
      <section className="context-box">
        <h3>Report history</h3>
        {conversation.versions.length ? (
          conversation.versions
            .slice()
            .reverse()
            .map((v) => (
              <details key={v.id}>
                <summary>
                  {v.reason} · {new Date(v.at).toLocaleString()}
                </summary>
                <p>{v.messageCount} messages in the previous version</p>
                <p>Previous context: {v.context || "None"}</p>
                <p>Current context: {conversation.context || "None"}</p>
                {v.findings.map((f) => (
                  <div key={f.title}>
                    <strong>{f.title}</strong>
                    <p>{f.body}</p>
                  </div>
                ))}
              </details>
            ))
        ) : (
          <p className="section-caption">
            Context corrections and new imports preserve the previous findings here.
          </p>
        )}
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
