import React, { useEffect, useState } from "react";
function read() {
  try {
    return JSON.parse(localStorage.getItem("between.preferences")) || {};
  } catch {
    return {};
  }
}
export default function Preferences() {
  const [prefs, setPrefs] = useState(read),
    [error, setError] = useState("");
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        prefs.theme === "system" || !prefs.theme ? (media.matches ? "dark" : "light") : prefs.theme;
      document.documentElement.dataset.textSize = prefs.size || "default";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [prefs]);
  function change(key, value) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      localStorage.setItem("between.preferences", JSON.stringify(next));
      setError("");
    } catch {
      setError("Appearance changes apply for this session; browser storage is unavailable.");
    }
  }
  return (
    <section className="settings-group">
      <h3>Appearance</h3>
      <label>
        Theme
        <select value={prefs.theme || "system"} onChange={(e) => change("theme", e.target.value)}>
          <option value="system">Use device setting</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <label>
        Reading size
        <select value={prefs.size || "default"} onChange={(e) => change("size", e.target.value)}>
          <option value="default">Default</option>
          <option value="large">Large</option>
          <option value="larger">Extra large</option>
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
export function applyPreferences() {
  const p = read();
  document.documentElement.dataset.theme =
    p.theme === "dark" ||
    ((!p.theme || p.theme === "system") && matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";
  document.documentElement.dataset.textSize = p.size || "default";
}
