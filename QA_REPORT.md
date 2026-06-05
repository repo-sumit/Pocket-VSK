# Unified Portal — QA Report

End-to-end QA + code review + responsive/visual audit of the whole app, with fixes.

**Method.** Driven with the Playwright library (the Playwright MCP was not connected to the session; the library is functionally equivalent for navigation, multi-viewport screenshots, console capture, and `localStorage` tampering). All checks run against the **production build** (`npm run build` → `npm run preview`) to avoid dev-server/HMR staleness. Skills applied: `impeccable` + `design-taste-frontend` (visual/responsive craft), `e2e-testing-patterns` / `integration-testing` / `performance-testing` (coverage), `owasp-security` (access control). Infra/DB skills ignored (mock data, no Supabase/Docker).

**Coverage.** 6 roles (Teacher, Principal, CRC, BRC/BEO, DEO, State) × 7 screens (Login, Scorecard/Home, Compare, Sections, Leaderboard, Export, KPI detail) × 6 breakpoints (320, 375, 390, 768, 1024, 1440) × 2 languages (EN, ગુજરાતી).

**Result.** All Blockers/Majors and most Minors fixed. **0 horizontal-overflow and 0 console errors** across the full matrix; `tsc --noEmit` clean; `npm run build` passes. Automated suites: functional **21/21**, access-control + dropdowns **20/20**, 6-role login/scope **6/6**.

---

## Issues found & status

Severity: **Blocker** (broken/unusable) · **Major** (wrong data, security, or breaks a screen) · **Minor** (visual/correctness, contained) · **Nit** (polish).

| # | Screen / Area | Sev | Issue | Status |
|---|---|---|---|---|
| 1 | Scorecard ring/badge (all roles) | Major | Grade bands too lenient: **77/100 showed "A+"** (A+ was `min:75`); any score ≥70 was group-A → green. | **Fixed** — recalibrated `GSQAC_BANDS` (A+ ≥85, A ≥75, B ≥60, C ≥40). 77 → **A**; applied consistently to ring, badge, status table, leaderboard. |
| 2 | Principal "School vs State", Home "you vs parent" | Major | RAG colour was absolute, so **"TPD 74%, behind State 87%" rendered green**. | **Fixed** — `DomainBar` colours by gap-vs-benchmark when a benchmark is present (at/ahead → green, slightly behind → amber, well behind → red); absolute grade RAG retained for the overall ring/grade. |
| 3 | Home, Principal, Compare, Sections, Export, KPI (≤375px, both langs) | Major | Horizontal overflow / misalignment on iPhone SE & 320px. Root cause: column-less grids (`grid gap-x`) created an implicit **auto** track that grew to *max-content*, and a flex name span used `truncate` without `min-w-0`. | **Fixed** — added explicit `grid-cols-1` base to all column-less grids; `min-w-0` on hero grid items and the DomainBar name; Export table wrapped in contained `overflow-x-auto`; headers set to `flex-wrap`. |
| 4 | Sections school dropdown (officer scope) | Major (perf) | The design-system `Select` mounted **every** option; at State scope that is **1000 school nodes**, with per-key `scrollIntoView`. | **Fixed** — render capped to 60 rows + "+N more · type to filter" hint; verified now mounts **60** nodes, not 1000. Search narrows the rest. |
| 5 | Compliance Benchmarks (Principal, mobile) | Major→Minor | 5 cards in a 2-col grid left an orphan + uneven heights. | **Fixed** — `grid-cols-2 lg:grid-cols-5`, the 5th card spans both columns on mobile, `h-full` equalises heights. No orphan, no overflow. |
| 6 | GSQAC scoreboard (Principal) | Minor | "Improvement compared to last cycle: **+71%**" — the `gsqac_improvement` *metric value* (~65-71) was shown as a cycle delta. | **Fixed** — now shows the GSQAC score's real month-over-month delta (e.g. **-2.5 pts**), signed + RAG-coloured. |
| 7 | Greeting (Principal) | Minor | School id clipped as raw overflow ("2401010010…"). | **Fixed** — intentional `truncate` + `title` tooltip on the greeting line (and heading). |
| 8 | `components/ui/atoms.tsx` | Major | `Card`'s `as?: any` — the only true `any` in the codebase; disabled prop type-checking. | **Fixed** — typed `as?: ElementType`. |
| 9 | `lib/format.ts`, `engine/rag.ts`, `config/applicability.ts`, `ui/Tooltip.tsx`, `scripts/_smoke_entry.ts` | Major | Dead code: 4 unused exported fns (`scoreOutOf100`, `roleFromIdLength`, `achievementVsBenchmark`, `applicableKpis`), an unused `Tooltip` component, and an orphan smoke script (superseded by the Playwright suites, and it referenced the now-deleted `roleFromIdLength`). | **Fixed** — all removed. |
| 10 | `components/role/PrincipalView.tsx` | Major (config) | Compliance thresholds (PTR/enrolment/class-capacity/training/chronic bands, defaults) hardcoded as magic numbers in the view — violates the config-driven mandate (brief flagged this for judgment). | **Fixed** — extracted to `config/complianceBands.ts` (`COMPLIANCE`) and imported. |
| 11 | `role/TeacherView.tsx` | Minor (config) | TPD 50-hour target, 50/40 bands, and `baseline=60` hardcoded. | **Fixed** — sourced from `COMPLIANCE.tpdTargetHours` / `.training` / `.needsImprovementBelow`. |
| 12 | `role/TeacherView.tsx` | Minor (token) | Stray hex `#8B5CF6` on the TPD sparkline bypassed theme tokens and could drift from the violet icon. | **Fixed** — uses `accent("purple").hex`. |
| 13 | `screens/SectionComparison.tsx` | Minor (perf) | School list used the **uncached** `getDescendants(...,'school')` (re-walks ~21k entities on scope change) and ignored the PM-SHRI filter. | **Fixed** — switched to the cached, PM-SHRI-aware `getSchoolDescendants` (also retires a dead provider method). |
| 14 | `index.css` + `RatingRing.tsx` | Minor (a11y) | No `prefers-reduced-motion` handling despite fade/scale/bar-grow/ring count-up. | **Fixed** — global reduced-motion reset + RatingRing jumps to final value when reduce is set. |
| 15 | `components/ui/atoms.tsx` ProgressBar | Nit (a11y) | Kept `role=progressbar`+`aria-valuenow` even when decorative (`aria-hidden`), which is contradictory. | **Fixed** — progressbar semantics only when a label is supplied; otherwise `aria-hidden` decorative. |
| 16 | Export.tsx / DomainView.tsx / PrincipalView.tsx | Minor | Redundant/unsafe `as number` casts over already-typed values. | **Fixed** — removed. |
| 17 | `config/applicability.ts` | Nit | `keyof typeof` / `as number` casts on the `PUBLISHED` map. | **Fixed** — `PUBLISHED` already typed `Partial<Record<Level,number>>`, casts removed. |
| 18 | Tooltip bubble (mobile) | Minor | `InfoTooltip` bubble (`opacity-0` but in layout) widened `scrollWidth` at 320px — an invisible scroll trap. | **Fixed** — toggled with `display:none` (`hidden`/`group-hover:block`) + viewport-clamped width. |

