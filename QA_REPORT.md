# Unified Portal — QA Report

## Design audit + fix (impeccable / taste lens)

Goal: every page readable in ~6 seconds, low cognitive load, consistent system. Verified with the production build + Playwright at **desktop · 375 · 320, EN + ગુ**. Screenshots: `audit-home-desktop.png`, `audit-home-375.png`, `audit-home-320.png`, `audit-home-375-gu.png`, `audit-kpi-monthly-desktop.png` (repo root).

**B — Charts (were wrong, now correct)** ([TrendChart.tsx](app/src/components/ui/TrendChart.tsx)) — the chart type, x-axis period and data now agree, driven by Frequency:
- **Monthly** indicators plot **month buckets with month x-labels (Nov…Jun)** — the previous "MONTHLY TREND" that showed `W16–W23` is fixed (verified: x = Nov,Dec,Jan,Feb,Mar,Apr,May,Jun).
- **Daily** → a **30-day daily line** (8 anchors densified to 30 daily points with a tiny deterministic wobble) labelled by date (3 May…1 Jun).
- **Annual / half / twice-a-year** are **not** line-charted — the Indicator Detail shows a snapshot + cycle delta (GSQAC = score + grade + vs-last-cycle, never a trend line).
- **Y-axis fixed:** ascending, evenly-spaced, **rounded ticks** with a domain that **fits the data** (e.g. 80/85/90/95/100 for an 86–97% series, not the old broken `1.8/.35/.9/.45/0`). The level-average reference reads "Avg 86%" (no longer clipped).

**C — "What to act on" hero strip** ([HeroKpiStrip.tsx](app/src/components/ui/HeroKpiStrip.tsx)) — **one card anatomy** reused across all 7: status dot + label (2-line, fixed height) + frequency chip (top-right) → one dominant value → one supporting line (vs {level} avg / vs target / % of enrolled / vs last cycle) → micro-viz pinned to the base (sparkline for daily, compliance bar for monthly %). Verified **all 7 tiles render at identical height (172 px)** and reflow 4→3→2 cols (desktop→375→320). Colour disciplined: the big value is neutral; colour is reserved for the status dot, the GSQAC grade badge ("67 B" amber) and the trend delta (green/red).

**A / E — system + consistency** — colour used only for status / grade / trend / risk on neutral surfaces; consistent `card-pad`, gaps, `section-title`, and a single value/label type rhythm; long indicator + school/Gujarati names **truncate with a title tooltip** (e.g. the full "Participation in CGMS (Chief Minister Gyan Sadhna Merit Scholarship)"). **0 horizontal overflow at 320 px** in EN and ગુ.

**Indicator names** aligned **exactly to `GJ _ Unified App KPIs.xlsx`** (column C) for all indicators (e.g. "Mid Day Meal (MDM) served %", "Chronic absentee students (7 consecutive days)", "Participation rate in ORF Reading (ORF)", "No of CRC/URC Visits per school", "Re-enrolment of OoSC (Out of School) against target %", "Data Driven Remediation %"). The Data-Driven-Remediation **GP report-card-download** mechanic is retained in its description/formula. GSQAC's 5 sub-rows keep the descriptive D1–D5 domain names (the sheet's repeated "GSQAC domain" placeholder isn't useful).

**Re-verified:** `tsc` + build clean; **roles 6/6 · access 20/20 · functional 21/21 · 0 console errors**; charts agree (month labels / 30-day / no annual line) with sane Y-axes; hero tiles uniform; 0 overflow at 320 px in EN + ગુ.

---

## OGM 3.0 — Officer Command Center (Pass 1 of phased build)

Decision-first, government-officer-first upgrade built **exactly** on `Docs/OGM 3.0 - Indicators.csv` (definitive). Per the agreed scope: **Pass 1 = OGM-3.0 catalog + schema + frequency-aware cards + N+1 comparison + official GSQAC colours + data-lake/freshness states + Officer Command Center (page 1)**. Pass 2 (Domain drill-down, Indicator Detail page, School Profile drawer) is deferred. Confirmed defaults applied: *My decision-critical heroes*, *Phased — foundation first*, *Park all indicators not in OGM 3.0*. The engine stayed config-driven, so most of this was config + a thin component layer.

