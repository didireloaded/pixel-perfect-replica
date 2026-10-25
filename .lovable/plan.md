# Move Between into Lovable

Migrate the uploaded Between app as-is (no redesign), keeping it unpublished.

## What moves over
- Analysis and import logic (`analysis.js`, `import.js`), profile screen, main app, styles — unchanged in behavior and look.
- Tests (13 expected passing), manifest, normal/maskable icons, service-worker build script.
- Dependencies: lucide-react, fflate.

## How it fits Lovable
- Home page (`/`) renders the existing app (replaces the placeholder). Bottom nav (Home, Chats, Insights, Ask, Settings) stays in-app as today.
- Styles loaded as the app stylesheet; system fonts kept.
- Page title, description, manifest link, theme color, apple-touch-icon set in page head.
- Browser-only code (file reading, localStorage profile) runs only after the page loads, to avoid server-render errors.
- Service worker: kept as production-only, generated at build time from an explicit asset list, never caches conversation data, never forces updates. Registration refused in Lovable preview/iframe/dev; `?sw=off` kill switch.
- No backend, auth, AI provider, or payments added. Profile stays local and is not presented as an account.

## Verification
- Run the migrated tests and confirm all pass.
- In a mobile-size browser: upload a fictional month-first-date ZIP, confirm date order detection and correction on review, no raw text box on upload, report renders, exact source excerpt opens.
- Profile name/photo persist after reload; no horizontal overflow at 390px.
- Offline reload can only be confirmed on the published site; reported as unverified until published.

## Technical notes
- Extract to /tmp, inspect, copy only listed files (no .git/node_modules).
- Convert `main.jsx` root mount into an exported component; keep `.jsx/.js` files.
- Port `tests/*.test.js` to run under the project's vitest (or node:test if they rely on it).
- Wire `build-sw.js` as a Vite build step producing `/sw.js`; record decisions in AGENTS.md.
