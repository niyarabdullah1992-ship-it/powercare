# Internal platform — standalone HTML snapshots

Self-contained HTML captures of the NiroVera / PowerCare internal platform,
rendered from the live React app (offline preview workspace). Each file inlines
its CSS and images and has the bootstrap scripts removed, so it opens directly in
any browser with no dev server — a static snapshot for viewing, sharing, or design
reference (not interactive).

## Files
- `internal-command-center.html` — Command Center (with the Owner Action Center)
- `internal-attendance.html` — Attendance
- `internal-operations.html` — Operations / tasks
- `internal-work-proof.html` — Work Proof
- `internal-signing.html` — Digital Signing
- `internal-payroll.html` — Payroll
- `internal-human-resources.html` — Human Resources
- `internal-safety.html` — Safety HSE

## How to view
Double-click any file (or open it in a browser). Fonts load from Google Fonts when
online; everything else is embedded.

## How they were generated
Regenerate against a running dev server (`npm run dev`) with:

```bash
npm install puppeteer-core --no-save
node scripts/export-internal-html.mjs
```
