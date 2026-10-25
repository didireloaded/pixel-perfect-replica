import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileArchive, Upload } from "lucide-react";
import { readChatFile } from "./import";
import { parseChat, redact, statistics, dayKey } from "./analysis";
export default function ImportFlow({ onComplete }) {
  const [text, setText] = useState(""),
    [filename, setFilename] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [step, setStep] = useState(1),
    [order, setOrder] = useState("AUTO"),
    [names, setNames] = useState({}),
    [contacts, setContacts] = useState(true),
    [connection, setConnection] = useState("All conversations"),
    [focus, setFocus] = useState("Understand our communication"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [context, setContext] = useState("");
  const picker = useRef();
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  const parsed = useMemo(() => parseChat(text, order), [text, order]);
  const included = useMemo(
    () =>
      redact(
        parsed.messages.filter(
          (m) =>
            (!from || (m.date && dayKey(m.date) >= from)) &&
            (!to || (m.date && dayKey(m.date) <= to)),
        ),
        names,
        contacts,
      ),
    [parsed, names, contacts, from, to],
  );
  const s = useMemo(() => statistics(included), [included]);
  const people = [...new Set(parsed.messages.map((m) => m.speaker))];
  async function read(file) {
    if (!file) return;
    const id = ++request.current;
    setBusy(true);
    setError("");
    setText("");
    setFilename("");
    setNames({});
    setFrom("");
    setTo("");
    try {
      const r = await readChatFile(file);
      if (id !== request.current) return;
      setText(r.text);
      setFilename(r.archiveName || file.name);
    } catch (e) {
      if (id === request.current) setError(e.message || "The file couldn’t be opened.");
    } finally {
      if (id === request.current) {
        setBusy(false);
        if (picker.current) picker.current.value = "";
      }
    }
  }
  function finish() {
    if (from && to && from > to) {
      setError("The start date must be before the end date.");
      return;
    }
    if (s.people.length < 2) {
      setError("Include messages from at least two participants.");
      return;
    }
    onComplete({
      messages: included,
      filename,
      connection,
      focus,
      context,
      warnings: parsed.warnings,
      sample: false,
    });
  }
  return (
    <>
      <div className="eyebrow">IMPORT · {step} OF 2</div>
      <h2 id="modal-title">{step === 1 ? "Import chat" : "Review chat"}</h2>
      <input
        ref={picker}
        type="file"
        hidden
        accept=".zip,.txt,application/zip,text/plain,application/x-zip-compressed"
        onChange={(e) => read(e.target.files[0])}
      />
      {step === 1 ? (
        <>
          {!text ? (
            <button
              className="upload-zone compact-upload"
              disabled={busy}
              onClick={() => picker.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                read(e.dataTransfer.files[0]);
              }}
            >
              <span className="feature-icon">
                <Upload size={24} />
              </span>
              <strong>{busy ? "Opening chat…" : "Choose WhatsApp export"}</strong>
              <span>ZIP or TXT · without attachments</span>
            </button>
          ) : (
            <div className="upload-confirmation" role="status">
              <span className="file-success">
                <Check size={19} />
              </span>
              <div>
                <strong>{filename}</strong>
                <small>
                  {parsed.messages.length.toLocaleString()} messages · {people.length} participants
                </small>
              </div>
              <button className="file-change" onClick={() => picker.current.click()}>
                Change
              </button>
            </div>
          )}
          <p className="upload-limit">ZIP up to 50 MB · chat text up to 2 MB</p>
          {text && parsed.messages.length === 0 && (
            <p className="warning">
              No messages detected. Check the date format or choose another export.
            </p>
          )}
          {text && (
            <label>
              Date format
              <select value={order} onChange={(e) => setOrder(e.target.value)}>
                <option value="AUTO">Detect automatically</option>
                <option value="DMY">Day / month / year</option>
                <option value="MDY">Month / day / year</option>
              </select>
            </label>
          )}
          <button
            className="primary full"
            disabled={busy || parsed.messages.length < 2}
            onClick={() => {
              setStep(2);
              setError("");
            }}
          >
            Review chat
            <ArrowRight size={16} />
          </button>
        </>
      ) : (
        <>
          <div className="selected-file">
            <FileArchive size={20} />
            <strong>{filename}</strong>
            <Check size={17} />
          </div>
          <div className="review-summary">
            <span>
              <strong>{s.total.toLocaleString()}</strong>messages
            </span>
            <span>
              <strong>{s.people.length}</strong>people
            </span>
            <span>
              <strong>{Object.keys(s.days).length}</strong>active days
            </span>
          </div>
          <div className="review-people">
            {people.map((p, i) => (
              <span key={p}>
                <i style={{ background: i % 2 ? "#aa7cce" : "#4f78df" }} />
                {names[p] || p}
              </span>
            ))}
          </div>
          {parsed.warnings.map((w, i) => (
            <p className={/chronological|attachment/.test(w) ? "import-note" : "warning"} key={i}>
              {w}
            </p>
          ))}
          <details
            className="adjustments"
            open={parsed.warnings.some((w) => /ambiguous|Invalid|Mixed/.test(w))}
          >
            <summary>
              Adjust details <span>Optional</span>
            </summary>
            <label>
              Date format
              <select value={order} onChange={(e) => setOrder(e.target.value)}>
                <option value="AUTO">
                  Automatic ({parsed.dateOrder === "MDY" ? "month/day" : "day/month"})
                </option>
                <option value="DMY">Day / month / year</option>
                <option value="MDY">Month / day / year</option>
              </select>
            </label>
            <div className="two-fields">
              <label>
                Connection
                <select value={connection} onChange={(e) => setConnection(e.target.value)}>
                  {["All conversations", "Relationships", "Friendships", "Family", "Work"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Focus
                <select value={focus} onChange={(e) => setFocus(e.target.value)}>
                  {[
                    "Understand our communication",
                    "Notice positive patterns",
                    "Explore participation",
                    "Prepare a conversation",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="two-fields">
              <label>
                From
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
            </div>
            <small>Leave dates blank to include the full history.</small>
            <h4>Names</h4>
            <div className="two-fields">
              {people.map((p) => (
                <label key={p}>
                  {p}
                  <input
                    value={names[p] || ""}
                    maxLength={60}
                    placeholder={p}
                    onChange={(e) => setNames({ ...names, [p]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={contacts}
                onChange={(e) => setContacts(e.target.checked)}
              />
              Replace emails & phone numbers
            </label>
            <small>Automatic detection may miss sensitive details.</small>
            <label>
              Anything we should know?
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Optional context"
              />
            </label>
          </details>
          <p className="import-note">Text only · session clears when you refresh</p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={15} />
              Back
            </button>
            <button className="primary" onClick={finish}>
              Create report
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
