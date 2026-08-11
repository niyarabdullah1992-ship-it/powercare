# Handoff: NiroVera — منصة إدارة العمليات والقوى العاملة

## Overview
NiroVera is an Arabic-first (RTL), bilingual (AR/EN) operations and workforce platform for
multi-site industrial operators (power/utility stations). It covers 22 internal sections plus
three public-facing surfaces. It is built for compliance with Saudi labour regulations
(MHRSD, Qiwa, GOSI, WPS, Nitaqat) and international HSE practice (ISO 45001, OSHA rate
definitions, the hierarchy of controls).

## About the Design Files
**The files in this bundle are design references created in HTML.** They are working
prototypes that demonstrate intended layout, behaviour and business logic — they are NOT
production code to copy directly.

The task is to **recreate these designs in the target codebase's environment** (React,
Vue, Next.js, native, etc.) using its established patterns, component library and data
layer. If no environment exists yet, choose the framework and implement the designs there.

Two specific carry-overs matter more than the markup:
1. **The derivation rules.** Nearly every figure on screen is computed from a source list,
   not stored. The formulas are documented below and must survive the port.
2. **The gates.** Actions are blocked with a named reason (never silently disabled). These
   are compliance requirements, not UX polish.

## Fidelity
**High-fidelity.** Final colours, typography, spacing and interaction states. Recreate
pixel-faithfully using the codebase's existing libraries where they map cleanly.

---

## Architecture: three surfaces, one tenant boundary

| Surface | File | Audience | Auth |
|---|---|---|---|
| Workspace (tenant entry) | `NiroVera Workspace.dc.html` | Anyone | Company name → workspace |
| Platform (internal console) | `NiroVera Platform.dc.html` | Employees | Account required |
| Careers (public postings) | `NiroVera Careers.dc.html` | Job candidates | **No account** |
| Landing (marketing) | `NiroVera Landing.dc.html` | Prospects | — |
| Mobile (field companion) | `NiroVera Mobile.dc.html` | Field crew | Account |
| Sales deck | `NiroVera Sales Deck.dc.html` | Investors/buyers | — |

### The intake queue (critical pattern)
The public Careers page and the internal console must NOT share an identity system. A
candidate is not an employee and must never receive an account.

- Careers **writes** an application into a queue (`nv_job_applications` in the prototype;
  a POST endpoint in production).
- Platform **reads** that queue into the Recruitment section.
- Data flows one way only. The public surface can never read employee, payroll or
  performance data because the channel carries nothing in that direction.
- The candidate is identified by a **reference number** (`NV-APP-<CODE>-<HASH>`), which is
  also how they request deletion of their data.

Vacancies flow the other way through `nv_job_vacancies`: the console publishes, the
careers page reads.

### Tenant isolation
Every record in both stores carries a `tenant` slug. Reads filter strictly on it — a record
without a tenant is **not** shown (no permissive fallback). In production this is a
server-side tenant scope, not a client filter.

---

## Global shell

**Layout:** fixed sidebar (232px, collapses to a 62px icon rail under 1100px) + sticky
header (58px) + scrolling content pane.

**Header:** screen title + derived subtitle, station scope picker (dropdown, drives every
list on every screen), search, live chip, language toggle.

**Sidebar navigation — four groups, ordered by the rhythm of the working day:**

1. **يومي / Daily** — Command Center · Operations · Attendance · Daily Report · Chat
2. **القوى العاملة / Workforce** — Shifts · Leave · HR · Recruitment · Org · Performance
3. **الموارد والامتثال / Resources & compliance** — Inventory · Safety · Work Proof · Signing · Complaints · Files
4. **الإدارة / Administration** — Reports · Assistant · Expenses · Settings

Groups 2–4 are collapsible; group 1 is not. **Collapsing hides items with an inline style
only — it must not remove them from the DOM**, or the collapsed icon rail (which overrides
the style) will have nothing to show.

**Badges** are all derived counts (overdue tasks, open hazards, pending leave, unread
messages, late recruitment stages). None are literals.

---

## Screens

