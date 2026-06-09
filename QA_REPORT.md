# Unified Portal — QA Report

## Design-system consistency refactor (one coherent product)

Centralised the visual language so a change in one shared component now propagates across every view (the previous problem: each screen grew its own card/header/table markup).

**New shared primitives**
- Layout: [ScreenContainer](app/src/components/layout/ScreenContainer.tsx) (one page wrapper + entry animation), [PageHeader + BackLink](app/src/components/layout/PageHeader.tsx), [PageSection + PageGrid](app/src/components/layout/PageSection.tsx).
- Metric grammar: [ValueDisplay](app/src/components/ui/ValueDisplay.tsx) (the one big-number treatment + colour discipline), [FrequencyDelta](app/src/components/ui/FrequencyDelta.tsx) (the one direction-aware, frequency-worded delta — inline + pill variants), [NPlusOneLine](app/src/components/ui/NPlusOneLine.tsx) (the one "{parent} · {score}" line), [EmptyState](app/src/components/ui/EmptyState.tsx).
- Composite cards: [DomainSummaryCard](app/src/components/ui/DomainSummaryCard.tsx), [GsqacSummaryCard](app/src/components/ui/GsqacSummaryCard.tsx) (distinctive pink output surface + D1–D5 + grade badge, annual — no daily trend), [ResponsiveDataTable](app/src/components/ui/ResponsiveDataTable.tsx) (one table grammar).

**Screens refactored to compose, not redefine**
- [ScorecardHome](app/src/screens/ScorecardHome.tsx): domain cards → `DomainSummaryCard`; School Quality → `GsqacSummaryCard`; header → `PageHeader`; sections → `PageSection/PageGrid`. (Overall-score hero kept as the one allowed bespoke surface.)
- [DomainView](app/src/screens/DomainView.tsx), [SubDomainView](app/src/screens/SubDomainView.tsx), [KpiDetail](app/src/screens/KpiDetail.tsx), [CascadeComparison](app/src/screens/CascadeComparison.tsx), [Leaderboard](app/src/screens/Leaderboard.tsx), [Export](app/src/screens/Export.tsx): all now use `ScreenContainer` + `BackLink`/`PageHeader` + `PageSection`; `KpiCard` (domain/sub-domain) and `KpiDetail` value/delta/N+1 go through the shared atoms; Export's two tables → `ResponsiveDataTable`.

**Consistency outcomes**
- **One metric card family** — `KpiCard`, `DomainSummaryCard`, hero tiles and the KPI-detail header all compose `ValueDisplay` + `FrequencyDelta` + `NPlusOneLine`; a change to any atom reflects on home, domain, sub-domain and detail at once.
- **N+1 grammar** is a single component everywhere (`{parent} · {score}`, no "ahead/behind %"); hidden at State. Removed the dead `DomainBar` (the last "−X% behind" pattern).
- **Direction-aware delta** everywhere (`FrequencyDelta`): a decline of a lower-is-better metric (chronic absentees ↘) is green; with frequency-correct wording (this week / month / cycle / time / year). Annual/half/twice-yearly KPIs keep their non-daily trend; GSQAC stays annual (no fake daily line).
- **Status text tags removed** from normal cards (`SubDomainView`, `KpiDetail` no longer render "On track" etc.); status now lives in value colour + dot + grade + delta. Export keeps a status column (explicitly allowed admin/export context).
- **GSQAC grade colours** remain centralised (`GRADE_GROUP` + `RatingBadge`); no new raw hex added.
- Docs: [README](app/README.md) reframed from the stale "5A / 29 KPIs" to the current **4A Input–Output** model; `package-lock.json` already in sync (no changes on `npm install`).

**Verification** — `npm run build` clean (tsc + vite). QA scripts all green against the production build:
- `roles-smoke` **6/6** (teacher · principal · crc · brc · deo · state — each scoped correctly, 0 errors)
- `verify` **21/21** · `verify-access` **20/20** (tamper→clamp, compare scoped to same/one-below, peers non-navigable, PM-Shri rules intact)
- `qa-sweep` **0 problems** — no horizontal overflow, no console errors across roles × screens × {320, 375, 768, 1440} × {EN, ગુ}.
- Visual pass (desktop + 320 ગુ): Scorecard, Domain, KPI detail, Leaderboard, Export read as one family. Screenshots at repo root: `ds-kpidetail-desktop.png`, `ds-domain-desktop.png`, `ds-leaderboard-desktop.png`, `ds-export-desktop.png`, `ds-home-320-gu.png`.

