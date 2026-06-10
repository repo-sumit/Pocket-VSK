# Unified Portal — QA Report

## KPI card row-grammar cleanup (uniform, compact, premium)

Follow-up to the graph removal: cards still felt irregular, so this pass enforces a strict **row grammar** (header · meta · metric rows · footer) shared by every KPI card, and fixes the duplicate period label.

- **Duplicate period label fixed** ([kpiCardParts.tsx](app/src/components/ui/kpiCardParts.tsx) `KpiCardHeader`, [KpiDetail.tsx](app/src/screens/KpiDetail.tsx)): the meta row now shows **one** period label. `getLastUpdatedLabel` already encodes the schedule month (e.g. `Sep 2025`), so the raw `scheduleNote` chip is no longer appended — `Yearly · Sep 2025 September` → `Yearly · Sep 2025` (and `Mar 2026 March` → `Mar 2026`). Removed the `scheduleNote` render from both the card header and the detail header.
- **Compact shell** ([kpiCardParts.tsx](app/src/components/ui/kpiCardParts.tsx)): dropped the tall `min-h-[16.5rem]` and the `flex-1` vertical-centring block; the shell is now `min-h-[13rem]` (~210px) with a bottom-anchored footer (`mt-auto`). Card padding stays at the standard `card-pad` (p-5 ≈ 20px).
- **Single-metric cards** ([KpiCard.tsx](app/src/components/ui/KpiCard.tsx)): header → meta → headline label (Rate / Count / Score / Latest, by unit) + value + delta/as-on on one row → a 2-up **Parent avg · Source** footer pinned to the foot. No empty middle; Source reads as muted footer text, not a metric. Applies to Attendance/Administration/School-Quality single cards too.
- **Multi-metric cards** ([MultiMetricKpiCard.tsx](app/src/components/ui/MultiMetricKpiCard.tsx)): now a clean score table — each metric is a reusable **`KpiMetricRow`** with three aligned columns (value · parent N+1 · right-aligned delta), label above, hairline `divide-y` between rows, and **one** muted `Source · …` line at the foot. CET/CGMS use the same rows with no fake Source metric tile and no blank middle.
- **Reusable row** ([kpiCardParts.tsx](app/src/components/ui/kpiCardParts.tsx) `KpiMetricRow`): single presentational component used by all multi-metric rows, so alignment is consistent (no one-off layouts).
- **Top Indicators / homepage domain cards**: already row-based and graph-free from the prior pass (Top Indicators = dot + title + N+1 left, value + delta right; domain cards = name + hero label + value + N+1 + delta). Verified no graph, no source row, no empty band — left unchanged.
- **Section labels** ([index.css](app/src/index.css) `.section-title`): confirmed plain (`text-xs font-bold uppercase tracking-wider text-neutral-500`) — no background/highlight strip. The "selected-looking" label in the screenshot was browser text selection, not a style; no change needed.
- No card-level graphs remain (`Sparkline` only in its own file + barrel export). KPI detail `TrendChart` panels untouched.
- No change to KPI names/values/formulas/metadata, delta/N+1/date logic, source values, access, routing, Compare, Export, GSQAC, or provider architecture.

**Files changed:** `components/ui/kpiCardParts.tsx`, `components/ui/KpiCard.tsx`, `components/ui/MultiMetricKpiCard.tsx`, `screens/KpiDetail.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

---

## Graph-free KPI cards — compact redesign (charts stay on detail only)

Removed every sparkline / line graph from KPI cards and redesigned the cards to be compact, information-first status tiles. Rule applied: **trend graphs belong only on KPI detail pages, never on overview cards.**

- **All card-level sparklines removed:**
  - [KpiCard.tsx](app/src/components/ui/KpiCard.tsx) — single-metric: header → headline value + delta / `as on <date>` → `Parent avg` (N+1) + `Source`, pinned to the foot. No graph. `buildTrend` is kept but used only to compute the delta.
  - [MultiMetricKpiCard.tsx](app/src/components/ui/MultiMetricKpiCard.tsx) — now a compact **score table**: one stacked row per metric (label · value · N+1 · delta), hairline dividers, and a single muted `Source` line at the foot. Both the primary sparkline and the secondary micro-sparklines are gone.
  - [HeroKpiStrip.tsx](app/src/components/ui/HeroKpiStrip.tsx) (homepage Top Indicators) — dropped the mini sparkline; the right side now shows value + a direction-aware delta (`↗ 0.3 this half-year` / `↘ 1 today`).
- **Homepage domain cards** ([DomainSummaryCard.tsx](app/src/components/ui/DomainSummaryCard.tsx)) and **GSQAC card** had no sparkline (delta only) — left as-is; verified no graph renders.
- **Shared shell** ([kpiCardParts.tsx](app/src/components/ui/kpiCardParts.tsx)): compact `min-h-[11.5rem]` shell, 2-line-clamped header, `KpiContextTile` (stacked label+value) and a new muted `KpiSourceLine`. Same title / value / date / delta / source typography across all card variants; equal grid heights via the existing `sm:auto-rows-fr`.
- **Detail charts untouched** ([KpiDetail.tsx](app/src/screens/KpiDetail.tsx)): the single-metric `TrendChart` and the per-metric multi-metric trend panels still render. `TrendChart` and `buildTrend` are retained for detail charts, delta and last-updated logic. `Sparkline` is kept as an exported utility (no longer used by any card).
- **i18n:** removed the now-unused single-card headline labels (`lblRate/lblCount/lblScore/lblValue`); kept `parentAvgLabel`.
- No change to KPI names, values, formulas, catalog metadata, delta/N+1/date/frequency logic, source labels, access control, routing, Compare, Export, GSQAC, or provider architecture.

**Files changed:** `components/ui/KpiCard.tsx`, `components/ui/MultiMetricKpiCard.tsx`, `components/ui/HeroKpiStrip.tsx`, `components/ui/kpiCardParts.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Confirmation:** grep for `Sparkline` shows it only in its own definition + the barrel re-export — no card renders it. `TrendChart` appears only in KPI detail. Cards are shorter and cleaner with no empty graph bands.

---

## Revert Assessment IA split — back to one KPI grid

Reverted the previous Operational-Indicator / Assessment-Outcomes split. The Assessment domain page is back to a **single `KPIs in Assessment` grid** where every indicator — including `SAT reports downloaded in classrooms` — renders through the normal `KpiCardAuto` path (single-metric → `KpiCard`, multi-metric → `MultiMetricKpiCard`).

- **Split logic removed** ([DomainView.tsx](app/src/screens/DomainView.tsx)): dropped the `operational` / `outcomes` partition, the `splitView` branch, the two `PageSection`s and the `OperationalKpiCard` import. The non-sub-domain branch is once again a single `PageSection` + `PageGrid cols="kpi"` over `ds.records`. No `Operational Indicator` / `Assessment Outcomes` labels remain.
- **Compact card removed**: `OperationalKpiCard.tsx` was created only for that experiment and is now unused, so it was deleted. `SAT reports downloaded in classrooms` keeps its normal single-metric card treatment — title, Daily badge, value, N+1, `as on <date>` (instead of delta), sparkline, chevron — all unchanged.
- **i18n cleanup**: removed the now-unused `domain.operationalIndicator` / `domain.assessmentOutcomes` keys (en + gu) to keep the `Dict` shape in sync.
- No change to KPI catalog, values, formulas, names, multi-metric SAT1/SAT2/ORF/CET/CGMS logic, delta/N+1/date/frequency logic, access control, routing, homepage, Export, Compare, Leaderboard, GSQAC, or provider architecture.

