import React, { useRef, useState } from "react";
import { Camera, UserRound } from "lucide-react";
const KEY = "between.profile.v1";
export function readProfile() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return {
      name: typeof value?.name === "string" ? value.name.slice(0, 50) : "",
      photo:
        typeof value?.photo === "string" &&
        /^data:image\/(png|jpeg);base64,/.test(value.photo) &&
        value.photo.length < 600000
          ? value.photo
          : "",
    };
  } catch {
    return { name: "", photo: "" };
  }
}
export function ProfileAvatar({ profile }) {
  return profile.photo ? (
    <img src={profile.photo} alt="Your profile" />
  ) : profile.name.trim() ? (
    <span>{profile.name.trim()[0].toUpperCase()}</span>
  ) : (
    <UserRound size={20} />
  );
}
export default function Profile({ profile, onSave }) {
  const [name, setName] = useState(profile.name),
    [photo, setPhoto] = useState(profile.photo),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  const input = useRef();
  async function pick(file) {
    if (!file) return;
    setError("");
    setSaved(false);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG or WebP image under 5 MB.");
      return;
    }
    setBusy(true);
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 40000000) throw new Error();
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      const side = Math.min(bitmap.width, bitmap.height);
      ctx.drawImage(
        bitmap,
        (bitmap.width - side) / 2,
        (bitmap.height - side) / 2,
        side,
        side,
        0,
        0,
        256,
        256,
      );
      setPhoto(canvas.toDataURL("image/jpeg", 0.85));
    } catch {
      setError("This image couldn’t be opened. Try another photo.");
    } finally {
      bitmap?.close();
      setBusy(false);
      input.current.value = "";
    }
  }
  function save(e) {
    e.preventDefault();
    const next = { name: name.trim(), photo };
    try {
      if (!next.name) {
        setError("Enter your name.");
        return;
      }
      localStorage.setItem(KEY, JSON.stringify(next));
      onSave(next);
      setSaved(true);
      setError("");
    } catch {
      setError(
        "Your browser couldn’t save this profile. Check available storage or try a smaller photo.",
      );
    }
  }
  function clear() {
    try {
      localStorage.removeItem(KEY);
      const empty = { name: "", photo: "" };
      setName("");
      setPhoto("");
      onSave(empty);
      setSaved(false);
      setError("");
    } catch {
      setError("Your browser couldn’t remove the profile.");
    }
  }
  return (
    <section className="settings-group profile-editor">
      <h2>Profile</h2>
      <form onSubmit={save}>
        <div className="profile-photo-row">
          <span className="profile-photo">
            <ProfileAvatar profile={{ name, photo }} />
          </span>
          <div>
            <input
              ref={input}
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => pick(e.target.files[0])}
            />
            <button
              className="photo-button"
              type="button"
              disabled={busy}
              onClick={() => input.current.click()}
            >
              <Camera size={16} />
              {busy ? "Opening…" : photo ? "Change photo" : "Add photo"}
            </button>
            {photo && (
              <button
                type="button"
                className="remove-photo"
                onClick={() => {
                  setPhoto("");
                  setSaved(false);
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
        <label htmlFor="profile-name">Name</label>
        <input
          id="profile-name"
          autoComplete="given-name"
          maxLength={50}
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder="Your name"
        />
        <p className="profile-storage-note">
          Saved on this device. Account sign-up isn’t connected yet.
        </p>
        <div className="profile-save-actions">
          <button className="primary" disabled={busy} type="submit">
            Save profile
          </button>
          {profile.name && (
            <button className="remove-photo" type="button" onClick={clear}>
              Remove device profile
            </button>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="profile-saved" role="status">
            Profile saved
          </p>
        )}
      </form>
    </section>
  );
}
