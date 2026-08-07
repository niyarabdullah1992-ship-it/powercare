repo: niyarabdullah1992-ship-it/powercare
branch: main

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
| NiroVera HR System.dc.html — core HR screens | src/pages/Dashboard.jsx, Employees, EmployeeProfile.jsx, Attendance.jsx, Payroll.jsx, Performance.jsx, HRStructureManagement.jsx |
| NiroVera HR System.dc.html — المهام (task proof cycle) | src/pages/MyTasks.jsx, src/components/tasks/, src/lib/escalation.js |
| NiroVera HR System.dc.html — operations | DailyReport.jsx, Inventory.jsx, Expenses.jsx, src/components/safety/ |
| NiroVera HR System.dc.html — governance | src/pages/Files.jsx, FileSigning.jsx, ClientProof.jsx, ProofVerify.jsx, AnonymousReports.jsx, Complaints.jsx, src/components/proof/, src/components/files/ |
| NiroVera HR System.dc.html — admin | src/pages/ExecutiveDashboard.jsx, Assistant.jsx, OwnerPanel.jsx |
| NiroVera HR.dc.html — 1a/1b/1c direction study | tailwind.config.js, index.html, src/components/Logo.jsx, src/lib/brand.js |

## Sync history
- 2026-08-07T14:20:00Z — repo modules mapped into the design.
- 2026-08-07T13:58:00Z — initial association; brand and theme read.