### 1. Command Center (`dash`)
- **Readiness card** — navy `#14284B`, 60px score + `/100`, delta chip, four factor bars.
- **Decisions queue** — items awaiting the user; resolving removes the row and decrements the count.
- **Proactive alerts** — four categories counted live (low stock, unfulfilled requests, unexcused absence, overdue tasks) + late recruitment stages. Each links to the section that fixes it. The subtitle enumerates only the sources actually present.
- **Station cards** — click sets the scope.
- **Today's attendance** — day-level bands (present/late/leave/absent) across all three shifts.
- **Safety record** — days clear + open items by severity.

### 2. Operations (`ops`)
Two closed axes replace free-form folders: **plan horizon** (when a task belongs) and
**work kind** (what kind of work). Filter chips (all/overdue/today/awaiting/completed)
filter the table; empty state is explicit.

**Task card (modal):** execution steps with weights, attachments, comments, completion
logging, and a supervisor approval bar. Points = **priority value (High 3 · Medium 2 ·
Low 1) × effort weight (1–5)**, granted only when the supervisor approves the proof.

**Assignment gate:** a task whose work kind requires a certificate cannot be assigned to
someone whose certificate has lapsed — in all three assignment modes (one person, several,
whole station). The blocked chip states which certificate.

### 3. Attendance (`attendance`)
- Live roster: employee · station · in · out · hours · status · verification source.
- **Owner switch** in Settings: geofence verification on/off. When off, every surface changes wording — a check-in becomes a *self-declaration*, not proof.
- Out-of-geofence check-ins are a **decision** (accept with reason / reject), not a dangling flag.
- **Retroactive settlement:** a past absence can be reclassified against a document (sick, exam, bereavement, external duty, force majeure) within 45 days. The original entry is never erased; the settlement is written beside it.
- **Monthly timesheet:** 31 rows per employee, seven totals, same rules as the daily view (10-minute grace, 8-hour shift, overtime beyond). Overtime is approved or rejected but always visible.

### 4. Daily Report (`daily`)
Each station row carries four **derived facts** (tasks closed · open hazards · unexcused
absence · approved proofs), each a button that jumps to its section. Actions: file, approve,
return for correction, chase outstanding, approve all ready, issue the signed daily record.
**Lateness and approval are separate fields** — approving a late report must not erase its
lateness.

### 5. Shifts (`shifts`)
Monthly matrix (day × shift type), assignment per cell, isolated **per station**. Four
pre-publication checks computed from the matrix itself, **per calendar week**:
48 h/week cap · 11 h between shifts · 24 h continuous weekly rest · full coverage.
Publication is blocked and the failing check is named. A rest day is not a gap.

### 6. Leave (`leave`)
Four derived stats, a request form, and the statutory entitlement per type with its article
(annual art. 109 · sick art. 117 · maternity art. 151 · paternity/marriage/bereavement art. 113 ·
Hajj art. 114 · exam art. 115). A request over 5 days without an attachment cannot be
approved — the reason is shown.

### 7. HR (`hr`)
Employee directory and full employee file (personal, professional, compliance, leave, salary,
contract, end-of-service). Nitaqat band derived from ID type across the headcount.
**Onboarding board:** seven statutory steps, each with its authority (Employer · MHRSD ·
GOSI · approved provider · Jawazat · safety coordinator). Iqama is skipped automatically for
a Saudi national. No start date before the mandatory steps close. Confirming a start date
adds the person to the directory with a real file and moves the Saudization rate.

### 8. Recruitment (`hiring`)
Five stages with SLA deadlines (3 · 5 · 7 · 7 · 5 days), **measured from the day the vacancy
opened, not from stage entry** — so an earlier delay cannot hide itself. Vacancy creation
form (11 fields, 3 required). Public posting link per vacancy + four channels (Taqat and
Jadarat first — Saudization priority must be provable). Applicant pipeline: new → shortlisted
→ interview → selected, or rejected with a recorded reason. The offer stage is gated on a
named selection.

### 9. Org (`org`)
Editable structure: create branches, change managers, assign positions. Permissions and the
escalation chain derive from it.

### 10. Performance (`perf`)
**Current formula: task points 50% · on-time 25% · safety 15% (closure 70% + verified
reporting 30%) · shift coverage 10%.** Attendance is **not** a term — it is an input, not an
outcome, and unexcused absence already has its own disciplinary track.