---

## Re-verification (after fixes, production build)

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `npm run build` | passes (main chunk 30 KB gz; 21k-entity seed lazy-loaded as a separate ~373 KB-gz chunk) |
| Responsive sweep (roles × screens × {320,375,390,768,1024,1440} × {en,gu}) | **0 overflow, 0 console errors** |
| Functional E2E (`verify.mjs`) | **21/21** (login validation 10-digit ID / 11-digit UDISE / 4-digit PIN, scorecard, compare, sections, KPI cascade, no "GSOAC" typo) |
| Access control + dropdowns (`verify-access.mjs`) | **20/20** |
| All-6-roles login + scope (`roles-smoke.mjs`) | **6/6** (teacher→section, principal→school, crc→cluster, brc→block, deo→district, state→state) |
| Select render cap | 1000-school dropdown mounts **60** nodes + hint (was 1000) |

### Access control (OWASP lens) — re-verified holding
- Block/Principal cannot reach an ancestor or peer dashboard via Compare, breadcrumb, leaderboard, or **hand-edited `localStorage` scope** — out-of-scope scope is clamped to home (`isInScope` guard on `setScope` write + `useScope` read + `AppShell` repair).
- Peer comparison stays read-only and non-navigable (peer leaderboard rows + Compare "Peers" group render values only).
- Header breadcrumb shows the user's own scope, never a switched ancestor.
- No secrets/keys in client code. Comments at each guard note that **production must also enforce scope server-side (Postgres RLS)** — client checks are bypassable.

---

## Deferred (Nits — low risk, documented; not fixed)

- **Chart hex literals** in `TrendChart.tsx` (grid/axis/benchmark/tooltip), the `RatingRing` track stroke, and the `Sparkline` default `#386AF6` mirror existing theme tokens. Recharts/SVG require JS values, so these are not class-token violations; centralising them into named `lib/colors` exports is a cleanup, not a correctness fix.
- **Level-ordering array** is defined in ~3 places (`LEVELS`, `CASCADE_ORDER`, `childLevelOf`); could derive all from the single `LEVELS` constant.
- **`perSchool` normalization** duplicated between `engine/rollup.ts` and `CascadeComparison.tsx` (`cmpVal`); extract a shared helper.
- **`mockProvider` seed cast** `as unknown as Entity[]` is at the JSON-import boundary; kept (documented) — a dev-only runtime guard/zod parse would harden it.
- **`KpiValueRow` type** and the provider's `resolveLogin`/`getUserByLogin` are part of the documented production (Supabase) seam; kept intentionally.
- **`InfoTooltip`** exposes its text via the button `aria-label` (accessible; not truly double-spoken); an `aria-describedby` refactor is optional polish.

## Not implemented / known limitations (unchanged from prior rounds)
- Mock data only (no Supabase); the `supabase/` schema + seed are a documented migration seam.
- Domain weightages are placeholders summing to 100% (`WEIGHTAGE_IS_PLACEHOLDER`), surfaced in the UI.
- Per-level KPI values are anchored to the published figures with deterministic per-entity spread; at the single-entity State level the value can sit slightly off its own benchmark (illustrative, not a strict bottom-up rollup).
