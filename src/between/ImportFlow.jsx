import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileArchive, Upload, LockKeyhole } from "lucide-react";
import { processImport } from "./import-task";
import { sample, redact, statistics, dayKey } from "./analysis";
import { connectionTypes } from "./workspace";
export default function ImportFlow({ onComplete, updateFor }) {
  const [text, setText] = useState(""),
    [filename, setFilename] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [step, setStep] = useState(1),
    [order, setOrder] = useState("AUTO"),
    [names, setNames] = useState({}),
    [contacts, setContacts] = useState(true),
    [connection, setConnection] = useState(updateFor?.connection || ""),
    [focus, setFocus] = useState("Understand our communication"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [context, setContext] = useState(""),
    [self, setSelf] = useState(updateFor?.self || ""),
    [selected, setSelected] = useState(null),
    [parsed, setParsed] = useState({ messages: [], warnings: [] }),
    [stage, setStage] = useState("");
  const picker = useRef();
  const controller = useRef();
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
      controller.current?.abort();
    },
    [],
  );
  const included = useMemo(
    () =>
      redact(
        parsed.messages.filter(
          (m) =>
            (!selected || selected.includes(m.speaker)) &&
            (!from || (m.date && dayKey(m.date) >= from)) &&
            (!to || (m.date && dayKey(m.date) <= to)),
        ),
        names,
        contacts,
      ),
    [parsed, names, contacts, from, to, selected],
  );
  const s = useMemo(() => statistics(included), [included]);
  const people = [...new Set(parsed.messages.map((m) => m.speaker))];
  async function read(file) {
    if (!file) return;
    controller.current?.abort();
    controller.current = new AbortController();
    const id = ++request.current;
    setBusy(true);
    setError("");
    setText("");
    setParsed({ messages: [], warnings: [] });
    setFilename("");
    setNames({});
    setSelected(null);
    setSelf(updateFor?.self || "");
    setFrom("");
    setTo("");
    try {
      const r = await processImport(
        { file, order },
        { signal: controller.current.signal, onStage: setStage },
      );
      if (id !== request.current) return;
      setText(r.text);
      setParsed(r.parsed);
      setFilename(r.archiveName || file.name);
    } catch (e) {
      if (id === request.current && e.name !== "AbortError")
        setError(e.message || "The file couldn’t be opened.");
    } finally {
      if (id === request.current) {
        setBusy(false);
        if (picker.current) picker.current.value = "";
      }
    }
  }
  function cancelImport() {
    request.current++;
    controller.current?.abort();
    setBusy(false);
    setText("");
    setFilename("");
    setParsed({ messages: [], warnings: [] });
    setStage("");
    if (picker.current) picker.current.value = "";
  }
  async function changeOrder(value) {
    setOrder(value);
    controller.current?.abort();
    controller.current = new AbortController();
    const id = ++request.current;
    setBusy(true);
    setError("");
    try {
      const result = await processImport(
        { text, order: value },
        { signal: controller.current.signal, onStage: setStage },
      );
      if (id === request.current) setParsed(result.parsed);
    } catch (e) {
      if (id === request.current && e.name !== "AbortError") {
        setError(e.message);
        setParsed({ messages: [], warnings: [] });
      }
    } finally {
      if (id === request.current) setBusy(false);
    }
  }
  async function finish() {
    if (!connection) {
      setError("Choose the connection type.");
      return;
    }
    if (!self || !s.people.includes(names[self] || self)) {
      setError("Choose which person is you.");
      return;
    }
    if (from && to && from > to) {
      setError("The start date must be before the end date.");
      return;
    }
    if (s.people.length < 2) {
      setError("Include messages from at least two participants.");
      return;
    }
    try {
      setBusy(true);
      setStage("");
      await onComplete({
        messages: included,
        filename,
        connection,
        focus,
        context,
        warnings: parsed.warnings,
        self: names[self] || self,
        sample: filename === "Fictional demo.txt",
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="eyebrow">IMPORT · {step} OF 2</div>
      <h2 id="modal-title">{step === 1 ? "Import chat" : "Review chat"}</h2>
      {busy && stage && (
        <div role="status" className="import-progress">
          <span>{stage || "Opening chat…"}</span>
          <button type="button" className="text-button" onClick={cancelImport}>
            Cancel import
          </button>
        </div>
      )}

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
              <strong>{busy ? stage || "Opening chat…" : "Choose WhatsApp export"}</strong>
              <span>ZIP or TXT · without attachments</span>
            </button>
          ) : (
            <div className="upload-confirmation" role="status">
              <span className={parsed.messages.length ? "file-success" : "file-neutral"}>
                {parsed.messages.length ? <Check size={19} /> : <FileArchive size={19} />}
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
          <p className="local-processing">
            <LockKeyhole size={14} /> Processed on this device · chat content isn’t uploaded
          </p>
          <details className="import-help">
            <summary>How to export from WhatsApp</summary>
            <ol>
              <li>Open a chat, then its contact or group information.</li>
              <li>Choose Export chat (on Android, it may be under More).</li>
              <li>
                Select <strong>Without media</strong>, then choose the ZIP or TXT here.
              </li>
            </ol>
            <p>
              Files above these limits are rejected before reading. If an export fails, export again
              without media or choose its chat TXT file. No messages are saved unless you choose
              Save on this device.
            </p>
          </details>
          {!text && !busy && !updateFor && (
            <button
              type="button"
              className="text-button"
              onClick={() => read(new File([sample], "Fictional demo.txt", { type: "text/plain" }))}
            >
              Try a fictional chat
            </button>
          )}
          <p className="upload-limit">ZIP up to 50 MB · chat text up to 2 MB</p>
          {text && parsed.messages.length === 0 && (
            <p className="warning">
              No WhatsApp messages detected. Check the date format, or export the chat again without
              media.
            </p>
          )}
          {text && (
            <label>
              Date format
              <select value={order} onChange={(e) => changeOrder(e.target.value)}>
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
          <fieldset className="connection-picker">
            <legend>What kind of connection?</legend>
            <div>
              {connectionTypes.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={connection === t ? "selected" : ""}
                  aria-pressed={connection === t}
                  onClick={() => setConnection(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="self-picker">
            <legend>Which person is you?</legend>
            {people.map((p) => (
              <label className="checkbox" key={p}>
                <input
                  type="radio"
                  name="self"
                  value={p}
                  checked={self === p}
                  onChange={() => setSelf(p)}
                />
                {names[p] || p}
              </label>
            ))}
          </fieldset>
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
              <select value={order} onChange={(e) => changeOrder(e.target.value)}>
                <option value="AUTO">
                  Automatic ({parsed.dateOrder === "MDY" ? "month/day" : "day/month"})
                </option>
                <option value="DMY">Day / month / year</option>
                <option value="MDY">Month / day / year</option>
              </select>
            </label>
            <div className="two-fields">
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
            <h4>Participants</h4>
            {people.length > 2 &&
              people.map((p) => (
                <label className="checkbox" key={p}>
                  <input
                    type="checkbox"
                    checked={!selected || selected.includes(p)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...(selected || people), p]
                          : (selected || people).filter((x) => x !== p),
                      )
                    }
                  />
                  {p}
                </label>
              ))}
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
          <p className="import-note">Text only · temporary until you choose to save</p>
          <div className="modal-actions">
            <button className="secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={15} />
              Back
            </button>
            <button className="primary" disabled={busy || !connection || !self} onClick={finish}>
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
