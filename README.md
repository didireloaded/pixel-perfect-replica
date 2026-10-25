# Between

A mobile-friendly PWA for exploring a WhatsApp text history. No account or payment is required. Imports, statistics and keyword observations run in the browser; chat content is not uploaded to a backend or analysis provider. App assets and hosting may still involve network requests; this is not a promise of zero network traffic.

## Import

In WhatsApp, open a chat's contact/group information (or More on Android), choose **Export chat → Without media**, then import the ZIP or TXT. A fictional demo is available inside Import chat.

Current hard limits: **50 MB ZIP, 2 MB extracted UTF-8 text**, one chat per import. These are supported limits, not a guarantee for every device. Larger files are rejected before reading. Archives and date parsing run in a cancellable Web Worker with stage feedback and a 30-second timeout. Media and system placeholders are excluded. The original filename, detected dates and warnings appear before creating the report; ambiguous dates can be corrected manually. Unsupported/damaged archives show an error rather than producing an empty report.

## Storage and deletion

Imports are temporary unless you explicitly choose **Manage conversation → Save on this device**. Temporary sessions disappear on reload. Saved conversations, notes, goals, bookmarks and answers use this browser profile's IndexedDB; profile photo/name and appearance preferences use localStorage. Optional expiry runs when the app opens or remains active, not while it is closed. Browser storage is not encrypted by the app.

Delete one chat from Manage conversation. **Profile → Clear all app data** removes temporary/saved chats, derived content, profile and preferences after confirmation. Other open tabs are notified when BroadcastChannel is supported. Downloaded exports, other browser profiles/devices, and browser/OS backups remain separate. This does not promise physical disk erasure.

## Exports and interpretation

Manage conversation provides a visual landscape **PDF preview/print**, JSON report, full JSON backup and **CSV statistics**. Source quotes are optional and off by default; names/context can still be personal. Selected observations can be downloaded or shared using the device share sheet. No login or paywall is added after import.

Statistics include participation, median reply times, starts, streaks, busiest days, activity and word/emoji frequency. Timing uses a chronological copy; source order and IDs stay intact. Patterns and Ask use disclosed keyword/retrieval rules, not semantic analysis, diagnosis or hidden-intent claims. Short/sparse histories support fewer conclusions. Conversation search renders 30 messages per page.

## Development

The app lives in `src/between`, loaded after hydration. Run `npm install`, `npm run dev`, `npm run test:between`, `npm test`, and `npm run build`. The production build is under `.output/public`; its generated service worker is disabled in dev and Lovable previews. Keep pushed Git history intact: the main branch syncs both ways with Lovable.

[Lovable project](https://lovable.dev/projects/90555f7e-7d3d-40f7-86df-3596359f90ef)

## Architecture verification

See [PRIVACY.md](PRIVACY.md) for the enforced chat-content boundary and hosting limitations, and [parser compatibility and measured limits](tests/fixtures/compatibility.md) for supported/unsupported examples and real/synthetic measurements. `tests/fixtures` contains one sanitized real derivative and two clearly labelled synthetic format variants. `scripts/benchmark-import.mjs` measures a local export without printing names or text.
