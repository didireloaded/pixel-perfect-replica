// Privacy boundary: raw errors may contain filenames, message text or component props.
// Keep this compatibility entry point local and silent; never forward it to telemetry.
export function reportLovableError(_error: unknown, _context: Record<string, unknown> = {}) {
  // Deliberately no network, console, or parent-window reporting.
}
