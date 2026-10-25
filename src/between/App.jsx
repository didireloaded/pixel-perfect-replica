import React, { useEffect, useMemo, useState } from "react";
import {
  Home,
  BarChart3,
  Bookmark,
  MessageCircle,
  UserRound,
  Upload,
  Search,
  Plus,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Info,
  Download,
  MoreHorizontal,
  WifiOff,
  Check,
  X,
} from "lucide-react";
import "./style.css";
import Profile, { readProfile, ProfileAvatar } from "./Profile";
import Preferences, { applyPreferences } from "./Preferences";
import ImportFlow from "./ImportFlow";
import Overview from "./Overview";
import PatternsView from "./PatternsView";
import ConversationView from "./ConversationView";
import Library from "./Library";
import Timeline from "./Timeline";
import Notebook from "./Notebook";
import AskView from "./AskView";
import ConversationTools from "./ConversationTools";
import Sheet from "./Sheet";
import { downloadJSON } from "./ExportPanel";
import { explorePatterns } from "./insights";
import { connectionTypes, mergeImport, revise, exportConversation } from "./workspace";
import useWorkspace from "./useWorkspace";
import { statistics } from "./analysis";
export default function App() {
  const [profile, setProfile] = useState(readProfile),
    [view, setView] = useState("home"),
    [tab, setTab] = useState("Overview"),
    [modal, setModal] = useState(null),
    [evidence, setEvidence] = useState(null),
    [category, setCategory] = useState("All"),
    [query, setQuery] = useState(""),
    [importTarget, setImportTarget] = useState(null),
    [message, setMessage] = useState(""),
    [browseDate, setBrowseDate] = useState(""),
    [installPrompt, setInstallPrompt] = useState(null),
    [offline, setOffline] = useState(!navigator.onLine);
  const workspace = useWorkspace();
  const { conversations, session, ready, error, setError } = workspace;
  const findings = useMemo(() => (session ? explorePatterns(session) : []), [session]);
  const stats = useMemo(() => statistics(session?.messages || []), [session?.messages]);
  useEffect(() => {
    applyPreferences();
    const capture = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const connection = () => setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
    };
  }, []);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 6000);
    return () => clearTimeout(timer);
  }, [message]);
  function openImport(target = null) {
    setImportTarget(target);
    setModal("import");
  }
  function destination(next) {
    setView("report");
    setTab(next);
    setModal(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function open(id) {
    workspace.setActiveId(id);
    destination("Overview");
  }
  async function update(transform) {
    if (!session) throw new Error("Select a conversation first.");
    return workspace.update(session.id, transform);
  }
  async function completeImport(input) {
    if (importTarget) {
      const current = conversations.find((c) => c.id === importTarget);
      if (!current) throw new Error("The conversation is no longer available.");
      const result = mergeImport(current, input);
      if (result.added) await workspace.update(current.id, () => result.conversation);
      workspace.setActiveId(current.id);
      setMessage(result.added ? `${result.added} new messages added` : "No new messages found");
    } else {
      workspace.add(input);
      setMessage("Conversation imported");
    }
    setModal(null);
    destination("Overview");
  }
  useEffect(() => {
    const cleared = () => {
      setProfile({ name: "", photo: "" });
      setEvidence(null);
      setModal(null);
      setView("home");
      setQuery("");
      setCategory("All");
      setImportTarget(null);
      applyPreferences();
      setMessage(
        "All chats, reports, profile and preferences cleared from this browser. Downloaded files are unchanged.",
      );
    };
    window.addEventListener("between:cleared", cleared);
    return () => window.removeEventListener("between:cleared", cleared);
  }, []);
  async function clearAllData() {
    try {
      await workspace.clear();
    } catch (e) {
      setError(e.message);
    }
  }
  async function deleteConversation() {
    try {
      await workspace.remove(session.id);
      setEvidence(null);
      setModal(null);
      setView("home");
      setMessage("Conversation and derived data removed");
    } catch (e) {
      setError(e.message);
    }
  }
  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      setInstallPrompt(null);
      setMessage(
        result.outcome === "accepted" ? "Installation requested" : "You can install later",
      );
    } else
      setMessage(
        "iPhone: Safari → Share → Add to Home Screen. Android/desktop: use your browser’s Install option.",
      );
  }
  async function toggleBookmark(id) {
    try {
      await update((c) => ({
        ...c,
        bookmarks: c.bookmarks.includes(id)
          ? c.bookmarks.filter((x) => x !== id)
          : [...c.bookmarks, id],
      }));
    } catch (e) {
      setError(e.message);
    }
  }
  const recent = conversations
    .filter(
      (c) =>
        (category === "All" || c.connection === category) &&
        `${c.title} ${c.filename}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 4);
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
            }}
          >
            <span className="brand-icon">
              <MessageCircle size={21} />
              <span />
            </span>
            between
          </a>
          <button
            className="user-avatar"
            aria-label="Edit profile"
            onClick={() => setView("profile")}
          >
            <ProfileAvatar profile={profile} />
          </button>
        </header>
        {offline && (
          <div className="offline-banner">
            <WifiOff size={16} />
            Offline · device features available
          </div>
        )}
        {error && (
          <div className="workspace-error" role="alert">
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {message && (
          <div className="toast" role="status">
            <Check size={16} />
            <span>{message}</span>
          </div>
        )}
        <main>
          {!ready ? (
            <div className="empty">
              <p>Opening your workspace…</p>
            </div>
          ) : (
            <>
              {view === "home" && (
                <>
                  <section className="home-heading">
                    <h1>{profile.name ? `Hey, ${profile.name.split(/\s+/)[0]}` : "Home"}</h1>
                  </section>
                  <label className="home-search">
                    <Search size={18} />
                    <input
                      aria-label="Search conversations"
                      placeholder="Search conversations"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <section className="home-actions">
                    <button className="import-tile" onClick={() => openImport()}>
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
                      <button onClick={() => destination("Conversation")}>
                        <Search size={20} />
                        <span>Search messages</span>
                      </button>
                      <button onClick={() => destination("Timeline")}>
                        <BarChart3 size={20} />
                        <span>Explore timeline</span>
                      </button>
                    </div>
                  </section>
                  <button
                    className="local-processing local-processing-button"
                    onClick={() => setModal("privacy")}
                  >
                    <ShieldCheck size={14} /> Chat content stays on this device
                  </button>
                  <div className="section-heading">
                    <h2>Your conversations</h2>
                    <button onClick={() => setView("library")}>
                      See all
                      <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="filter-tabs">
                    {["All", ...connectionTypes].map((t) => (
                      <button
                        key={t}
                        className={category === t ? "selected" : ""}
                        onClick={() => setCategory(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {recent.length ? (
                    recent.map((c) => (
                      <button className="library-row" key={c.id} onClick={() => open(c.id)}>
                        <span className="duo-avatar">
                          <span>{c.messages[0]?.speaker[0]}</span>
                          <span>{[...new Set(c.messages.map((m) => m.speaker))][1]?.[0]}</span>
                        </span>
                        <span>
                          <strong>{c.title}</strong>
                          <small>
                            {c.connection} · {c.messages.length.toLocaleString()} messages
                          </small>
                          <small>{c.saved ? "Saved on device" : "Temporary session"}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))
                  ) : (
                    <button className="add-chat-row" onClick={() => openImport()}>
                      <span className="dashed-icon">
                        <Plus size={22} />
                      </span>
                      <strong>{query ? "No matching conversations" : "Add a conversation"}</strong>
                      <ChevronRight size={17} />
                    </button>
                  )}
                </>
              )}
              {(view === "library" || view === "saved") && (
                <Library
                  key={view}
                  conversations={conversations}
                  savedOnly={view === "saved"}
                  onOpen={open}
                  onEvidence={(id, ids) => {
                    workspace.setActiveId(id);
                    setEvidence(ids);
                  }}
                  onImport={() => openImport()}
                />
              )}
              {view === "profile" && (
                <>
                  <div className="screen-title">
                    <h1>Profile</h1>
                  </div>
                  <Profile profile={profile} onSave={setProfile} />
                  <section className="settings-group">
                    <h3>Data on this device</h3>
                    <p className="section-caption">
                      {conversations.filter((c) => c.saved).length} saved chats ·{" "}
                      {conversations.filter((c) => !c.saved).length} temporary chats. Saved chats
                      use this browser’s IndexedDB. Temporary chats disappear on refresh.
                    </p>
                    <button className="danger-button" onClick={() => setModal("clear-all")}>
                      Clear all app data
                    </button>
                  </section>
                  <Preferences />
                  <section className="settings-group">
                    <h3>App & data</h3>
                    <button className="settings-row" onClick={install}>
                      <Smartphone size={20} />
                      <strong>Add to Home Screen</strong>
                      <ChevronRight size={16} />
                    </button>
                    <button className="settings-row" onClick={() => setModal("privacy")}>
                      <ShieldCheck size={20} />
                      <strong>Privacy & storage</strong>
                      <ChevronRight size={16} />
                    </button>
                    <button
                      className="settings-row"
                      onClick={() =>
                        downloadJSON(
                          conversations.map((c) => exportConversation(c, { quotes: true })),
                          "between-data.json",
                        )
                      }
                      disabled={!conversations.length}
                    >
                      <Download size={20} />
                      <strong>Export all my data</strong>
                      <ChevronRight size={16} />
                    </button>
                    <button className="settings-row" onClick={() => setModal("about")}>
                      <Info size={20} />
                      <strong>About Between</strong>
                      <ChevronRight size={16} />
                    </button>
                  </section>
                </>
              )}
              {view === "report" && !session && (
                <div className="empty">
                  <MessageCircle size={33} />
                  <h2>{tab === "Ask & reflect" ? "Ask & reflect" : "Insights"}</h2>
                  <p>Open a conversation or import a new one.</p>
                  <div className="action-row">
                    <button className="primary" onClick={() => openImport()}>
                      Import chat
                      <Upload size={17} />
                    </button>
                    <button className="secondary" onClick={() => setView("library")}>
                      Conversations
                    </button>
                  </div>
                </div>
              )}
              {view === "report" && session && (
                <>
                  <div className="report-heading">
                    <div>
                      <div className="eyebrow">
                        {session.connection} · {session.saved ? "SAVED ON DEVICE" : "TEMPORARY"}
                      </div>
                      <h1>{session.title}</h1>
                      <p>
                        {stats.total.toLocaleString()} messages · {Object.keys(stats.days).length}{" "}
                        active days · You: {session.self}
                      </p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Manage conversation"
                      onClick={() =>
                        document.querySelector(".conversation-tools")?.setAttribute("open", "")
                      }
                    >
                      <MoreHorizontal size={22} />
                    </button>
                  </div>
                  <ConversationTools
                    key={session.id}
                    conversation={session}
                    onUpdate={update}
                    onImportUpdate={() => openImport(session.id)}
                    onDelete={() => setModal("delete")}
                  />
                  <div
                    className="category-tabs report-tabs"
                    role="tablist"
                    aria-label="Report sections"
                  >
                    {[
                      "Overview",
                      "Patterns & evidence",
                      "Timeline",
                      "Conversation",
                      "Ask & reflect",
                      "Notes & goals",
                    ].map((t) => (
                      <button
                        role="tab"
                        aria-selected={tab === t}
                        key={t}
                        className={tab === t ? "chosen" : ""}
                        onClick={() => {
                          setTab(t);
                          setBrowseDate("");
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <section role="tabpanel" aria-label={tab}>
                    {tab === "Overview" && (
                      <>
                        <article className="conversation-summary">
                          <h2>At a glance</h2>
                          <p>
                            {session.title} includes {stats.total.toLocaleString()} text messages
                            from {stats.people.length} participants, across{" "}
                            {Object.keys(stats.days).length} active days.{" "}
                            {findings
                              .slice(0, 2)
                              .map((f) => f.body)
                              .join(" ")}
                          </p>
                          <button
                            className="text-button"
                            onClick={() => setTab("Patterns & evidence")}
                          >
                            Explore the evidence
                            <ChevronRight size={15} />
                          </button>
                        </article>
                        <Overview
                          messages={session.messages}
                          onEvidence={setEvidence}
                          onBrowse={(date) => {
                            setBrowseDate(date);
                            setTab("Conversation");
                          }}
                        />
                        <div className="action-row">
                          <button className="secondary" onClick={() => setTab("Timeline")}>
                            Compare periods
                          </button>
                          <button className="secondary" onClick={() => setTab("Notes & goals")}>
                            Notes & goals
                          </button>
                        </div>
                      </>
                    )}
                    {tab === "Patterns & evidence" && (
                      <PatternsView
                        findings={findings}
                        onEvidence={setEvidence}
                        conversation={session}
                        onUpdate={update}
                      />
                    )}{" "}
                    {tab === "Timeline" && (
                      <Timeline
                        key={session.id}
                        conversation={session}
                        onUpdate={update}
                        onEvidence={setEvidence}
                        onBrowse={(date) => {
                          setBrowseDate(date);
                          setTab("Conversation");
                        }}
                      />
                    )}{" "}
                    {tab === "Conversation" && (
                      <ConversationView
                        key={`${session.id}-${browseDate}`}
                        messages={session.messages}
                        initialDate={browseDate}
                        onEvidence={setEvidence}
                      />
                    )}{" "}
                    {tab === "Ask & reflect" && (
                      <AskView
                        key={session.id}
                        conversation={session}
                        onUpdate={update}
                        onEvidence={setEvidence}
                      />
                    )}{" "}
                    {tab === "Notes & goals" && (
                      <Notebook conversation={session} onUpdate={update} onEvidence={setEvidence} />
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </main>
        <nav className="tab-bar" aria-label="Main navigation">
          {[
            ["Home", "home", Home],
            ["Insights", "report", BarChart3],
            ["Saved", "saved", Bookmark],
            ["Ask", "ask", MessageCircle],
            ["Profile", "profile", UserRound],
          ].map(([label, dest, Icon]) => {
            const active =
              dest === "ask"
                ? view === "report" && tab === "Ask & reflect"
                : dest === "report"
                  ? view === "report" && tab !== "Ask & reflect"
                  : view === dest;
            return (
              <button
                key={dest}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  dest === "ask"
                    ? destination("Ask & reflect")
                    : dest === "report"
                      ? destination("Overview")
                      : setView(dest);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }}
              >
                <Icon size={22} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      {modal && (
        <Sheet
          onClose={() => setModal(null)}
          titleId="modal-title"
          className={modal === "import" ? "import-modal" : ""}
        >
          {modal === "import" ? (
            <ImportFlow
              onComplete={completeImport}
              updateFor={conversations.find((c) => c.id === importTarget)}
            />
          ) : modal === "delete" ? (
            <>
              <h2 id="modal-title">Delete this conversation?</h2>
              <p>
                This removes its source messages, reports, notes, bookmarks, saved answers and
                derived versions from this workspace and device storage. Exported files remain on
                your device.
              </p>
              <div className="modal-actions">
                <button className="secondary" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button className="danger-button" onClick={deleteConversation}>
                  Delete conversation
                </button>
              </div>
            </>
          ) : modal === "clear-all" ? (
            <>
              <h2 id="modal-title">Clear all app data?</h2>
              <p>
                This deletes all temporary and saved chats, reports, notes, bookmarks, answers,
                profile photo and preferences from this browser. This cannot be undone.
              </p>
              <p>
                Downloaded exports and browser or OS backups are not deleted. Other browser profiles
                and devices are separate. Close other Between tabs first if this browser does not
                support cross-tab notifications.
              </p>
              <div className="modal-actions">
                <button className="secondary" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button className="danger-button" onClick={clearAllData}>
                  Clear all app data
                </button>
              </div>
            </>
          ) : modal === "privacy" ? (
            <>
              <h2 id="modal-title">Privacy & storage</h2>
              <button className="danger-button" onClick={() => setModal("clear-all")}>
                Clear all app data
              </button>
              <p>
                Imports are processed in your browser. Temporary conversations disappear on refresh.
                Only conversations you explicitly save are stored in this browser’s IndexedDB, with
                the expiry you select. Expiry is enforced when the app opens and while it is active.
              </p>
              <p>
                Profile and appearance preferences are saved locally. Device storage is not an
                encrypted vault. Use a private browser profile on shared devices.
              </p>
              <p>
                No conversation content is sent to an analysis service. The current findings and Ask
                use documented keyword rules. No account is required. Chats are not uploaded to
                cloud storage.
              </p>
              <p>
                Deleting a conversation removes its active device data and derived content;
                downloaded exports and browser/OS backups must be managed separately. No guarantee
                is made about physical disk erasure.
              </p>
            </>
          ) : (
            <>
              <h2 id="modal-title">About Between</h2>
              <p>
                Source-linked conversation insights, with code-calculated statistics, editable
                communication templates and space for your own context.
              </p>
              <p>
                Interpretations of hidden feelings, automatic diagnosis and compatibility scores are
                not offered.
              </p>
            </>
          )}
        </Sheet>
      )}
      {evidence && session && (
        <Sheet onClose={() => setEvidence(null)} label="Source messages" className="evidence-modal">
          <div className="eyebrow">SOURCE MESSAGES</div>
          <h2>In context</h2>
          <p className="section-caption">
            Referenced messages are highlighted. Neighbouring messages preserve the original source
            order.
          </p>
          {session.messages
            .filter(
              (m, i) =>
                evidence.includes(m.id) ||
                evidence.includes(session.messages[i - 1]?.id) ||
                evidence.includes(session.messages[i + 1]?.id),
            )
            .map((m) => (
              <article
                className={`source-message ${evidence.includes(m.id) ? "highlighted" : ""}`}
                key={m.id}
              >
                <div>
                  <div className="source-message-head">
                    <strong>
                      {m.speaker}
                      {m.speaker === session.self ? " · You" : ""}
                    </strong>
                    <button
                      className={
                        session.bookmarks.includes(m.id)
                          ? "bookmark-button selected"
                          : "bookmark-button"
                      }
                      aria-label={
                        session.bookmarks.includes(m.id) ? "Remove bookmark" : "Bookmark message"
                      }
                      onClick={() => toggleBookmark(m.id)}
                    >
                      <Bookmark size={17} />
                    </button>
                  </div>
                  <time>{m.date ? new Date(m.date).toLocaleString() : "No timestamp"}</time>
                  <p>{m.body}</p>
                  <small>
                    {evidence.includes(m.id) ? "Referenced excerpt" : "Surrounding context"}
                  </small>
                </div>
              </article>
            ))}
          <button className="secondary" onClick={() => setEvidence(null)}>
            Return
          </button>
        </Sheet>
      )}
    </div>
  );
}