Transitional guard: both the current and previous criteria are computed and **the higher is
applied**, so an amendment can never disadvantage an employee mid-period.

Statutory safeguards (8 items): published in advance · statutory leave never counts as
absence · no automated decision · acknowledgement with a verification id starts the objection
window · partial periods pro-rated · objections decided in 15 working days and an upheld
objection **recomputes the score** · no penalty for reporting hazards · scores are personal data.

Comparison at three levels (station / group / individual) using the same formula.

### 11. Safety (`hse`)
ISO 45001 structure: TRIR / LTIFR / DART computed on exposure hours (headcount × 2080,
per 200,000 hours), 5×5 risk matrix, hazard register on the hierarchy of controls, permits
to work with gas testing, CAPA, competency register, drills. Hazard closure requires an
acceptable control **and** before/after stamped photos, and produces a signed closure seal.
Reporting a hazard earns points; the incident itself does not.

### 12. Work Proof (`workproof`)
Four-stage chain: stamped capture → supervisor approval → verification seal → client
acceptance. The raiser cannot approve their own proof. Out-of-geofence captures stop at
approval. Two digital signatures (performer, client). The seal hash covers the reference,
both capture stamps and the location verdict — replacing a photo invalidates both signatures.

### 13. Digital Signing (`signing`)
Corporate seal: navy card, gold border, corner brackets, hexagon fingerprint, encrypted
verification id, signer name and timestamp, site identity, and a deterministic QR derived
from the same invariant inputs as the id. Pending signatures render the same seal marked
`PENDING`. Records raised in other sections (leave decisions, completion certificates,
payroll runs) become real signable documents here.

### 14–22
Complaints (escalation chain, anonymous rate limits 3/10/30), Inventory, Files, Reports,
Assistant, Expenses, Payroll (WPS file, GOSI, approval), Settings (permission matrix,
temporary delegation, geofence switch, audit trail).

### Permission matrix (Settings)
**Role × scope, not role alone.** Five levels per cell: own → station → region → company →
none. Click to cycle; every change is an exception recorded with author and time, revertible
in one click. `Delegated` is derived from the delegation register and is not settable here.

**Temporary delegation** carries an end date and **expires by itself** — the usual cause of
over-privileged accounts is a delegation nobody revoked.

---

## Cross-section links (must survive the port)
- Approved leave → deducted from shift coverage → excluded from assignment → never recorded as absence.
- Published roster → defines the period length → pro-rates part-period task points.
- Task approval → grants points → moves the performance score.
- Hazard reporting → points; hazard closure → seal + audit entry.
- Client acceptance → completion certificate → signing chain.
- Purchase order raised → inventory items move to "on order".
- Every action → audit trail entry with author and timestamp.

---

## Design tokens

### Colour
| Token | Hex | Use |
|---|---|---|
| Brand | `#1E9E63` | Primary actions, positive state |
| Brand deep | `#14683F` | Text on brand-soft |
| Brand soft | `#EAF6EF` | Selected/active background |
| Ink | `#14284B` | Primary text, navy surfaces |
| Ink deep | `#111C33` | Seal background |
| Ink mid | `#1B2740` | Pending seal background |
| Secondary text (light bg) | `#5A6B85` | ~4.9:1 on white |
| **Secondary text (dark bg)** | `#A8B4C8` | ~5.9:1 on `#14284B` |
| Muted / disabled marks | `#94A3B8`, `#CBD5E1` | Non-text only |
| Border | `#E2E8F0` | 1px borders |
| Surface | `#FFFFFF` | Cards |
| Canvas | `#F7F8FA` | Page background |
| Rail | `#F1F5F9` | Track backgrounds, dividers |
| Danger | `#DC2626` / `#B91C1C` | Text `#B91C1C`, bg `#FEF2F2`, border `#FECACA` |
| Warning | `#F59E0B` / `#B45309` | Text `#B45309`, bg `#FFFBEB`, border `#FDE68A` |
| Success | `#15803D` | bg `#ECFDF3`, border `#BBF7D0` |
| Info | `#1D4ED8` | bg `#EFF6FF`, border `#BFDBFE` |
| Region purple | `#6D28D9` | bg `#F5F3FF`, border `#DDD6FE` |
| Gold (seal) | `#C8A24A` | Seal border and id |
| Accent mint | `#6EE7B7` | On navy only |

