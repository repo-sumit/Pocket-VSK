# VSK Gujarat — KPI Scorecard Mini-App

A **gamified, story-first KPI scorecard** for the Gujarat school-education system. A teacher, principal, or cluster/block/district/state officer logs in and instantly sees: *how am I doing, on what, am I improving, and how do I compare to my peers and the levels above me — down to the section of a class?*

Built as a **config-driven, KPI-agnostic** product: adding a KPI is a data change, never a redesign. Switching the framework (VSK 6A ↔ GSQAC ↔ Himachal SQAF) is a config-row swap that re-renders the entire dashboard.

> Prototype on **real GSQAC data** (33,236 schools, sliced) for the School-Quality domain; the rest is realistic deterministic mock data shaped exactly like the live tables.

---

## Quick start

```bash
cd app
npm install
npm run seed     # (re)generate seed JSON from ../GSQAC/gsqac 2024-25.csv  [optional — output is committed]
npm run dev      # http://localhost:5173
```

Build / verify:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # tsc + vite build → dist/
node scripts/smoke.mjs   # runtime check of the data + engine layer (no browser)
```

### Demo logins (any role)

The login screen has a **"Demo logins ▾"** helper that fills the fields for the selected role. Resolved from `src/data/seed/meta.json`:

| Role | ID | 2nd field |
|---|---|---|
| Teacher | `TUTL101` | School ID `24010111201` |
| Principal | `PRIN201` | School ID `24010111201` |
| Cluster (CRC) | `NARACRC` | Passcode `1234` |
| Block (BRC) | `LAKHAPBRC` | Passcode `2345` |
| District (DEO) | `KACHCHDEO` | Passcode `3456` |
| State | `GJSTATE` | Passcode `0000` |

> Officer passcodes live in `app_users` and are **admin-editable only** — there is no user-facing password reset (interim model; SSO is a clean seam for later).

---

## Architecture (data-first)

KPIs are stored in **LONG / metadata-driven** form. The five tables in `supabase/schema.sql` are mirrored 1:1 by the `DataProvider` seam:

```
entities         org tree (state→district→block→cluster→school→grade→section)
app_users        login → role → scope (entity_id) resolution
domains          framework config (id, weightage, rating_bands)
kpi_definitions  one row per KPI (unit, direction, level_representation)
kpi_values       the facts (one per entity × kpi × period)
```

```
src/
  config/      frameworks (VSK 6A, GSQAC, SQAF) · KPI catalog · rating bands · periods
  data/
    seed/      entities.json · appUsers.json · meta.json  (sliced from the real CSV)
    provider/  DataProvider interface · MockProvider (deterministic) · SupabaseProvider (stub)
  engine/      RAG · Δ WoW/MoM · trend · cascading rollups · domain & overall score · grade · leaderboard · story
  i18n/        en + gu dictionaries (no inline copy)
  hooks/       compose provider + engine for the screens
  components/  ui primitives (RatingRing, KpiCard, DomainBar, ComparisonBars, Leaderboard …) + layout (AppShell)
  screens/     Login · ScorecardHome · DomainView · KpiDetail · CascadeComparison · SectionComparison · Leaderboard · Export
```

**Everything derived lives in `engine/`, not in the DB:** Δ WoW / Δ MoM, trend arrow, RAG status, domain score (weighted rollup), overall score = Σ(weightage × domain %) → letter grade, and cascading rollups (which walk `entities.parent_id`).

### Why MockProvider is deterministic, not bundled rows

`MockProvider` computes every value as a pure function of `(entityId, kpiId, period)` anchored to each entity's real GSQAC performance. That means **adding a `kpi_definition` row makes it render everywhere with zero code change** (the modularity mandate), the demo is stable across reloads, and there's no 400k-row JSON to ship. Swap `VITE_DATA_PROVIDER=supabase` to read the live `kpi_values` table instead — same shapes, no component edits.

### Cascading & section level (100%)

Every KPI rolls Section → Grade → School → Cluster → Block → District → State per its `level_representation` (`avg` / `count` / `class` / `NA`), sourced from OGM 3.0. Where a level genuinely has no data, the UI renders an explicit **"NA"** tile — never a blank. **Section comparison** (7-A vs 7-B vs grade/school average on any class-level KPI) is a first-class screen.

---

## Design

Follows the **SwiftChat Design System** (`Screenshots/swiftchat-design-system.md`) — brand blue `#386AF6`, Montserrat (Latin) + **Mukta** (Gujarati, auto-switched via `<html lang>`), 8-pt spacing, pill/`radius` scale. The Scorecard Home is modelled on the **School Report Card** (overall /100 ring + grade + domain bars vs the level above), and the cascade view on the report-cards' "Performance Comparison" grouped bars. Mobile-first, responsive to desktop, bilingual, accessible (focus rings, labels, contrast).

---

## Deploy

### Vercel
`vercel.json` is included (SPA rewrites + `npm run build` → `dist/`). Import the repo, set the root to `app/`, deploy. Optional env: `VITE_DEFAULT_FRAMEWORK`.

### Supabase (go-live)
1. Run `supabase/schema.sql` then `supabase/seed.sql` (auto-generated entities + app_users).
2. Load `domains` / `kpi_definitions` from `src/config` and `kpi_values` from your data lake.
3. Set `VITE_DATA_PROVIDER=supabase` + `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, and flesh out `src/data/provider/supabaseProvider.ts` (every method maps to a documented query).

---

## Non-goals (per the brief)
No chat/AI, no data-entry/writes, no real SSO/OAuth, no app-to-app redirection, no student-level drill-down by default. Clean seams are left for SSO and source-app redirection.