**Known risks / TODOs**
- For **count** KPIs the N+1 shows the parent's raw count (e.g. chronic absentees "Kachchh · 790"), which is naturally larger because the parent aggregates more schools — faithful to "that KPI's score at the parent level" but worth a product decision (suppress for counts, or show a rate) — needs Sumit's call.
- `MetricCard` was intentionally **not** collapsed into a single monolith: `KpiCard` (vertical) and the `HeroKpiStrip` tile (horizontal, full-name) are deliberately different layouts that now share the same atoms — propagation is achieved without a risky rewrite.
- Access control remains **client-side only** (`isInScope`); production still needs server-side RLS (unchanged by this pass).

---

## N+1 made consistent across ALL indicators

The N+1 comparison was still being skipped for change-deltas (`displayStrategy: "delta_cycle"` — e.g. "Reduction in dropout %") and, on the older build, for counts/ratios/GSQAC — so the Key Indicators strip looked inconsistent (some tiles had "[parent] · score", some showed "vs last cycle" / "3% of enrolled" / nothing). Now **every** indicator shows the N+1 line, on both the Key Indicators strip ([HeroKpiStrip.tsx](app/src/components/ui/HeroKpiStrip.tsx)) and the KPI cards ([KpiCard.tsx](app/src/components/ui/KpiCard.tsx)).

- **Universal N+1** — shown whenever a published parent figure exists; hidden only at State (no parent) and for NA. `peerAvg` carries a comparable per-level figure for every KPI (rates, counts, ratios, scores **and** change-deltas), so the comparison is sound everywhere.
- **Formatted like the tile's own value** — change-deltas show a **signed** N+1 (e.g. "Reduction in dropout %" → value `+14.6%`, N+1 `Kachchh · +14%`); rates/counts/ratios/scores show the plain figure (`Kachchh · 74%`, `Kachchh · 790`, `Kachchh · 1.8`, `Kachchh · 74`).
- **KpiCard now matches the strip for change-deltas** — those KPIs render a signed, direction-coloured value (`+11%` green) with the signed N+1, and the redundant inline "Δ this cycle" tag is suppressed (the value already is the delta). Rate KPIs keep value + inline direction-coloured delta + N+1.

**Verified** (`tsc` + build clean) at a Block scope (parent = Kachchh), 375 + desktop, EN + ગુ: all 7 Key Indicators and every domain/sub-domain KPI card show "[parent] · score"; dropout reads `Kachchh · +14%` / `Kachchh · +૧૪%`; **0 horizontal overflow**; **0 console/page errors**; verify suite **21/21**. Screenshots at repo root: `keyind-consistent-desktop.png`, `keyind-assessment-375.png`.

---

## KPI cards = domain-card family + N+1 on every KPI

Screenshots at repo root: `kpicards-domain-375.png`, `kpicards-assessment-375.png`, `kpicards-assessment-desktop.png`, `kpicards-attendance-375-gu.png`.

**N+1 on every KPI card** — the "KPIs in <domain>" lists ([KpiCard.tsx](app/src/components/ui/KpiCard.tsx)), the Key Indicators strip ([HeroKpiStrip.tsx](app/src/components/ui/HeroKpiStrip.tsx)) and the indicator detail all show the **next-level-up entity's name + that KPI's score at that level** (e.g. "Lakhapat · 91%"), formatted with the KPI's own unit (`91%`, `73`, `1.6`, `62`/`4.1K`). Same source as the domain cards: `peerAvg(kpi.id, level)` at the parent level + `sc.parent` name. Hidden at State (no parent) and for change-deltas (`displayStrategy: "delta_cycle"`, where the value isn't the same quantity as the baseline) — so "Assessment result %" / "Improvement in …" show no N+1, while every rate/count/score KPI does.

