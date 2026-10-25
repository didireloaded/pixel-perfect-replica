# Measured parser compatibility — 25 October 2026

| Variant                                                        | Result                                                                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Supplied real iOS-style MDY ZIP, AM/PM and Unicode whitespace  | 936 retained text messages, 2 participants, 24 active days; browser Overview and Patterns rendered |
| Sanitized iOS MDY derivative, 60 lines                         | 58 retained messages; correct MDY detection                                                        |
| Synthetic Android DMY, multiline/system/media/deleted events   | 3 retained messages; correct DMY detection                                                         |
| Synthetic dotted DMY with seconds, bidi marks and 24-hour time | 3 retained messages; correct DMY detection                                                         |
| Synthetic year-first ISO-style timestamp                       | Parses with timestamp                                                                              |
| Localized `p. m.` meridiem                                     | Correct sender and 12-hour time after a focused regression fix                                     |
| Arabic-Indic date/time digits                                  | No message parsed; unsupported                                                                     |
| Colon in sender name (`Team: Person A`)                        | Splits at first colon; wrong sender identity; unsupported                                          |
| Ambiguous day/month and month/day                              | Explicit warning and manual date-order choice; cannot infer certainty                              |

Localized media/deletion labels are not comprehensively recognized. Mixed date orders and undated fallback text are limited. Fixtures are not evidence of universal locale support. Additional independently sourced, sanitized real Android/locale exports are still needed.

## Size measurements

Desktop local Node v24.21.0, one run each, no bodies or participant names logged:

| Input                             | Archive/file bytes | Extracted bytes | Retained messages |             Extraction | Parsing | Basic statistics + patterns |
| --------------------------------- | -----------------: | --------------: | ----------------: | ---------------------: | ------: | --------------------------: |
| Available real ZIP                |             21,461 |         101,230 |               936 |                 3.0 ms |  4.2 ms |                      3.4 ms |
| Synthetic near-limit TXT          |          2,097,000 |       2,097,000 |            34,950 |                 0.7 ms | 41.4 ms |                     62.3 ms |
| Same synthetic text in ZIP        |              7,330 |       2,097,000 |            34,950 |                11.6 ms | 42.7 ms |                     49.5 ms |
| Synthetic TXT one byte over limit |          2,097,153 |               — |                 — | Rejected by size guard |       — |                           — |

Hard accepted limits remain 50 MiB compressed ZIP and 2 MiB extracted text. These timings are not phone measurements, end-to-end UI latency, worst-case group-chat performance or peak-memory measurements. The synthetic archive compresses unusually well. The largest real export available to this task is small and does not establish a hardware failure threshold for 50–100 MB archives. No breakpoint was found in that sample; the 2 MiB text guard is the current limiting boundary.

Reproduce with `node scripts/benchmark-import.mjs /absolute/path/to/export.zip`. The script reads locally and prints aggregate sizes/counts/timings only. Never commit private originals or raw benchmark output containing chat content.
