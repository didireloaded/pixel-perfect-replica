import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  MessageCircle,
  Heart,
  Users,
  Home,
  Briefcase,
  ShieldCheck,
  Lock,
  ChevronRight,
  Upload,
  X,
  Check,
  Download,
  Trash2,
  Search,
  ArrowLeft,
  Quote,
  Info,
  Settings,
  BarChart3,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { statistics, findings } from "./analysis";
import "./style.css";
import ImportFlow from "./ImportFlow";
import Overview from "./Overview";
import PatternsView from "./PatternsView";
import ConversationView from "./ConversationView";
import Profile, { readProfile, ProfileAvatar } from "./Profile";
const categories = [
  ["All conversations", MessageCircle],
  ["Relationships", Heart],
  ["Friendships", Users],
  ["Family", Home],
  ["Work", Briefcase],
];
export default function App() {
  const [profile, setProfile] = useState(readProfile);
  const [view, setView] = useState("home"),
    [category, setCategory] = useState("All conversations"),
    [modal, setModal] = useState(null),
    [session, setSession] = useState(null),
    [evidence, setEvidence] = useState(null),
    [tab, setTab] = useState("Overview"),
    [query, setQuery] = useState(""),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState(""),
    [draft, setDraft] = useState(""),
    [tone, setTone] = useState("Gentle"),
    [draftGoal, setDraftGoal] = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [installStatus, setInstallStatus] = useState("");
  useEffect(() => {
    const capture = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const connection = () => setOffline(!navigator.onLine);
    const done = () => {
      setInstallPrompt(null);
      setInstallStatus("Between is installed.");
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallStatus(
        choice.outcome === "accepted" ? "Installation requested." : "You can install later.",
      );
      setInstallPrompt(null);
    } else
      setInstallStatus(
        "On iPhone: open in Safari, tap Share, then Add to Home Screen. On supported desktop or Android browsers, use the browser’s Install app option. Installation requires HTTPS or localhost.",
      );
  }
  function openDestination(next) {
    setView("report");
    setTab(next);
    setModal(null);
    window.scrollTo(0, 0);
  }
  const messages = session?.messages || [];
  const stats = useMemo(() => statistics(messages), [messages]);
  const insights = useMemo(() => findings(messages), [messages]);
  function openImport() {
    setModal("import");
  }
  function completeImport(next) {
    if (
      session &&
      !window.confirm("Replace the current report? Export it first if you want to keep it.")
    )
      return;
    setSession(next);
    setModal(null);
    setView("report");
    setTab("Overview");
    setAnswer("");
    setQuestion("");
    setDraft("");
    setDraftGoal("");
    setEvidence(null);
  }
  function remove() {
    setSession(null);
    setAnswer("");
    setDraft("");
    setQuestion("");
    setQuery("");
    setDraftGoal("");
    setEvidence(null);
    setModal(null);
    setView("home");
  }

  function exportReport() {
    const out = [
      "BETWEEN — Local conversation report",
      "Imported conversation",
      `${stats.total} messages · ${stats.people.length} participants`,
      "Calculated statistics and keyword matches.",
      ...insights.flatMap((f) => [
        f.title,
        f.body,
        ...f.ids.map((id) => {
          const m = messages.find((x) => x.id === id);
          return `${m.speaker} · ${m.date || "No timestamp"}: ${m.body}`;
        }),
        f.limit,
      ]),
      "User-provided context: " + (session?.context || "None"),
      "No conclusion here establishes another person’s feelings.",
    ].join("\n\n");
    const url = URL.createObjectURL(new Blob([out], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "between-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  function ask(q) {
    setQuestion(q);
    const terms = q
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 3);
    const hits = messages
      .filter((m) => terms.some((t) => m.body.toLowerCase().includes(t)))
      .slice(0, 3);
    setAnswer(
      hits.length
        ? "These messages match words in your question. Open each excerpt and review the context. "
        : "No matching evidence was found by local keyword search. Try a word from the conversation.",
    );
    setEvidence(hits.length ? hits.map((m) => m.id) : null);
  }

  return (
    <div className="app">
      <div className="main">
        <header>
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setView("home");
              window.scrollTo(0, 0);
            }}
          >
            <span className="brand-icon">
              <MessageCircle size={21} />
              <span />
            </span>
            between
          </a>
          <div className="header-actions">
            <button
              className="user-avatar"
              aria-label="Edit profile"
              onClick={() => setView("settings")}
            >
              <ProfileAvatar profile={profile} />
            </button>
          </div>
        </header>
        {offline && (
          <div className="offline-banner">
            <WifiOff size={15} />
            Offline · local imports and reports still work
          </div>
        )}
        <main>
          {view === "home" && (
            <>
              <section className="home-heading">
                <h1>{profile.name ? `Hey, ${profile.name.split(/\s+/)[0]}` : "Home"}</h1>
              </section>
              <label className="home-search">
                <Search size={19} />
                <input
                  aria-label="Search your chats"
                  placeholder="Search chats"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setView("history");
                  }}
                />
              </label>
              <section className="home-actions" aria-label="Quick actions">
                <button className="import-tile" onClick={openImport}>
                  <span className="quick-icon blue">
                    <Upload size={22} />
                  </span>
                  <span>
                    <strong>Import chat</strong>
                    <small>WhatsApp ZIP or text</small>
                  </span>
                  <Plus size={19} />
                </button>
                <div className="home-tools">
                  <button onClick={() => openDestination("Conversation")}>
                    <Search size={21} />
                    <span>Search messages</span>
                  </button>
                  <button
                    onClick={() => {
                      openDestination("Ask & reflect");
                      setTimeout(
                        () =>
                          document
                            .querySelector(".draft-section")
                            ?.scrollIntoView({
                              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                                .matches
                                ? "auto"
                                : "smooth",
                            }),
                        0,
                      );
                    }}
                  >
                    <MessageCircle size={21} />
                    <span>Draft a reply</span>
                  </button>
                </div>
              </section>
              <div className="section-heading">
                <h2>Your chats</h2>
                <button onClick={() => setView("history")}>
                  See all <ChevronRight size={15} />
                </button>
              </div>
              <div className="filter-tabs">
                {categories.map(([name, Icon]) => (
                  <button
                    className={category === name ? "selected" : ""}
                    key={name}
                    onClick={() => setCategory(name)}
                  >
                    {name === "All conversations" ? "All" : name}
                  </button>
                ))}
              </div>
              {session && (category === "All conversations" || session.connection === category) ? (
                <button
                  className="chat-row"
                  onClick={() => {
                    setView("report");
                    setTab("Overview");
                  }}
                >
                  <span className="duo-avatar">
                    <span>{stats.people[0]?.[0]}</span>
                    <span>{stats.people[1]?.[0]}</span>
                  </span>
                  <span className="chat-row-copy">
                    <strong>{stats.people.join(" & ")}</strong>
                    <small>
                      {stats.total} messages · {session.filename}
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button className="add-chat-row" onClick={openImport}>
                  <span className="dashed-icon">
                    <Plus size={22} />
                  </span>
                  <span>
                    <strong>
                      {category === "All conversations"
                        ? "Add your first conversation"
                        : `Add a ${category.toLowerCase().replace(/s$/, "")} chat`}
                    </strong>
                  </span>
                  <ChevronRight size={18} />
                </button>
              )}
            </>
          )}
          {view === "settings" && (
            <>
              <div className="screen-title">
                <h1>Settings</h1>
              </div>
              <Profile profile={profile} onSave={setProfile} />
              <section className="settings-group">
                <h3>App</h3>
                <button className="settings-row" onClick={install}>
                  <span className="quick-icon blue">
                    <Smartphone size={21} />
                  </span>
                  <span>
                    <strong>Add to Home Screen</strong>
                  </span>
                  <ChevronRight size={18} />
                </button>
                {installStatus && (
                  <p className="install-status" role="status">
                    {installStatus}
                  </p>
                )}
                <button className="settings-row" onClick={() => setModal("privacy")}>
                  <span className="quick-icon violet">
                    <ShieldCheck size={21} />
                  </span>
                  <span>
                    <strong>Privacy & storage</strong>
                    <small>Conversation data stays in tab memory</small>
                  </span>
                  <ChevronRight size={18} />
                </button>
                <button className="settings-row" onClick={() => setModal("about")}>
                  <span className="quick-icon pink">
                    <Info size={21} />
                  </span>
                  <span>
                    <strong>About Between</strong>
                  </span>
                  <ChevronRight size={18} />
                </button>
              </section>
              <section className="settings-group">
                <h3>Your data</h3>
                <p className="settings-description">
                  Refreshing or closing clears your conversation. Installing the app does not save
                  chats. The offline app shell stores only application files.
                </p>
                <button
                  className="settings-row danger"
                  disabled={!session}
                  onClick={() => setModal("delete")}
                >
                  <Trash2 size={21} />
                  <span>
                    <strong>Clear conversation</strong>
                    <small>Remove the current report and drafts</small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              </section>
            </>
          )}
          {view === "history" && (
            <>
              <div className="page-intro">
                <div>
                  <h1>Chats</h1>
                </div>
                <button className="primary" onClick={openImport}>
                  <Plus size={17} />
                  New conversation
                </button>
              </div>
              <label className="searchbox">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search participants"
                />
              </label>
              {session && stats.people.join(" ").toLowerCase().includes(query.toLowerCase()) ? (
                <button className="history-card" onClick={() => setView("report")}>
                  <span className="feature-icon">
                    <MessageCircle />
                  </span>
                  <div>
                    <h3>{stats.people.join(" & ")}</h3>
                    <p>
                      {stats.total} messages · {session.filename}
                    </p>
                  </div>
                  <ArrowRight />
                </button>
              ) : (
                <div className="empty">
                  <MessageCircle size={35} />
                  <h3>{query ? "No matching conversations" : "No chats yet."}</h3>
                  <p>Import a chat to get started.</p>
                  <button className="primary" onClick={openImport}>
                    Add a conversation <Plus size={16} />
                  </button>
                </div>
              )}
            </>
          )}
          {view === "report" && !session && (
            <section className="empty">
              <MessageCircle size={34} />
              <h2>{tab === "Ask & reflect" ? "Ask & reflect" : "Insights"}</h2>
              <p>Import a chat to get started.</p>
              <button className="primary" onClick={openImport}>
                Import chat
                <Upload size={17} />
              </button>
            </section>
          )}
          {view === "report" && session && (
            <>
              <button className="back" onClick={() => setView("home")}>
                <ArrowLeft size={15} />
                Home
              </button>
              <div className="report-heading">
                <div>
                  <div className="eyebrow">{session.filename}</div>
                  <h1>{stats.people.join(" & ")}</h1>
                  <p>
                    {stats.total} messages · {Object.keys(stats.days).length} active days ·{" "}
                    {session.focus}
                  </p>
                </div>
                <div className="report-actions">
                  <button className="secondary" onClick={exportReport}>
                    <Download size={16} />
                    Export report
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Delete conversation"
                    onClick={() => setModal("delete")}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="category-tabs report-tabs">
                {["Overview", "Patterns & evidence", "Conversation", "Ask & reflect"].map((t) => (
                  <button className={tab === t ? "chosen" : ""} key={t} onClick={() => setTab(t)}>
                    {t}
                  </button>
                ))}
              </div>
              {tab === "Overview" && <Overview messages={messages} onEvidence={setEvidence} />}{" "}
              {tab === "Patterns & evidence" && (
                <PatternsView
                  findings={insights}
                  onEvidence={setEvidence}
                  context={session.context}
                  onContext={(context) => setSession({ ...session, context })}
                />
              )}{" "}
              {tab === "Conversation" && (
                <ConversationView messages={messages} onEvidence={setEvidence} />
              )}
              {tab === "Ask & reflect" && (
                <div className="reflect-grid">
                  <section className="stats-card">
                    <Search size={25} />
                    <h2>Ask your chat</h2>
                    <p>Search the imported messages by keyword.</p>
                    <div className="suggested">
                      {[
                        "What supports this interpretation?",
                        "What did we say about work?",
                        "Where did we say thank you?",
                      ].map((q) => (
                        <button key={q} onClick={() => ask(q)}>
                          {q}
                          <ArrowUpRight size={14} />
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
                        Search the conversation
                        <input
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="Find a word or topic…"
                          required
                        />
                      </label>
                      <button className="primary" type="submit">
                        Find evidence <Search size={15} />
                      </button>
                    </form>
                    {answer && (
                      <p className="answer" role="status">
                        {answer}
                      </p>
                    )}
                  </section>
                  <section className="stats-card draft-section">
                    <MessageCircle size={25} />
                    <h2>Draft a reply</h2>
                    <p>Editable template.</p>
                    <label>
                      What would you like to talk about?
                      <input
                        value={draftGoal}
                        onChange={(e) => setDraftGoal(e.target.value)}
                        placeholder="Making more time to talk"
                      />
                    </label>
                    <label>
                      How should it sound?
                      <select value={tone} onChange={(e) => setTone(e.target.value)}>
                        {["Gentle", "Direct", "Brief"].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="primary"
                      disabled={!draftGoal.trim()}
                      onClick={() =>
                        setDraft(
                          tone === "Brief"
                            ? `Can we talk about ${draftGoal}? I'd like to hear your perspective.`
                            : tone === "Direct"
                              ? `I'd like us to talk about ${draftGoal}. It matters to me, and I want to understand how you see it. When would be a good time?`
                              : `I've been thinking about ${draftGoal}, and I'd love to talk when we both have a little space. I want to understand your perspective, too.`,
                        )
                      }
                    >
                      Create a starting point <ArrowRight size={15} />
                    </button>
                    {draft && (
                      <label>
                        Your editable draft
                        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
                        <small>Nothing is sent automatically.</small>
                      </label>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </main>
        <nav className="tab-bar" aria-label="Main navigation">
          <button
            aria-current={view === "home" ? "page" : undefined}
            className={view === "home" ? "active" : ""}
            onClick={() => {
              setView("home");
              window.scrollTo(0, 0);
            }}
          >
            <Home size={22} />
            <span>Home</span>
          </button>
          <button
            aria-current={view === "history" ? "page" : undefined}
            className={view === "history" ? "active" : ""}
            onClick={() => {
              setView("history");
              window.scrollTo(0, 0);
            }}
          >
            <MessageCircle size={22} />
            <span>Chats</span>
          </button>
          <button
            aria-current={view === "report" && tab !== "Ask & reflect" ? "page" : undefined}
            className={view === "report" && tab !== "Ask & reflect" ? "active" : ""}
            onClick={() => openDestination("Overview")}
          >
            <BarChart3 size={22} />
            <span>Insights</span>
          </button>
          <button
            aria-current={view === "report" && tab === "Ask & reflect" ? "page" : undefined}
            className={view === "report" && tab === "Ask & reflect" ? "active" : ""}
            onClick={() => openDestination("Ask & reflect")}
          >
            <Search size={22} />
            <span>Ask</span>
          </button>
          <button
            aria-current={view === "settings" ? "page" : undefined}
            className={view === "settings" ? "active" : ""}
            onClick={() => {
              setView("settings");
              window.scrollTo(0, 0);
            }}
          >
            <Settings size={22} />
            <span>Settings</span>
          </button>
        </nav>
      </div>
      {modal && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <section
            className={"modal " + (modal === "import" ? "import-modal" : "")}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") setModal(null);
              if (e.key === "Tab") {
                const els = [
                  ...e.currentTarget.querySelectorAll("button,input,select,textarea,a[href]"),
                ].filter((el) => !el.disabled && el.offsetParent !== null);
                if (e.shiftKey && document.activeElement === els[0]) {
                  e.preventDefault();
                  els.at(-1)?.focus();
                } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
                  e.preventDefault();
                  els[0]?.focus();
                }
              }
            }}
            ref={(el) => {
              if (el && !el.contains(document.activeElement)) el.querySelector("button")?.focus();
            }}
          >
            <button
              className="close icon-button"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {modal === "import" ? (
              <ImportFlow onComplete={completeImport} />
            ) : modal === "privacy" ? (
              <>
                <ShieldCheck size={30} />
                <h2 id="modal-title">Privacy & storage</h2>
                <p>
                  Your conversation is processed in browser memory. It is not uploaded or saved to
                  conversation history. No account or analytics are used. Your optional profile name
                  and photo are stored on this device. The installed production app caches
                  application files for offline use, never your messages or reports.
                </p>
                <p>
                  Refreshing or closing this tab clears the session. Exported files remain on your
                  device until you delete them.
                </p>
                <p>
                  Name and contact replacement reduce exposure but cannot guarantee anonymity. No
                  external provider receives your messages.
                </p>
                <button className="primary" onClick={() => setModal(null)}>
                  Got it <Check size={16} />
                </button>
              </>
            ) : modal === "delete" ? (
              <>
                <Trash2 size={30} />
                <h2 id="modal-title">Clear this conversation?</h2>
                <p>
                  This removes the conversation, local report, context and drafts from this app
                  session. Exported files on your device are unaffected.
                </p>
                <div className="modal-actions">
                  <button className="secondary" onClick={() => setModal(null)}>
                    Keep it
                  </button>
                  <button className="primary" onClick={remove}>
                    Clear session
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="modal-title">About Between</h2>
                <p>
                  Between helps you review your conversations and the messages behind each finding.
                </p>
                <p>
                  This version uses calculated statistics and keyword matches. Accounts, contextual
                  interpretation and cloud storage are not connected.
                </p>
              </>
            )}
          </section>
        </div>
      )}
      {evidence && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEvidence(null);
          }}
        >
          <section
            className="modal evidence-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Source evidence"
            tabIndex={-1}
            ref={(el) => el?.focus()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEvidence(null);
              if (e.key === "Tab") {
                const els = [...e.currentTarget.querySelectorAll("button")];
                if (e.shiftKey && document.activeElement === els[0]) {
                  e.preventDefault();
                  els.at(-1)?.focus();
                } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
                  e.preventDefault();
                  els[0]?.focus();
                }
              }
            }}
          >
            <button
              className="close icon-button"
              aria-label="Close evidence"
              onClick={() => setEvidence(null)}
            >
              <X size={20} />
            </button>
            <div className="eyebrow">BACK TO THE WORDS</div>
            <h2>Source messages</h2>
            <p>
              Highlighted messages support this observation. Neighbouring messages may add context
              or complicate it.
            </p>
            {messages
              .filter(
                (m, i) =>
                  evidence.includes(m.id) ||
                  evidence.includes(messages[i - 1]?.id) ||
                  evidence.includes(messages[i + 1]?.id),
              )
              .map((m) => (
                <div
                  className={"source-message " + (evidence.includes(m.id) ? "highlighted" : "")}
                  key={m.id}
                >
                  <div>
                    <strong>{m.speaker}</strong>
                    <time>{m.date ? new Date(m.date).toLocaleString() : "No timestamp"}</time>
                    <p>{m.body}</p>
                    <small>
                      {m.id} ·{" "}
                      {evidence.includes(m.id) ? "Referenced excerpt" : "Surrounding context"}
                    </small>
                  </div>
                </div>
              ))}
            <button className="secondary" onClick={() => setEvidence(null)}>
              Return to report <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