**Files changed:** `screens/DomainView.tsx`, `components/ui/OperationalKpiCard.tsx` (deleted), `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

---

## Assessment IA split — Operational Indicator vs Assessment Outcomes

Forcing the single-metric operational KPI into the same tall analytical card as the SAT1/SAT2/ORF/CET/CGMS outcome cards still read wrong. Fixed by **information architecture**, not more height tuning: the Assessment domain page now splits into two labelled sections, and the operational KPI gets a purpose-built compact card. Scoped to the Assessment domain page only — Attendance, Administration, School Quality, Export, Compare, Leaderboard and KPI detail are untouched.

- **Two sections** ([DomainView.tsx](app/src/screens/DomainView.tsx)): a domain with no sub-domains that carries **both** single-metric and multi-metric indicators now renders **`Operational Indicator`** (compact card stack) above **`Assessment Outcomes`** (the multi-metric grid). The split is config-driven by `kpi.metrics` (only Assessment has the mix today), so every other domain keeps its single uniform grid. No catalog/metadata change.
- **Compact operational card** ([OperationalKpiCard.tsx](app/src/components/ui/OperationalKpiCard.tsx), new): a slim full-width horizontal row for `SAT reports downloaded in classrooms` — left: title + `Daily` + `as on 9 Jun`; right: the value + N+1 (`Gujarat · 86%`), with a small sparkline between on wide screens. No footer tile grid, no blank middle, ~one-row height. Reuses the shared atoms (FrequencyBadge, ValueDisplay, NPlusOneLine, FrequencyDelta, Sparkline) so typography stays in the same family. Keeps value, N+1, and the as-on date.
- **Outcome cards unchanged**: SAT1/SAT2/ORF/CET/CGMS keep the analytical `MultiMetricKpiCard` (title, frequency/date, primary metric, N+1, delta, trend, secondary tiles) and stay equal-height within their grid.
- **i18n**: `domain.operationalIndicator` / `domain.assessmentOutcomes` (en + gu).

**Result:** the oversized sparse first card is gone; the operational health-check and the analytical outcomes are visually and conceptually separated, and the outcome grid aligns cleanly on its own.

**Files changed:** `components/ui/OperationalKpiCard.tsx` (new), `screens/DomainView.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Note:** I dropped the redundant outer "KPIs in Assessment" heading for the split view in favour of the two specific section headers (`Operational Indicator` / `Assessment Outcomes`), which reads cleaner than three stacked labels. Single-grid domains keep their "KPIs in {domain}" heading.

---

## KPI card shell + composition (single = multi card family)

The earlier equal-height pass stretched rows but left short cards sparse: `SAT reports downloaded in classrooms` had a big blank middle while SAT1/SAT2/ORF looked dense, so they read as different card types. This pass fixes the **internal composition** so every KPI card is the same component, not just the same height.

