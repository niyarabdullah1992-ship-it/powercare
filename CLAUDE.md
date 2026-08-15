# CLAUDE.md — PowerCare / NiroVera

## What this product is

**NiroVera** is the HR operating product. **PowerCare** is the care/company layer around it (sessions, ownership, packaging, trust). Treat them as one connected system, not two competing brands.

Core idea: HR that does not only *record* work — it **proves** work was done.

### The Proof Cycle (never break this chain)

1. **Attendance** — person + place + time  
2. **Task** — effort weight, field gate, evidence, employee attestation  
3. **Review** — approve / reject with written reason, audit trail  
4. **Escalation** — auto-escalate when time quota is burned without progress  
5. **Sign / stamp** — Secure Sign + heritage fingerprint  
6. **Client proof** — disclose only allowed fields, hash, public verify link  

If a change severs this chain, it is the wrong change.

## Claude design principles (ideas, not a visual clone)

Apply these as product UX rules — calm, clear, connected:

1. **One job per surface** — dashboard decides; forms capture; proofs verify.  
2. **Typography and hierarchy first** — calm density, readable Arabic, no noisy chrome.  
3. **One restrained accent** — status color is meaning, not decoration.  
4. **Connected language** — copy should show how modules feed each other (attendance → payroll, task → proof).  
5. **Whitespace as trust** — prefer clarity over packing widgets.  
6. **Do not fake Claude’s cream/terracotta skin** — keep NiroVera/PowerCare identity; borrow *thinking*, not palette cosplay.

## Working rules

- Follow `AGENTS.md` for Base44 workflow.  
- Prefer `npm run dev` for frontend-only; `base44 dev` when backend is needed.  
- Reuse existing pages under `src/pages/` and libs under `src/lib/` before inventing parallel modules.  
- Preserve RTL Arabic-first behavior and role/plan visibility (`navVisibility`, auth gates).  
- Never commit secrets from `.env.local`.

### Design handoff — server first (non-negotiable)

When implementing from `.tmp-design-caps/design_handoff_nirovera/` (see `design/HANDOFF.md`):

1. **Start with the server, not the screens.** The `.dc.html` files are the reference UI; what is missing is the data model, auth, tenant isolation, and server-side derivation rules under them.
2. Do **not** copy HTML/`support.js`. Recreate with Base44 entities/functions + existing React patterns.
3. Order: **(A)** schema + auth API + `companyId` isolation → **(B)** one full vertical slice — **Operations / tasks** end-to-end → only then other sections.
4. Nearly every on-screen figure is **derived** (formulas live in `class Component` in `NiroVera Platform.dc.html`). Gates must name their blocking reason.

## Priority surfaces

| Surface | Intent |
| --- | --- |
| `Landing.jsx` | Explain Proof Cycle + trust for buyers |
| `Dashboard.jsx` | Decision glance across people/care/ops/trust |
| `MyTasks.jsx` | Proof cycle in daily work |
| `Attendance.jsx` | Live attendance feeding later payroll/tasks |
| `FileSigning.jsx` / `ClientProof.jsx` | Trust closure of the cycle |
| `Assistant.jsx` | Ask enterprise data in Arabic within permissions |

When unsure, optimize for: **connected proof, Saudi-ready HR, quiet confident UI.**
