export const chunks = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );
export function shortText(value, limit = 240) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}
// Equal calendar intervals, including silent days. Counts always sum to dated messages.
export function activitySeries(days, maxBars = 16) {
  const entries = Object.entries(days).sort(([a], [b]) => a.localeCompare(b));
  if (!entries.length) return [];
  const ordinal = (key) => Date.parse(`${key}T00:00:00Z`) / 86400000;
  const first = ordinal(entries[0][0]),
    last = ordinal(entries.at(-1)[0]);
  const width = Math.max(1, Math.ceil((last - first + 1) / maxBars));
  const bars = Array.from({ length: Math.ceil((last - first + 1) / width) }, (_, i) => ({
    from: new Date((first + i * width) * 86400000).toISOString().slice(0, 10),
    to: new Date(Math.min(last, first + (i + 1) * width - 1) * 86400000).toISOString().slice(0, 10),
    count: 0,
  }));
  for (const [day, count] of entries)
    bars[Math.floor((ordinal(day) - first) / width)].count += count;
  return bars;
}
export function reportPages(data) {
  const people = [...data.statistics.people].sort(
    (a, b) => data.statistics.counts[b] - data.statistics.counts[a],
  );
  return [
    { kind: "snapshot" },
    ...chunks(people, 6).map((people) => ({ kind: "participation", people })),
    ...chunks(data.findings, 2).map((findings) => ({ kind: "patterns", findings })),
    ...chunks(data.goals || [], 5).map((goals) => ({ kind: "goals", goals })),
    { kind: "reflection" },
  ];
}
