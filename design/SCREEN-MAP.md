# SCREEN-MAP — Claude Design ↔ PowerCare / NiroVera

repo: niyarabdullah1992-ship-it/powercare  
branch: main

**Visual source of truth:** [`NiroVera HR System (standalone).html`](./NiroVera%20HR%20System%20(standalone).html)

Open locally while developing:

- Design: `http://127.0.0.1:5173/design/NiroVera%20HR%20System%20(standalone).html` (if served from `public/`/`design/` symlink) or open the file from `design/`
- App: `http://127.0.0.1:5173/app`

## Last sync

date: 2026-08-07T16:05:05Z

### Updated in this project

- Ported the heritage-fingerprint digital stamp (drawHeritageFingerprint.js) onto توقيعي and the issued client-proof card.
- Added إثبات العمل للعميل (4-step wizard, disclosure, SHA-256 link) and rebuilt التوقيع الرقمي as Secure Sign tabs, from ClientProof.jsx / FileSigning.jsx.
- Built the public marketing site (NiroVera Website.dc.html) from Landing.jsx content: proof cycle, sectors, roles, pricing, footer contacts.
- Rebuilt المهام on the platform's real model: quota progress vs elapsed time, effort weight, attendance gate, proof + attestation review, and the auto-escalation chain (read from src/pages/MyTasks.jsx).
- Mapped the repo's page modules into the HR system design (23 screens).
- Added operations, governance and admin modules: tasks, daily report, inventory, expenses, safety, signing, proof, anonymous reports, complaints, executive board, assistant, owner panel.
- Grounded brand and typography in tailwind.config.js and index.html.

## Screen map

| Screen | Repo files |
| --- | --- |
| NiroVera Website.dc.html — public site | src/pages/Landing.jsx, Pricing.jsx, PowerCareSapComparisonV2.jsx, src/components/landing/ |
| NiroVera HR System — لوحة المعلومات | src/pages/Dashboard.jsx, src/components/dashboard/HandoffCommandBoard.jsx |
| NiroVera HR System — core HR | Employees, EmployeeProfile.jsx, Attendance.jsx, Payroll.jsx, Performance.jsx, HRStructureManagement.jsx |
| NiroVera HR System — المهام (task proof cycle) | src/pages/MyTasks.jsx, src/components/tasks/, src/lib/escalation.js |
| NiroVera HR System — operations | DailyReport.jsx, Inventory.jsx, Expenses.jsx, src/components/safety/ |
| NiroVera HR System — governance | src/pages/Files.jsx, FileSigning.jsx, ClientProof.jsx, ProofVerify.jsx, AnonymousReports.jsx, Complaints.jsx, src/components/proof/, src/components/files/ |
| NiroVera HR System — admin | src/pages/ExecutiveDashboard.jsx, Assistant.jsx, OwnerPanel.jsx |
| Shell (sidebar + header) | src/components/Layout.jsx, src/index.css |
| Brand / direction study | tailwind.config.js, index.html, src/components/Logo.jsx, src/lib/brand.js |

## How to use in Cursor

1. Open the standalone HTML as the visual reference.
2. Pick one screen from the map above.
3. Ask: «طابق [اسم الشاشة] من `design/NiroVera HR System (standalone).html` مع الملف في الخريطة».
4. Keep live Base44 data; match layout, colors (`#0B1A3F` / `#0E7A4B` / `#F7F8FA`), spacing — do not copy `sc-for` internals.
5. Compare side-by-side before moving to the next screen.

## Sync history

- 2026-08-07T14:20:00Z — repo modules mapped into the design.
- 2026-08-07T13:58:00Z — initial association; brand and theme read.
- 2026-08-07 — consolidated under `design/` as Cursor source of truth.
