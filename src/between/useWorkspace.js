import { useCallback, useEffect, useRef, useState } from "react";
import { listSaved, putSaved, deleteSaved, clearSaved } from "./storage";
import { createConversation, isExpired } from "./workspace";
export default function useWorkspace() {
  const [conversations, setConversations] = useState([]),
    [activeId, setActiveId] = useState(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const channel = useRef(null);
  const state = useRef([]),
    locks = useRef(new Set());
  const publish = useCallback((next) => {
    state.current = next;
    setConversations(next);
  }, []);
  useEffect(() => {
    let alive = true;
    listSaved()
      .then(async (all) => {
        const keep = [];
        for (const c of all) {
          if (isExpired(c)) await deleteSaved(c.id);
          else keep.push(c);
        }
        if (alive) {
          publish(keep);
          setActiveId(keep.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.id || null);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [publish]);
  useEffect(() => {
    const timer = setInterval(() => {
      const expired = state.current.filter((c) => isExpired(c));
      if (!expired.length) return;
      publish(state.current.filter((c) => !isExpired(c)));
      expired.forEach((c) => deleteSaved(c.id).catch((e) => setError(e.message)));
    }, 60000);
    return () => clearInterval(timer);
  }, [publish]);
  useEffect(() => {
    if (!window.BroadcastChannel) return;
    const connection = new BroadcastChannel("between-storage");
    channel.current = connection;
    connection.onmessage = ({ data }) => {
      if (data !== "cleared") return;
      publish([]);
      setActiveId(null);
      window.dispatchEvent(new Event("between:cleared"));
    };
    return () => {
      channel.current = null;
      connection.close();
    };
  }, [publish]);
  const clear = useCallback(async () => {
    if (locks.current.size) throw new Error("Wait for the current save to finish, then try again.");
    await clearSaved();
    publish([]);
    setActiveId(null);
    for (const key of ["between.profile.v1", "between.preferences"]) localStorage.removeItem(key);
    channel.current?.postMessage("cleared");
    window.dispatchEvent(new Event("between:cleared"));
  }, [publish]);
  const add = useCallback(
    (input) => {
      const c = createConversation(input);
      publish([c, ...state.current]);
      setActiveId(c.id);
      return c;
    },
    [publish],
  );
  const update = useCallback(
    async (id, transform) => {
      if (locks.current.has(id)) throw new Error("A save is still in progress. Try again.");
      locks.current.add(id);
      try {
        const previous = state.current.find((c) => c.id === id);
        if (!previous || isExpired(previous))
          throw new Error("This conversation is no longer available.");
        const value = typeof transform === "function" ? transform(previous) : transform;
        const next = {
          ...value,
          id: previous.id,
          revision: previous.revision + 1,
          updatedAt: new Date().toISOString(),
        };
        if (next.saved) await putSaved(next, previous.saved ? previous.revision : null);
        else if (previous.saved) await deleteSaved(id, previous.revision);
        publish(state.current.map((c) => (c.id === id ? next : c)));
        return next;
      } finally {
        locks.current.delete(id);
      }
    },
    [publish],
  );
  const remove = useCallback(
    async (id) => {
      if (locks.current.has(id)) throw new Error("A save is still in progress. Try again.");
      locks.current.add(id);
      try {
        const c = state.current.find((c) => c.id === id);
        if (c?.saved) await deleteSaved(id, c.revision);
        publish(state.current.filter((c) => c.id !== id));
        setActiveId((previous) => (previous === id ? null : previous));
      } finally {
        locks.current.delete(id);
      }
    },
    [publish],
  );
  return {
    conversations: conversations.filter((c) => !isExpired(c)),
    session: conversations.find((c) => c.id === activeId && !isExpired(c)) || null,
    activeId,
    setActiveId,
    ready,
    error,
    setError,
    add,
    update,
    remove,
    clear,
  };
}
