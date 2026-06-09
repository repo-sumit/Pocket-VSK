# Unified Portal — Vidya Samiksha Kendra (Gujarat)

One platform for school-performance KPIs across every level of the Gujarat education system, designed **insight-first**: lead with the one or two things that matter, glanceable in 3 seconds, uncluttered. Audience runs from the Principal Secretary down to every teacher.

Config-driven and **KPI-agnostic** — the whole dashboard renders from `domains` / `kpi_definitions` / `kpi_values`. Built on the **4A Input–Output model**: **Attendance** (30%) · **Assessment** (30%) · **Administration** (40%) compose the **Input Composite**, with **School Quality (GSQAC)** as the standalone **output** domain. A config-driven KPI catalog (the 4A indicators + GSQAC D1–D5) with the published per-level numbers from `Docs/` as the source of truth. Bilingual (English + ગુજરાતી), mobile-first, anonymised demo data.

---

## Quick start

```bash
cd app
npm install            # if "npm" is blocked in PowerShell: npm.cmd install
npm run seed           # (re)generate seed JSON from ../GSQAC/gsqac 2024-25.csv (committed)
npm run dev            # http://localhost:5173
```

Verify: `npm run typecheck` · `npm run build` · `node scripts/smoke.mjs` (runtime check of the data + engine).

### Login — role inferred from ID digit-length (no role picker)

Type an ID; the app detects the role and asks for the right second field. **DEO logs in with the 4-digit District ID + PIN**; same level-ID + PIN pattern for State/Block/Cluster; Teacher uses Teacher ID + School ID; Principal uses the 11-digit School ID + PIN. Use the **"Demo logins ▾"** helper.

| Level | Digits | Demo ID | 2nd field |
|---|---|---|---|
| State | 2 | `24` | PIN `0000` |
| District (DEO) | 4 | `2401` | PIN `3456` |
| Block (BRC) | 6 | `240101` | PIN `2345` |
| Cluster (CRC) | 10 | `2401010001` | PIN `1234` |
| School / Principal | 11 | `24010100011` | PIN `1111` |
| Teacher | 8 | `24000009` | School ID `24010100011` |

There is **no SSO consent step** — after confirming details you land on the dashboard.

---

## Screens & roles

- **Homepage (insight-first):** overall score ring + grade + a one-line "what changed this week", then a biggest-concern / most-improved callout, then 5 scannable domain rows (you vs the level above) + a clean score table (weightage · % · contribution · status).
- **Role-scoped drill-down:** each role starts at its own scope and drills *down* its chain — Teacher→Section, Principal→Grade→Section, Cluster→Schools→…, up to State→District→Block→Cluster→Schools→Grade→Section.
- **Teacher view:** TPD tracker (38/50 hrs + 7-day trend), Classroom Pulse (Students "At Risk" + holistic tooltip), threshold-based evaluation copy. Classroom-level only (admin actions masked).
- **Principal view:** School-vs-**State**, GSQAC scoreboard (/1000), R-Y-G compliance benchmarks (PTR 27:1 · class max 30 · enrolment 150+ · chronic · avg training), attendance-gap detector + **Download Names**, drop-out reduction. (School-level inspector actions masked.)
- **Compare (redesigned):** small-multiples of **every KPI at a glance** (value · benchmark · sparkline · RAG), with an **"Add comparison"** multi-select (Select All) scoped to entities below the user — tiles switch to grouped comparison bars.
- **KPI detail:** value · Δ WoW/MoM · trend · the cascade across **all levels** (Section→State).
- Also: Section comparison, Leaderboard, Export.

## Global
- **PM SHRI filter** (top nav): All / PM SHRI / Non-PM SHRI — aspirational tracker that scopes aggregates.
- **Time-based greeting**; **At Risk** vocabulary (with holistic-identification tooltip); supportive (non-punitive) labels; bilingual numerals.

---

## Architecture & key modelling notes

```
src/config/    the 4A framework · KPI catalog + PUBLISHED per-level numbers · sub-domain seam · rating bands
src/data/      seed JSON (real names + GSQAC scores; nested codes) · MockProvider (per-level anchoring, PM-SHRI-aware) · Supabase stub
src/engine/    RAG · Δ WoW/MoM · trend · domain & overall score · grade · leaderboard · story · cascade
src/components/ ui primitives + layout (AppShell, PM SHRI filter, MultiSelect) + role/ (TeacherView, PrincipalView)
src/screens/   Login · ScorecardHome (role-routed) · DomainView (3-tier) · KpiDetail · CompareView · SectionComparison · Leaderboard · Export
```

- **Source-of-truth & per-level anchoring.** The published Teacher/School/Cluster/Block/District/State numbers are illustrative per-level figures, **not a single mathematical chain** (e.g. Attendance is 89/95/98/86/86/85). So the provider **anchors each level to its published number** (with per-entity spread, so a level's *average* matches the published figure while individual entities vary for RAG/leaderboards). Section→Grade roll up (grade = mean of its sections) so the teacher/section comparison stays internally consistent.
- **3-tier Domain > Sub-Domain > Indicator** is a configurable seam: `kpi.sub_domain` + `domain.sub_domains`. Administration ships a placeholder split (Schemes & Payments / Grievances & Issues / District Tracking); the full breakdown is pending (Chaitanya).
- **Domain weightages are placeholders** pending State sign-off (`WEIGHTAGE_IS_PLACEHOLDER`, flagged in the UI); they sum to 100%.
- Swap mock → live: run `supabase/schema.sql` + the generated `supabase/seed.sql`, load config rows, set `VITE_DATA_PROVIDER=supabase`, flesh out `supabaseProvider.ts`. Deploy via Vercel (`vercel.json`, root `app/`).

---

## Known gaps / decisions
- **Sub-domain/indicator detail** is a built seam but only Administration has a placeholder grouping — the full breakdown is pending from Chaitanya.
- **Per-level anchoring** (above) is a deliberate choice to match the published numbers, since they aren't a strict rollup; consequently school↑ levels each show their own published figure rather than a literal mean of children.
- **GSQAC score** is published as an aggregate that scales by level (school 84 → state 84000); it displays the published figure and is the standalone School Quality (output) domain.
- "Schools below benchmark" / "Low-performing" KPIs are kept (data) but **labelled supportively** per the empathetic-copy principle.
- 2003 historical-progression infographic (FCR-3.7) not built (low priority).