**KpiCard rebuilt as a member of the domain-card family** — same card anatomy (`card` + `card-pad`, radius, shadow, `hover:shadow-raised`, chevron), the same **big-number value treatment** (`text-3xl font-extrabold`, `valueToneClass`), and the same **inline frequency delta** (arrow + value, e.g. `↘1.1`) replacing the old green "Δ this week" pill. The delta is **coloured good/bad by the indicator's direction** (a decline of a higher-is-better metric → red; of a lower-is-better metric → green) with **frequency-correct wording** kept: Daily → "this week", Monthly → "this month", Twice-a-year → "this cycle", Half-yearly → "this time", Yearly → "this year" (new `kpi.pWeek…pYear` keys + `periodLabelKey`). Each KPI keeps its **frequency-appropriate trend graph**. Net layout per card: name + chevron · value + delta · trend · N+1 line — a KPI card and a domain card now read as the same family.

**Verified** (`tsc` + build clean): 375 / desktop, EN + ગુ — **0 horizontal overflow** everywhere; every KPI card shows "[parent] · score"; deltas colour by good/bad (chronic-absentee "↘1 this week" = green; "Assessment result %" "↘0.1 this cycle" = red) with localised wording ("this week" → "આ અઠવાડિયે"); **0 console/page errors**; verify suite **21/21**.

---

## Hero + School-Quality visual polish (+ indicator rename)

Two craft passes on the homepage, mock data only, no logic/data changes. Screenshots at repo root: `polish-home-375.png`, `polish-home-320.png`, `polish-home-desktop.png`, `polish-home-375-gu.png`.

**Indicator rename (from `Docs/GJ _ Unified App KPIs.xlsx`)** — re-parsed column C; one name changed in the sheet: `asm_remediation` "Data Driven Remediation %" → **"SAT report downloaded in classroom"** (gu "વર્ગખંડમાં SAT રિપોર્ટ ડાઉનલોડ"), with its formula/description updated to match (classrooms where the SAT report was downloaded ÷ total classrooms). All other names already matched ("Students below `<hierarchy>` avg" confirms the placeholder we substitute per scope).

**1. Hero "Overall score" card** ([ScorecardHome.tsx](app/src/screens/ScorecardHome.tsx)) — the ring, the grade badge and the 30-day trend now read as **one unit on a premium surface**: a subtle green-tinted gradient (`from-tint-mintBg via-white to-tint-greenBg/40`) with a faint green border + raised elevation, setting it apart from the flat white domain cards (stays within the green/neutral system, no new colours). The score is the star (ring bumped to 104, grade badge beside it). The trend gained **context**: a "30-DAY TREND" label, a coloured **net-change pill ("+5 over 30 days" / "૩૦ દિવસમાં +૫")**, a dashed **baseline** at the start value and an emphasised **endpoint dot** ([Sparkline.tsx](app/src/components/ui/Sparkline.tsx) gained `baseline`, `emphasizeEnd`, `responsive`). The trend is **full-width responsive** (measured via ResizeObserver, jsdom-guarded) so there is no empty right-side gap on desktop; on mobile it stacks under the score.

**2. School Quality card** ([ScorecardHome.tsx](app/src/screens/ScorecardHome.tsx)) — the flat washed-pink fill is replaced with a **refined pink gradient** (`from-tint-pinkBg to-white`) + a clear pink border, a richer pink **award-icon chip**, and a pink-700 "OUTPUT · ANNUAL" eyebrow (AA). Same radius / padding / shadow as the other cards. The 5 GSQAC bars, the **67 · B** grade badge (official colour), the coverage line (bumped to neutral-500) and "vs last cycle +1.4%" stay legible on the new surface.

**Verified** (`tsc` + build clean): 375 / 320 / desktop, EN + ગુ — **0 horizontal overflow** at every width; net pill localises ("+5 over 30 days" → "૩૦ દિવસમાં +૫"); renamed indicator renders in Key Indicators (EN + gu); **0 console/page errors**; verify suite **21/21** (desktop + mobile).

---

## Homepage simplification + mobile-first

Built mobile-first (verified 375 + 320 first, then desktop, EN + ગુ). Screenshots at repo root: `audit-home-375-mobile.png`, `audit-home-desktop-new.png`, `audit-domain-page-375.png`.

