# Chat-content boundary

Between is a local processing tool. Imported archives, extracted text, participant identities, profile photos and derived conversation content must not enter an automatic network request, URL, console log, telemetry event or parent-window message.

## Allowed flow

File picker → dedicated module Worker → ZIP/text extraction and date parsing → structured-clone result to the same browser tab → local filtering/redaction/statistics/keyword observations → temporary memory. Explicit device saves use IndexedDB. Profile/preferences use localStorage. Worker messages stay local; BroadcastChannel sends only the literal `cleared` signal, never chat data. The browser-only app mounts after hydration, so SSR loaders receive no chat state.

PDF/CSV/JSON downloads stay on device. The OS share sheet is a deliberate user action that may transmit the selected observation to a destination the user chooses; it is not automatic analysis traffic.

## Enforcement

- Production documents carry CSP `connect-src 'none'`, blocking fetch/XHR, WebSocket, EventSource and beacon destinations, including same-origin data endpoints. Script/image/font sources are restricted; forms and frames are disabled. Bundled static assets remain same-origin. Development omits this policy for Vite HMR: it is not a privacy certification of the editor or third-party browser extensions.
- The build emits the same document policy in hosting headers, plus `connect-src 'none'` for parser-worker assets. The service worker is separately allowed to retrieve the explicit static shell; its cache never stores chat content.
- Raw client error forwarding to Lovable hooks was removed. Never restore arbitrary exception/context reporting. Server-side errors handle initial requests only and must never be connected to imported state.
- `node --test tests/privacy-boundary.test.js` checks the processing modules for network/telemetry capabilities and unreviewed dependencies. It also checks policy wiring and raw-error hooks. Run with `npm run test:between` before merging.

These are defenses against accidental regressions, not a proof against arbitrary malicious code or a compromised same-origin host. Source-level guards can be bypassed by obfuscation; any new dependency, dynamic resource URL, analytics SDK, logging, backend or sharing flow needs review against this boundary. Do not send raw errors, filenames, text, snippets or identifiers even if an SDK claims to redact them.

## Hosting boundary

Loading the app necessarily requests its shell/assets; the host can see IP/request metadata. Lovable editor tooling and browser extensions run outside this source-code guarantee. Verify the deployed response policy after hosting changes. The editor preview must not be described as a hostile-host sandbox. Use a trusted production build for private imports.
