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
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
    document.documentElement.dataset.textSize = prefs.size || "default";
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
  document.documentElement.dataset.theme = "light";
  document.documentElement.style.colorScheme = "light";
  document.documentElement.dataset.textSize = p.size || "default";
}