**Overall score card** ([ScorecardHome.tsx](app/src/screens/ScorecardHome.tsx)) — renamed **"Input Composite → Overall score"** (ring sublabel); **grade badge (A+) moved to the right** of the score; removed the status word ("on track"), the green ±-vs-last-week button, the **"What changed this week"** block, the **"current period · Week 23"** label, and the **"Improve the 3 inputs…"** subtitle; added a **small 30-day trend** for the overall score (`overallTrendData` in [trend.ts](app/src/lib/trend.ts)).

**Section order** is now **Overall score → Domain cards → School Quality → Key indicators** (the strip moved to the bottom).

**Key indicators** ([HeroKpiStrip.tsx](app/src/components/ui/HeroKpiStrip.tsx)) — renamed from "What to act on", subtitle removed. Rebuilt as **full-width horizontal tiles showing each indicator's full name (no truncation)**: status dot + full name + frequency chip + one supporting line on the left; mini trend (desktop) + value on the right. The N+1 line shows the **parent's name + score** (e.g. "Gujarat · 91%") — no "ahead/behind/vs target".

**Domain cards** — header renamed **"Inputs · act on these" → "Domain"**; removed the "Weightage 30%" string, the On track/Needs-attention tags, the status dot, and the "Weightages: placeholder" tag. The N+1 line now shows **"[parent name] · [parent score]"** (e.g. "Gujarat · 95%"), not a ±%. The small frequency-based up/down delta arrow is **kept**.

**Domain pages** ([DomainView.tsx](app/src/screens/DomainView.tsx)) — same card language as the homepage: dropped the header weightage + status badge, and the indicator tiles ([KpiCard.tsx](app/src/components/ui/KpiCard.tsx)) drop the "% score" clutter + name truncation (full names), using the shared value treatment.

**Indicator pages** ([KpiDetail.tsx](app/src/screens/KpiDetail.tsx)) — removed the "On track and ahead of the level average" commentary; **"Students below hierarchy avg" now substitutes the real N+1 level** (e.g. "Students below state avg"); the N+1 line shows the **parent's name + real score** (e.g. "Gujarat · 18%"), consistent with the cards.

**Verified** (production build · Playwright): all of the above at 375 / 320 / desktop, EN + ગુ; **0 horizontal overflow**; section labels localise (એકંદર સ્કોર · ડોમેન · મુખ્ય સૂચકાંકો); domain + Key-indicator N+1 lines read "[parent] · score" with no "behind/vs target"; `tsc` + build clean; **roles 6/6 · access 20/20 · functional 21/21 · 0 console errors**.

---

## Colour discipline + School-Quality consistency + domain-page cleanup

Single source of truth added in [lib/colors.ts](app/src/lib/colors.ts): `valueToneClass(status)` for headline numbers and `deltaToneClass(delta, direction)` / `deltaIsGood` for deltas. Colour now signals **good vs bad**, derived from each indicator's `direction` — never a minus sign or "just being a number".

**1. Removed the duplicate "GSQAC · D1–D5 (live data)" section** from `/domain/school_quality` ([DomainView.tsx](app/src/screens/DomainView.tsx)) — the 5-domain breakdown already lives on the School Quality card. Verified the domain page now shows only "KPIs in School Quality".

**2. School Quality card no longer an amber outlier** ([ScorecardHome.tsx](app/src/screens/ScorecardHome.tsx)). All four domain values now use one treatment (`valueToneClass`): good → green, watch (amber) → **neutral**, at-risk → red. So Attendance/Assessment/Administration stay green and **School Quality's "67%" is neutral** (verified `rgb(14,14,14)`), not amber — while the **GSQAC grade badge "B" keeps its official colour** (verified `rgb(176,126,0)`).

**3. Value/delta colouring fixed app-wide — red only for *bad*** (direction-aware):
- **Reduction in dropout % "+16.2%"** now renders **green** (verified `rgb(21,128,61)`) — higher-is-better, so a positive change is good, not red. Fixed on the hero card and the indicator detail.
- **Chronic absentees** (lower-is-better): a decrease "−117" renders **green** (verified) — down is good; its value/dot are green when healthy.
- **Re-enrolment / remediation / assessment** (higher-is-better): up = green, down = red.
- Applied via the helpers to the hero strip, indicator detail, domain/input cards, the GSQAC vs-last-cycle delta, and the leaderboard "vs avg" gap. `DeltaPill` was already direction-aware (kept). A good value or delta is **never red**; flat = neutral.

