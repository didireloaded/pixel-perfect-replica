// This application does not need runtime data connections. Static assets remain same-origin.
// Explicit device sharing/downloads are user actions outside automatic import/analysis.
export const privacyPolicy =
  "connect-src 'none'; script-src 'self' 'unsafe-inline'; worker-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";
