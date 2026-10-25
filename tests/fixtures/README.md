# Export variants

- `ios-mdy-anonymized.txt`: format-preserving derivative of the supplied real iOS-style export. All names, message bodies, dates and clock times replaced; only delimiters, Unicode spacing/bidi marks and AM/PM layout remain. First 60 lines; 58 retained messages, two participants, month-first dates.
- `android-dmy.txt`: synthetic Android-style day-first export with system event, multiline text, media and deleted-message placeholders. Three retained messages.
- `ios-dotted-24h.txt`: synthetic dotted day-first export with bidi marks, seconds, 24-hour clock and multiline text. Three retained messages.

Only the first fixture is derived from a real export. These are not three independently supplied real exports. No private original ZIP is checked in.

Known unsupported/limited cases: non-Latin AM/PM markers, non-Latin digits, localized media/deletion placeholders, sender names containing colons, mixed date orders, and mixed dated/undated text. Plain `Name: text` fallback is accepted without timing; unsupported timestamped lines can be excluded. Ambiguous dates require user confirmation. Tests assert recognized counts rather than treating a non-crash as format support.