**Verified** (production build · Playwright): dropout/chronic/re-enrolment colour correctly; SQ value neutral + badge official; domain page has no D1–D5 section; `tsc` + build clean; **roles 6/6 · access 20/20 · functional 21/21 · 0 console errors**. Screenshot: `audit-home-colours.png` (repo root). Note: "watch/amber" headline numbers are rendered **neutral** (per the rule "a healthy headline is neutral/brand or green, never red"); the status dot + grade badge carry the amber signal.

---

## Frequency-aware trend graphs + delta tags

Every indicator now carries a **frequency-appropriate trend graph** (on the cards and the detail) plus a **delta tag whose wording is derived from `frequency`** — never a weekly axis or a "Δ this week" tag for non-daily data. All driven from one engine ([lib/trend.ts](app/src/lib/trend.ts)), so cadence + tag are config, not per-card.

| Frequency | Graph x-axis (verified) | Delta tag (verified) |
|---|---|---|
| **Daily** (Student attendance, Chronic absentees) | last 30 days — daily line (3 May…1 Jun) | **Δ this week** |
| **Monthly** (CRC/URC visits, School observation, Data-Driven Remediation) | Jan…Jun (months); CRC plotted on a 0–2 axis | **Δ this month** |
| **Twice a Year** (Assessment result/SAT, Students-below) | SAT1'23 · SAT2'23 · SAT1'24 · SAT2'24 · SAT1'25 · SAT2'25 | **Δ this cycle** |
| **Half yearly** (Reduction in dropout, Re-enrolment) | Sept'23 · Mar'24 · Sept'24 · Mar'25 · Sept'25 · Mar'26 | **Δ this time** |
| **Yearly** (GSQAC, CET, CGMS, ORF, CPD) | 2021 · 2022 · 2023 · 2024 · 2025 (+ GSQAC grade) | **Δ this year** |

- **History** is believable dummy data (gently trends, can dip), deterministic (seeded by kpi + entity), and **pinned to the real current value** at the latest point, so the headline number and the graph agree. The delta = current minus one tag-period back (≈7 days for daily, 1 point otherwise).
- **Clarification applied:** annual / half-yearly indicators **now get a graph** (with yearly / half-year x-points) — consistent with the earlier "no fake weekly line for annual data" rule; GSQAC also keeps its **snapshot + grade**.
- **Specific cases fixed:** CRC/URC visits + School observation → monthly graphs with month labels & "Δ this month"; dropout → half-year graph & "Δ this time"; GSQAC/annual → yearly graph & "Δ this year".
- **Charts** ([TrendChart.tsx](app/src/components/ui/TrendChart.tsx)): nice ascending Y-ticks fitted to data (e.g. 63–68 for GSQAC, 1.2–2 for CRC, 80–100 for a 90% series), "Avg N" reference, last x-label no longer clipped, entry animation disabled (snappy + clean).
- **Cards** ([HeroKpiStrip](app/src/components/ui/HeroKpiStrip.tsx), [KpiCard](app/src/components/ui/KpiCard.tsx)): every hero tile and every indicator tile now shows a frequency-appropriate mini trend (sparkline) + the cadence delta tag. Confirmed **no "Δ this week" appears on any non-daily indicator**. Fixed a colour glitch: a positive context delta (e.g. "+16.2% reduction") now reads green to match its On-track status.

**Verified** (production build · Playwright): each frequency renders the correct x-axis + delta tag at **desktop and 320, EN + ગુ** (Gujarati cadence labels e.g. "સપ્ટે '૨૩" + "Δ આ વખતે"); `tsc` + build clean; **roles 6/6 · access 20/20 · functional 21/21 · 0 console errors**. Screenshots: `audit-kpi-yearly-gsqac.png`, `audit-kpi-halfyearly.png`, `audit-kpi-twiceayear.png`, `audit-kpi-monthly-desktop.png`, `audit-home-*.png` (repo root).

---

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