### What changed (Pass 1)

| Area | Change |
|---|---|
| **Indicator catalog** ([kpiCatalog.ts](app/src/config/kpiCatalog.ts)) | Rebuilt to the OGM 3.0 set exactly: Attendance (5) · Assessment (12, incl. ORF/CET/CGMS participation+improvement, NAS, merit, classroom prep) · Administration → **CPD / Visits & Observations / Retention** · School Quality (GSQAC + 5 domains + vs-cycle). Each indicator carries `formula`, `data_source`, `frequency`, `availableInDataLake`, `displayStrategy`, `hero`, `pmShriApplicable`, `roleVisibility`, `lowestLevel`, `dataLagNote`. Everything **not** in OGM 3.0 is parked. |
| **Schema** ([types/index.ts](app/src/types/index.ts)) | `KpiDef` extended with the OGM 3.0 metadata (mapped onto the existing shape, minimum churn); added `Frequency` / `DisplayStrategy` types; `Unit` gained `ratio`/`grade`. |
| **Sub-domains** ([frameworks.ts](app/src/config/frameworks.ts)) | Administration's 7 → **3** (CPD · Visits & Observations · Retention), per the sheet. |
| **Frequency-aware display** ([HeroKpiStrip.tsx](app/src/components/ui/HeroKpiStrip.tsx)) | Daily → 30-day **sparkline**; Twice-a-year / Half-yearly → **vs-last-cycle delta**; Monthly → **compliance %**; Yearly → **snapshot + GSQAC grade**; counts → **count + rate**; CRC visits → **x / 2** ratio. Never a fabricated daily trend for annual data. |
| **N+1 comparison** ([lib/peer.ts](app/src/lib/peer.ts)) | Each level vs its **next level up** (School↔Cluster, Cluster↔Block …) shown as a signed gap ("State 73 · −5.3 behind"), not a rank, and not for raw counts. Replaces the static state baseline. State has no N+1 (correctly hidden). |
| **Official GSQAC colours** ([lib/colors.ts](app/src/lib/colors.ts)) | Grade colours = GSQAC guidelines: **A green `#1B7F4B`, B yellow `#E0A400`, C red `#D33A2C`, D black `#2B2B2B`** (text darkened for AA where needed; verified computed: B = `rgb(176,126,0)` on `rgba(224,164,0,.14)`). Operational status (On Track / Watch / …) kept separate. |
| **Data-state badges** ([DataBadges.tsx](app/src/components/ui/DataBadges.tsx)) | `FrequencyBadge` · `FreshnessBadge` (cadence-appropriate) · `SourceBadge`. (A "Demo data — not in data lake yet" badge was built then removed at the user's request.) |
| **GSQAC domains** ([mockProvider.ts](app/src/data/provider/mockProvider.ts)) | `sq_d1..d5` now sourced from **real** `entity.meta.gsqac.domains`; output domain score pinned to `sq_gsqac` (D1–D5 are context, not re-averaged). |
| **Officer Command Center** ([ScorecardHome.tsx](app/src/screens/ScorecardHome.tsx)) | Composite ring + "what changed" + biggest-opportunity callout, **Hero KPI strip** (6 decision-critical indicators, frequency-aware + N+1), 4A domain cards, School Quality (real GSQAC, D1–D5), and a **risk-first "Where to focus first" table** (units below you, worst composite first; reuses the child leaderboard, performant). |
| **Mock realism** ([mockProvider.ts](app/src/data/provider/mockProvider.ts)) | `ratio`/`hours` get proportional spread; **context-delta %s (YoY / dropout) kept tight (~±2.4) and allowed to dip negative** — a real decline becomes a "needs attention" signal instead of being swamped by ±9 jitter. |

### Verification (production build · preview 4174)
- `tsc --noEmit` clean · `npm run build` clean (main 31 KB gz; seed lazy chunk 408 KB gz).
- **Functional `verify.mjs` 21/21**, **access/dropdown `verify-access.mjs` 20/20**, **all-roles `roles-smoke.mjs` 6/6** — **0 console/page errors**.
- Playwright MCP: State Command Center (hero strip, 4A cards, real GSQAC D1–D5 B-grade, risk table), drill State → District (N+1 peer bands appear: "State 92% · −0.1% behind", "State 73 · −5.3 behind"), frequency-aware tiles (Daily sparkline, YoY/half-yearly deltas, monthly %, yearly GSQAC grade), official GSQAC B colour verified by computed style.
- Responsive: **0 horizontal overflow at 320 px** in **English and ગુજરાતી**; all `ogm` strings + Gujarati numerals render; scope drill + access clamps intact.

### Command Center — review round (hero set, attention strip, transparency)

Follow-up addressing the #1–#5 checklist + the official hero list:

| Item | Change |
|---|---|
| **Hero set (#2)** | `kpi.hero` now flags **exactly the official 7** (config-driven; asserted `HERO_KPIS` = the set): Chronic absentees · Data-Driven Remediation % · Teachers completing 50 hrs % · CRC/URC visits · Reduction in dropout % · Re-enrolment of OoSC · GSQAC score. Strip reframed **"What to act on — intervention levers, not headline numbers"**, ordered most-at-risk first, all 7 frequency-aware, demo/data-lake badges carried (5 of 7 are DL=No). |
| **"What needs attention?" (#1)** | New **computed** insight strip ([insights.ts](app/src/lib/insights.ts) + [AttentionStrip.tsx](app/src/components/ui/AttentionStrip.tsx)) — biggest N+1 gap, weakest input domain, biggest decline vs cycle, chronic absentees + rate, GSQAC coverage gap — ranked by severity, distinct from the hero strip and risk table. Nothing hardcoded. |
| **PM-Shri (#3)** | Confirmed top-bar, Cluster+ only (hidden Teacher/Principal); now also reachable on mobile. |
| **Coverage honesty (#4)** | GSQAC "real / measured" school counts via `getScopeStats` ([mockProvider](app/src/data/provider/mockProvider.ts)) — chip on the School Quality card + a coverage insight, so missing data ≠ low performance. |
| **Composite-risk sort (#5)** | Formula made transparent: info tooltip ("30% Attendance + 30% Assessment + 40% Administration, lowest first") + each row shows its 4A breakdown as accent dots ([SchoolRiskTable](app/src/components/ui/SchoolRiskTable.tsx); `LeaderboardEntry.domainPercents`). |
| **State N+1 (minor)** | Falls back to vs-previous-period, gated to Daily/Weekly/Monthly so annual KPIs never show a fabricated weekly delta. |

**Adversarial review (3 parallel lenses — correctness · taste · a11y/i18n).** No blockers. Fixed: em dashes in rendered copy removed (both locales + `dataLagNote`, per the impeccable law); GSQAC excluded from the N+1 peer band and the peer-gap insight (its real value has no real next-level-up baseline in the mock — the grade is the signal); GSQAC status dot now derives from its grade band (can't disagree with the badge); risk-formula info is a focusable button + coverage line has an accessible label; info-severity insights use neutral grey so only red/amber carry urgency. Documented: chronic rate is illustrative (count and enrolment are independently sourced in the mock).

**Re-verified:** `tsc` + build clean; all-roles 6/6 · access 20/20 · functional 21/21, **0 console errors**; 7 heroes + attention strip render at desktop and 320px in EN + ગુજરાતી (Gujarati numerals); 0 horizontal overflow; official GSQAC grade colours intact.

### Reconciliation to `GJ _ Unified App KPIs.xlsx` + IA cleanup

Definitive list switched to the **Excel sheet** (parsed via openpyxl: 35 rows = 30 indicators + 5 GSQAC-domain rows). The catalog is now reconciled to it **exactly** — `merit-list`, `NAS`, `classroom-prep`, `avg-CPD-hours` and a standalone `GSQAC-improvement` KPI were parked (not in the sheet); the **Compare screen renders all 35** and Export lists all of them.

| # | Change |
|---|---|
| **Two-axis visibility** ([applicability.ts](app/src/config/applicability.ts), [kpiCatalog.ts](app/src/config/kpiCatalog.ts)) | Config-driven, no hardcoded id lists. **`lowestLevel`** = level applicability: school-and-above (teacher attendance, MDM, reporting, ALL Administration, GSQAC) are hidden at grade/section; classroom (student attendance, chronic, ALL assessment) go to section. **`roleVisibility`** = sheet column J: the 20 "No" rows exclude the teacher persona (officers/principal keep them). Verified live: at Section 1-A a teacher sees Student attendance + Chronic + assessment, while **Teacher attendance / MDM / Administration / GSQAC / CET / CGMS are gone** (the screenshot bug is fixed). |
| **A1 Demo badge removed** | The "not in data lake" badge no longer renders anywhere; every indicator shows (demo values where no live feed). `availableInDataLake` flag retained in config. |
| **A2 Sections removed** | Screen + route + nav item deleted. Nav is **Scorecard · Compare · Leaderboard · Export** (desktop + mobile). |
| **A3 / A4** | Biggest-opportunity card already gone; **"vs benchmark" copy removed everywhere** (KpiCard, Leaderboard, KpiDetail, and engine [story.ts](app/src/engine/story.ts)) in favour of N+1 "vs {level} avg" language. |
| **B Frequency-aware trend** ([KpiDetail.tsx](app/src/screens/KpiDetail.tsx)) | Daily → 30-day line; Monthly → monthly; **Twice/Yearly/Half-yearly → cycle-over-cycle (no weekly line)**; GSQAC → snapshot + grade + vs-last-cycle. Verified: GSQAC detail shows "Cycle over cycle" + "Annual snapshot", **no weekly trend**. |
| **C Cross-level = upward only** ([engine/index.ts](app/src/engine/index.ts) `getKpiCascade`) | Own level + ancestors up to State (never descendants); **hidden entirely for a State user**. Verified. |
| **D Hero → detail** ([ScorecardHome.tsx](app/src/screens/ScorecardHome.tsx)) | Key-indicator (and insight) cards open the indicator's detail page directly. |
| **E Compare = 4 single-selects** ([CascadeComparison.tsx](app/src/screens/CascadeComparison.tsx)) | Exactly four single-select slots; options scoped to the user's **own level (peers) or one level below** (e.g. Block → Blocks or Clusters; never District/State). Access-control test updated + passing. |
| **G Data-Driven Remediation reframed** | Now **"GP report-card downloads %"** — Gyan Prabhav generates a report card at every level; the metric is downloads ÷ total at that level × 100. |
| **I Export comprehensive** ([Export.tsx](app/src/screens/Export.tsx)) | 4A summary + per-domain tables of **every applicable indicator** (★ heroes highlighted) with value · N+1 · Δ-by-frequency · source · grade, scoped to level. Verified: 7 hero rows highlighted, all indicators present. |

**Re-verified (production build):** `tsc` + build clean; **roles 6/6 · access 20/20 · functional 21/21 · 0 console errors**; teacher-at-section applicability fixed; Compare offers Block-peers + Cluster-one-below (no District/State); 0 horizontal overflow at 320 px; EN + ગુજરાતી (i18n parity type-enforced); no "demo data" / "benchmark" copy anywhere.

### Deferred to Pass 2 (by agreement)
Domain Drill-down (metric-first + geography-first), Indicator Detail page (full formula/source/cascade/data-lineage), School Profile drawer. PM-Shri filter UI exists from the prior round (Cluster+); per-indicator PM-Shri denominator application and the 3-band "students below hierarchy avg" distribution are Pass-2 refinements. Several Visits & Retention indicators are `DL=No` (demo) pending data-lake availability — flagged in-UI.

---

# QA Report (4A Input-Output reframe — prior round)

Structural migration from the 5A model to the **4A Input-Output** model (per `Mini-App_Action_Plan_4A.md` + `OGM 3.0 - KPIs_6th June_draft 1.csv`), with real GSQAC data for School Quality. The engine stayed **config-driven** — most of this was config + data + a few screens.

**Method.** Read the reference files first (action plan, OGM Table 1/3, real `GSQAC/gsqac 2024-25.csv`) without modifying them. Verified with the **Playwright MCP** (now connected) plus the Node Playwright suites, against the **production build** (`npm run build` → `npm run preview`). Skills applied: `impeccable` + `design-taste-frontend` (6-second-rule, decision-first, no "rangoli"); `owasp-security` (access control); e2e/integration/performance patterns (coverage). Two data-integration forks were confirmed with the user before building (GSQAC source; vs-last-cycle).

---

## What changed

| Area | Change |
|---|---|
| **Framework** ([frameworks.ts](app/src/config/frameworks.ts)) | 5 domains → **4**: Attendance (input 30%), Assessment (input 30%), Administration (input 40%), **School Quality** (output). Administration gets **7 sub-domains**. Renamed "Unified Portal · 4A". `kind: input/output` + `INPUT_DOMAIN_IDS`/`OUTPUT_DOMAIN_ID`. |
| **Catalog** ([kpiCatalog.ts](app/src/config/kpiCatalog.ts)) | Rebuilt from §2 (~50 indicators) with `unit` (type), `direction`, `data_source`, `sub_domain`, sample numbers, "—"=NA markers, and `// TODO` notes on the CSV-flagged ambiguous metrics. Added `context` flag + per-KPI `rag`. `GSQAC_DOMAINS` (D1-D5). |
| **Scoring** ([score.ts](app/src/engine/score.ts)) | Headline = **Input Composite** (30/30/40 over the 3 inputs, output excluded). **School Quality shown as-is** (the GSQAC `score`, not averaged). **Sub-domain rollups** (domain = mean of sub-domains = mean of indicators). lower-is-better inverted; **count + delta indicators are CONTEXT** (shown, not folded into the %). |
| **School Quality** ([attachGsqac.mjs](app/scripts/attachGsqac.mjs), [mockProvider.ts](app/src/data/provider/mockProvider.ts)) | **Real GSQAC** joined by UDISE: **775/1000 schools real**, 225 synth from the real distribution, rolled up enrolment-weighted to cluster→state. Provider sources `sq_*` from `meta.gsqac` — **annual/flat** (no WoW); "vs last cycle" is a flagged synth delta. |
| **Home** ([ScorecardHome.tsx](app/src/screens/ScorecardHome.tsx)) | **4A homepage for every role**: composite ring + 3 input cards (score, RAG, WoW, vs-parent peer gap) + **School Quality output card** (GSQAC + grade + D1-D5 + vs last cycle). Removed the score-breakdown table and bespoke `PrincipalView`/`TeacherView` ("rangoli" + duplication). |
| **Drill (3-click)** ([DomainView.tsx](app/src/screens/DomainView.tsx), [SubDomainView.tsx](app/src/screens/SubDomainView.tsx)) | Administration → **sub-domain cards** → indicators (3 taps); Attendance/Assessment → indicators (2 taps); School Quality → GSQAC D1-D5 breakdown. New `domain/:domainId/:subId` route. **Geography drill** = the "Explore below" children + breadcrumb (both journeys). |
| **Peer comparison** ([ui/Leaderboard.tsx](app/src/components/ui/Leaderboard.tsx)) | **Performance bands (A+/A/B) + "± vs benchmark"** (the peer-group/next-level-up average), **no integer ranks/medals/rank-movement**. Read-only for out-of-subtree peers. Input cards show the vs-parent-average gap. |
| **Compliance boxes** | Folded into Administration indicators — **PTR survives as `vis_ptr`**; the standalone class-capacity/enrolment boxes are gone (not KPIs in the new catalog). |
| **i18n** | All new domain/sub-domain/indicator labels carry `name_gu`; new UI strings (Input composite, School Quality, vs last cycle, sub-domains, ahead/behind, peer comparison) added to en + gu. |

---

## Verification (production build)

| Check | Result |
|---|---|
| `tsc --noEmit` · `npm run build` | clean / passes (main chunk 30 KB gz; 21k-entity+GSQAC seed lazy-loaded ~408 KB gz) |
| Responsive sweep (roles × screens × {320,375,768,1440} × {en,gu}) | **0 overflow, 0 console errors** |
| Functional (`verify.mjs`) | **21/21** (login validation 10-digit ID / 11-digit UDISE / 4-digit PIN, screens load, no console errors) |
| Access control + dropdowns (`verify-access.mjs`) | **20/20** |
| All-6-roles login + scope (`roles-smoke.mjs`) | **6/6** |
| Playwright MCP visual | 4A home (desktop + iPhone SE), 3-click drill (Administration → Retention → indicators), geography drill (district cards), School Quality real GSQAC D1-D5, peer-bands leaderboard, 0 console errors |

**Scoring sanity (State):** composite **91 (A++)** = 0.3·94 + 0.3·87 + 0.4·90 ✓; Administration **89%** = mean of its 7 sub-domains ✓; School Quality **67% (B)** = real rolled-up GSQAC (Scholarships D5 = 47%, matching the CSV's low D5) ✓.

### §5 carry-forward — re-verified, no regressions
- **Access control:** Block/Principal cannot reach an ancestor/peer via Compare, breadcrumb, leaderboard, or hand-edited `localStorage` (clamped to home; `isInScope` guard intact). Peer comparison read-only/non-navigable. Production-RLS comments retained.
- **Login:** 10-digit ID + 11-digit UDISE (teacher/principal) / ID + 4-digit PIN (officers), role by seed lookup, time-based greeting — all pass.
- **"—" = hidden** (no NA clutter); role-appropriate sets; PM SHRI hidden for Teacher/Principal; **Select All** in dropdowns; custom on-brand dropdowns with search + a11y; responsive 320–1440; bilingual; real registry retained.

### Bugs found & fixed during this round
| Issue | Fix |
|---|---|
| Input-card WoW trend distorted by count deltas (chronic absentees / merit list) | domain trend averages only scored %/score indicators |
| "Reduction in dropout 16%" rendered **red** and dragged the score (delta scored as 16/100) | delta indicators (dropout, student improvement, ORF/FLN) marked `context` + sensible per-KPI RAG → green, not folded into the score |
| (Prior round) grade band 77→A+, behind-benchmark green, iPhone SE overflow, 1000-node dropdown, dead code | all still fixed (bands A+ ≥85, gap-aware RAG, `grid-cols-1` reflow, Select cap, config-driven compliance) |

---

## Deferred / couldn't implement (and why)

- **Open metric definitions (pending Chaitanya / State)** — built with sample numbers + a `// TODO` label, logic deferred: *Performance of PM SHRI schools* (metric?), *Grant & expenditure* (what metric?), *Scheme delivery vs Payment completion* (flagged "very similar"), *ICT/Library usage* (may not apply to all schools), *Attendance reporting compliance* and *Reports downloaded* (exact definition). These render with real labels + data sources but their definitions are not final.
- **"Improvement vs last cycle"** — synthesized per-entity delta, flagged `// TODO: real prior-cycle data`, because `gsqac 2024-25.csv` is a single round (no prior cycle).
- **GSQAC coverage** — 775/1000 schools are real; 225 are synthesized from the real distribution (marked `synth`) to keep every level populated, per your decision. A re-seed to GSQAC-only schools would make it ~100% real but churn the registry/demo logins.
- **Per-KPI aggregation definitions** (Devpal) — the app rolls each indicator section→…→state by anchoring to the published per-level numbers (cascade-consistent); the exact production aggregation per indicator is pending.
- **Compliance class-capacity / enrolment boxes** — removed (folded per §3.11); only **PTR** survives as an indicator (`vis_ptr`), since the other two aren't indicators in the new catalog.
- **Prior-round Nits** (chart-hex centralization, level-ordering dedup, `perSchool` dedup) remain deferred — documented previously; none affect correctness.

All Blockers/Majors implemented and verified; the items above are data/definition dependencies on Chaitanya/Devpal/State, not build gaps.
