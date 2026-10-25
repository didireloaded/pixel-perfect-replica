# Pixel Perfect Replica

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/90555f7e-7d3d-40f7-86df-3596359f90ef).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Visual report update

The upload confirmation and report heading retain the original ZIP filename. Exports without attachments are supported; raw transcript/paste UI, sample shortcuts and per-message exclusion controls have been removed from the import flow. Review uses automatic whole-history defaults with optional adjustments. Contact/name redaction still applies to all imported text, and ambiguous date errors remain visible.

Overview uses computed message counts/share, starts, median reply times, busiest day, consecutive active-day streak, largest timestamp gap, hourly activity and active-day tiles. Highlights open exact source evidence. Words use Unicode letter/number tokens, omit common English filler words and rank frequencies; emojis count displayed sequences. Patterns is a distinct keyword-findings view. Conversation uses text/participant/date filters and 30-message pages.

Timing uses a stable chronological copy of dated messages; ties keep source order. Missing timestamps are excluded from timing only. Original message order and IDs remain unchanged for evidence. All gaps, days and medians reflect only the selected imported text, not offline interaction or feelings. Date grouping is in the device timezone. No accounts, semantic analysis or publishing were added.

Build outputs in `.output/public` (Nitro), `dist/client` or `dist` are supported by the service-worker generator; hosting metadata is not precached. Preview/dev service-worker exclusions remain intact.
