# Unified Portal — QA Report (4A Input-Output reframe)

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