**Contrast rule:** the light-surface and dark-surface secondary tokens are different values.
Never apply one blanket colour — `#5A6B85` is 4.9:1 on white but 2.70:1 on navy.

### Typography
- Arabic UI: `IBM Plex Sans Arabic` (300/400/500/600/700)
- Latin/numerals: `IBM Plex Sans` — always with `dir="ltr"` on numeric spans in RTL
- Monospace (ids, references, timestamps): `IBM Plex Mono`
- Scale: 9 (kicker) · 10 · 11 (secondary) · 12 · 13 (body) · 14–15 (card title) · 20 · 24 · 28 · 56–60 (hero figure)
- Weights: 400 body · 500 emphasis · 600 headings and figures
- Headings: `letter-spacing:-0.01em` to `-0.04em`; kickers: `+0.06em` to `+0.16em`

### Spacing, radius, shadow
- Spacing: 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 26
- Radius: 5 (chip) · 7–9 (button) · 10–11 (input/inner card) · 12–14 (card) · 16 (section) · 20 (pill) · 50% (avatar)
- Shadow: `0 1px 3px rgba(20,40,75,.10)` (raised chip) · `0 6px 18px rgba(20,40,75,.10)` (card) · `0 8px 22px rgba(17,28,51,.22)` (seal) · `0 14px 34px rgba(20,40,75,.28)` (toast)
- Content max-width: 1320px (1000px for signing, 960px for careers)

---

## Interaction rules
- **Toasts** confirm actions whose effect is off-screen; they auto-dismiss after 3.6s and clear on navigation.
- **Gates name their reason.** Never a silently disabled control — show the blocking condition as text.
- **Empty states are explicit.** A filtered list that returns nothing says so; a fresh branch shows "—" and "no data yet" rather than inventing figures.
- **Enter sends** in the chat composer (Shift+Enter for a newline).
- **Number agreement (Arabic)** is a shared helper family, not ad-hoc strings: 1 = singular, 2 = dual, 3–10 = plural, 11+ = singular accusative. Zero takes the plural noun.
- **Language switching must not change data.** Never key state, hashes or identity on a translated display string — always on a stable id. This bug class recurred repeatedly; guard against it in code review.
- **Dates** are formatted from local date parts, never `toISOString()` (which shifts a day at UTC+3).

## State
Client state in the prototype (React class state). In production, most of this is server
state: tasks, attendance records, rosters, leave requests, hazards, permits, proofs,
signatures, applications, vacancies, delegations, permission exceptions, audit log.

Genuinely client-only: active screen, scope selection, language, open modals, form drafts,
collapsed nav groups, filter chips.

## Assets
- Logo: `https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/a15fe425c_generated_image.png`
- Fonts: Google Fonts (IBM Plex Sans Arabic, IBM Plex Sans, IBM Plex Mono)
- No other images; all icons are inline SVG, all charts are CSS.

## Files in this bundle
| File | Contents |
|---|---|
| `NiroVera Platform.dc.html` | The 22-section internal console (main reference) |
| `NiroVera Careers.dc.html` | Public job posting + application page |
| `NiroVera Workspace.dc.html` | Tenant entry / company lookup |
| `NiroVera Landing.dc.html` | Marketing site |
| `NiroVera Mobile.dc.html` | Field companion screens |
| `NiroVera Sales Deck.dc.html` | Investor/buyer deck |
| `support.js` | Prototype runtime (NOT part of the design — do not port) |

Each `.dc.html` opens directly in a browser. The template is the markup between
`<x-dc>` tags; the logic is the `class Component` script below it. Read the logic for the
derivation formulas — the markup alone does not carry them.

## Known gaps (out of scope for this design)
1. No server or database — state is in-browser and lost on refresh.
2. No real integrations with Qiwa, GOSI, WPS or Nafath — those steps are marked manually.
3. Not yet tested with field users.
4. Mobile exists as one prototype screen, not a full companion app.