- **One canonical shell** ([kpiCardParts.tsx](app/src/components/ui/kpiCardParts.tsx), new): `KpiCardShell` (h-full, `min-h-[16.5rem]`, flex-col) → `KpiCardHeader` (title `line-clamp-2` with a reserved `min-h-[2.5rem]` so every header is the same height, + frequency·last-updated chip) → `KpiPrimary` (flex-1, centred, so modest content fills instead of leaving a gap) → `KpiFooter` (`mt-auto`, 2-up grid pinned to the bottom). Both card types now compose from these pieces, so header / primary / trend / footer rhythm and outer height are identical.
- **Single-metric cards fill the footer intelligently** ([KpiCard.tsx](app/src/components/ui/KpiCard.tsx)): rebuilt on the shell. Header has a headline metric label (Rate / Count / Score / Latest, by unit — matches the multi cards' sub-metric label rhythm without inventing data), the big value + delta or `as on <date>`, then the trend. The footer is **always two compact context tiles** drawn from already-available data: `Parent avg` (N+1), `Source`, falling back to `Updated`. No blank middle, no oversized first card.
- **`SAT reports downloaded in classrooms`** now reads: header `Daily`, primary `RATE / 76.5% / as on 9 Jun` + sparkline, footer `Parent avg · Gujarat · 86%` + `Source · Gyan Prabhav bot`. Same density and height as its neighbours; the date appears once (no header/primary/footer triplication).
- **Multi-metric cards** ([MultiMetricKpiCard.tsx](app/src/components/ui/MultiMetricKpiCard.tsx)): rebuilt on the same shell. Triple-metric (SAT1/SAT2/ORF) keep primary + 2 sub-metric tiles; **dual-metric (CET/CGMS)** fill the spare footer slot with a `Source` context tile so they're the same height as the triple cards (no obvious empty box, §4). Sub-metric tiles, N+1, deltas and micro-sparklines are unchanged.
- **Typography unified** (§8): title, chip, metric label (`uppercase 2xs muted`), primary value (`size lg`), N+1, delta and the primary sparkline (height 32 on every card) share one scale across single and multi cards.
- **Grid** ([PageSection.tsx](app/src/components/layout/PageSection.tsx)) keeps `sm:auto-rows-fr` as row-alignment support; the real fix is the card internals, so the target height is set by the dense SAT/ORF card, not the sparse single card.

**Files changed:** `components/ui/kpiCardParts.tsx` (new), `components/ui/KpiCard.tsx`, `components/ui/MultiMetricKpiCard.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Known tradeoffs:** (a) the footer holds sub-metric tiles on multi cards (which include micro-sparklines) vs text context tiles on single/dual cards, so triple-metric footers carry slightly more ink, but every card now has a filled 2-up footer of equal height with no blank gaps. (b) On a dual-metric card the metric tile is taller than the source context tile beside it, so the source tile top-aligns with a little space below; deliberate, and far less jarring than an empty box. (c) Single-metric primary shows N+1 in the footer rather than inline (multi shows it inline) to avoid duplicating it; both cards display N+1 exactly once.

---

## Equal-height KPI cards (layout consistency pass)

Multi-metric cards (SAT1/SAT2/ORF) were taller than dual-metric (CET/CGMS) and single-metric (SAT reports) cards, so the Assessment page looked uneven across rows. Made every KPI card in a grid row share one height, with balanced internal spacing. **Layout only — no KPI logic, values, formulas, deltas, N+1, graph data, provider, routing, access, Compare/Export, or GSQAC changes.**

- **Grid equalises rows** ([PageSection.tsx](app/src/components/layout/PageSection.tsx)): the `cols="kpi"` grid gained **`sm:auto-rows-fr`** (`grid-cols-1 sm:grid-cols-2 sm:auto-rows-fr xl:grid-cols-3`). From the 2-up breakpoint up, every row track is equal height so cards stretch to match the tallest in the row. Deliberately **omitted at the 1-col mobile breakpoint** so phone cards keep their natural full-width height (§1). Only the KPI grid is touched — the homepage `domain` grid and the sub-domain `two` grid are unchanged.
- **Shared sizing contract** — both card types now use `h-full flex flex-col` so they fill the row track:
  - [KpiCard.tsx](app/src/components/ui/KpiCard.tsx) (single-metric): header pinned top, **value + sparkline wrapped in a `flex-1` centred region**, N+1 pinned to the foot. A short card (e.g. "SAT reports downloaded") fills the shared height with balanced spacing instead of leaving blank white space — content stays centred, nothing clipped (§4).
  - [MultiMetricKpiCard.tsx](app/src/components/ui/MultiMetricKpiCard.tsx) (SAT1/SAT2/ORF/CET/CGMS): header top, **primary metric block in a `flex-1` region**, secondary compact tiles pinned to the foot. The secondary `grid-cols-2` keeps a **dual-metric card (one tile) the same height as a triple-metric card (two tiles)** — the empty cell reserves the slot (§3/§6).
- **Consistent card system everywhere** ([SubDomainView.tsx](app/src/screens/SubDomainView.tsx)): switched from `KpiCard` to the same `KpiCardAuto` selector used by DomainView, so Administration sub-domain cards share the identical sizing path (they're single-metric, so they render via KpiCard exactly as before, now with `h-full`).
- **Typography untouched** (§7): title/badge/primary-value/secondary-label/N+1/delta/sparkline sizes and the chevron position are all unchanged. No one-off large/small cards.

**Assessment page result:** SAT1 = SAT2, CET = CGMS, ORF and the single-metric SAT-reports card all align to the row height; cards in a row align vertically.

**Files changed:** `components/layout/PageSection.tsx`, `components/ui/KpiCard.tsx`, `components/ui/MultiMetricKpiCard.tsx`, `screens/SubDomainView.tsx`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Known visual tradeoff:** with uniform row heights, the shortest cards (single-metric "SAT reports", and dual-metric CET/CGMS vs triple-metric SAT/ORF) gain a little vertical breathing room above/below their content. This is intentional and balanced (centred value/sparkline, footer pinned) rather than top-bunched with blank space below. Mobile (1-col) keeps natural per-card heights, so no card looks padded on phones.

---

## Multi-metric indicator cards + sheet-driven last-updated labels

**Sheet version used:** `Docs/GJ _ Unified App KPIs.xlsx` (the re-uploaded `GJ _ Unified App KPIs(10).xlsx`, Sheet1, 28 indicators across Attendance / Assessment / Administration / School Quality). Re-parsed columns: `Indicator`, `Data Source`, `Formula/Logic`, `Delta`, `Visible to School (HM)/Teacher`, **`Show Last Updated on UI`**.

### 1 · School Quality eyebrow → `GSQAC Score`
[GsqacSummaryCard.tsx](app/src/components/ui/GsqacSummaryCard.tsx): the homepage School Quality card eyebrow changed from `OUTPUT · ANNUAL` to **`GSQAC Score`** (new i18n key `scorecard.gsqacScore`, en + gu). The header now reads **School Quality / GSQAC Score**. GSQAC score, grade, N+1, D1–D5, grade colours and routing are untouched.

### 2 · `SAT reports downloaded in classrooms` → `as on <date>` (no delta)
The sheet's Delta column is blank for this row, so it now shows **`as on 9 Jun`** (variable working date, never hardcoded) instead of `↘ 0.2 today`. Driven by a config flag `suppressDelta` on `asm_remediation` (not an ID check in the UI). Applied to: homepage Assessment domain card ([DomainSummaryCard.tsx](app/src/components/ui/DomainSummaryCard.tsx)), Assessment domain page card ([KpiCard.tsx](app/src/components/ui/KpiCard.tsx)), KPI detail header ([KpiDetail.tsx](app/src/screens/KpiDetail.tsx) — delta pill hidden, "As on 9 Jun" kept), and the Export indicator/summary delta cells ([Export.tsx](app/src/screens/Export.tsx)). Value + N+1 are preserved; value tone goes neutral (no hidden-delta colouring).

### 3 · `Show Last Updated on UI` column drives the date/month/year label
New shared helper [`getLastUpdatedLabel(kpi, date, lang)`](app/src/lib/trend.ts) maps cadence → label: **Daily → `9 Jun`** (working date) · **Monthly → `Jun 2026`** · **SAT1/SAT2 (scheduleNote) → `Sep 2025` / `Mar 2026`** · **Twice/Half-yearly → cycle month + year** · **Yearly/Annual → `2026`** · else → `Latest available`. The sheet flag `showLastUpdatedOnUi` (column H = Yes) gates whether the chip shows. Wired into `KpiCard`, `MultiMetricKpiCard`, and `KpiDetail` headers. No `Latest: 1 Jun` is shown anywhere (`kpi.latestOn` is unused).

### 4–7 · Multi-metric indicator cards (SAT1 / SAT2 + ORF / CET / CGMS)
Indicators whose Formula/Logic carries 2–3 metrics now render as a single **[MultiMetricKpiCard](app/src/components/ui/MultiMetricKpiCard.tsx)** instead of separate top-level cards:
- **Schema** ([types/index.ts](app/src/types/index.ts)): `KpiMetricDef { id, label, label_gu, unit, direction, formula }` + `KpiDef.metrics?`. Config-driven — `SAT1/SAT2` → `Avg score · Below hierarchy avg · Participation`; `ORF` → `CWPM score · Below hierarchy avg · Participation`; `CET/CGMS` → `Result · Participation`. Re-audited from the sheet (not hardcoded to SAT only).
- **Data** ([kpiCatalog.ts](app/src/config/kpiCatalog.ts) `METRIC_PUBLISHED`, [mockProvider.ts](app/src/data/provider/mockProvider.ts)): each sub-metric has its own per-level anchor under `<parentId>__<metricId>` and flows through the **existing** value/benchmark/trend/PM-Shri machinery. No values hardcoded in UI components (§9/§12). [score.ts `metricKpiDef`](app/src/engine/score.ts) synthesises a single-value KpiDef per metric; [engine `getKpiMetricRecords`](app/src/engine/index.ts) + [`useKpiMetrics`](app/src/hooks/index.ts) expose them.
- **Card layout**: title → `Yearly · Sep 2025` chip → a primary metric row (label · big value · N+1 · delta · one sparkline) → the secondary metrics in a compact 2-up grid (small type, own N+1, direction-aware delta, tiny micro-sparkline). Each metric shows **value + N+1 + delta + compact trend**; calm palette (status hue for the primary spark, muted slate for the micro-sparks) to avoid clutter/colour overload.
- **Lower-is-better** (§8): `Below hierarchy avg` uses `direction: "lower"`, so a fall reads **green** and a rise **red** (shared `deltaToneClass`). `Students absent 7+ days`, `Identified Dropout Students` keep their existing lower-is-better logic.

### 8–10 · KPI detail for multi-metric indicators
[KpiDetail.tsx](app/src/screens/KpiDetail.tsx): for SAT1/SAT2/ORF/CET/CGMS the page shows a **compact 3-up metric summary** at top, then **one trend chart per metric** (never a single chart that hides the others), then a clean **`How it's calculated`** breakdown listing each metric's plain-language formula (Avg % score / Below hierarchy avg / Participation). Frequency, source and last-updated stay visible. Single-metric detail pages are unchanged.

### KPI / domain name reconciliation (per the latest sheet)
- `att_chronic` → **Students absent from past 7+ days** · `att_report` → **Schools and Class Sections Submitting Attendance** · `vis_ict` → **Schools using ICT Labs (%)** · `vis_library` → **Schools using Library (%)**.
- GSQAC D1–D5 display names aligned to the canonical GSQAC model + sheet: **Learning & Teaching · School Administration · Co-curricular Activities · Resources & their Use · Participation in Scholarships** (catalog `sq_d*` + `GSQAC_DOMAINS`, en + gu). GSQAC scores, grade bands, D1–D5 *values* and colours unchanged.

**Files changed:** `types/index.ts`, `config/kpiCatalog.ts`, `lib/trend.ts`, `engine/score.ts`, `engine/index.ts`, `hooks/index.ts`, `components/ui/MultiMetricKpiCard.tsx` (new), `components/ui/KpiCard.tsx`, `components/ui/DomainSummaryCard.tsx`, `components/ui/GsqacSummaryCard.tsx`, `screens/KpiDetail.tsx`, `screens/DomainView.tsx`, `screens/Export.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Assumptions:** (a) `Show Last Updated on UI` (Yes/No) gates *whether* to show the label; the cadence/`scheduleNote` decides the *format*. (b) SAT/ORF/CET/CGMS sub-metric demo numbers are deterministic anchors (avg = parent value; below-hierarchy ~20–34%; participation ~84–95%) since the live data lake isn't wired — kept config-driven so swapping in real values is a data change. (c) `metrics` was applied to every Assessment indicator that clearly carries multiple formulas, not only SAT1/SAT2 (§6). No changes to access control, routing, PM-Shri, login, Compare selection, Export structure (only labels/date-context), GSQAC score/grade/D1–D5 logic, provider architecture, or the homepage top-indicator split.

---

## Sub-domain scores + sub-domain summary card removed

- **Sub-domain cards** ([DomainView.tsx](app/src/screens/DomainView.tsx)) — removed the aggregate score chip (e.g. 88% / 92% / 81% / 75%). Each sub-domain card now shows only the **name + "{n} Indicators"** + status dot + chevron (no progress bar, no score). Applies to every domain with sub-domains (Administration). Dropped the now-unused `valueToneClass`/`pct`/`cn` imports.
- **Sub-domain detail** ([SubDomainView.tsx](app/src/screens/SubDomainView.tsx)) — removed the large top summary card (domain eyebrow + sub-domain title + big `88.3%` value + long progress bar). The page now goes straight from the **← {Domain}** back link to the **INDICATORS** grid (ScreenContainer spacing, no large gap). Dropped the unused `ProgressBar`/`ValueDisplay` imports.
- **KPI indicator cards unchanged** — values, frequency/date badge, sparkline, N+1, delta all still render. Scoring logic (`buildDomainScore`/`subScores`) untouched (still used by homepage domain cards); only the visible sub-domain score/summary UI was removed.

**Files:** `DomainView.tsx`, `SubDomainView.tsx`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No KPI catalog/name/formula/value, homepage, top-indicator, access, routing, PM-Shri, Compare, Export, GSQAC, or provider changes.

---

## Daily KPI date → today's working date (weekend → previous Friday)

Replaced the trend-point "Latest: 1 Jun" date on Daily indicators with **today's working date**.

- **Helper** [`getWorkingDateLabel(date = new Date(), lang)`](app/src/lib/format.ts) (+ `getWorkingDate`): Mon–Fri → today; **Sat → previous Fri; Sun → previous Fri**. Returns a compact localised day + short month ("9 Jun" / "૯ જૂન", no year). Not hardcoded — derived from `new Date()` at render.
- **Daily KPI cards** ([KpiCard.tsx](app/src/components/ui/KpiCard.tsx)): badge row now reads **"🕐 Daily · 9 Jun"** (working date instead of the last daily trend point). Same muted style, same row, no height change. Non-daily cards unchanged.
- **Daily KPI detail** ([KpiDetail.tsx](app/src/screens/KpiDetail.tsx)): the "current value" label for daily cadence is now **"As on 9 Jun"** (`kpi.asOn`, en + gu) instead of "Latest: {date}". Non-daily detail labels (Current month/cycle/half-year/year) unchanged.
- Config-driven by `cadenceOf(kpi.frequency) === "daily"`, so it covers every Daily KPI (Students absent…, Teachers/Students present today, MDM, Schools submitting Attendance, SAT reports downloaded, Identified Dropout Students, …) without an ID list.
- Daily delta wording stays **"this day"** (unchanged). No `Latest:` / `Latest available` shown for Daily KPIs that have data.

**Files:** `lib/format.ts`, `KpiCard.tsx`, `KpiDetail.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No KPI value/formula/name/delta/graph or access/routing/PM-Shri/Compare/Export/GSQAC/provider changes.

---

## Daily KPI cards show the latest data date

[KpiCard.tsx](app/src/components/ui/KpiCard.tsx): Daily indicators now show the latest data date next to the frequency badge, e.g. **"🕐 Daily · 1 Jun"** (the `FrequencyBadge` already carries the clock icon + "Daily"; a muted `· {date}` is appended).

- **Date source:** the last point of the KPI's own daily trend (`buildTrend(rec, lang).points[last].x`, e.g. "1 Jun" / "૧ જૂન" — real mock trend data, localised digits). No hardcoded/faked date; when the KPI is NA (no trend) the card shows "Not tracked" as before, so no date is invented.
- **Scope:** only `cadenceOf(kpi.frequency) === "daily"` KPIs (Students absent from past 7+ days, Teachers/Students present today, MDM, Attendance submission, and any other Daily KPI). Non-daily cards are unchanged (SAT schedule note etc. untouched).
- **Style:** same muted `text-2xs text-neutral-400` as the frequency badge, on the same row — no new colour, no extra card height, grid alignment preserved. Daily deltas still read "this day".

**Files:** `KpiCard.tsx`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No KPI name/value/formula/delta/graph/access/routing/PM-Shri/Compare/Export/GSQAC/provider changes.

---

## Export scorecard redesign — date label + polished report

[Export.tsx](app/src/screens/Export.tsx) reworked into a cleaner government report card; nothing else (KPI/provider/other screens) touched.

- **Week → date.** Removed all `Week {n}` copy. Page subtitle and the report-card header now read **"Generated on 9 Jun 2026"** via new [`formatDate(new Date(), lang)`](app/src/lib/format.ts) (localised digits + short month, gu-aware). `CURRENT_PERIOD`/`periodNo` no longer used. `export.generatedOn` → "Generated on".
- **Header** realigned: real logo chip vertically centred with a bold entity title, muted `Level · Unified Portal · 4A` line, and the generated-date line; a small school-filter chip (All Schools / PM SHRI) on the right; divider below.
- **Domain summary** is now **four compact cards** (one per domain) with a domain-accent left border + tinted icon chip: domain name · homepage-indicator label · big value · `{Level} avg {x}` · right-aligned **`FrequencyDelta`** (frequency-correct, direction-aware colour). Replaces the plain summary table.
- **Indicator sections** get a tinted **accent section band** (domain colour + icon + a `{score} · {grade}` chip on the right). Columns: Indicator (+ inline freq) · Value · `{Level} avg` · Δ · Source. Numeric columns are `whitespace-nowrap` (no awkward wrapping); the Δ column renders the shared `FrequencyDelta` (icon + colour, lower-is-better KPIs flip green/red); source is light/compact and may wrap.
- **D1–D5** rendered as clean labelled cards (`D1 Teaching & Learning … 71%` + thin bar); the noisy **"GSQAC: x / y schools measured"** coverage line is **removed**.
- **Footer** browser-print instruction removed — now just `★ Home-page indicators` (`export.homeIndicators`).
- **Print CSS**: added `.print-avoid { break-inside: avoid }` (applied to summary cards, each domain section, D1–D5 block) and a transparent `::selection` in print to avoid highlight artifacts.

**Files:** `Export.tsx`, `lib/format.ts`, `index.css`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No KPI catalog/formula/provider/homepage/domain/detail/Compare/Leaderboard/login/access/PM-Shri changes.

---

## Dynamic login flow (no tabs; ID length decides the surface)

[Login.tsx](app/src/screens/Login.tsx) rebuilt: removed the Teacher/Principal | Officer tab toggle. The user enters **one User ID** first; the digit count reveals the right second field:
- **8 digits → Teacher / Principal** → 11-digit **School ID** field (helper "Teacher / Principal login requires your 11-digit School ID.").
- **2 / 4 / 6 / 10 digits → Officer** → 4-digit **PIN** field (helper "Officer login requires a 4-digit PIN.").
- **1 / 3 / 5 / 7 / 9 digits** → no second field; after blur a subtle helper "Enter a valid 2, 4, 6, 8, or 10 digit ID."

A small muted pill ("Teacher / Principal" or "Officer login") appears once the ID length is valid.

**Validation / inputs** (all `inputMode="numeric"` + `pattern="[0-9]*"`, paste sanitised to digits): User ID `maxLength 10` + `autoComplete="username"`; School ID `maxLength 11` + `autoComplete="off"`; PIN `maxLength 4` + `autoComplete="current-password"` + masked (`type=password`). **Continue is disabled** until lengths are exact (8+11 for TP, {2/4/6/10}+4 for officer). **Reset:** changing the first ID across the TP↔officer boundary clears the second field (and an invalid length hides it).

**Auth preserved:** still calls `dataProvider.resolveLoginById(id, second)`; role comes from the seed, and the seed role must agree with the length-implied surface. Verify step + session routing unchanged.

**Seed compatibility (per §9):** the new product rule is Teacher/Principal **8-digit** ID. The committed seed had 10-digit teacher/principal IDs (collided with the new "10 = cluster officer"), so [appUsers.json](app/src/data/seed/appUsers.json) + [meta.json](app/src/data/seed/meta.json) teacher/principal `login_id`s were shortened to 8 digits (`"24" + last 6`, e.g. 2400000001 → 24000001; principal 2400000002 → 24000002). CRC stays 10-digit (cluster), BRC 6, DEO 4, State 2 (+ PIN). Demo logins updated and still work: 24000001/School 24010100101 (teacher), 24/0000 (state), 2401/3456 (deo), 240101/2345 (brc), 2401010005/1234 (crc).

**Copy:** `login.invalid` → "Could not find a matching user. Check the ID and credential." New i18n keys `errIdLen`/`officerLogin`/`helpSchool`/`helpPin` (en + gu).

**Known follow-ups (not run / not build-blocking):** the Playwright helpers (`scripts/verify.mjs`, `verify-access.mjs`, `roles-smoke.mjs`) still drive the old tab flow + 10-digit teacher ID `2400000001` and will need updating to the tab-less flow (User ID → School ID/PIN, 8-digit teacher `24000001`). The seed **generator** (`scripts/generateSeed.*`) still derives 10-digit teacher IDs from `entities.json`; re-running `npm run seed` would regenerate 10-digit IDs — the generator needs the same 8-digit rule before it's next run. Runtime/app uses the committed JSON (already 8-digit), so this doesn't affect the build or the running app.

**Files:** `Login.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `data/seed/appUsers.json`, `data/seed/meta.json`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No post-login routing / access-control / role-scope / dashboard / KPI / PM-Shri / provider changes.

---

## Homepage School Quality card → domain-card delta style

[GsqacSummaryCard](app/src/components/ui/GsqacSummaryCard.tsx) (homepage School Quality / GSQAC card) now matches the regular domain cards:
- **Removed the coverage line** ("GSQAC: x / y schools measured") — the `coverage` prop was dropped from the component and the `gsqacCoverage` derivation removed from [ScorecardHome](app/src/screens/ScorecardHome.tsx). (The coverage data/helper is untouched and still used in the Export GSQAC detail section.)
- **Replaced "vs last cycle: +1.4%"** with the shared right-side **`FrequencyDelta`** on the score row — same icon/size/weight/colour as Attendance/Assessment/Administration cards. GSQAC is annual, so it reads **"↗ 1.4 this year"** (cadence `yearly`); positive = green, negative = red.
- Score, official grade badge, and the N+1 line (`{parent} · {score}`, hidden at State) are unchanged. GSQAC score/grade/colour/D1–D5/detail-page/route logic untouched.

Final homepage card: title · OUTPUT · ANNUAL · score · grade badge · N+1 · "↗ 1.4 this year" — no coverage line, no "vs last cycle".

**Files:** `GsqacSummaryCard.tsx`, `ScorecardHome.tsx`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No KPI catalog / formula / grade-colour / access / routing / PM-Shri / Export-structure changes.

---

## 3A re-audit vs latest sheet (`GJ _ Unified App KPIs(8).xlsx`) — GSQAC untouched

Re-parsed the latest sheet (re-uploaded over `GJ _ Unified App KPIs.xlsx`, modified today). It added a **Delta** column and shifted columns; only **Attendance / Assessment / Administration** were updated. **School Quality / GSQAC (sq_*, D1–D5, grade colours, GsqacSummaryCard) was not touched.**

**Names + data sources + frequency (catalog [kpiCatalog.ts](app/src/config/kpiCatalog.ts), all per sheet):**
- Attendance (src "Attendance bot", Daily): Students absent from past 7+ consecutive days (HP) · Teachers present today · Students present today · Students consuming Mid-day Meal (MDM) · Schools submitting Attendance.
- Assessment: SAT reports downloaded in classrooms (HP, src "Gyan Prabhav bot", **now Daily**) · Semester Assessment Test 1 (SAT1) · SAT2 (src "Xamta bot", **Yearly**) · **FLN - Oral Reading Fluency** (src "Oral Reading Fluency (ORF) Bot", Monthly) · **Common Entrance Test (CET)** (Yearly) · **Chief Minister Gyan Sadhna Merit Scholarship (CGMS)** (Yearly). The old ORF/CET/CGMS participation+improvement pairs were **collapsed to one each** (ids `asm_orf`/`asm_cet`/`asm_cgms`); `asm_below` ("Students below avg") and `Assessment result %` are **removed** (not in sheet).
- Administration (sub-domains now School Observation · **Classroom Observation** (new) · Student Retention · CPD): renamed all to sheet wording — No of CRC/URC Visits per school (HP), School observations completed by CRC/URC, ICT Lab Usage in Schools, Library/Urinals & Toilets/Handwash/Drinking Water/SMC, Schools Visited for Classroom Observation, Classrooms following monthly lesson plans, Classrooms with Completed Teacher Diaries, **Identified Dropout Students**, Re-enrolment of Out-of-School Students, **Average CPD Time Per Teacher**, Teachers Achieving the 50-Hour CPD Target. Sources updated to SMA / CTS + EWS / PLC.

**Source labels** shortened to sheet values everywhere (catalog `data_source` → KPI-detail badge / Export tables): "Attendance Monitoring System (Attendance Bot)" → "Attendance bot", "Student Monitoring App (SMA)…" → "SMA", etc.

**Score / value vs delta** — main value is the actual score (`%`, count, `score` for ORF CWPM, `hours` for avg CPD). No KPI uses `delta_cycle` any more (the improvement KPIs were collapsed), so no formula/delta text leaks into the value.

**Delta + main-value colour now follow movement direction** (`ValueDisplay` gained an optional `toneClass`; cards derive it from `deltaToneClass(trend.delta, kpi.direction)`): up = green, down = red, **flat = neutral**, with the lower-is-better exception applied automatically by `kpi.direction` (so **Students absent from past 7+ consecutive days** and **Identified Dropout Students** show green when falling, red when rising). Applied consistently to KpiCard, DomainSummaryCard (home + page), KpiDetail summary, and the Top-Indicators strip. **GSQAC values keep their grade/status tone** (skipped via `sq_*` guard).

**Frequency wording** stays sheet-driven: Daily → "today", Monthly → "this month", Yearly → "this year", Half-yearly → "this half-year". No "this week"/"Weekly" on any KPI.

**SAT1/SAT2** — now annual (`Yearly`), `noTrend` removed → they show the trend graph + delta + N+1 + frequency badge like other cards, with a schedule note (**SAT1 "September", SAT2 "March"**, via new `KpiDef.scheduleNote`, rendered on KpiCard + KpiDetail).

**Absentee KPI** unchanged in logic — `Students absent from past 7+ consecutive days` stays an absolute count (no per-school average), Daily → "today", down = green.

**Mock data** ([kpiCatalog.ts] `PUBLISHED`): removed `asm_below`/improve rows; `asm_orf` set to CWPM-range scores (~44–53); `cpd_hours` → avg hours (~38–46); `ret_dropout` → growing absolute dropout count (school 6 → state 1400). Provider is catalog-driven, so the renamed/collapsed KPIs flow to Domain/KPI-detail/Compare/Leaderboard/Export automatically.

**Assumptions:** SAT/ORF/CET/CGMS treated as snapshot result values (`snapshot_latest`) with a YoY delta; no real assessment date in mock, so SAT shows the month schedule note + yearly trend; `MID-day MDM` formula kept as "Total eligible Students" (prior explicit user override) though the sheet says "Total Students"; ORF unit set to `score` (CWPM), CPD-time unit set to `hours`; "Classroom Observation" added as a 4th Administration sub-domain per the sheet's Domain column.

**Files:** `kpiCatalog.ts`, `frameworks.ts`, `types/index.ts`, `ValueDisplay.tsx`, `KpiCard.tsx`, `DomainSummaryCard.tsx`, `HeroKpiStrip.tsx`, `KpiDetail.tsx`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No GSQAC/access/routing/PM-Shri/Compare-selection/Export-structure/provider changes.

---

## Frequency wording: Daily → "today", Half-yearly → "this half-year"

The per-KPI delta/context wording is i18n-driven through one path — `FrequencyDelta` → `periodLabelKey(cadence)` → `kpi.p*` — used by every card/detail (KpiCard, DomainSummaryCard, HeroKpiStrip, KpiDetail). Fixing the two off words there propagates everywhere:

- `kpi.pWeek` (Daily) "this week" → **"today"** (gu "આ દિવસે")
- `kpi.pTime` (Half-yearly) "this time" → **"this half-year"** (gu "આ અર્ધવર્ષ")
- unchanged (already correct): Monthly → "this month", Twice-a-year → "this cycle", Yearly → "this year".

So every Daily KPI (Teacher/Student Attendance, MDM served %, Students absent from past 7+ consecutive days, Attendance reporting compliance %) now reads e.g. "Latest: 1 Jun" + "↗ +3.4% **today**"; SAT-reports (Monthly) → "this month"; dropout/re-enrolment (Half-yearly) → "this half-year"; SAT1/SAT2 (Twice-a-year, snapshot) → "this cycle"; GSQAC (Yearly) → "this year". Date context for Daily details unchanged ("Latest: {date}"). Frequency badges already drive off the catalog `frequency` (no "Weekly" KPI exists, so no Weekly badge renders); the dead `Weekly` i18n key is unused. Doc comment in [FrequencyDelta.tsx](app/src/components/ui/FrequencyDelta.tsx) updated.

**Assumption / out of scope:** the Leaderboard "Top movers this week" and the school-risk-table "this week" are composite **week-over-week** movements (the scorecard periods are weekly), not a single daily KPI's frequency — left as-is (correct for the weekly comparison; not a per-KPI frequency label). Legacy unused strings (`scorecard.whatChanged`, `kpi.deltaWeek`, `kpi.weeklyTrend`, `ogm.thisWeek`) are not rendered anywhere and were left untouched.

**Files:** `i18n/en.ts`, `i18n/gu.ts`, `FrequencyDelta.tsx`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No catalog/formula/id/access/routing/Compare/Export/provider changes.

---

## Domain pages: top summary card removed · KPI charts: average line removed

1. **Domain-page top summary card removed** — [DomainView.tsx](app/src/screens/DomainView.tsx) no longer renders the `DomainSummaryCard` (`variant="page"`) / `GsqacSummaryCard` header on any domain page (Attendance, Assessment, Administration, School Quality). The back link is now followed directly by the indicator section (`KPIS IN …`, or Administration's sub-domain cards). Removed the now-unused scaffolding (`useScopeStats`, `domainWoW`, `hero`/`parentPercent`/`gsqacCoverage`, the `sq_gsqac` filter) — so the School Quality page now shows **GSQAC score** as a normal indicator card too (no separate hero card). `DomainSummaryCard`/`GsqacSummaryCard` are untouched and still used by the **homepage** only.
2. **Average/reference line removed from KPI charts** — [TrendChart.tsx](app/src/components/ui/TrendChart.tsx) dropped the dashed benchmark `ReferenceLine` and its `Avg {n}` / `સરેરાશ` label (and the `benchmark` prop + `ReferenceLine` import; the Y-axis now fits the trend data only). [KpiDetail.tsx](app/src/screens/KpiDetail.tsx) no longer passes `benchmark`. The trend line/area, axes, dots and tooltip remain. (The Compare `ComparisonBars` has no average line; the underlying `benchmark` value still feeds RAG status only — not a chart overlay.)

**Files:** `DomainView.tsx`, `TrendChart.tsx`, `KpiDetail.tsx`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No changes to KPI catalog/formulas/ids, access control, routing, PM-Shri, Compare, Export, or provider architecture.

---

## Assessment: SAT1/SAT2 replace "Assessment result %" (snapshot, no trend)

Per the latest `GJ _ Unified App KPIs.xlsx` (Assessment focus area), "Assessment result %" is gone; the sheet defines two SAT result indicators.

- **Removed** `asm_result` ("Assessment result %") from the catalog (`PUBLISHED` + KPI def). It was only referenced in the catalog (provider is config-driven), so it disappears from Domain/KPI-detail/Compare/Leaderboard/Export automatically.
- **Added** [kpiCatalog.ts](app/src/config/kpiCatalog.ts):
  - `asm_sat1` — **"Semester Assessment Test 1 (SAT1)"** (gu "સેમેસ્ટર મૂલ્યાંકન કસોટી 1 (SAT1)")
  - `asm_sat2` — **"Semester Assessment Test 2 (SAT2)"** (gu "સેમેસ્ટર મૂલ્યાંકન કસોટી 2 (SAT2)")
  - Sheet metadata: domain Assessment, data source **Xamta Bot**, DL yes, PM-Shri yes, **visible to teacher** (no `roleVisibility`), direction higher, unit %, `frequency: "Twice a Year"`, `displayStrategy: "snapshot_latest"`. `PUBLISHED` result-% values added per level (SAT1 72→83, SAT2 74→84) so all hierarchy levels resolve.
- **No graph for SAT1/SAT2** — new `KpiDef.noTrend` flag. [KpiCard](app/src/components/ui/KpiCard.tsx) skips the sparkline and shows a cycle context line ("Current cycle") instead; [KpiDetail](app/src/screens/KpiDetail.tsx) renders no trend chart (and no EmptyNA), keeping the snapshot summary (value + N+1 + cycle label + formula/source/frequency). The KPI-detail summary label already reads "Current cycle" (cadence = twice). New `snapshotContextKey` helper in [trend.ts](app/src/lib/trend.ts).
- **Domain page order** (Assessment): SAT1 · SAT2 · Students below `<hierarchy>` avg · ORF participation/improvement · CET participation/improvement · CGMS participation/improvement · SAT reports downloaded in classrooms — matches the sheet/task order (asm_result replaced in-place, so SAT1/SAT2 lead).
- **Homepage Assessment card** unchanged — still "SAT reports downloaded in classrooms" (the sheet's Home-Page indicator); SAT1/SAT2 are normal indicators (`hero:false`).
- **Compare/Export/Leaderboard** inherit the catalog: SAT1/SAT2 appear as separate rows/cards, no "Assessment result %", and (being `noTrend`) no sparkline.

**Assumptions** (documented): SAT date isn't in the mock, so the context line shows the cycle ("Current cycle") rather than a literal date; frequency set to "Twice a Year" (the sheet's free-text "SAT1 to SAT1 …" describes a per-cycle YoY comparison); value shown as the SAT result % snapshot (no fabricated previous-cycle delta). Gujarati labels translated (not English fallback).

**Files:** `types/index.ts` (`noTrend`), `kpiCatalog.ts`, `trend.ts`, `KpiCard.tsx`, `KpiDetail.tsx`, `QA_REPORT.md`. **Build:** `npm run build` passes clean.

---

## Absentee KPI = absolute count · hierarchy bar chart removed from KPI detail

1. **Rename** — `att_chronic` → **"Students absent from past 7+ consecutive days"** (en + gu) in [kpiCatalog.ts](app/src/config/kpiCatalog.ts); same id/direction (lower-is-better). Flows everywhere via `kpi.name`; the dead `principal.chronicAbs` legacy string updated too. No old variants remain (grep-clean).
2. **Absolute-count semantics** — the value is already anchored to the published per-level **count** (`PUBLISHED.att_chronic` = section 4 → school 18 → cluster 62 → block 215 → district 790 → state 4100), shown via `formatValue(count)` — never a percentage or per-school average.
3. **N+1 = absolute parent count** — KPI-detail N+1 now uses `peerAvg(att_chronic, level)` (the published parent-level count, e.g. cluster scope → "Lakhapat · 215"), matching the cards. Compare (`cmpVal`) now **exempts `att_chronic`** from the `schoolsImplied` per-school normalization (deliberate exception); all other count KPIs unchanged.
4. **"How it's calculated"** — updated to absolute-count prose: *"Counts unique students absent for 7 or more consecutive school days as of the selected/latest date. ."* Description no longer mentions "rate"/"average per school".
5. **Hierarchy comparison bar chart removed from ALL KPI detail pages** — deleted the "How {KPI} compares up the hierarchy" `ComparisonBars` card + the "Shown as average per school" subtitle from [KpiDetail.tsx](app/src/screens/KpiDetail.tsx) (cascade is still read only for the parent N+1 name). N+1 remains in the summary card + KPI cards only. `ComparisonBars` itself is untouched and still used by the Compare screen.
6. **Trend charts kept** — the frequency-aware time-trend chart (30-day / monthly / half-yearly / yearly) is unchanged.

**Files:** `kpiCatalog.ts`, `KpiDetail.tsx`, `CascadeComparison.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No changes to access control, routing, PM-Shri, Compare selection, Export structure, provider, or non-absentee formulas.

---

## KPI display cleanup — absentee rename · detail labels · domain top cards · freq badges

1. **Absentee rename** — `att_chronic` name "Students absent from 7+ days" → **"Students absent since last 7+ consecutive days"** (en + gu) in [kpiCatalog.ts](app/src/config/kpiCatalog.ts). Same id/formula/direction (lower-is-better). Flows to home/domain/top-indicators/detail/Compare/Leaderboard/Export via `kpi.name` (no hardcoded copies remain — grep-clean).
2. **`CURRENT VALUE` removed from KPI detail** — [KpiDetail.tsx](app/src/screens/KpiDetail.tsx) now derives a frequency-aware label from the indicator's cadence: Daily → **"Latest: {date}"** (last trend point, or "Latest available" if none) · Monthly → "Current month" · Twice-a-Year → "Current cycle" · Half-yearly → "Current half-year" · Yearly → "Current year". New `kpi.*` i18n keys (en + gu). (Export keeps "Current value" as a table **column header** — not a detail page.)
3. **Lowest-level text removed** — dropped the visible `Lowest level: {level}` line from KPI detail; `kpi.lowestLevel` applicability logic untouched (only the UI render removed).
4. **Domain page top card = homepage indicator** — [DomainSummaryCard](app/src/components/ui/DomainSummaryCard.tsx) `page` variant now uses the same hero-indicator logic as `home` (value/unit/delta/N+1 + indicator label under the domain name); [DomainView](app/src/screens/DomainView.tsx) passes `heroRec` (= `ds.records.find(r => r.kpi.hero)`). Attendance → Students absent since last 7+ consecutive days · Assessment → SAT reports downloaded in classrooms · Administration → No of CRC/URC Visits per school · School Quality → GSQAC score (`GsqacSummaryCard`). No more generic domain aggregate as the top-card primary value (aggregate fallback only where the hero is role-hidden, e.g. teacher).
5. **Frequency badge on KPI cards** — [KpiCard.tsx](app/src/components/ui/KpiCard.tsx) now renders a `FrequencyBadge` (driven by `kpi.frequency` from the sheet) under the indicator name. Verified catalog frequencies vs the sheet: Attendance = Daily, SAT reports + CRC visits + observations = Monthly, dropout + re-enrolment = Half-yearly, GSQAC + ORF/CET/CGMS + CPD = Yearly, Assessment result = Twice-a-Year — all already correct.
6. **30-day trend avg line** — left as the existing subtle dashed reference (already low-emphasis); not made more prominent.

**Files:** `kpiCatalog.ts`, `DomainSummaryCard.tsx`, `DomainView.tsx`, `KpiDetail.tsx`, `KpiCard.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. Formulas/ids/access/PM-Shri/routing/provider unchanged.

---

## Export logo + nav reorder

- **Export header logo** — replaced the blue circular `VSK` text badge in [Export.tsx](app/src/screens/Export.tsx) with the real app logo (`/logo-vsk.png`, the same asset `VskBadge` uses top-left), in a compact white/ring container (`h-9 w-9`, `object-contain`, no stretch/crop, transparency preserved).
- **Sidebar / bottom-nav order** — reordered the single `NAV` array in [AppShell.tsx](app/src/components/layout/AppShell.tsx) (powers desktop sidebar + mobile bottom nav) to **Scorecard → Leaderboard → Compare → Export**. Routes/keys/active-state logic unchanged.

**Build:** `npm run build` passes clean.

---

## Homepage duplication fix — split domain-card vs Top Indicators

The homepage repeated the same indicators in the Domain cards **and** the bottom Key Indicators strip (both driven by `kpi.hero`). Split the two concerns with a new config flag.

- **`hero`** = the domain's "Home Page Indicator for any hierarchy" → drives the **domain card** primary value (unchanged): Students absent from 7+ days · SAT reports downloaded in classrooms · No of CRC/URC Visits per school · GSQAC score.
- **`topIndicator`** (new optional `KpiDef` flag) = top intervention indicators → drives the bottom strip, now relabelled **"Top Indicators"**. Set `topIndicator: true` on `ret_dropout` (Reduction in dropout %) and `ret_reenroll` (Re-enrolment of OoSC… against target %) only.
- [HeroKpiStrip](app/src/components/ui/HeroKpiStrip.tsx) now filters `r.kpi.topIndicator` (was `r.kpi.hero`) and uses the new `ogm.topIndicators` label — so the bottom section no longer repeats the four domain-card indicators.

Catalog flags now: **4 `hero` + 2 `topIndicator`** (Teacher% completing 50 hours has neither → absent from the strip, as required). Config-driven: changing the strip later needs only catalog flags, no UI edits. Direction-aware colour preserved (both Top Indicators are higher-is-better). Domain cards, School Quality card, Compare and Export unchanged (Export has no bottom Key-Indicators strip).

**Files:** `types/index.ts` (`topIndicator?`), `kpiCatalog.ts` (flags on dropout + re-enrolment), `HeroKpiStrip.tsx` (filter + label), `i18n/en.ts` + `gu.ts` (`ogm.topIndicators`), `ScorecardHome.tsx` (comment). **Build:** `npm run build` passes clean.

---

## Latest KPI sheet re-audit (now has explicit "Home Page Indicator" column)

Re-parsed the **latest** `GJ _ Unified App KPIs.xlsx` from scratch (treated as source of truth). New structure vs the version the prior pass saw:
- New columns: **Focus Area** (col A) = app *domain*; **Home Page Indicator for any hierarchy** (col B) = the explicit homepage/hero indicator per focus area; **Domain** (col C) = app *sub-domain*.
- The "Home Page Indicator" cells are green-filled and list exactly one per focus area.

**Home Page Indicator column (authoritative homepage + hero mapping):**
Attendance → Students absent from 7+ days · Assessment → SAT reports downloaded in classrooms · Administration → No of CRC/URC Visits per school · School Quality → GSQAC score.

**Reconciliation result — the previous pass's 4-hero mapping is confirmed correct by the new explicit column.** (The green fills in the *Indicator* column on Reduction-in-dropout / Re-enrolment / Teacher%-50h are NOT in the Home-Page-Indicator column, so they stay non-hero per the column's authority.)

**Mismatches found & fixed:**
- `att_teacher` name **"Teacher attendance %" → "Teacher Attendance"** (sheet drops the %); `name_gu` "શિક્ષક હાજરી %" → "શિક્ષક હાજરી".
- `att_student` name **"Student attendance %" → "Student Attendance"**; `name_gu` → "વિદ્યાર્થી હાજરી".
- Administration sub-domain labels aligned to the sheet's *Domain* column: `adm_visits` **"Visits & Observations" → "School Observation"** (gu "શાળા નિરીક્ષણ"); `adm_retention` **"Retention" → "Student Retention"** (gu "વિદ્યાર્થી જાળવણી"). (`adm_cpd` kept the correctly-spelled "Continuous Professional Development".)

**Already correct (verified against the latest sheet, no change):**
- Hero/homepage indicators (4, one per domain) — `hero: true` only on att_chronic, asm_remediation, vis_crc_count, sq_gsqac; homepage domain-card value = that hero indicator (config-driven via `kpi.hero`, no hardcoded domain→id map).
- All other indicator display names (Students absent from 7+ days, SAT reports downloaded in classrooms, Assessment result %, Students below <hierarchy> avg, ORF/CET/CGMS participation+improvement, all School-Observation indicators, Reduction in dropout %, Re-enrolment of OoSC…, CPD hours, Teacher% completing 50 hours, GSQAC score).
- GSQAC D1–D5 labels (Teaching & Learning · School Management · Co-curricular activities · Use of Resources · Exam Participation) — match the sheet's School-Quality *Domain* rows; en + gu.
- Teacher visibility — every row's "Visible to teacher" matches current `roleVisibility` (Teacher Attendance, CET/CGMS, all School-Observation rows, GSQAC = hidden; rest visible). No change.
- Frequency (Daily / Twice-a-Year / Yearly / Monthly / Half-yearly), direction (Students-absent = lower-is-better; rest higher), domain mapping, PM-Shri applicability — all consistent.

**Hero indicators before → after:** unchanged (Students absent from 7+ days · SAT reports downloaded in classrooms · No of CRC/URC Visits per school · GSQAC score). Teacher% completing 50 hours stays non-hero (normal Administration · CPD indicator, teacher-visible).

**Export / Compare** read names from the catalog, so the two renamed attendance indicators flow through automatically; export's domain summary still headlines each focus area's home-page indicator.

**Files changed:** `kpiCatalog.ts` (att_teacher/att_student names), `frameworks.ts` (adm_visits/adm_retention sub-domain labels), `QA_REPORT.md`. **Build:** `npm run build` passes clean. **KPI sheet:** latest `GJ _ Unified App KPIs.xlsx` (with Focus Area + Home Page Indicator columns). **Remaining assumptions:** CRC/URC Visits is the Administration home-page indicator (no sub-domain in the sheet) but is kept inside the School-Observation sub-domain for the drill-down so it isn't an orphan; "Continous Professional Development (CPD)" kept as the correctly-spelled "Continuous Professional Development".

---

## KPI sheet re-alignment · homepage hero = sheet's Home-Page indicator (one per domain)

Re-parsed `GJ _ Unified App KPIs.xlsx` (now source of truth). The sheet has no "Home Page Indicator" column — the note *"Green coloured are Hero KPIs"* marks heroes by green Indicator-cell fill. Per the task this is narrowed to exactly one homepage/hero indicator per domain (the green cells also flag dropout/re-enrolment/Teacher%-50h, which the task explicitly demotes to normal).

**Hero indicators are now exactly four** (config-driven via `kpi.hero`, never a hardcoded list — [kpiCatalog.ts](app/src/config/kpiCatalog.ts) `HERO_KPIS = VSK_KPIS.filter(k => k.hero)`):
- Attendance → **Students absent from 7+ days** (`att_chronic`)
- Assessment → **SAT reports downloaded in classrooms** (`asm_remediation`)
- Administration → **No of CRC/URC Visits per school** (`vis_crc_count`)
- School Quality → **GSQAC score** (`sq_gsqac`)

`hero` removed from `cpd_50` (Teacher% completing 50 hours), `ret_dropout`, `ret_reenroll` — they stay as normal Administration indicators (verified: only 4 `hero: true` remain). `Teacher% completing 50 hours` keeps `visibleToTeacher` (no `roleVisibility`).

**Indicator renames (catalog `name`/`name_gu`):** `att_chronic` "Chronic absentee students…" → **"Students absent from 7+ days"**; `asm_remediation` → **"SAT reports downloaded in classrooms"**; `cpd_50` → **"Teacher% completing 50 hours"**; GSQAC D1–D5 → **Teaching & Learning · School Management · Co-curricular activities · Use of Resources · Exam Participation** (both `sq_d*` KPIs and `GSQAC_DOMAINS`). All other names already matched the sheet. Gujarati names updated alongside.

**Homepage domain card value = the domain's hero indicator** (not the weighted aggregate). [DomainSummaryCard](app/src/components/ui/DomainSummaryCard.tsx) `home` variant now takes a `heroRec` and renders that indicator's value (unit-aware), frequency-aware delta and N+1, with the indicator label under the domain name; [ScorecardHome](app/src/screens/ScorecardHome.tsx) passes `d.records.find(r => r.kpi.hero)` per input domain. School Quality keeps `GsqacSummaryCard` (score + grade + N+1 + vs-last-cycle). Falls back to the aggregate where a domain's hero is role-hidden (e.g. CRC visits for a teacher).

**Export** domain summary now headlines each domain's hero indicator (name + value + N+1 + Δ; School Quality shows score · grade · vs-last-cycle) instead of the aggregate — [Export.tsx](app/src/screens/Export.tsx). Per-indicator detail tables + GSQAC D1–D5 detail unchanged.

**Role visibility** confirmed against the sheet's "Visible to teacher" column — current `roleVisibility` already matches exactly (Teacher Attendance, CET/CGMS, all visits/observations, GSQAC = NON_TEACHER; the rest visible). No changes needed; access logic untouched.

**Direction-aware colours** preserved: `att_chronic` is `direction: "lower"` so a rising count is red and a falling count green (via `ValueDisplay`/`FrequencyDelta`); all rate heroes higher-is-better. Names flow automatically into Domain/Sub-domain/KPI-detail/Compare/Leaderboard/Export since those read `kpi.name`/`name_gu`. (Legacy `principal.*`/`teacher.*` i18n strings are unused/unrendered — left as-is.)

**Build** — `npm run build` (tsc + vite) passes clean. Playwright not run (per instructions).

**Manual checks (code-level):** 4 `hero: true` in catalog (one per domain); homepage domain cards driven by hero record; hero strip shows the 4; `Teacher% completing 50 hours` not a hero, still present in Administration; renamed labels match sheet; Export uses hero-indicator summary; Compare/Export pull names from the catalog. **Known risks:** count-hero N+1 shows the parent's raw count (naturally larger); domain-card value is now an indicator (not the aggregate %) by design — the aggregate still drives the domain *page* header and Export detail.

---

## Overall-score removal · domain/GSQAC card parity · Export reframe · Compare selection

Five focused product/UI fixes, all composing the existing shared components (no new product features, no formula/provider/access changes).

**1. Overall Score / Input Composite hero removed everywhere.** Deleted the circular ring + grade badge + 30-day trend hero from [ScorecardHome](app/src/screens/ScorecardHome.tsx) and the ring/grade block from [Export](app/src/screens/Export.tsx). No screen references `RatingRing`/`overallPercent`/`inputComposite` any more (grep-clean). The homepage now opens straight on Domain cards → School Quality → Key indicators. (The "Key indicators" `HeroKpiStrip` is actionable KPI content and stays.)

**2. Domain page top = homepage domain-card grammar.** [DomainSummaryCard](app/src/components/ui/DomainSummaryCard.tsx) gained a `variant: 'home' | 'page'`. [DomainView](app/src/screens/DomainView.tsx) replaced the banner/long-progress header with the expanded `page` variant (icon chip + name + scope name + value + N+1 + frequency delta + compact progress). School Quality pages use the `GsqacSummaryCard` instead, and the D1–D5 indicator cards render below (the `sq_gsqac` overall tile is filtered out to avoid duplication).

**3. School Quality homepage card fixed.** [GsqacSummaryCard](app/src/components/ui/GsqacSummaryCard.tsx) is now compact and in the domain-card rhythm (white card + subtle pink accent chip): title · `OUTPUT · ANNUAL` · GSQAC score · official grade badge · **N+1 line** (`Kachchh · 64%`) · `vs last cycle: +1.4%` · coverage · chevron. **The 5 GSQAC domain bars were removed from the homepage** — they live on the School Quality detail page (as the D1–D5 indicator cards). No daily trend; grade uses official colours via `RatingBadge`/`GRADE_GROUP`.

**4. Export reframed.** Removed the Input-Composite ring, grade hero, weightage/contribution columns and the "Input composite" total row. Domain summary is now **Domain · Value · {parent} avg (N+1) · Δ** across the 4A inputs + School Quality (output shows score · grade · vs-last-cycle). Header shows entity · level · framework · period · PM-Shri (if active). GSQAC D1–D5 bars kept under a dedicated "School Quality · D1–D5" detail section. Tables use the shared `ResponsiveDataTable`.

**5. Compare selection fixed.** [CascadeComparison](app/src/screens/CascadeComparison.tsx): **Unit 1 is fixed to the user's own scope** (primary chip); Units 2–4 start empty with `Select a unit` placeholders. Selecting a unit **removes it from the other dropdowns** (no duplicates); a `Clear` row frees it again. Comparison bars render **only for selected units**; with just Unit 1 an empty state shows *"Select another unit to compare KPIs."* Access rules unchanged (pool = same-level peers + one-level-below subtree only; comparison units non-navigable).

**Files touched** — components: `DomainSummaryCard`, `GsqacSummaryCard`; screens: `ScorecardHome`, `DomainView`, `Export`, `CascadeComparison`; i18n: `en.ts` + `gu.ts` (`compare.selectAnother`). `RatingRing` is now unused (left in place, tree-shaken).

**Build** — `npm run build` (tsc + vite) passes clean.

**Manual checks** (code-level; Playwright not run per instructions): overall-score hero gone from all screens (grep-verified); homepage School Quality card has no 5 bars and shows N+1 + vs-last-cycle; Domain page top uses the shared card; Export has no Input-Composite ring/columns and follows the 4A + School Quality structure; Compare defaults to Unit 1 only, blocks duplicates, renders only selected units, shows the empty state at 1 unit; EN + ગુ keys present (parity maintained); cards reuse existing responsive grids (no new fixed widths) so 320px behaviour is unchanged.

**Known risks** — School Quality N+1 uses the parent's School-Quality domain percent (consistent with other domain N+1); the `page`-variant domain header and homepage card share one component so future tweaks propagate. Access control remains client-side (`isInScope`) as before.

---

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
