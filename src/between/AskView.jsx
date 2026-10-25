import React, { useState } from "react";
import { Search, Bookmark, ArrowUpRight } from "lucide-react";
import { answerQuestion, createDraft } from "./insights";
export default function AskView({ conversation, onUpdate, onEvidence }) {
  const [question, setQuestion] = useState(""),
    [result, setResult] = useState(null),
    [mode, setMode] = useState("Reply"),
    [tone, setTone] = useState("Gentle"),
    [goal, setGoal] = useState(""),
    [own, setOwn] = useState(""),
    [draft, setDraft] = useState(""),
    [error, setError] = useState("");
  const ask = (q) => {
    setQuestion(q);
    setResult(answerQuestion(conversation, q));
  };
  async function save(answer) {
    try {
      await onUpdate((c) => ({
        ...c,
        answers: c.answers.some((x) => x.id === answer.id) ? c.answers : [...c.answers, answer],
      }));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="ask-layout">
      <section className="stats-card">
        <h2>Ask & reflect</h2>
        <div className="prompt-chips">
          {[
            "What supports this interpretation?",
            "What contradicts it?",
            "Do we take responsibility?",
            "What plans did we make?",
            "What am I contributing?",
          ].map((q) => (
            <button key={q} onClick={() => ask(q)}>
              {q}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
        >
          <label>
            Your question
            <input
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about this conversation"
            />
          </label>
          <button className="primary">
            Find evidence
            <Search size={16} />
          </button>
        </form>
        {result && (
          <article className="answer-card" aria-live="polite">
            <p>{result.text}</p>
            {result.ids.length > 0 && (
              <button className="evidence-link" onClick={() => onEvidence(result.ids)}>
                {result.ids.length} source messages
                <ArrowUpRight size={14} />
              </button>
            )}
            {result.counterIds.length > 0 && (
              <button className="text-button" onClick={() => onEvidence(result.counterIds)}>
                Review counterexamples
              </button>
            )}
            <small>{result.limitations}</small>
            <button
              className="secondary"
              onClick={() => save(result)}
              disabled={conversation.answers.some((x) => x.id === result.id)}
            >
              <Bookmark size={15} />
              {conversation.answers.some((x) => x.id === result.id) ? "Saved" : "Save answer"}
            </button>
          </article>
        )}
      </section>
      <section className="stats-card draft-section">
        <h2>Find the words</h2>
        <div className="segmented-control">
          {["Reply", "Apology", "Boundary", "Talking points", "Rewrite"].map((k) => (
            <button className={mode === k ? "selected" : ""} key={k} onClick={() => setMode(k)}>
              {k}
            </button>
          ))}
        </div>
        <label>
          Your goal
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What do you want to communicate?"
          />
        </label>
        {mode === "Rewrite" && (
          <label>
            Your message
            <textarea value={own} onChange={(e) => setOwn(e.target.value)} />
          </label>
        )}
        <label>
          Tone
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            {["Gentle", "Direct", "Brief"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <button
          className="primary"
          disabled={!goal.trim() || (mode === "Rewrite" && !own.trim())}
          onClick={() => setDraft(createDraft({ goal, tone, kind: mode, ownDraft: own }))}
        >
          Prepare draft
        </button>
        {draft && (
          <>
            <label>
              Edit your draft
              <textarea
                className="editable-draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <button
              className="secondary"
              onClick={() =>
                save({
                  id: crypto.randomUUID(),
                  question: `${mode}: ${goal}`,
                  text: draft,
                  ids: [],
                  at: new Date().toISOString(),
                  type: "draft",
                })
              }
            >
              Save draft
            </button>
          </>
        )}
        <p className="import-note">
          Editable templates, not personalised interpretation. Nothing is sent automatically.
          Rewrite currently normalises spacing; Brief also limits it to two sentences.
        </p>
      </section>
      {conversation.answers.length > 0 && (
        <section className="stats-card">
          <h2>Saved answers & drafts</h2>
          {conversation.answers
            .slice()
            .reverse()
            .map((a) => (
              <details key={a.id}>
                <summary>{a.question}</summary>
                <p>{a.text}</p>
                {a.ids.length > 0 && (
                  <button className="evidence-link" onClick={() => onEvidence(a.ids)}>
                    Open sources
                  </button>
                )}
                <button
                  className="text-button"
                  onClick={() =>
                    onUpdate((c) => ({
                      ...c,
                      answers: c.answers.filter((x) => x.id !== a.id),
                    })).catch((e) => setError(e.message))
                  }
                >
                  Remove
                </button>
              </details>
            ))}
        </section>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
