# Pocket VSK — QA Report

## Hide Administration "Compare by" at School/Grade/Section (Pass 46)

At School/Grade/Section the officer-view **Administration** card showed a "Compare by" chip row
(`[Untracked Students] [CRC/URC Visits]`) followed by **"Not tracked at this level"** — its KPIs
(`ret_dropout`, `vis_CRCC_count`, `lowestLevel: school`) have no child data to compare below
school, so the whole section was noise.

### Guards added (Administration card only)

1. **Level guard** (`ScorecardHome.tsx`): for `domain.id === "administration"`, the card's
   `comparable` is now `comparable && !isSchoolOrBelow`, where `isSchoolOrBelow` =
   `level ∈ {school, grade, section}`. So the entire compare section is suppressed at those levels.
2. **Valid-rows guard** (`DomainInsightCard.tsx`): the compare section now renders only when
   `comparable && comparing && (metrics.length <= 1 || hasData)`. The multi-metric card
   (Administration is the only one passing >1 `compareMetrics`) thus requires valid child rows —
   no chips and no "Not tracked at this level" when there's nothing to compare.

Together these match the spec's `canShowAdministrationCompare = applied && level not in
{school,grade,section} && childRows > 0`.

### Result

- School/Grade/Section: Administration card is compact — KPI rows + N+1 pills only (`7 untracked
Students` / `Cluster · 22`, `1.4 No of CRC/URC Visits per school` / `Cluster · 1.6`), no
  Compare by, no "Not tracked".
- Cluster/Block/District/State: unchanged — Compare by chips + comparison chart still show when
  Compare is applied and data exists.
- Single-metric input cards (Attendance, Assessment) and GSQAC are untouched — `metrics.length <= 1`
  keeps the valid-rows guard inert, and only the Administration card gets the level guard.

### Files changed

- `src/screens/ScorecardHome.tsx` — `isSchoolOrBelow`; per-card `cardComparable` for Administration.
- `src/components/ui/DomainInsightCard.tsx` — compare section requires `hasData` for the
  multi-metric card.

### Verification

- `npx tsc --noEmit` ✓ clean · `npm run build` ✓ (`built in 16.01s`; only the pre-existing
  > 1.5 MB `entities` chunk-size warning).
- No changes to Administration KPI values, untracked / CRC-URC logic, N+1 pills, compare sheet,
  other domain cards, domain/KPI-detail pages, or header/filter/share behaviour.

---

## Drop "avg" from N+1 comparison pills on cards (Pass 45)

The card-level N+1 comparison pills appended "avg" for percent/score/ratio metrics
(`School avg 76%`, `vs State avg · 84%`, `District avg · 1.8`). Removed that word so the pills now
read `School 76%` / `State · 84%` / `District · 1.8`. The "avg" came from `t("common.avg")` in
exactly three card components; fixed at the source (no per-card hacks):

- `DomainInsightCard.tsx` — `N1Chip` lost its `avg` prop + the `{avg ? " avg" : ""}` render (and
  the now-unused local `t`); the three call sites (InputHead, OutputHead, Administration secondary)
  dropped `avg={…}`. Covers homepage domain cards, GSQAC card, and the Administration CRC/URC pill.
- `KpiCard.tsx` — removed `peerIsAvg`; `peerStr` is now `"{Level} · {value}"`. Covers domain-page
  single-metric KPI cards (Attendance, SAT, etc.).
- `MultiMetricKpiCard.tsx` — removed `peerIsAvg`; `peerLabel` is now `"{Level} · {value}"`. Covers
  multi-metric sub-rows.

### Deliberately NOT changed (these "avg"s are metric names / non-card, per the task)

- `formatBelowLevelLabel` / `format.ts` → "Students below {Level} avg" — an actual metric label
  (MultiMetricKpiCard still uses it for the below-average sub-metric). Unchanged.
- `Export.tsx` indicator-table column header "{Level} avg" (`export.parentAvg`) — a print/table
  column, not a card pill. Out of scope; unchanged.
- Parakh survey card "State avg N" — Parakh is out of scope per the standing constraints. Unchanged.
- `common.avg` i18n key left defined (now unused) so the en/gu dict shapes stay aligned.

### Files changed

- `src/components/ui/DomainInsightCard.tsx`, `src/components/ui/KpiCard.tsx`,
  `src/components/ui/MultiMetricKpiCard.tsx`.

### Verification

- `npx tsc --noEmit` ✓ clean · `npm run build` ✓ (`built in 26.79s`; only the pre-existing
  > 1.5 MB `entities` chunk-size warning).
- Grep confirms **zero** remaining `common.avg` / `peerIsAvg` usages in `src/`.
- No changes to login/header/filter/share-export behaviour, compare sheet, GSQAC pages, assessment
  ordering, Parakh, chart logic, or KPI values/formulas.

---

## Untracked Students card/drilldown spec re-review — no change (Pass 44)

Re-received the original "Add Untracked Students card + role-aware drilldown" spec. Verified the
whole spec is already implemented and chose (with the user) to **keep the current card** rather
than revert it.

Already in place (Passes 38/41):

- `UntrackedHomeCard` renders on the Teacher/Principal homepage (`ScorecardHome.tsx:156`),
  alongside Attendance · Assessment · School Quality — card order intact.
- Title is "Untracked Students" (never "Dropout"); tapping navigates to `/app/kpi/ret_dropout`.
- Drilldown is role-aware (`KpiDetail` → `RosterDetail`): Teacher → student list (avatar · name ·
  grade·section · Untracked/Re-enrolled pill); Principal → grade-wise expandable accordion; Officer
  → N-1 hierarchy counts via `useKpiChildSeries`, no names.
- Values are deterministic from `UNTRACKED_SUMMARY` / `UNTRACKED_BY_GRADE` (no hardcoded component
  values); card and detail summary use the same source.

Intentional divergence from the (re-pasted, older) spec — kept by user decision:

- The spec shows a "43 re-enrolled this year" line and a "vs" prefix on the pill. Both were
  deliberately removed in Pass 40, and a principal CRC/URC visits row was added in Pass 41 (with
  compare chips in Pass 43). The user chose to keep these refinements, so the homepage card is
  **unchanged**. (The detail summary still shows both untracked + re-enrolled counts.)

No files changed; no rebuild (last green build: Pass 43).

---

## Administration card — N+1 pill + Compare on BOTH KPIs (Pass 43)

The homepage **Administration** card carries two KPIs — Untracked Students (hero) and No. of
CRC/URC Visits per school (secondary). The hero already had an N+1 pill and a compare chart; the
CRC/URC row had neither. Both now behave identically.

### N+1 comparison pill on the CRC/URC row

The secondary row now renders its own `N1Chip` (same pill style as every other card) using
`peerAvg(vis_CRCC_count, level)` — the parent-level published average — with `avg = unit !== "count"`.
So at block view it reads **`District avg · 1.8`** (ratio → "avg", formatted as a decimal, never
`%`), while the untracked row stays **`District · 260`** (count, no "avg"). At State (no parent)
neither pill shows, matching the existing peer logic used across all cards.

### "Compare by" selector — both metrics comparable

When Compare is applied, the Administration card now shows a **Compare by** chip selector
(`[Untracked Students] [CRC/URC Visits]`, default Untracked) and one chart at a time — mirroring
the multi-metric `KpiCompareSection` pattern, so the card never grows two stacked charts:

- **Untracked Students** → count bars (`useKpiChildSeries("ret_dropout", childIds)`, auto-scaled,
  worst-first since lower-is-better).
- **CRC/URC Visits** → decimal bars (`useKpiChildSeries("vis_CRCC_count", childIds)`, `unit:"ratio"`,
  `maxValue:3`) — no `%`.

Chips/charts appear only after Compare is applied (no empty space, no "Tap Compare…" hint). Every
other input domain stays single-metric (no chips); GSQAC keeps its domain-% bars.

### Data consistency

All three figures come from the canonical sources — the card value from the scorecard record, the
N+1 value from `peerAvg` (PUBLISHED parent), and the bars from `useKpiChildSeries` — the same
sources the KPI detail and other compare charts use. No values are hardcoded in the component.

### Implementation

`DomainInsightCard` now takes an optional `compareMetrics: { rec, chipLabel }[]`. When >1 it
renders the chip selector and drives the chart off the SELECTED metric's record (its own unit /
direction / maxValue); the default is the hero alone (no chips). `ScorecardHome` builds the
two-metric list only for `domain.id === "administration"` (chip labels: the untracked KPI name +
the new `compare.crcVisits` = "CRC/URC Visits", en + gu).

### Files changed

- `src/components/ui/DomainInsightCard.tsx` — CRC/URC N+1 pill; `compareMetrics` prop + chip
  selector; chart driven by the selected metric.
- `src/screens/ScorecardHome.tsx` — pass `compareMetrics` for the Administration card.
- `src/i18n/en.ts`, `src/i18n/gu.ts` — `compare.crcVisits`.

### Verification

- `npx tsc --noEmit` ✓ clean · `npm run build` ✓ (`built in 27.88s`; only the pre-existing
  > 1.5 MB `entities` chunk-size warning).
- Reference values confirmed: `ret_dropout` district 260, `vis_CRCC_count` district 1.8 →
  pills "District · 260" and "District avg · 1.8".
- No changes to login/header/filter/share-export/compare sheet behaviour, GSQAC, assessment
  ordering, Parakh, the Untracked detail page, other domain cards, KPI formulas, or routes.

---

## Home compare bars use the hero indicator's unit, not the domain % (Pass 42)

### Bug

On the homepage domain cards, the embedded "… COMPARISON" bars always rendered the **domain
score percent** (`leaderboard.domainPercents[domainId]`) with a hardcoded `unit="%"` /
`maxValue={100}`. So the Attendance card — whose hero is a **count** ("225 students absent") —
showed cluster bars as `87.9% … 92.8%` (the attendance _score_), not the absent-student counts.
The N+1 pill ("District 790") was already a count; only the bars disagreed.

### Fix

The bars now follow the **hero indicator's own unit**, mirroring the already-correct
`KpiCompareSection` used on the KPI/domain pages:

- `DomainInsightCard` computes its own input-domain bars from
  `useKpiChildSeries(heroKpi.id, selectedChildIds)` (the same provider series the detail uses),
  rendering them in `heroKpi.unit`: `count → count`, `% → %`, `ratio → ratio`. `maxValue` is 100
  for %/score, 3 for ratio, else auto-scaled; `lowerBetter` follows `heroKpi.direction` so
  lower-is-better counts (absent, untracked) sort worst-first.
- GSQAC (output) is itself a percent score, so it keeps the domain-percent `bars` path (`unit=%`,
  max 100) — unchanged.
- `ScorecardHome` now passes `compareChildren` (selected child id + label) to input cards instead
  of pre-baked `bars`; `bars` is passed only for the GSQAC card. The `bars` prop is now optional.

Net: Attendance/Administration (count heroes) show counts; Assessment (% hero) shows %; GSQAC
shows the score %. Verified hero units — `att_chronic` count·lower, admin untracked count·lower,
`asm_SAT 2` %·higher.

### Files changed

- `src/components/ui/DomainInsightCard.tsx` — compute hero-unit bars via `useKpiChildSeries`;
  `bars` optional + new `compareChildren` prop; pass `unit`/`maxValue`/`lowerBetter` through.
- `src/screens/ScorecardHome.tsx` — pass `compareChildren` to input cards; keep `childBars` (the
  domain-percent path) for the GSQAC card only.

### Verification

- `npx tsc --noEmit` ✓ clean · `npm run build` ✓ (`built in 16.01s`; only the pre-existing
  > 1.5 MB `entities` chunk-size warning).
- No changes to login/routing, header, filter/compare sheets, GSQAC scoring, assessment ordering,
  or Parakh. KPI values/formulas unchanged; this only changes which series the bars plot.

---

## CRC/URC visits on the Administration domain card — non-teachers only (Pass 41)

Moved/extended the "No. of CRC/URC visits" metric so it sits with untracked students on the
**Administration domain card**, for everyone who has Administration access (i.e. all roles except
teachers).

- **Officers** (CRCC/BRC/DEO/State) — who see the real Administration `DomainInsightCard` — now
  get a second metric below a **divider**: the untracked-students hero, then a line, then
  e.g. `1.7 No of CRCC/URC Visits per school`. The value is the **same scorecard record**
  (`vis_CRCC_count`) the Administration → Visits detail uses (published school 1.4 → block 1.7 →
  state 1.9), so the card and the drill-down agree. Implemented via a new optional `secondaryRec`
  prop on `DomainInsightCard` (input domains only); `ScorecardHome` passes it only for
  `domain.id === "administration"`.
- **Principal** — whose Administration card is replaced by the dedicated `UntrackedHomeCard` —
  keeps the CRC/URC visits row (`2 / 3 CRC/URC visits this month`) it gained in Pass 40.
- **Teacher** — no Administration access — **no longer** shows CRC/URC visits. The row on
  `UntrackedHomeCard` is now gated to `role === "principal"`, so the teacher card shows only the
  untracked count + N+1 pill.

### Files changed

- `src/components/ui/DomainInsightCard.tsx` — optional `secondaryRec` → divider + second metric row.
- `src/screens/ScorecardHome.tsx` — pass `secondaryRec` (`vis_CRCC_count`) for the Administration card.
- `src/components/ui/UntrackedHomeCard.tsx` — gate the CRC/URC visits row to principal only.

### Verification

- `npx tsc --noEmit` ✓ clean · `npm run build` ✓ (`built in 10.51s`; only the pre-existing
  > 1.5 MB `entities` chunk-size warning).
- `vis_CRCC_count` confirmed published at school→state, `lowestLevel: school`,
  `roleVisibility: NON_TEACHER` — so the record is present (with a value) for officers at every
  level, and never for teachers.
- No changes to login/routing, header, filter/compare sheets, GSQAC, assessment ordering, or Parakh.

---

## Untracked card cleanup + drop "vs" prefix + CRC/URC visits metric (Pass 40)

Three focused homepage tweaks:

1. **Remove "re-enrolled this year" from the Untracked card.** `UntrackedHomeCard` no longer
   renders the secondary re-enrolled line. (The re-enrolled count is still shown in the _detail_
   summary, and `UNTRACKED_SUMMARY.reenrolled` is kept — only the home card line was dropped.)

2. **Drop the "vs" prefix from every N+1 hierarchy comparison pill.** The pills now read
   "School 18", "District 790", "District avg 82%" instead of "vs School 18", etc. Removed the
   `t("common.vs")` token from all six render sites:
   - `components/ui/DomainInsightCard.tsx` (`N1Chip` — home domain cards)
   - `components/ui/KpiCard.tsx` and `components/ui/MultiMetricKpiCard.tsx` (KPI-listing peer label)
   - `components/ui/RosterDetail.tsx` (both the untracked and the count comparison pills)
   - `components/ui/UntrackedHomeCard.tsx`
     The `common.vs` i18n key is left defined (harmless, keeps the en/gu shape aligned) but is now
     unused. The "avg" suffix on percent/score comparisons (§22) is unchanged.

3. **Add "No. of CRC/URC visits" to the Untracked card with a line separator.** Below a divider,
   the card now shows the school's CRC/URC school-observation count for the month
   (`vis_CRCC_count` semantics — max 3/month), e.g. `2 / 3 CRC/URC visits this month`. Driven by
   two new fields on the shared `UNTRACKED_SUMMARY` mock (`crcVisits`, `crcVisitsMax`) — a
   school-level metric, so identical for the teacher and principal of one school. Added the
   `roster.crcVisitsLabel` i18n key (en + gu). The whole card still navigates to the untracked
   detail (`/app/kpi/ret_dropout`); the officer Administration card is unchanged.

### Files changed

- `src/components/ui/UntrackedHomeCard.tsx` — removed re-enrolled line + "vs"; added CRC/URC visits row.
- `src/components/ui/DomainInsightCard.tsx`, `KpiCard.tsx`, `MultiMetricKpiCard.tsx`, `RosterDetail.tsx` — dropped "vs".
- `src/lib/rosterMock.ts` — `crcVisits` / `crcVisitsMax` on `UNTRACKED_SUMMARY`.
- `src/i18n/en.ts`, `src/i18n/gu.ts` — `roster.crcVisitsLabel`.

### Verification

- `npx tsc --noEmit` ✓ clean · `npm run build` ✓ (`built in 10.85s`; only the pre-existing
  > 1.5 MB `entities` chunk-size warning).
- Grep confirms **zero** remaining `common.vs` usages in `src/`.
- No changes to login/routing, header, filter/compare sheets, GSQAC, assessment ordering, or Parakh.

---

## Blank-screen-after-login crash fix — untracked roster generator (Pass 39)

### Root cause

After login the app crashed with `Uncaught TypeError: Cannot read properties of undefined
(reading '0')` originating in `lib/rosterMock.ts` inside `genUntracked`, on the line that builds
the surname initial:

```ts
name: `${FIRST[hv % FIRST.length]} ${LAST[(hv >> 4) % LAST.length][0]}.`;
```

The hash `h()` returns an **unsigned** 32-bit int (`x >>> 0`, up to ~4.29B). But `hv >> 4` is an
**arithmetic (signed)** shift: when `hv ≥ 2³¹`, JS first coerces it to a negative Int32, so the
shift result is negative. In JS a negative dividend yields a negative modulo (`-13 % 8 === -5`),
so `LAST[-5]` is `undefined`, and the trailing `[0]` (first char of the surname) threw.

Because `UNTRACKED_BY_GRADE` is built at **module top-level** (`.map(g => genUntracked(...))`),
this threw during import — so the whole React tree failed to mount and the user saw a blank
screen. Empirically **41 of the 82** generated rows hit the negative index; the first one is
enough to crash. (`genStudents` had the same signed-shift footgun but only interpolated the
`undefined` as the string `"undefined"` rather than calling `[0]`, so it never crashed.)

### Fix (`lib/rosterMock.ts`) — defensive + deterministic

- Added a safe `pick<T>(arr, index, fallback)` helper that normalises **any** integer index
  (including the negative signed-shift values) to a valid slot via `((i % len) + len) % len`,
  and falls back if the array is empty or the slot is `undefined`.
- `genUntracked` and `genStudents` now route every array lookup through `pick`; the surname
  initial is taken with `pick(LAST, hv >> 4, "K").charAt(0).toUpperCase()` (always a real string,
  so `.charAt(0)` can never throw). Both generators also clamp the length to `Math.max(0, n)`.
- Output is still fully deterministic — same scope → same list — so the homepage card and detail
  summary continue to match (§2). No values, counts, or role behaviour changed.

### Verification

- `npx tsc --noEmit` ✓ clean.
- `npm run build` ✓ (`built in 11.18s`; only the pre-existing >1.5 MB `entities` chunk-size warning).
- Standalone node replay of the exact hash + `pick` logic across all 82 untracked students:
  `negative hv>>4` rows = 48, rows the **old** code would crash on = **41**, **new** invalid/undefined
  names = **0**.
- Role flows (unchanged): teacher home → student-list detail; principal home → grade accordion →
  expand → student rows; officer → N-1 count list (no names). Untracked card shows for
  teacher/principal only. No login/routing/header/compare/GSQAC/assessment changes.

### Files changed

- `src/lib/rosterMock.ts` — `pick` helper; hardened `genUntracked` + `genStudents`.

---

## Untracked Students card + role-aware drilldown for Teacher/Principal (Pass 38)

Upgraded the Teacher/Principal **Untracked Students** homepage card to the latest design and made
its drilldown fully role-aware, all from one central deterministic mock so card and detail agree.

### Central mock (`lib/rosterMock.ts`)

- `UNTRACKED_SUMMARY` — role-scoped summary that drives **both** the homepage card and the detail
  summary so they always match (§2): teacher `5 untracked / 2 re-enrolled · vs School 18`,
  principal `82 untracked / 43 re-enrolled · vs State 1.2K`.
- `UNTRACKED_BY_GRADE` now carries a generated student roster per grade (counts sum to the
  school's 82), so each grade row can expand to students (§4). Teacher list (`TEACHER_UNTRACKED`)
  unchanged (the §3 sample).

### Homepage card (`components/ui/UntrackedHomeCard.tsx`, new)

Dedicated Teacher/Principal card matching the design: **purple/lavender icon**, title
"Untracked Students", subtitle "Updated 12 Jun", big neutral count + "untracked students", a
secondary "{n} re-enrolled this year", the **vs State/School** N+1 pill, right-side chevron only
(no "Know more", no compare hint). Tapping opens `/app/kpi/ret_dropout`. `ScorecardHome` now
renders this for teacher/principal (replacing the prior generic domain-card reuse); officers keep
the Administration domain card unchanged. Card order stays Attendance · Assessment · School
Quality · Untracked Students.

### Role-aware drilldown (`components/ui/RosterDetail.tsx`)

- **Summary** for untracked teacher/principal now shows **two values** (untracked + re-enrolled)
  from `UNTRACKED_SUMMARY` with the matching N+1 pill — identical to the card.
- **Teacher** → student list (avatar · name · grade·section · status pill `Untracked`/`Re-enrolled`),
  no last-seen clutter, data-only.
- **Principal** → **grade-wise accordion** (new `UntrackedClassAccordion`): each grade row shows a
  count + chevron and expands to its student rows (§4) — previously a flat count list.
- **Officer** → unchanged N-1 hierarchy counts from the canonical provider series
  (`useKpiChildSeries`), no names (§5).

### Files changed

`lib/rosterMock.ts` (UNTRACKED_SUMMARY + grade rosters), `components/ui/UntrackedHomeCard.tsx`
(new), `components/ui/RosterDetail.tsx` (two-value summary + principal accordion + shared row),
`screens/ScorecardHome.tsx` (use the new card), `i18n/en.ts` + `i18n/gu.ts` (5 roster keys).

### Build

`tsc --noEmit` ✓ · `vite build` ✓ (`built in 11.52s`; only the pre-existing `entities` seed
chunk-size warning). Playwright not run, per standing instruction.

### Deviation

§3's literal teacher-detail header showed `82 / 43`, which conflicts with §2's teacher card values
`5 / 2` and the "card value must match detail summary" rule. Resolved in favour of consistency:
teacher card **and** detail header both show `5 / 2` (school-scoped principal shows `82 / 43`).

---

## Homepage domain card shows the hero KPI's full name (Pass 37)

The home **Attendance** card read "936 **students absent**" (a clipped suffix). It now reads
"936 **students absent from past 7+ consecutive days**" — the hero KPI's full name.

### Change

`DomainInsightCard` → `InputHead` (`components/ui/DomainInsightCard.tsx`) now renders the hero's
full name via `formatKpiCardTitlePhrase(kpi.name, …)` instead of the short
`getSingleMetricValueSuffix`. The home card's title is the **domain** name ("Attendance"), so the
full sentence in the value row is not a duplicate (unlike the KPI-listing card, whose title IS the
KPI name — that card is unchanged and keeps its short suffix). Count KPIs keep the lower-cased
leading word so it reads as a sentence; the number stays neutral black; the N+1 pill is unchanged.

Side effect (benign): the Teacher/Principal **Untracked Students** home card hero (`ret_dropout`)
now reads "… untracked students" (full name) instead of "… students untracked". The Assessment
hero already used its full name.

### Files changed

`components/ui/DomainInsightCard.tsx`.

### Build

`tsc --noEmit` ✓ · `vite build` ✓ (`built in 10.10s`; only the pre-existing `entities` seed
chunk-size warning). Playwright not run, per standing instruction.

---

## GSQAC indicator cards now match the sub-domain card style (Pass 36)

The GSQAC **Indicators** list (`/app/gsqac/:areaKey/:subId`) rendered each indicator as a thin
single-row item (status dot · name · score · chevron), inconsistent with the **Sub-domains** page
which uses full score cards. Made them match.

### Change

`GsqacIndicatorCard` (`components/ui/GsqacCards.tsx`) now uses the **same layout as
`GsqacSubdomainCard`**: full-width white `card-pad` card, title top-left with the right-side
chevron, then a large score (`text-2xl`) + GSQAC **grade badge** (`RatingBadge` via the shared
`gsqacGrade` helper) below. Long indicator names wrap to two lines (`line-clamp-2`); the card
height adapts naturally. No indicator count line (not useful here), no status-dot row.

### Preserved

- **Compare** unchanged — the card still renders the shared `GsqacCompareSection` (grade-coloured
  bars via `fillFor`, baseline-aligned, chart-strip-only scroll); nothing before Compare is
  applied, no "Tap Compare…" hint.
- **Navigation** unchanged — tapping still opens `/app/kpi/:indicatorId`; the chevron stays; no
  "Know more" text.
- The sub-domain page header is unchanged — back link + lightweight title + `INDICATORS`, no
  redundant top summary card (§7, kept from Pass 34).

Only `GsqacIndicatorCard` changed; the sub-domain and area cards already used this pattern, so the
three GSQAC card types now share one consistent visual language.

### Files changed

`components/ui/GsqacCards.tsx` (GsqacIndicatorCard layout).

### Build

`tsc --noEmit` ✓ · `vite build` ✓ (`built in 12.51s`; only the pre-existing `entities` seed
chunk-size warning). Playwright not run, per standing instruction.

---

## Teacher/Principal homepage: add School Quality + Untracked Students cards (Pass 35)

Teacher and Principal homepages now show **four** primary cards in order — Attendance, Assessment,
**School Quality**, **Untracked Students** — instead of just Attendance + Assessment.

### 1. School Quality (GSQAC) now visible to teachers (§1)

Root cause: `sq_gsqac` carried `roleVisibility: [...NON_TEACHER]`, which hid the entire output
(School Quality) domain from teachers (principals already saw it). Removed that restriction —
GSQAC is a school-level **team** metric, so it's visible to teachers too (`config/kpiCatalog.ts`).
Now the teacher's School Quality card shows the real GSQAC score + grade (not `NA`), and the
GSQAC drilldown page renders for teachers.

### 2. School Quality always shown for Teacher/Principal, with school-level fallback (§1)

`ScorecardHome` now pulls a second, school-level scorecard (`useScorecard(homeId)`). For
Teacher/Principal the School Quality card uses the current scope's GSQAC when present, else falls
back to the **school-level** score — so the card persists at Grade/Section view (GSQAC is a
school-level metric). Officers keep the exact previous behaviour (current-scope output only).

### 3. Dedicated Untracked Students card for Teacher/Principal (§2/§4)

For Teacher/Principal the generic **Administration** domain card is replaced by a dedicated
**Untracked Students** card (reusing the same `DomainInsightCard` style with the `ret_dropout`
hero: `Daily · 1st Oct`, neutral count, N+1 pill). It drills to `/app/kpi/ret_dropout`, the
role-aware detail (§3): teacher → student list · principal → grade-wise list · officer → N-1
hierarchy counts (Pass 33/34). Card order is Attendance · Assessment · School Quality · Untracked
Students. Officers keep the full domain set (Attendance, Assessment, Administration, School
Quality) unchanged.

### Data consistency (§6)

The Untracked card value and the detail-page headline both read the canonical provider
`ret_dropout` value for the same scope — no hardcoded divergence. (The teacher's own-class roster
list inside the detail remains the same demo list pattern used for "absent 7+ days".)

### Files changed

`config/kpiCatalog.ts` (sq_gsqac visible to teachers), `screens/ScorecardHome.tsx` (role-aware
cards: school-level GSQAC fallback + dedicated Untracked card, Administration card hidden for
Teacher/Principal). No card component redesign; no change to login/header/filter/share/compare,
GSQAC nested pages, Assessment ordering, PARAKH, or officer homepages (§8).

### Build

`tsc --noEmit` ✓ · `vite build` ✓ (`built in 10.70s`; only the pre-existing `entities` seed
chunk-size warning). Playwright not run, per standing instruction.

### Deviations

- The Untracked card shows the **school-level** untracked count from the provider (the canonical
  value, matching the detail headline per §6), not a role-scoped `4`/`18` — the provider tracks
  untracked at school level, and forcing different per-role numbers would re-introduce the
  card↔detail divergence this codebase just fixed. Same pattern as the "absent 7+ days" card.
- Re-enrolment secondary text ("43 re-enrolled") was left off to keep the card compact and avoid
  a card-component change; it remains available on the Untracked detail/Administration sub-domain.

---

## Data consistency + GSQAC redundant-card removal + grade-coloured bars (Pass 34)

Three focused fixes: make the KPI detail child list read the same canonical source as the
comparison chart, strip the redundant top summary cards from the GSQAC drill, and colour GSQAC
comparison bars by grade.

### 1. Data consistency — detail N-1 list now matches the comparison chart (§1)

**Bug:** the role-aware detail for "students absent 7+ days" / "untracked students" rendered its
officer N-1 hierarchy list from a **separate hash generator** (`rosterMock.unitCounts`), so the
detail list showed unrelated values (e.g. `Anjar 25, Lakhpat 18`) while the domain card's compare
chart showed the real provider values (e.g. `Anjar 208, Lakhpat 225`).

**Fix:** `RosterDetail`'s `OfficerList` now reads the **same canonical provider series** the
compare chart uses — `useKpiChildSeries(kpiId, childIds)` — keyed by `att_chronic` / `ret_dropout`,
formatted in the metric's own unit (count). Card value, detail headline, compare chart, and the
detail N-1 list all resolve from the provider for the same scope/filter, so they agree (Rules 1–3).
PM SHRI / filter state already flows through `useKpiChildSeries`, so all surfaces stay in sync.
The dead `unitCounts` generator (and its `UnitCount` type / `Entity` import) was **removed** from
`rosterMock.ts` (§8).

### 2. Removed the Overall GSQAC card from the domain page (§2)

`/app/domain/school_quality` no longer renders the big "Overall GSQAC · 68.1% · 680.7/1000" card.
The page starts at **GSQAC AREAS** (area cards), which still show score · grade · sub-domain count
and a compare chart when Compare is applied.

### 3. Removed redundant top summary cards from the GSQAC area & sub-domain pages (§3, §4)

- **Area page** (`/app/gsqac/:areaKey`): dropped the area score/grade/marks + static
  District·State summary card. Now: back link + a lightweight area **title** (name only) + the
  **SUB-DOMAINS** cards (each with its own compare chart).
- **Sub-domain page** (`/app/gsqac/:areaKey/:subId`): dropped the sub-domain score summary card.
  Now: back link + lightweight sub-domain **title** + the **INDICATORS** cards.
- **Indicator detail** (`/app/kpi/:id`, §5): already shows title + meta + value in the page
  header, then the trend chart + "How it's calculated" — no separate redundant summary card.
  Compare stays hidden on `/app/kpi/*`.

### 4. GSQAC comparison bars use the grade-scale colour (§6)

`ChildComparisonBars` gained an optional `fillFor(bar)` prop (per-bar hex). Non-GSQAC charts
omit it and keep the neutral brand fill (§10); **GSQAC** charts pass
`fillFor={(b) => GSQAC_BAND_HEX[gsqacGrade(b.value)]}`, so each bar is coloured by its own score's
grade band — green (A-range) → lime (A2/A1) → amber (B) → orange (C) → red (D). Applies to the
GSQAC area / sub-domain / indicator compare charts. Baseline, fixed tracks, 2-line labels,
percent units, and chart-strip-only scroll are unchanged (§7).

### Files changed

`components/ui/RosterDetail.tsx` (officer list → `useKpiChildSeries`), `lib/rosterMock.ts`
(removed `unitCounts`), `components/ui/ComparisonBars.tsx` (`fillFor` prop),
`components/ui/GsqacCards.tsx` (grade-colour `fillFor`), `screens/DomainView.tsx` (removed
Overall GSQAC card), `screens/GsqacAreaView.tsx` (no summary card), `screens/GsqacSubDomainView.tsx`
(no summary card).

### Build

`tsc --noEmit` ✓ · `vite build` ✓ (`built in 12.37s`; only the pre-existing `entities` seed
chunk-size warning). Playwright not run, per standing instruction.

### Deviation

`GsqacOverallCard` is now unused (kept exported in `GsqacCards.tsx`, harmless) since the overall
score is no longer shown on the listing page. Area/sub-domain pages keep a one-line **title** for
orientation — the spec allows the page title to carry context; only the large _score/comparison
summary cards_ were removed.

---

## GSQAC drill: Area → Sub-domain page → Indicator cards → KPI detail, all Compare-enabled (Pass 33)

Extended the GSQAC / School Quality flow to a full domain-style drill, so every level lists
its children as proper cards and supports embedded Compare, ending in a normal KPI detail page.

### Navigation flow (implemented)

```
/app/domain/school_quality            → Overall + 5 area cards            (Compare ✓)
  → /app/gsqac/:areaKey               → area headline + sub-domain cards  (Compare ✓)
    → /app/gsqac/:areaKey/:subId      → sub-domain headline + indicator cards (Compare ✓)
      → /app/kpi/:indicatorId         → GSQAC indicator detail (trend + data, no Compare)
```

The existing `/app/gsqac/:areaKey` prefix was **extended by one level** (`:areaKey/:subId`)
rather than colliding with the generic `/app/domain/:domainId/:subId` route — behaviourally
equivalent to the spec's nested paths, no existing routes broken (§1). New route registered in
`App.tsx` (lazy-loaded `GsqacSubDomainView`).

### GSQAC data restructure (`config/gsqac.ts`)

- Sub-domain `indicators` changed from `string[]` → **`GsqacIndicator[]` (`{ id, name, score }`)**
  with stable, GSQAC-prefixed ids (`sq_<subId>_<i>`) so each indicator can be its own card,
  drill to `/app/kpi/:id`, and resolve back. Indicator names + scores are the brief's §6 dataset
  (deterministic dummy data — no provider series exists for GSQAC).
- Added `gsqacSubdomainById(subId)` and `gsqacIndicatorById(id)` lookups, and
  `gsqacIndicatorTrend(id, score)` — a deterministic 4-point yearly series for the detail chart.
- `gsqacCompareValue` (Pass 32) reused for every level's Compare bars.

### Sub-domain & indicator cards (`components/ui/GsqacCards.tsx`)

- **`GsqacSubdomainCard`** is no longer an inline accordion — it's a **navigation card**
  (score · grade · indicator count · chevron) that opens the sub-domain page and shows the
  embedded `GsqacCompareSection` after Compare is applied (§2).
- New **`GsqacIndicatorCard`** — compact KPI-style row (status dot · name · score% · chevron)
  with the same `GsqacCompareSection`, drilling to the KPI detail (§3, §4, §8).
- Both reuse the shared `ChildComparisonBars` + `CompareContext` via `GsqacCompareSection`
  (no one-off chart). Compare bars stay percent, baseline-aligned, with the school-and-above
  level guard (no fabricated grade/section GSQAC, §10).

### Screens

- New **`GsqacSubDomainView`** (`/app/gsqac/:areaKey/:subId`): sub-domain headline + one
  `GsqacIndicatorCard` per indicator.
- **`GsqacAreaView`**: sub-domain cards now navigate to the sub-domain page (were inline
  accordions).
- **`KpiDetail`**: detects a GSQAC indicator id (`gsqacIndicatorById`) and renders a dedicated
  **`GsqacIndicatorDetail`** — area eyebrow · indicator name · `Yearly · 2024–25 · GSQAC
Dashboard` meta · big score + grade · **yearly trend line chart** · "How it's calculated".
  No embedded Compare on the detail page; Compare button stays hidden on `/app/kpi/*` (§5, §9).

### Visual / chart rules

GSQAC indicator + sub-domain cards follow the same white-rounded-card language (title, value,
right chevron, grade colour allowed for GSQAC). Bars use the shared component (same baseline,
fixed-height tracks, 2-line labels, 1–8 spread / 9+ chart-strip-only scroll) — no new chart
bugs, no full-page horizontal overflow (§8, §10).

### Files changed

`config/gsqac.ts` (indicator objects + ids + lookups + trend), `components/ui/GsqacCards.tsx`
(sub-domain nav card + new indicator card), `screens/GsqacSubDomainView.tsx` (new),
`screens/GsqacAreaView.tsx` (sub-domain navigation), `screens/KpiDetail.tsx` (GSQAC indicator
detail), `App.tsx` (new route).

### Build

`tsc --noEmit` ✓ · `vite build` ✓ (`built in 11.95s`; only the pre-existing `entities` seed
chunk-size warning). Playwright not run, per standing instruction. Non-GSQAC domains, login,
header, filter, share/export, PARAKH, Assessment ordering, and Administration cleanup untouched
(§12).

---

## GSQAC Compare support — embedded comparison charts on School Quality cards (Pass 32)

Added embedded Compare charts to the **GSQAC / School Quality** cards so they behave like the
Attendance / Assessment / Administration cards: when Compare is applied, each GSQAC card shows a
bar chart of the selected N-1 hierarchy units. Compare was already reachable on these pages — the
cards just weren't drawing the charts.

### What changed

- **New shared `GsqacCompareSection`** (`components/ui/GsqacCards.tsx`) — mirrors
  `KpiCompareSection` exactly (renders nothing until Compare is applied, then a
  `ChildComparisonBars` strip of the selected child units, worst-first, percent units, max 100).
  It reuses the shared **`ChildComparisonBars`** + **`CompareContext`** rather than a bespoke
  chart. GSQAC scores live in a self-contained config (not the provider/engine), so the bar
  values come from a new deterministic helper instead of `useKpiChildSeries`.
- **`config/gsqac.ts` → `gsqacCompareValue(childId, seedKey, base)`** — deterministic, stable
  per-(child, card) GSQAC % near the card's own headline score (±8, clamped 20–99). No
  random-on-render; same scope always renders the same bars (§4). Percent throughout (§5).
- **GSQAC domain page** (`/app/domain/school_quality`): the **Overall GSQAC** card and all five
  **area** cards (Teaching and Learning, School Administration, Co-scholastic Activities, Usage of
  Resources, State-Level Competitive Exams) now render the compare chart when applied
  (`GsqacOverallCard` restructured to a column so the chart sits below the score row;
  `GsqacAreaCard` renders the chart outside its tappable button).
- **GSQAC area page** (`/app/gsqac/:areaKey`): every **sub-domain** card
  (`GsqacSubdomainCard`) renders the compare chart when applied. The **area headline** card now
  shows the static District·State reference **only before Compare**; once Compare is applied it
  shows the selected N-1 child units instead (§7 — never a redundant current-entity bar either
  way).
- **Level guard (§1):** GSQAC is school-level accreditation, so the compare chart only renders for
  valid parent→child levels (State→District→Block→Cluster→School). Below school (grade/section)
  has no GSQAC data, so no empty chart is shown.

### Consistency / safety

- Charts use the shared blue `ChildComparisonBars` (same baseline-aligned fixed-height tracks,
  thin bars, 2-line labels, 1–8 spread / 9+ chart-strip-only horizontal scroll). No new chart
  component, no baseline/overflow regressions (§6).
- Compare stays hidden on `/app/kpi/*` (unchanged). GSQAC scores, grade bands, formulas, routing,
  Compare-sheet behaviour, PARAKH, and the non-GSQAC domains are untouched (§9).

### Files changed

`config/gsqac.ts` (gsqacCompareValue), `components/ui/GsqacCards.tsx` (GsqacCompareSection +
wired into Overall / area / sub-domain cards), `screens/GsqacAreaView.tsx` (area-headline:
static reference before Compare, selected children after).

### Build

`tsc --noEmit` ✓ · `vite build` ✓ (`built in 26.68s`; only the pre-existing `entities` seed
chunk-size warning). Playwright not run, per standing instruction.

---

## Latest Pocket VSK design implementation — role-aware, chevron-only cards, PARAKH-in-Assessment (Pass 31)

**Design source implemented:** Claude Design handoff `aBSC3l6AJc-fw_qaqXYmqA` →
`ui_kits/vsk-dashboard/index.html` (fetched as a 3.4 MB gzip bundle, extracted; read the
README, `index.html`, `dashboard.jsx`, `screens.jsx`, `app.jsx`, `data.js`, `data2.js`,
`icons.js`, and the bundle's own QA notes). Secondary reference: `Docs/Pocket VSK Dashboard
Design.pdf` (27 pp, §1–27 product rules), text-extracted and read in full. The existing
React/Vite/TS app was **updated in place** — no static prototype was created.

Much of the design's structure already shipped in earlier passes (compact header with
logo·scope·share·filter and **no logout**; hierarchy arrows hidden at root/leaf; filter
sheet with School Type + Language; floating Compare hidden on `/app/kpi/*`; remove-comparison;
baseline-aligned bars; WASH KPIs removed + GSHALA/Smartclass/Computer-lab/PAL added;
dropout→Untracked terminology; PM SHRI biasing real data). This pass implements the **deltas**
in the latest iteration.

### 1. Card grammar — chevron-only, neutral numbers, short grammar (§5, §6, §10, §11, §15, §22)

- **Removed "Know more" text entirely.** The card's only navigation affordance is now a clean
  right-side `CardChevron` (a circular chevron, top-right of the header) — never a text CTA.
  `kpiCardParts.tsx` `KnowMore` → `CardChevron`; `KpiCardHeader` gains `chevron` (was
  `showKnowMore`); updated every caller (`KpiCard`, `MultiMetricKpiCard`, `DomainInsightCard`,
  `GsqacCards`, `ParakhCards`, `DomainView` sub-domain rows).
- **KPI numbers are neutral black (§10).** Removed RAG/delta colouring from KPI _values_ —
  only GSQAC scores keep status colour, and delta stays the separate coloured pill.
  (`KpiCard`, `MultiMetricKpiCard` metric rows, `DomainInsightCard` input hero.)
- **Single-metric short grammar (§5).** The home Attendance hero reads "**225** students absent"
  (short suffix) instead of the full "…from past 7+ consecutive days" sentence.
- **N+1 "avg" labels (§11, §22).** Comparison tags now read "vs State **avg** · 84%" for
  percentage/score averages and "vs State · 4.1K" for counts; the tag is a higher-contrast
  brand pill (`vs State` always — never "Gujarat"). New `common.avg` i18n key (en/gu).
- **SAT/FLN double-percent bug fixed (§15).** The below-average sub-metric now renders
  "**27%** Students below District avg" via the new `formatBelowLevelLabel(level)` — the value
  already shows "27%", so the label no longer carries a second "%". Level-aware
  (State/District/Block/Cluster).

### 2. Comparison bars — one neutral colour (§9, §10)

`ComparisonBars` fill is now a single neutral brand colour (`bg-primary-400`) with neutral value
labels — no RAG colour-coding outside GSQAC/delta. Baselines stay aligned (fixed-height tracks),
bars thin (24/30px), units match the metric, responsive spacing + horizontal scroll preserved.

### 3. Compare sheet (§7, §8)

`Clear all` / `Select all` bumped to **44px** tap height (`h-11`, was `h-9`). The
applied-then-cleared → **Remove comparison** primary-button behaviour was already in place.

### 4. Role-aware Attendance / Untracked detail (§6, §18, §19, §23) — NEW

`/app/kpi/att_chronic` and `/app/kpi/ret_dropout` now replace the trend chart with **role-aware
lists** (`RosterDetail.tsx` + deterministic demo data in `lib/rosterMock.ts`):

- **Teacher** → own-class **student list** (name · section · "Absent for N days" · last present;
  untracked shows status pills). Names only at teacher scope (§23).
- **Principal** → **class-wise accordion** (Grade → count, expands to the roster); untracked →
  grade-wise number list.
- **Officer** (Cluster/Block/District/State) → **N-1 hierarchy counts** (child unit → number),
  **no names**.
  Each view leads with a neutral count summary + the N+1 count tag. Graph-first is avoided for
  teacher/principal (§18.2). New `roster.*` i18n block (en/gu).

### 5. Assessment (§3, §13, §15)

- One continuous KPI grid — no "Other assessments" / "District Focus" section headings.
- **SAT cards show all three metrics** (Avg score · Students below {Level} avg · Participation);
  the below-average row uses the fixed label (no double %).
- **Ordering (§13):** "SAT reports downloaded" moved to the **front** of the Assessment domain
  (was last), ahead of the SAT results, FLN, CET, CGMS.

### 6. PARAKH redesigned as a KPI card inside Assessment (§12, §16, §24, §26) — NEW

- New `config/parakhSurvey.ts` (percentile rows + subject scores; Kachchh & State samples
  verbatim from the brief, other districts deterministic) and `ParakhSurveyCard.tsx` — same card
  pattern as other KPIs (rounded white card, neutral numbers, right-side affordance).
- **Grade 3 / 6 / 9 rows**, each a plain **percentile band** ("Top 25%") with the muted
  UDIT/UDAY/UNNAT/UDBHAV category secondary; **tap a grade → subject-wise scores**. **No delta**
  (§16.3). District compares with **State avg**; State compares with **National**.
- PARAKH + the **Grade 10 / Grade 12** board cards now render **inside the Assessment domain
  page** for **district/state only** (continuous, no separate heading) and were **removed from
  the homepage** district-focus section (§12).

### 7. Administration hero → Untracked Students (§19)

The home Administration card hero is now **Untracked Students** ("82 students untracked",
Daily · 1st Oct) instead of "No of CRCC/URC visits per school"; CRC/URC visits remain a secondary
KPI inside the domain (`kpiCatalog.ts` hero flag moved).

### 8. Login (§2)

Field label is the single static **"Teacher ID / User ID"** (en/gu); welcome text
("Welcome to Education Department, Gujarat") and role-label demo mode were already compliant.

### Files changed

`i18n/en.ts`, `i18n/gu.ts` (avg, roster.\*, login label), `lib/format.ts`
(`formatBelowLevelLabel`), `lib/rosterMock.ts` (new), `components/ui/kpiCardParts.tsx`
(CardChevron), `components/ui/KpiCard.tsx`, `components/ui/MultiMetricKpiCard.tsx`,
`components/ui/DomainInsightCard.tsx`, `components/ui/GsqacCards.tsx`,
`components/ui/ParakhCards.tsx`, `components/ui/ComparisonBars.tsx` (neutral bars),
`components/ui/RosterDetail.tsx` (new), `components/ui/ParakhSurveyCard.tsx` (new),
`config/parakhSurvey.ts` (new), `config/kpiCatalog.ts` (admin hero, assessment reorder),
`components/compare/CompareSheet.tsx` (44px), `screens/KpiDetail.tsx` (roster branch),
`screens/DomainView.tsx` (PARAKH/board in Assessment), `screens/ScorecardHome.tsx`
(removed home district-focus).

### Build

`tsc --noEmit` ✓ (exit 0, no unused-import errors) · `vite build` ✓ (`built in 27.97s`; only the
pre-existing `entities` seed chunk-size warning). Per the brief, **Playwright was not run**;
verification is by typecheck + build + reading the design source.

### Deferred (documented, not regressions)

- **CET/CGMS grade-teacher gating (§13/§24):** CET/CGMS currently show as aggregate Assessment
  cards for all who see Assessment; the "CET only for Grade 5 teachers / CGMS only for Grade 8
  teachers" rule needs grade-context plumbing the engine's role/level applicability doesn't yet
  carry. Aggregate display is correct for officers; teacher grade-scoping is the next step.
- **GSQAC explicitly surfaced to grade/section teachers (§18.1/§25):** GSQAC is school-level and
  already shows on the home scorecard at **school** scope (so a school-scoped teacher/principal
  sees score + grade); surfacing it for a grade/section-scoped teacher needs a school-GSQAC
  lookup that doesn't exist in the data model yet — left out rather than fabricate district-level
  accreditation (§25 explicitly warns against that).
- **Desktop export/PDF font-size bump:** export logic untouched per "don't break export"; the
  font-size increase is a contained follow-up.
- The legacy `/app/parakh` standalone screen still exists but is no longer linked from home (PARAKH
  now lives in Assessment); left in place to avoid touching routing.

---

## "Know more" top-right CTA + GSQAC redundant-bar removal (Pass 30)

Two focused UI fixes. No redesign; KPI values, formulas, routing, compare/PM-SHRI/language/export behaviour, GSQAC headline score and grade-badge logic all unchanged.

### 1. `Know more` moved to the top-right of clickable cards; old chevron removed (§9)

The duplicate navigation affordance is gone: clickable cards used to show **both** a right-side chevron (top-right of the header) **and** a bottom `Know more →` CTA. `Know more` is now the single CTA and sits exactly where the chevron used to be — **top-right of the card header** — with the bottom CTA removed.

- **`KnowMore`** (`components/ui/kpiCardParts.tsx`) restyled for top-right placement: blue (`text-primary-600`), medium weight (`font-semibold`), compact `text-xs`, `whitespace-nowrap shrink-0`, small trailing arrow that nudges on hover. No more `mt-3` bottom margin. Because it always sits inside the card's own `<button>`, the whole card is the tap target (well over the 36–44px minimum) and tapping `Know more` navigates.
- **`KpiCardHeader`** now renders `Know more` (top-right) instead of `ChevronRight`, gated by a new `showKnowMore` prop. **`KpiCardShell`** no longer appends the bottom `KnowMore`. `KpiCard` / `MultiMetricKpiCard` pass `showKnowMore={!!onClick}` — single- and multi-metric KPI listing cards get the top-right CTA, value rows unchanged.
- **`DomainInsightCard`** (home domain cards): chevron → top-right `Know more`; bottom `Know more` removed; head button group renamed `group/head`→`group` so the arrow hover still animates.
- **`GsqacAreaCard`** (GSQAC area score cards): chevron → top-right `Know more`.
- **`ParakhCard`** (district PARAKH card): bottom `Know more` moved up into the header row (top-right; row switched to `items-start` + `flex-1` title).
- **`DomainView` sub-domain nav rows** (Administration): right-side chevron → `Know more`.
- **Intentionally left alone** (not the "old navigation chevron" pattern): `GsqacOverallCard` headline (not clickable), `GsqacSubdomainCard` accordion `ChevronDown` (expand toggle, not navigation), `BoardCard` (not clickable, "API pending"), the hierarchy navigator/breadcrumb arrows (shell), the `ComparisonBars` "scroll ›" hint, the Login demo-credential picker rows, and the unused `CalloutCard` (not rendered anywhere).

### 2. Redundant `School` bar removed from the GSQAC area comparison chart (§14)

On a GSQAC area detail page (`/app/gsqac/:areaKey`) the school/current-entity score is already the **headline** (e.g. "usage of Resources — 80.4% · 64.4/80 · A2★"), so repeating it as a `School` bar in the comparison chart was redundant.

- **`GsqacAreaView`**: dropped the `school` entry from `cmpBars`; the chart now shows only the reference bars **District · State**.
- Chart title changed from "School vs District vs State" → **"Compare with"** (`i18n gsqac.comparison`, en + gu) to match the headline-plus-reference layout.
- Scope is exactly this GSQAC current-entity-vs-parent/state chart. Normal domain/KPI N-1 child-comparison charts (`KpiCompareSection`, `DomainInsightCard` Compare bars) are untouched — those legitimately compare selected child units.

### Files changed

`components/ui/kpiCardParts.tsx` (KnowMore restyle, header `showKnowMore`, shell drops bottom CTA), `components/ui/KpiCard.tsx`, `components/ui/MultiMetricKpiCard.tsx`, `components/ui/DomainInsightCard.tsx`, `components/ui/GsqacCards.tsx`, `components/ui/ParakhCards.tsx`, `screens/DomainView.tsx`, `screens/GsqacAreaView.tsx` (School bar removed + retitle), `i18n/en.ts`, `i18n/gu.ts` (`gsqac.comparison` → "Compare with"). Also fixed a **pre-existing** build blocker in `index.html` (a stray `"` inside the meta `description` attribute broke vite's HTML parse) — unrelated to the UI work, but the build couldn't complete without it.

### Build

`tsc --noEmit` ✓ (exit 0, no unused-import errors) · `vite build` ✓ (`built in 17.24s`; only the pre-existing `entities` seed chunk-size warning).

### Manual checks (Playwright, desktop 1280px + mobile 390px, 0 console errors)

- **Home domain cards** (Principal @ school): `Know more >` at top-right of each card, blue, with arrow; no chevron; no bottom CTA. Header pattern matches the brief — `[icon] Attendance … Know more >` / `Daily · 12 Jun` / `16 students absent…` / `vs Cluster 62`.
- **KPI listing cards** (`/app/domain/attendance`): single- (`16 students absent`, `96.8%`) and multi-metric (`87.8% Present` / `98.6% Submitted`) cards all show top-right `Know more`; value rows unchanged.
- **GSQAC area cards** (`/app/domain/school_quality`): each area card shows top-right `Know more`; the overall 68.1% headline card stays with no CTA; grade legend intact.
- **GSQAC area detail** (`/app/gsqac/D4`, "usage of Resources"): headline `80.4% · 64.4/80 · A2★` preserved; "COMPARE WITH" chart shows **only District 73.9% and State 71.4%** — no `School` bar; sub-domain accordions unchanged.
- **Sub-domain nav rows** (`/app/domain/administration`): `Know more >` on the right instead of a bare chevron; status dot + indicator count unchanged.
- **PARAKH card** (District Officer @ Kachchh): `Know more` top-right; Board Result cards (not clickable) correctly show no CTA.
- **Navigation still works** when tapping `Know more` (verified drilling into the GSQAC area via the CTA). Mobile layout stays clean and compact.

---

## Pocket VSK rebrand + PARAKH / board / KPI changes — Claude Design (Pass 29)

Implemented the latest Claude Design output (`-HL5VTkjAIpB3_W6_dwunw`, `ui_kits/vsk-dashboard/index.html`; downloaded via curl after WebFetch couldn't parse the gzip). The structural redesign (compact header, hierarchy arrows, filter sheet, share icon, floating Compare, Compare sheet + Remove-comparison, GSQAC drilldown, chart baseline/units) was already shipped in Passes 26–28 and is preserved. This pass adds the new product deltas.

**Design URL implemented:** `https://api.anthropic.com/v1/design/h/-HL5VTkjAIpB3_W6_dwunw?open_file=ui_kits%2Fvsk-dashboard%2Findex.html`

### Branding & login (§1)

- App renamed **Pocket VSK** / **Education Department · Gujarat** (`i18n app.name/tagline`, en + gu).
- Login: header welcome → **"Welcome to Education Department, Gujarat"**, ID field → **"Teacher ID"**. Demo mode shows **role labels, never real names** — the verify step greets by role and drops the Name row; the greeting on home greets by role label.

### Role labels & greeting (§3)

- Officer roles relabelled **Cluster Officer / Block Officer / District Officer / State Officer** (en + gu). Greeting reads **"Good <time>, <Role>"** + **"You are viewing <level> level"** (no designation, no real name).

### N+1 comparison (§11)

- N+1 now compares to the next level UP and is labelled by the **level word** ("vs State", "vs District") rather than the entity name (was "Kachchh · 94%"). Rendered as a **bolder, higher-contrast pill** on home domain cards (`N1Chip`) and KPI listing rows (`KpiInlineRow`). Uses `peerLevelOf(level)`.

### Card CTA (§9)

- Cards now show a visible **"Know more →"** CTA (`KnowMore` in `kpiCardParts`) on the home domain cards and every KPI listing card, instead of relying on a chevron alone.

### Terminology (§17)

- **Dropout → Untracked Students** everywhere: `ret_dropout` name + value suffix ("students untracked"), the `adm_retention` sub-domain name, and the principal-dashboard i18n strings. Re-enrolment (`ret_reenroll`) stays as a sibling KPI in the same sub-domain.

### Administration KPI cleanup (§16)

- Removed the WASH/infra KPIs (**Urinals & Toilets, Handwash, Drinking Water**) — defs + PUBLISHED anchors. Added four LMS digital-usage KPIs: **GSHALA + GSHALA Plus usage · Smartclass usage · Computer lab usage · PAL usage** (source label `LMS`, deterministic anchors). Visits / observations / lesson-plan / diaries / SMC / library / ICT retained.

### Assessment result-first (§14)

- The **latest SAT result (SAT 2)** is now the Assessment hero; **"SAT reports downloaded in classrooms"** moved to the end of the domain (no longer the hero). The below-average sub-metric stays level-aware ("% below <level> average").

### PARAKH district category (§19) — new

- New self-contained `config/parakh.ts` (bands UDIT/UDAY/UNNAT/UDBHAV with stage + meaning + colours; exact Grade-3 district classification; deterministic static placeholders for Grade 6 & 9; board results). New `ParakhCard` (district home) + `ParakhScreen` (route `/app/parakh`) with a Grade 3/6/9 selector, band hero, four-band legend, and same-band district list. Factual only (no recommendations). Shown only when the scope is a **district**.

### Board results (§18) — new

- **Grade 10 (82.4% ↗) / Grade 12 (78.9% ↘)** result cards in the district-focus section — static, "API pending", no drilldown.

**Files changed:** `i18n/en.ts`, `i18n/gu.ts`, `screens/Login.tsx`, `screens/ScorecardHome.tsx`, `components/ui/kpiCardParts.tsx` (KnowMore + N+1 pill), `components/ui/KpiCard.tsx`, `components/ui/MultiMetricKpiCard.tsx`, `components/ui/DomainInsightCard.tsx`, `config/kpiCatalog.ts` (admin cleanup, assessment reorder, untracked rename), `config/frameworks.ts`, `lib/format.ts`, `config/parakh.ts` (new), `components/ui/ParakhCards.tsx` (new), `screens/ParakhScreen.tsx` (new), `components/ui/Icon.tsx` (Layers), `App.tsx`.

**Build:** `tsc --noEmit` ✓ (exit 0) · `vite build` ✓ (~12s).

**Unavoidable deviations / deferred (documented):**

- **Teacher/principal student-NAME lists (§12/§13)** — the design's chronic-absentee / below-avg / untracked name lists need new per-entity student mock data + role-branched list UI; the real provider has no student-name data. Deferred. Officers continue to see aggregate counts (already correct: "no individual student names above school level").
- **Grade 5 / Grade 8 CET attempt/merit + CGMS extras (§15)** — grade-scoped extra cards; deferred (needs grade-context extras wiring).
- **"No. of students below <level> avg." as a COUNT (§14)** — the real model carries this as a level-aware **% below <level> average** sub-metric; kept as %, not converted to a count.
- **Top-level "Untracked Students" home domain card** — kept under Administration → Untracked Students (terminology updated) rather than promoted to a standalone home domain.
- **Export/PDF desktop font-size bump (§5)** — export logic left untouched per "don't break export"; UI placement (Share icon) was already done in Pass 26.
- **PM SHRI ~20% subset (§4)** — the filter already drives data via the provider's existing PM SHRI logic; the precise 20%-subset seed was not re-authored.
- Per the brief, Playwright was **not** run; verification is by `tsc` + `vite build` + code reasoning.

---

## Comparison-bar baseline alignment fix (Pass 28)

**Bug:** embedded comparison bars weren't sharing a bottom baseline — bars whose unit label wrapped to 2 lines (e.g. `Sabar Kantha`, `Narayan Sarovar`) sat lower/higher than 1-line neighbours.

**Cause:** the bar strip used `flex items-end`, so each bar-item (a column of `[value][fixed track][label]`) was aligned by its _bottom = bottom of the label_. A 2-line label made that item taller, pushing its fixed-height track (and therefore the bar) up relative to 1-line items, so the baselines diverged.

**Fix** (single shared component `ComparisonBars.tsx` → `ChildComparisonBars`, used by domain cards, KPI cards, and the GSQAC School·District·State comparison):

- Strip is now `flex items-start`. Since the value label is single-line (fixed `h-3.5`) and the bar track is fixed-height, every track's BOTTOM lands at the same offset from the top → **all bar baselines align**, independent of label height.
- The fill stays bottom-aligned inside its fixed track (`items-end` on the track).
- The unit label sits below the baseline with a reserved 2-line height (`min-h-[2.4em]` + `line-clamp-2` + `break-words`), so it can wrap to two lines without moving the bar.
- Unchanged: narrow 24px fill, responsive spacing (1–4 spread · 5–8 balanced · 9+ horizontal scroll on the strip only — page never scrolls), and unit formatting (count→count, %→%, visits→decimal, score→score).

**Files changed:** `src/components/ui/ComparisonBars.tsx` (only — `KpiCompareSection.tsx` just passes data through; no change needed). No change to values/formulas/compare behavior/card layout/colors/routing.

**Build:** `tsc --noEmit` ✓ (exit 0) · `vite build` ✓ (~21s).

---

## Hierarchy arrow visibility + Compare empty-selection (Pass 27)

Two focused fixes.

### 1. Hide non-actionable hierarchy arrows (header navigator)

`HeaderNav` (in `HierarchyNavigator.tsx`) now **hides** the circled left/right arrows instead of rendering them disabled, using clean helpers:

- `canNavigateUp = parent != null` — `parent` comes from `trail` (clamped home→current in `useScope`), so it is null exactly when the user is at their own/root level. **Left arrow shows only when drilled below root.** (State user on State, District user on District, Block/Cluster/School user on their home → no left arrow; District user on Block/Cluster/School → left arrow.)
- `canDrillDown = !!childLevel && children.length > 0` — **Right arrow shows only when a real next child level exists and has children.** Section (no child level) and any childless scope (School/Grade with no child data) → no right arrow.
- The centre label is tappable (opens the picker) only when `canDrillDown`; otherwise it's a static label. Arrows are hidden (not greyed), and `justify-center` keeps the centre title aligned whether 0, 1, or 2 arrows are present.

### 2. Compare sheet — empty selection removes the comparison

`CompareSheet.tsx` now has **distinct `Select all` and `Clear all` pills** (the old single toggle only offered "Clear all" when everything was selected, so a partial selection could never be emptied). `Clear all` sets the selection to `[]` without closing the sheet; `Select all` restores all child units. Primary button logic (explicit `removeMode`):

- applied && selected == 0 → **"Remove comparison"** (enabled) → `onRemove` clears applied state, closes the sheet, hides all card charts; reopening starts with all child units preselected.
- otherwise → **"Apply (n)"**, disabled when selected == 0 (so a never-applied empty selection stays disabled).

**Files changed:** `src/components/layout/HierarchyNavigator.tsx` (HeaderNav arrow visibility), `src/components/compare/CompareSheet.tsx` (Select all / Clear all split + explicit primary-button logic). No provider/engine/state-architecture changes — the existing `trail`, `childLevel`, `children`, and `CompareContext.remove()` are reused.

**Build:** `tsc --noEmit` ✓ (exit 0) · `vite build` ✓ (~14s).

---

## Major design pass — header, filters, compare, charts, GSQAC, retention (Pass 26)

Large multi-area design implementation. **Design URL was unavailable** — `https://api.anthropic.com/v1/design/h/-ckHo6Stkgw7qbrOfl-9uw` returns HTTP 404 (verified via WebFetch and curl; body is literally "not found"), unlike the three earlier bundles. Implemented strictly from the exhaustive written brief (§1–20) plus the four provided SVG icons (`Docs/filter.svg`, `bar-compare.svg`, `right-side.svg`, `left side.svg`) and the prior same-family bundle for component patterns.

### Mobile header redesign (§1,3,4)

- New header on every page: **[logo] · centered entity-name + level with circled ‹/› arrows · [share] · [filter]**. Left arrow steps one hierarchy level up; the centre label / right arrow open the next-level picker (new `HeaderNav` in HierarchyNavigator, reusing the existing `ChildPicker`).
- **Logout button removed entirely** from the dashboard (use `/login` to switch user). No large "Pocket VSK" title on mobile (desktop keeps it), no role/designation in the header, no second action row.
- Greeting now reads **"You are viewing <level> level"** with no designation/role.
- 4 custom currentColor SVG icons added to the Icon module: `FunnelFilter`, `BarCompare`, `CircleChevronLeft/Right`, `Share`.

### Filter / Share / Compare placement (§5,6,7)

- **Filter sheet** (`FilterSheet`) consolidates **School Type** (officers only) + **Language** as large radio rows; bottom sheet on mobile / centred card on desktop. School-type and i18n logic unchanged — only the controls moved. The separate All-Schools and Language header pills are gone.
- **Share icon** replaces the mobile Export button (navigates to the existing export route).
- **Compare** is now a **mobile floating action** (bottom-right, bar-chart icon + selected-count badge) and a **desktop header button**; both hidden on `/app/kpi/*`.

### Card cleanup (§8,12)

- Removed the **"Tap Compare to view…" hint** everywhere (`KpiCompareSection` and `DomainInsightCard` now render nothing before Compare — cards stay compact, no reserved chart space). Charts still appear inside cards after Apply.
- Card text rules unchanged from prior passes: single-metric compact suffix (`225 students absent`, `96.3%`, `1.7`), multi-metric inline rows (`86.7% Present`), N+1 right-aligned, no source / Parent avg / Rate / Latest / Count / Score.

### Compare sheet + chips (§9,10)

- **Clear all / Select all** is now a large pill button (≈40px), not tiny text. **Remove comparison** appears when an applied comparison is cleared (closes sheet, hides charts) — preserved.
- **Compare-by chips** are larger (h-9 / ~36px, padded, clear selected state) and a long chip row scrolls horizontally; one selected metric's chart shows at a time.

### Comparison chart fixes (§11)

- Narrower bars (≈24px) inside a wider 54px cell; **2-line wrapping labels** (`Narayan Sarovar` instead of `Naray…`); responsive spacing (1–4 spread · 5–8 balanced · 9+ scroll); only the chart strip scrolls. Unit consistency preserved (count→count, %→%, visits→decimal, score→score, hours→hrs) — `KpiCompareSection` passes the metric/KPI unit through; added a `noSort` option so the GSQAC School·District·State comparison keeps its labelled order.

### Student Retention / Re-enrolment (§15,16)

- `ret_reenroll` ("Re-enrolment of Out-of-School Students") now displays **Daily · 1st Oct** on the KPI card and the detail page — never "Half-yearly" / "Jun 2026" / "11 Jun". `ret_dropout` shows **1st Oct** too. Implemented as a DISPLAY override (`displayFrequency` + a retention branch in `getLastUpdatedLabel`); KPI IDs/formulas/trend untouched.
- `studentRetentionVisible()` gating helper (real rule: visible Oct 1 → academic-year end), wired into `DomainView`'s sub-domain list; a documented demo override keeps retention visible so the "Daily · 1st Oct" cards are showcased.

### GSQAC / School Quality redesign (§13,14,17)

- New self-contained demo dataset `config/gsqac.ts` (does NOT touch the provider/engine or the real `sq_*` KPIs): overall **68.1% · 680.7/1000**, 5 GSQAC areas with marks + sub-domains + indicator lists + School/District/State comparison — exact brief values.
- The **School Quality** domain page now shows an overall GSQAC score card + **5 area score cards** (score % · official grade badge · sub-domain count), not operational KPI cards. New route **`/app/gsqac/:areaKey`** drills into an area: headline (score · grade · marks) + School·District·State comparison + **sub-domain score cards** that expand to their **indicator list** (scores, no trend). Official GSQAC grade bands (A5★…D) reused.

**Files changed:** `components/ui/Icon.tsx`, `components/layout/AppShell.tsx`, `components/layout/HierarchyNavigator.tsx`, `components/layout/FilterSheet.tsx` (new), `screens/ScorecardHome.tsx`, `components/ui/KpiCompareSection.tsx`, `components/ui/DomainInsightCard.tsx`, `components/ui/KpiCard.tsx`, `components/compare/CompareSheet.tsx`, `components/ui/ComparisonBars.tsx`, `lib/displayPolicy.ts`, `lib/trend.ts`, `screens/KpiDetail.tsx`, `screens/DomainView.tsx`, `config/gsqac.ts` (new), `components/ui/GsqacCards.tsx` (new), `screens/GsqacAreaView.tsx` (new), `App.tsx`, `i18n/en.ts`, `i18n/gu.ts`.

**Build:** `tsc --noEmit` ✓ (exit 0) · `vite build` ✓ (built in ~15s, 2442 modules).

**Adversarial review:** a 6-agent code-review workflow ran 59 checks across the six areas (header 10/0 · charts 9/0 · GSQAC 10/0 · cards 6/1 · compare 12/3 · retention 6/2). Fixes applied from it: `displayFrequency` now also used in `MultiMetricKpiCard` + the domain-hero meta line (future-proofs the Daily·1st Oct override); Compare-by chips bumped to 40px; dead `CompareHint` component + unused `compare.hint` i18n string removed. Two suggestions were intentionally not taken: adding `childEntities` to the CompareContext effect deps (would reset the selection on every render — current `[currentId]` is correct since children are derived from the scope), and the raf-cleanup micro-race (pre-existing, focus on an unmounted node is a no-op).

**Unavoidable deviations:**

- Design file 404 → implemented from the written brief (which is more detailed than a mock) + provided SVGs + prior bundle.
- Per "do not run Playwright", verification is by build + an adversarial code-review workflow, not browser screenshots.
- GSQAC drilldown uses the brief's self-contained dummy dataset (overall 68.1%) so the home School-Quality card's real `sq_*` value and the GSQAC drilldown overall can differ — intended, as the brief specifies the dummy GSQAC figures for the drilldown.
- Retention date-gating ships with a demo override (visible) so the "Daily · 1st Oct" cards are verifiable today (Jun 11); the real Oct-1 gate is implemented behind the helper.

---

## Balanced two-column KPI grid (Pass 25)

Fixed the uneven KPI-card layout on the domain / sub-domain listing pages. The old `PageGrid` (CSS grid, 1/2/3 columns, `items-start`) left awkward gaps and an uneven rhythm because cards of different metric counts (and the taller Compare-applied cards) flowed into fixed grid rows. Replaced it with a balanced two-column flex layout that distributes cards by estimated height.

### Balanced grid implementation

- New reusable `src/components/ui/BalancedKpiGrid.tsx`:
  - `getKpiCardLayoutWeight(kpi, compareApplied)` — height estimate: 1 metric = 1, 2 = 2, 3+ = 3; `+2` when Compare is applied (every card grows an embedded chart).
  - `splitIntoBalancedColumns(items, weightOf)` — greedy split: the first (hero) KPI is pinned top-left, then each remaining card drops into the **currently shorter** column.
  - `BalancedKpiGrid` — renders **one column on mobile** (`< md`, original logical order, natural scroll) and **two flex columns on desktop/tablet** (`>= md`, `flex flex-col gap-3` each, NOT grid rows).
- Cards keep their natural, content-aware height — the grid only decides _which_ column each card lands in. No `auto-rows-fr`, no `items-stretch`, no fixed large min-height. The existing per-tier `min-h` (compact/medium/tall by metric count) is unchanged.

### Behaviour

- **Desktop two-column balancing:** greedy by weight, hero pinned first. On Attendance this yields exactly the brief's example — Left: _Students absent_ · _Student attendance_ · _Schools & Class Sections_; Right: _Teacher attendance_ · _MDM_. On School Quality (6 KPIs) it yields a clean 3/3 split with the 2-metric CET & CGMS card balancing the singles.
- **Mobile one-column:** cards render in original KPI order, no reordering.
- **Compare applied:** weights bump `+2`, charts render inside cards, columns re-balance; only the chart strip scrolls — the page never scrolls horizontally.

**Files changed:** `src/components/ui/BalancedKpiGrid.tsx` (new), `src/screens/DomainView.tsx` (KPI listing → `BalancedKpiGrid`; reads `compareApplied` from `useCompare`), `src/screens/SubDomainView.tsx` (same). The sub-domain navigation grid and the home/scorecard layout are untouched (different components). No change to KPI data, formulas, titles, metric rows, Compare behaviour, hierarchy, filters, export, language, or KPI detail pages.

**Build:** `tsc --noEmit` ✓ (exit 0) and `vite build` ✓ (`built in 15.12s`). (The chained `npm run build` still trips the known vite `html-inline-proxy` race on Windows; each stage passes on its own.)

**Visual QA (Playwright, 1280 px + 390 px, before & after Compare):** Attendance and School Quality columns are balanced and tightly stacked with no mid-grid gaps; the hero KPI stays first; single-metric cards no longer strand awkward gaps; 2/3-metric cards align cleanly. Mobile stays one-column in logical order. Compare charts render inside cards and only the strip scrolls — no full-page horizontal overflow (desktop `1280 === 1280`, mobile `375 === 375`). No card content clipped.

---

## Single-KPI value text + route-aware header — Claude Design handoff (Pass 24)

Implemented the latest Claude Design output (`3UB6HIFoWB84PJ66UfWzcg`, `ui_kits/vsk-dashboard/index.html`) — two focused fixes from the latest review, layered on the already-built design.

**Design URL implemented:** `https://api.anthropic.com/v1/design/h/3UB6HIFoWB84PJ66UfWzcg?open_file=ui_kits%2Fvsk-dashboard%2Findex.html`

### 1. Single-KPI value row no longer repeats the title

- The single-metric value row used to repeat the full card title (`936 students absent from past 7+ consecutive days` directly under the same title). New `getSingleMetricValueSuffix(kpiId, lang)` in `lib/format.ts` returns a short suffix instead — **never the full title**.
- `att_chronic` → `students absent` (`4.7K students absent`); `ret_dropout` → `dropout students` (both count KPIs, where a bare number is ambiguous). All other single cards return `""` and show just the bare value — `100%`, `1.7`, `66.8` — under their title.
- `KpiInlineRow` now drops the value's trailing margin and the empty label span when the suffix is empty, so bare-value cards read cleanly. Multi-metric rows (`88.2% Present`, `100% Submitted`) are untouched; N+1 stays right-aligned.
- Home **domain** cards are unaffected (their header is the domain name, not the KPI title, so the full inline sentence there is not a repeat).

### 2. Homepage top section hidden on domain / KPI pages

- The big "homepage top section" (hierarchy selector + PM SHRI/All Schools + Language + Export) now renders **only on the scorecard** (`/app`). Driven by a route check in `AppShell` (`isHome = pathname === "/app"`). The block is unmounted (not hidden), so no blank space is left behind.
- Domain / sub-domain / KPI / export pages keep only the slim identity bar (logo · user · logout), so they start cleanly with their own content (`← Scorecard` / `KPIS IN ATTENDANCE`, or `← Back` / KPI title / trend chart).
- **Compare stays reachable on domain & sub-domain pages** (new `DomainCompareBar` — a slim right-aligned Compare pill) so the in-card "Tap Compare" hint still has a control. It renders nothing on the scorecard (Compare is in the full block there), on KPI detail, on export, or at a leaf scope — no leftover bar. This reconciles "hide the homepage top section" with "Compare must work on domain pages / be hidden only on `/app/kpi/*`".

**Files changed:** `src/lib/format.ts` (new `getSingleMetricValueSuffix`), `src/components/ui/KpiCard.tsx` (suffix instead of repeated title), `src/components/ui/kpiCardParts.tsx` (`KpiInlineRow` clean empty-label case), `src/components/layout/AppShell.tsx` (route-aware header + `DomainCompareBar`).

**Pages updated:** `/app` (full top section kept), `/app/domain/attendance|assessment|administration|school_quality` + sub-domains (top section hidden, Compare kept), `/app/kpi/*` (top section hidden, Compare hidden), `/app/export` (top section hidden).

**Build:** `tsc --noEmit` ✓ (exit 0) and `vite build` ✓ (`built in 13.14s`). (The chained `npm run build` still trips the known vite `html-inline-proxy` race on Windows when a second dev server holds port 5173; each stage passes on its own.)

**Manual checks (Playwright, 1440 px + 390 px):** `/app` keeps the full top section (desktop + mobile) — navigator, Compare/Export, All Schools, EN|ગુ, greeting. `/app/domain/attendance` (and the other three domains, shared header) drop the large block and start at `← Scorecard / KPIS IN ATTENDANCE` with no blank space; the chronic-absence card shows `4.7K students absent` (not the repeated sentence); MDM shows bare `100%`; multi cards show `88.2% Present` / `100% Submitted`. `/app/kpi/att_chronic` shows no top section and no Compare. Compare still opens the drawer, applies, renders embedded charts (`Compare · 10`, 5 district charts) on the domain page. No horizontal page overflow (desktop `1425 === 1425`, mobile `375 === 375`).

**Unavoidable deviation:** §2 of the brief lists Compare among the action rows to hide on domain pages, while §4 requires Compare to work on domain pages (hidden only on `/app/kpi/*`). The design file itself hides the whole action row on non-home views and applies Compare from the scorecard — its own author flagged this as a tradeoff. To satisfy §4 + the QA checks, this build keeps a slim Compare-only control on domain/sub-domain pages rather than removing it entirely; everything else in the homepage top block is hidden as specified.

---

## Inline KPI grammar + action-row priority — Claude Design handoff (Pass 23)

Implemented the latest Claude Design output (`boETLkYBGUSZ5TNRlsRrHg`, `ui_kits/vsk-dashboard/index.html`). The handoff's two newest iterations were a KPI-card alignment fix and a top action-row priority polish; the rest of the design (hierarchy navigator, domain cards, compare drawer, embedded charts, content-aware heights, bar spacing) was already in place from earlier passes, so this pass closed the two remaining gaps.

**Design URL implemented:** `https://api.anthropic.com/v1/design/h/boETLkYBGUSZ5TNRlsRrHg?open_file=ui_kits%2Fvsk-dashboard%2Findex.html`

### 1. Inline KPI row grammar (single + multi cards now align)

- Replaced the uppercase **label-above-value** pattern (the design's explicit "bad" case — `PRESENT` / `88.2%`) with one shared inline row: **`{value} {metric/descriptor}`** left, **N+1 peer comparison** right-aligned. New `KpiInlineRow` in `kpiCardParts.tsx` is used by both single- and multi-metric cards so they share one grammar and align across the grid.
- **Single-metric cards** read as a sentence — `4.7K students absent from past 7+ consecutive days`, `100% Students consuming Mid-day Meal (MDM)`, `1.7 No of CRCC/URC Visits per school` — value large/bold, descriptor smaller inline (via the existing `formatKpiCardTitlePhrase`, which lower-cases the leading word for count KPIs). N+1 pinned to the row end.
- **Multi-metric cards** — `88.2% Present` / `100% Submitted`, `93.4% Schools` / `95.6% Class sections`, `87.7% CET` / `84.9% CGMS` — same inline grammar, thin divider between rows, delta only where policy allows.
- No `Parent avg`, no source on cards; chart units still match KPI units (count→count bars, %→% bars, visits→decimal bars). Heights stay content-aware (Pass 22).

### 2. Top action-row priority: Compare > Export > All Schools > Language

- **Compare** is now the prominent action at all times: filled light-blue (`bg-primary-50`) with a brand border (`border-primary-500`), bar-chart icon, brand text — clearly stronger than the muted **All Schools** filter (it was previously a plain white pill until applied). Still toggles `Compare` ↔ `Compare · N`.
- **Export** stays solid blue and now sits in the same action group.
- **All Schools** (PM SHRI filter) stays a muted-grey secondary pill; **Language** stays a compact `EN | ગુ` toggle.
- **Mobile** is two tidy rows via flex `order` + 50% basis — Row 1 `[Compare] [Export]` (equal width), Row 2 `[All Schools ▾] … [EN | ગુ]` — no more scattered/wrapping controls. **Desktop** is one row `[All Schools] [Compare] [EN | ગુ] [Export]`.

**Key components changed:** `src/components/ui/kpiCardParts.tsx` (new inline `KpiInlineRow`, replacing `KpiMetricRow`), `src/components/ui/KpiCard.tsx` (single card → inline descriptor row), `src/components/ui/MultiMetricKpiCard.tsx` (rows → `KpiInlineRow` with dividers), `src/components/layout/AppShell.tsx` (`CompareControl` prominence + responsive 2-row/1-row action layout).

**Pages updated (shared components, so all at once):** `/app/scorecard` (home domain cards), `/app/domain/attendance`, `/app/domain/assessment`, `/app/domain/administration`, `/app/domain/school_quality`. KPI detail (`/app/kpi/*`) left unchanged — Compare hidden there, trend charts + source kept.

**Build:** `tsc --noEmit` ✓ (exit 0) and `vite build` ✓ (`built in 17.05s`). Note: the chained `npm run build` intermittently trips a known vite `html-inline-proxy` race on Windows (worsened by a second dev server holding port 5173); each stage passes cleanly when run on its own.

**Manual checks (Playwright, 1440 px + 390 px):** latest design implemented closely; mobile action buttons aligned in two rows (not scattered); Compare visually prominent, All Schools secondary, Export aligned; single + multi KPI cards read inline and align despite differing metric counts; School Quality single-metric score cards compact, CET & CGMS 2-metric card taller; compare drawer works (right-drawer desktop / bottom-sheet mobile); embedded charts appear only after Apply, with units matching KPI units; clearing all selected units after Apply shows **Remove comparison**; KPI detail pages do not show Compare; no full-page horizontal scroll (desktop `1425 === 1425`, mobile `375 === 375`).

**Unavoidable deviation:** the design uses a deterministic mock `Gujarat · X` state benchmark for the N+1 on KPI cards. The real app keeps its actual parent/peer-average value (`{parent} · X`) per "do not change provider/values", so the N+1 is hidden at State level (no parent) and shows the real parent average at lower levels — same right-aligned inline grammar, real data.

---

## Metric-count-based KPI card heights (Pass 22)

KPI cards are now content-aware: a single-metric card is compact instead of being stretched to a neighbouring 2/3-metric card's height (the School Quality KPI page — GSQAC score, Teaching and Learning, etc. — was the worst offender).

- **Grid no longer forces equal row height.** `PageGrid` dropped `sm:auto-rows-fr` on the `kpi` and `domain` columns and added `items-start`, so each card takes its natural height (a short single-metric card sits next to a taller multi-metric card without stretching).
- **Tiered card min-height by metric count.** `KpiCardShell` takes a `metrics` count and drops `h-full`; min-height tiers are 1 → `min-h-[9rem]` (compact) · 2 → `min-h-[12rem]` (medium) · 3+ → `min-h-[14rem]` (tall). `KpiCard` is always single; `MultiMetricKpiCard` passes its metric count. Verified heights (mobile, before Compare): single ≈ 187px vs 2-metric (CET & CGMS) ≈ 239px — clearly differentiated, no large blank middle.
- **Compact compare chart on single-metric cards.** `KpiCompareSection` now sizes the embedded chart by card type — single-metric bar height 78px, multi-metric 100px — so a single card doesn't grow as tall as a multi-metric card once Compare is applied.
- **Bar spacing unchanged** (Pass 21): 1–4 spread evenly, 5–8 balanced, 9+ scroll; only the chart strip scrolls, never the page (re-verified `scrollWidth === clientWidth` at 375 px).
- Applies everywhere via the shared components (home domain cards, domain/sub-domain KPI listings, Attendance/Assessment/Administration/School Quality). Nothing else touched — KPI values/names/formulas, provider, Compare selection, chart units, hierarchy, export, language, source rules, and KPI detail pages are unchanged.

**Files changed:** `src/components/layout/PageSection.tsx` (grid: no `auto-rows-fr`, `items-start`), `src/components/ui/kpiCardParts.tsx` (`KpiCardShell` tiered min-height + `metrics` prop), `src/components/ui/MultiMetricKpiCard.tsx` (passes metric count), `src/components/ui/KpiCompareSection.tsx` (chart height by metric count).

**Build:** `npm run build` ✓ (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Manual checks (Playwright, 1440 px + 390 px):** School Quality single-metric cards compact (no empty space) and visibly shorter than the 2-metric CET & CGMS card; row cards no longer equal-height; Compare charts still appear after Apply with a shorter strip on single-metric cards; 5 bars spread evenly; no full-page horizontal scroll; mobile cards compact.

---

## Responsive bar spacing in comparison charts (Pass 21)

Fixed the embedded comparison chart so bars adapt to the selected unit count instead of crowding on the left with empty space on the right. All cards share one component (`ChildComparisonBars`), so the fix lands everywhere at once (home domain cards + KPI/Indicator cards, single- and multi-metric).

- **Count-aware layout** in `ChildComparisonBars`: `1` → centred; `2–4` → `justify-between` (spread across the full chart width); `5–8` → `justify-around` (balanced, even margins); `9+` → fixed `gap-6` + horizontal scroll with the existing "scroll ›" hint. Bars keep a fixed slim width (40px, `shrink-0`) so they never stretch into blocks; `justify-*` distributes the extra space, with `gap-3` as a minimum so tight rows stay legible.
- **No page overflow:** the bar row is always `overflow-x-auto`, so a row that doesn't fit scrolls _inside the card_ — the page never scrolls horizontally (verified `documentElement.scrollWidth === clientWidth` at 375 px).
- Scroll threshold moved from 6 to 8 bars (the "scroll ›" hint now appears with the 9+ scroll tier).

**Files changed:** `src/components/ui/ComparisonBars.tsx`.

**Build:** `npm run build` ✓ (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Manual checks (Playwright):** 2 bars span the full width (not cramped left, no right gap); 5 bars distribute evenly; 10 bars (>8) use a fixed gap and scroll horizontally with a visible scroll track; no full-page horizontal scroll on mobile or desktop; re-applying a different Compare count re-flows correctly; behaviour identical on domain cards and KPI cards.

---

## Hide Compare button on KPI detail pages (Pass 20)

Focused visibility fix: the top-bar **Compare** control (button + `Compare · N` chip + drawer trigger) is now hidden on KPI/Indicator detail routes (`/app/kpi/*`), where comparison doesn't apply. It still shows on the scorecard home and the domain KPI-listing pages.

- `CompareControl` (in `AppShell.tsx`) now returns `null` when `useLocation().pathname.includes("/kpi/")` (in addition to the existing leaf-scope guard). No Compare button, no `Compare · 5` chip, and the drawer can't be triggered on detail pages.
- **Compare state untouched.** Only the header control is hidden; `CompareProvider`/`CompareMount` are unchanged, so an applied comparison reappears intact when the user returns to a domain or the home page.
- Nothing else touched: compare selector/charts, KPI detail charts/layout, hierarchy filters, Export, language toggle, All Schools (PM SHRI) filter, and logout all behave as before.

**Files changed:** `src/components/layout/AppShell.tsx`.

**Build:** `npm run build` ✓ (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Manual checks:** `/app/kpi/sq_gsqac`, `/app/kpi/att_chronic`, `/app/kpi/asm_SAT 1` → no Compare button; `/app/domain/*` and the home scorecard → Compare button still present; Export / language / All Schools / logout unaffected.

---

## Polish + behaviour pass — teacher SQ, Select-level, hierarchy back, Compare remove, inline values (Pass 19)

Focused update on the existing design (no redesign). Eight targeted changes, all verified in-browser (Playwright) and `npm run build` clean.

1. **School Quality hidden where it's NA.** The home GSQAC card now renders only when `output.percent != null` — so at grade/section (GSQAC is school-and-above) it disappears instead of showing "NA". Verified: a Teacher at Section sees only Attendance + Assessment (2-up, no empty grid slot); officers/school+ still see School Quality. (Implemented data-driven rather than role-gated, so the circled DEO-at-Section "NA" case is fixed too, while every valid GSQAC level keeps the card.)
2. **`Change <level>` → `Select <level>`.** `hierarchy.change` i18n now "Select {level}" (en) / "{level} પસંદ કરો" (gu) — drives the mobile drill chip and the desktop "Select Block/Cluster/School/…" button.
3. **Far-left `<` hierarchy-back button.** The mobile navigator pill already had it; added a matching leading `<` icon button on the desktop navigator. It steps up one level (`setScope(parent)`), removing the rightmost selected layer one at a time, and is hidden at the top of the user's scope. Verified: Block → click `<` → back to District; button then hidden.
4. **Compare "Remove comparison".** When a comparison is applied and the user clears all units, the primary button switches from a disabled "Apply" to an enabled **"Remove comparison"** (`compare.remove`). Clicking it closes the sheet, sets `applied=false`, hides all card charts, and re-preselects all children for the next open (`CompareContext.remove`). If no comparison was ever applied, "Apply" stays disabled at zero selection. Verified end-to-end.
5. **Inline value + descriptor on all domain cards.** `formatKpiCardTitlePhrase` now returns a descriptor for every unit (count lower-cases the leading word; others keep it), so every home domain card reads as one line: "208 students absent from past 7+ consecutive days", "80.6% SAT reports downloaded in classrooms", "1.7 No of CRCC/URC Visits per school". School Quality keeps "62.4% B" with the "GSQAC Score" eyebrow.
6. **N+1 moved to the right on KPI listing rows.** `KpiMetricRow` (multi-metric) and the single-metric `KpiCard` now place the value on the left and the N+1 comparison (+ any allowed delta) right-aligned — "85.2% … Kachchh · 94%" — instead of stranding the peer in the middle. No "Parent avg", no source, no card graphs until Compare is applied.
7. **Compare hint stays adaptive** ("Tap Compare to view {district/block/cluster/…}-wise chart") and **charts remain inside cards only** (no standalone bottom chart; only the chart strip scrolls; the page does not). Unchanged from Pass 18, re-verified.
8. **Visual language preserved** — white rounded cards, soft shadows, grey-blue page, blue actions, RAG status colours. No new design language.

### Files changed

`screens/ScorecardHome.tsx` (hide NA School Quality; drop heroName), `components/ui/DomainInsightCard.tsx` (always-inline InputHead), `lib/format.ts` (`formatKpiCardTitlePhrase` returns all units), `components/layout/HierarchyNavigator.tsx` (desktop `<` back button), `components/ui/kpiCardParts.tsx` (`KpiMetricRow` N+1 right), `components/ui/KpiCard.tsx` (value left / N+1 right), `components/compare/CompareContext.tsx` (`remove`), `components/compare/CompareSheet.tsx` (Remove-comparison button), `components/layout/AppShell.tsx` (wire `applied`/`onRemove`), `i18n/en.ts` + `i18n/gu.ts` (`hierarchy.change`→Select, `compare.remove`).

### Build & verification

`npm run typecheck` clean · `npm run build` ✓ (only the pre-existing entities-seed chunk-size warning). Playwright: Teacher/Section (SQ hidden, inline values), DEO desktop (Select Block, inline cards, no `<` at top), Block (`<` back works, "Select Cluster", cluster-wise hint), Compare apply → clear all → "Remove comparison" → charts gone + cards compact, KPI listing N+1 right-aligned. No console errors; no horizontal page overflow (mobile action row wraps).

---

## Compare action — gated embedded charts (Claude Design `vsk-dashboard`, Pass 18)

**Design implemented:** the Claude Design handoff `swiftchat-design-system/ui_kits/vsk-dashboard/index.html` (run `N4v5-UUHsk3kJJDtUfMTww`), read in full with its chat transcript, `dashboard.jsx`, `app.jsx`, `data.js`. This iteration turns the always-on embedded charts into a **Compare action**: charts are hidden by default and appear only after the user picks which n-1 child units to compare and applies. Implemented against the existing provider/engine, KPI catalog, hierarchy, PM SHRI, i18n and access control (no product-logic changes).

### Behaviour (matches the design)

- **Compare is an action, not a page.** New `Compare` button in the top action row (`Compare` → `Compare · N` once applied; reopens the selector). Hidden at leaf scopes (nothing below to compare). No route, no nav entry.
- **Charts hidden by default.** Every domain card (home) and KPI card (domain/sub-domain pages) shows a compact dashed hint _"Tap Compare to view {level}-wise chart"_ instead of a chart — no reserved empty space.
- **Selection UI** (`CompareSheet`): a **bottom sheet on mobile, right-side drawer on desktop** (one CSS-responsive component, portaled to `<body>` past the header's backdrop-blur). Title "Compare {Level}s" + "Select units to show in the charts", search, "N of M selected" + Select all / Clear all, **all child units preselected on open**, Cancel + Apply (Apply disabled with nothing selected).
- **Level-specific + resets on scope change** (`CompareContext`): applying compares the selected n-1 units; changing scope (drill up/down) resets the selection and re-preselects the new scope's children, so a District's block selection never leaks into a Block's clusters.
- **After Apply** each card reveals an embedded bar chart of the selected units only, worst-first, RAG-coloured, value labels, abbreviated unit labels, tap-a-bar to drill. Chart strips scroll horizontally inside the card (a "scroll ›" hint appears beyond six bars); **the page never scrolls horizontally** (verified at 375 px after fixing an action-row overflow by letting it wrap on mobile).
- **Unit consistency (critical):** the chart uses the KPI/metric's OWN unit, never a mismatched %. New `engine.getKpiChildSeries` computes each selected child's value in the KPI's unit (count→count, %→%, visits→`ratio`, score→score). Verified: "Students absent · 225" → count bars (64/62/56/53/53), not percentages; CRCC/URC visits cap at 3; GSQAC/score in score; % KPIs in %.
- **Multi-metric KPI cards** (Teacher/Student attendance, SAT 1/SAT 2/ORF, CET, CGMS, attendance submission, GSQAC D5) show **"Compare by [metric]" chips**; switching a chip re-renders the chart in that metric's unit (one chart at a time — no mixed-unit stacks). Verified Present↔Submitted switching.
- **Standalone bottom comparison panel removed** from domain pages (`ChildComparisonPanel` deleted); all comparison now lives inside the cards.
- Preserved: KPI values/IDs/formulas, hierarchy + drill-down navigator, PM SHRI filter, language toggle, Export action, N+1 peer chips, RAG-status headlines, no source on cards, no line/sparkline graphs on cards.

### Components changed

New: `components/compare/CompareContext.tsx` (provider + `useCompare`), `components/compare/CompareSheet.tsx`, `components/ui/KpiCompareSection.tsx`. Changed: `components/layout/AppShell.tsx` (Compare button + sheet + provider; action-row wrap fix), `components/ui/ComparisonBars.tsx` (rewritten to the design's unit-aware worst-first BarChart; reference line dropped), `components/ui/DomainInsightCard.tsx` (chart gated behind Compare + dashed hint), `components/ui/KpiCard.tsx` + `MultiMetricKpiCard.tsx` + `kpiCardParts.tsx` (compare slot, `CompareHint`, shell split so the summary button no longer wraps the chart's buttons), `screens/ScorecardHome.tsx` + `screens/DomainView.tsx` (gating; standalone panel removed), `engine/index.ts` + `hooks/index.ts` (`getKpiChildSeries` / `useKpiChildSeries`), `lib/colors.ts` (`compareBarStatus`), `i18n/en.ts` + `i18n/gu.ts` (Compare strings; pruned dead comparison keys). Deleted: `components/ui/ChildComparisonPanel.tsx`.

### Build & verification

- `npm run typecheck` clean · `npm run build` ✓ (only the pre-existing entities-seed chunk-size warning).
- Browser smoke test (Playwright, Block officer, 375 px + 1440 px): charts hidden by default with hint → Compare opens the preselected checklist (bottom sheet mobile / right drawer desktop) → Apply reveals per-card charts; "Compare · 5" state; count KPI shows count bars; multi-metric "Compare by" chips switch the chart; no page horizontal overflow; no console errors. The fetched design bundle was read then removed after extraction (reproducible from the URL).

### Deviations from the design

- **App bar** keeps the real `logo-vsk.png` + "Pocket VSK" wording (the prototype used a GraduationCap stand-in because the logo wasn't in its upload).
- **PM SHRI** stays a 3-option Select (All / PM SHRI / Non-PM SHRI), not the prototype's 2-state toggle (preserves existing product logic).
- **KPI cards keep the N+1 peer chip** ("Kachchh · 94%") which the prototype omitted — it is existing product context and not disallowed by the design.
- **Honest empty data:** where a selected level genuinely lacks a KPI's data (e.g. Administration at grade level), the card shows "Not tracked at this level" rather than fabricating bars (the prototype's data was illustrative).

---

## Design-handoff alignment — Claude Design `vsk-dashboard` kit (Pass 17)

**Source:** a Claude Design handoff bundle (`swiftchat-design-system`, fetched from the design URL) whose `ui_kits/vsk-dashboard/index.html` is a recreation of _this app's_ home, iterated against the same brief. Read the bundle README, the chat transcript, and the kit source (`dashboard.jsx`, `app.jsx`, `data.js`) per the README's instructions, then aligned the production home to the design's specific visual decisions. Pass 16 already delivered the structure (navigator, embedded charts, greeting, action row); this pass adopts the remaining visual differences. The bundle's app bar used a GraduationCap stand-in (no logo in the upload) — kept our real `logo-vsk.png`; kept our 3-option PM SHRI Select over the design's 2-state toggle (more functional). The bundle's illustrative "Admin areas / GSQAC domains" data was mapped onto our **real** sub-domain / GSQAC-domain scores, never invented.

### Aspects implemented

1. **N+1 comparison as a boxed chip** — home domain cards now show `vs {parent} · {value}` in a rounded grey chip (`bg-surface-sunken`, "vs" label + bold tnum value) instead of the plain muted line, matching the design's prominent treatment. New `N1Chip` in `DomainInsightCard.tsx`; `common.vs` i18n key (en "vs" / gu "vs"). (KPI cards on detail/domain pages keep the compact `Kachchh · 94%` line — the chip is the home-card treatment.)
2. **Headline value colored by RAG status** — the big number reads in its status colour via `valueToneClass(status)` (green good / red at-risk / neutral for amber·NA), matching the design's `--rag-{status}-text`. Verified: School Quality 48.2% renders red with a C badge at an at-risk school; Attendance count renders green where the engine grades it healthy.
3. **"scroll ›" affordance** on the embedded bar chart when there are more than 6 child units (`ChildComparisonBars`), alongside the kept dashed reference line (current scope's own value — transcript wants scope context). `common.scroll` i18n key. Verified at school level (8 grades) and is consistent with the 33-district horizontal scroll.
4. **Sub-area fallback bars** — a domain with no child-unit data at the current level now shows its own sub-areas instead of an empty state (the design's pattern). Administration at school level → "Areas needing attention" from the four Administration sub-domains (School Observation · Classroom Observation · Student Retention · CPD), using real `subScores`. School Quality keeps its existing GSQAC D1–D5 fallback. New `compare.areasFocus` i18n key.
5. **Greeting aligned to the design** — "Good evening, {name}" + "{designation} · viewing {level} level" (uses the user's real designation, e.g. "Block Resource Coordinator (BEO)"). Removed the VskBadge and the duplicated entity-name/parent lines (those live in the hierarchy navigator). New `hierarchy.viewingLevel` key.
6. **Chart title row tidied** — dropped the redundant "Lowest first" caption from the card (worst-first ordering reads from colour + the bars; the scroll hint now carries the affordance), matching the design's single-title row.

### Files changed

`components/ui/DomainInsightCard.tsx` (N1Chip, RAG headline, title row), `components/ui/ComparisonBars.tsx` (scroll affordance), `screens/ScorecardHome.tsx` (greeting, sub-area fallback), `i18n/en.ts`, `i18n/gu.ts` (`common.vs`, `common.scroll`, `compare.areasFocus`, `hierarchy.viewingLevel`).

### Build & verification

- `npm run typecheck` clean; `npm run build` ✓ (only the pre-existing entities-seed chunk-size warning).
- Browsed (Playwright) as **Ila Patel** (Block / BRC), 390px + 1440px: block (cluster bars), cluster (school bars, red at-risk bar), and school (grade bars with "scroll ›", Admin "Areas needing attention", GSQAC "GSQAC domains needing attention" with red worst bar) — N+1 chips, RAG headlines, and design-aligned greeting all render correctly on mobile and desktop; no console errors. The fetched design bundle was read, then removed after extraction (reproducible from the URL).

---

## Homepage redesign — smart hierarchy navigator + per-card embedded charts (Pass 16)

**Goal:** redesign the home page mobile-first (≈95% of users are on a phone) against the supplied mobile + desktop layout references, keeping the established VSK/SwiftChat visual system. Government-school monitoring dashboard — calm, practical, readable in 6 seconds.

### Reference layouts used

- **Mobile reference (primary):** ~390px app frame — top app bar (logo · logout), a compact hierarchy pill (‹ current ›), an action row (All Schools · EN/ગુ · Export), a short greeting, then full-width vertical domain cards each with an embedded horizontal-scroll bar chart. No bottom standalone "needs attention" card.
- **Desktop reference:** sticky top bar (logo + identity · clean breadcrumb · filter/language/export/logout), greeting row, then a 2-column (2×2) grid of wide, information-rich domain cards.

### 1. Smart hierarchy navigator (replaces the long breadcrumb)

New `components/layout/HierarchyNavigator.tsx`, mounted in the app shell in place of `Breadcrumb` (deleted).

- **Mobile:** a rounded pill — `‹ up · current scope · drill ›`. Left steps **up one level** (bounded by the user's home scope; disabled at the top, labelled "You are at the top of your scope"). The centre + right open a **bottom-sheet picker** of the next level down.
- **Desktop:** a clean inline trail (`Block · Lakhapat / Cluster · Dayapar`, current bold, each step navigable) plus a `Change {child level}` control that opens the same picker.
- **Picker:** a bottom sheet on mobile (grab handle, thumb-reachable, ≥48px tap rows), a centred card on desktop; search appears for long lists (districts/schools); Esc + backdrop + ✕ close; body scroll locked while open.
- **Behaviour by level** matches the spec: State→District, District→Block, …, School→Grade, Grade→Section; left always returns to the parent (within scope). Drilling sets scope and returns to `/app`.
- **Bug fixed during QA:** the sheet is rendered through a **React portal to `document.body`**. The sticky header uses `backdrop-blur`, and `backdrop-filter` creates a containing block for `position: fixed` descendants, which was pinning the sheet to the header instead of the viewport.

### 2. Top action row

- `All Schools / PM SHRI` filter now uses a **sliders (filter) icon**, not the decorative sparkle (`PmShriFilter`).
- Compact `EN | ગુ` segmented toggle and a primary **Export** button sit in the same row. Logout is a small muted circular icon in the identity row (does not compete with Export).
- Mobile: navigator takes its own line, the actions wrap beneath with Export pushed right. Desktop: navigator + actions share one row.

### 3. Greeting (corrected, context-aware)

`ScorecardHome` shows a compact block (not an oversized hero): `Good evening, {user name}` / `Viewing {Level} · {Entity}` / `Parent: {parent}`. Uses the signed-in **user's name** (e.g. "Ila Patel"), fixing the old "Good evening, State" artefact; falls back to the role label if no name.

### 4. Domain cards → `DomainInsightCard` (new), with embedded charts

New `components/ui/DomainInsightCard.tsx` replaces the home use of `DomainSummaryCard` + `GsqacSummaryCard` (both deleted). One card per domain: a clickable head (icon · name · `Daily · 10 Jun` · headline KPI · N+1 · policy-gated delta) that drills into the domain, **plus its own embedded child-unit bar chart** under a hairline divider. The outer element is a `<div>` (head and each bar are separate buttons, so domain-drill and child-drill stay distinct).

- **Attendance** (count hero) reads as a sentence: "**15** students absent from past 7+ consecutive days" (225 at block, 4.7K at state — real data).
- **Assessment / Administration** (% / ratio) keep value + label ("86.1% · SAT reports downloaded in classrooms", "1.2 · No of CRCC/URC Visits per school").
- **School Quality** keeps the GSQAC score + official grade badge + allowed `↗ 1.4% this year`.
- N+1 comparison on every card (`Nargadh · 62`, etc.). No source text, no card-level line graph/sparkline (all from the Pass-15 display policy, unchanged).

### 5. Embedded child-unit bar charts (one per card; standalone strip removed)

Each card's chart reuses `ChildComparisonBars` (`height: 96`) showing the **n-1 child units** for that domain, lowest first, status-coloured (red worst → green best, lower-is-better honoured), with a dashed reference line for the current scope's own value, and **tap-a-bar to drill** into that unit.

- Level-aware titles: "Districts/Blocks/Clusters/Schools/Grades needing attention" (`compare.focusTitle`).
- **Horizontal scroll** when units are many (verified at State: 33 districts scroll with a visible track; ≤10 clusters/schools stretch to fill).
- **School Quality at school level** has no child GSQAC (grades aren't graded), so it falls back to the **5 GSQAC domains** ("GSQAC domains needing attention"); an empty state ("No lower level to compare") shows where a level genuinely has no comparable children (e.g. Administration at school level).
- The old standalone bottom `ChildComparisonPanel` on the home page is **removed** (the component is kept — `DomainView` still uses it in-context).

### 6. Layout / responsiveness

- Home domain grid changed to `grid-cols-1 sm:grid-cols-2` (full-width cards on mobile, **2×2 on tablet/desktop** per the desktop reference), since each card now carries a chart.
- New `sheet-up` keyframe (tailwind) for the mobile bottom sheet; `scale-in` for the desktop centred card; both respect `prefers-reduced-motion`.
- 44px minimum tap targets on the navigator arrows and picker rows. No horizontal page overflow at 390px; Gujarati text expansion verified (labels + Gujarati numerals, no breakage).

### 7. Files changed

New: `components/layout/HierarchyNavigator.tsx`, `components/ui/DomainInsightCard.tsx`.
Changed: `components/layout/AppShell.tsx`, `components/layout/PmShriFilter.tsx`, `components/layout/PageSection.tsx`, `components/ui/Icon.tsx` (+ `SlidersHorizontal`, `X`), `components/ui/index.ts`, `screens/ScorecardHome.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `tailwind.config.ts`.
Deleted: `components/layout/Breadcrumb.tsx`, `components/ui/DomainSummaryCard.tsx`, `components/ui/GsqacSummaryCard.tsx`.

### 8. Build & verification

- `npm run build` ✓ (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).
- Browsed (Playwright) as **Ila Patel** (Block / BRC) and **State VSK Cell** at 390px and 1440px, EN + ગુ: hierarchy pill + drill sheet, drill-up/down, all four embedded charts, GSQAC grade + delta, state-level horizontal scroll, no console errors.

### 9. Acceptance criteria — all met

Mobile + desktop reference layouts (1, 2, 12, 13) · smart navigator replaces breadcrumb (3) · clear drill-up/down (4) · clean top actions (5) · corrected greeting (6) · four redesigned domain cards (7) · embedded child bar chart per card (8) · standalone bottom card removed (9) · N+1 on every card (10) · no card-level line graphs / no source (11) · `npm run build` passes (14) · QA report updated (15).

---

## Officer-first redesign — nav removal, display policy, embedded comparisons (Pass 15)

**Source of truth:** `transcript.pdf` (June 2026 product-review transcript, 5 pages — extracted and applied in full), cross-checked against `Docs/GJ_Unified_App_KPIs.xlsx` (Sheet1, 45 rows) and `Docs/GSQAC_Report_2024_25_English.pdf`. Where the transcript supersedes the sheet (CRCC/URC max 3 vs the sheet's "Max = 2"), the transcript wins.

### 1. Navigation & app shell

- **Standalone Leaderboard and Compare are removed.** Deleted `screens/Leaderboard.tsx`, `screens/CascadeComparison.tsx`, `components/ui/Leaderboard.tsx`, `components/ui/SchoolRiskTable.tsx`, `components/ui/MultiSelect.tsx`. `/app/leaderboard` and `/app/compare` now `<Navigate to="/app" replace />` (old links land safely on the scorecard).
- **No navigation rails at all** (transcript: "no navigation buttons"): the desktop side nav and the mobile bottom nav are gone; content gets the full width.
- **App shell = identity row + one compact filter/action row**: `[Hierarchy drill-down ▾] [All Schools / PM SHRI ▾] [EN|ગુ] [Export]`. The drill-down is a new `ScopeDrilldown` select (children of the current scope, one level down; breadcrumb handles going back up). PM SHRI moved out of the identity row into the filter row (officers only, unchanged logic). **Export is a top-right action**, hidden while on the export page itself; the Export screen gained a Back link.
- Orphaned engine surface removed with the screens: `getPeerLeaderboard`, `getOverallCascade`, `getKpiCascade`, `getKpiAmong`, `engine/rollup.ts`, `CascadeRow` type, and the `usePeerLeaderboard`/`useOverallCascade`/`useKpiCascade` hooks. `getChildLeaderboard`/`buildLeaderboard` are kept — they power the new embedded comparisons.

### 2. Homepage redesign

- **Top Indicators section removed** (`HeroKpiStrip.tsx` deleted; `topIndicator` flag removed from types/catalog; `ogm.topIndicators`/`ogm.heroKpis`/`perMonthMax2` i18n keys removed).
- **Domain cards in ONE row** on wide screens: Attendance · Assessment · Administration · School Quality (`PageGrid cols="domain"` → `xl:grid-cols-4`, 2-up on tablet, stacked on phone).
- **Sentence-style hero copy** for count indicators: the Attendance card reads "**4.7K students absent from past 7+ consecutive days**" (new `formatKpiCardTitlePhrase` helper — count units only; % / ratio heroes keep value + label, so "1.8 no of CRCC/URC visits…" never happens).
- **Embedded child comparison** ("Which districts need attention?"): bar chart of every n-1 unit by input composite, lowest first, status-coloured, dashed line marking the current scope's own average, tap a bar to drill down. Horizontal scroll kicks in when units × 52px exceed the panel width (33 districts scroll; ~10 blocks stretch to fill).

### 3. KPI card display policy (central, in `src/lib/displayPolicy.ts`)

- **`shouldShowCardDelta(kpi)`** — single arbiter for card deltas: `suppressDelta` → false; Daily cadence → false; assessment domain → only SAT 1/SAT 2/CET/CGMS (and their sub-metrics; FLN/ORF excluded); school_quality → only the GSQAC score; everything else (all of Attendance by cadence, all of Administration incl. School Observation) → false. Edge handled: sq_d5's CET/CGMS rows reuse `asm_cet__participation`/`asm_cgms__participation` series but keep `domain_id: school_quality`, so they stay delta-free. Consumed by `KpiCard`, `MultiMetricKpiCard`, `DomainSummaryCard` and both Export delta paths.
- **`shouldShowSource(context)`** — source renders only on the KPI detail page (title meta: `Yearly · Sep 2025 · Xamta bot`) and in the Export tables; **no card shows source** (the `KpiSourceLine`/`KpiContextTile` parts, `SourceBadge` and `KpiMetaRow` were deleted so no card can grow one back).
- **No "Parent avg" label** — peer comparison is `Kachchh · 94%` everywhere (Export summary tiles now use the same `{parent name} · {value}` grammar).
- **No RATE/LATEST/COUNT/SCORE labels** (i18n keys deleted), **no graphs/sparklines in cards** (`Sparkline.tsx` deleted; recharts only in detail-page `TrendChart`).
- **Delta or date once per card**: the frequency + date chip (`Daily · 10 Jun`, `Yearly · Sep 2025`) lives only in the card header; deltas (where allowed) sit beside the value; value colour follows the delta only when a delta is actually shown, neutral otherwise.
- **% in deltas**: `FrequencyDelta` inline variant now renders `↗ 1.1% this year` for percent metrics (count/score/hours stay bare).

### 4. KPI naming / copy

- "Students absent from past 7+ **consecutive** days", "Teacher attendance", "Student attendance" — verified app-wide (already renamed in Pass 8; no stale strings remain).
- CET/CGMS metric label **"Result" → "Success rate of CET" / "Success rate of CGMS"** (cards, detail formulas, and the parent formula copy reworded too; Gujarati: "CET/CGMS સફળતા દર").
- "% below `<level>` average": metric label is now "% below hierarchy average" resolved per scope (state→"% below state average" … section→"% below section average") via `resolveMetricLabel`, which now applies **both** the English and Gujarati replacement to whichever string renders — the literal word "hierarchy" cannot reach the UI in either language. New `formatBelowLevelAverageLabel(level, lang)` helper exported for future callers. Sub-metric Gujarati formulas now actually render in gu mode (`KpiDef.formula_gu` propagated through `metricKpiDef`).

### 5. FLN / ORF correction

- Frequency changed `Monthly` → `Yearly` (transcript: "random, mostly annually, 2–3×/year") — card chip now `Yearly · 2026`, detail trend uses a yearly axis, description documents the irregular cadence, formula notes the "this year's latest − last year's first" trend logic. **No delta on any of its three card metrics** (policy).

### 6. Domain pages — embedded n-1 comparison

All four domain pages (`/domain/attendance`, `assessment`, `administration`, `school_quality`) render a `ChildComparisonPanel` ("Compare Blocks · Attendance") under the indicator grid (outside the Administration sub-domain conditional, so it appears there too): each child unit's **domain score** as a bar, lowest first, grade-band colours, dashed current-scope reference line, tap-to-drill, horizontal scroll for many units. School Quality uses the GSQAC score per child. This is dashboard content, not the old Compare feature — no separate page exists.

### 7. KPI detail pages

- Source on detail only; trend charts kept; every chart titled (`AVG SCORE · YEARLY TREND`, `% BELOW DISTRICT AVERAGE · YEARLY TREND`, `30-day trend: …`).
- `/kpi/att_chronic` "How it's calculated" is now exactly: _"Counts students who have been absent for 7 or more consecutive school days as of the selected date."_ — the "Shown as an absolute count (summed up the hierarchy); the supporting rate = …" sentence is gone (also scrubbed from `ret_dropout` and `sq_gsqac` copy).
- No comparison overlays in single-metric charts; the only multi-line chart is the intentional GSQAC sq_d5.

### 8. GSQAC

- **Sub-domain breakdown removed everywhere**: `GsqacBreakdown` component, `GSQAC_SUBDOMAINS` config and the `kpi.subdomains` i18n key deleted — no grey pill/list blocks remain.
- **sq_d5 lines clearly differentiated**: CET deep teal `#0E7490`, CGMS purple `#7C3AED` (categorical `MULTI_LINE_HEX` palette by index; the old grade-colour-by-value logic that produced two near-identical greens is gone, and the now-unused `gsqacGradeHex` was removed).
- Delta only on the **GSQAC score** (home card improvement + detail); D1–D5 cards show `Yearly · 2026` instead.
- Official grade bands untouched (`A5★ >95 … D >0`); grade legend still on the School Quality page.

### 9. Administration

- **CRCC/URC visits capped at 3** (transcript supersedes the sheet's Max 2): target "Max 3 / month", formula "(max 3)", mock provider hard-caps ratio values at 3, trend history clamps ratio at 3; anchors (1.4–1.9) sit realistically inside the cap. No "max 2" string remains.
- **School Observation deltas removed** (whole administration domain is delta-free by policy).

### 10. Files changed

`App.tsx`, `components/layout/AppShell.tsx`, `Breadcrumb.tsx`, `PageSection.tsx`, `components/ui/{KpiCard,MultiMetricKpiCard,kpiCardParts,DomainSummaryCard,ComparisonBars,ChildComparisonPanel(new),DataBadges,Select,index}.tsx/ts`, `screens/{ScorecardHome,DomainView,KpiDetail,Export}.tsx`, `config/kpiCatalog.ts`, `types/index.ts`, `engine/{index,score}.ts`, `hooks/index.ts`, `data/provider/mockProvider.ts`, `lib/{displayPolicy(new),format,trend,colors}.ts`, `i18n/{en,gu}.ts`. Deleted: `screens/{Leaderboard,CascadeComparison}.tsx`, `components/ui/{Leaderboard,SchoolRiskTable,HeroKpiStrip,Sparkline,MultiSelect}.tsx`, `engine/rollup.ts`.

### 11. Build & verification

- `npm run build` ✓ (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).
- Visual pass in-browser (state login `24`/`0000`): home (desktop+mobile, EN+ગુ), attendance/assessment/school-quality domain pages at state & district scope, `att_chronic`/`asm_SAT 1`/`sq_d5` detail, Export — all matched the spec.
- Adversarial multi-agent verification over the 24 acceptance criteria: 42 checks confirmed; 1 blocker found and fixed (Gujarati branch of `resolveMetricLabel` could leak the literal word "hierarchy" in detail formulas — resolver made language-proof + `formula_gu` propagated), plus minor fixes (language toggle moved into the filter row per the preferred top-bar order; Export summary tile peer grammar; `shouldShowSource` actually wired into KpiDetail/Export; bar-chart label-height constant corrected; stale gu `scorecard.inputs` translation; dead exports pruned).

### 12. Assumptions

- The seed contains 10 districts (not all 33); the comparison chart's horizontal scroll is driven by `bars × 52px`, so a full 33-district feed scrolls as specified.
- Comparison bars use the **domain score** (and input composite on home) as the comparable measure across child units — normalized 0–100, grade-band coloured; per-KPI child comparison can be added later on the detail pages if product wants it.
- `KpiDef.target` ("Max 3 / month") remains informational config; it is not rendered on cards (the detail formula carries the cap).
- Sentence-style hero copy keeps the big number first in Gujarati too ("૮૮૦ છેલ્લા 7+ સળંગ …") — a deliberate big-number-first card treatment.
- Old `/leaderboard` / `/compare` deep links redirect to the scorecard rather than 404 (backward compatibility).

---

## sq_d5 trend lines coloured by GSQAC grade scale (Pass 14)

The two lines on `kpi/sq_d5`'s "Yearly trend: CET & CGMS (State Exams)" graph are now coloured **by the GSQAC grade scale** — each line takes the colour of its latest value's grade band (same palette as the grade-scale legend on the School Quality page), replacing the previous fixed blue/pink.

- Promoted the report-faithful band palette to `src/lib/colors.ts` as `GSQAC_BAND_HEX` + `gsqacGradeHex(grade)` (single source of truth); `GsqacGradeLegend` now imports it instead of a local copy.
- `GsqacMultiTrend` colours each series via `gsqacGradeHex(gradeFor(value, GSQAC_BANDS).grade)`; removed the `GSQAC_LINE_COLORS` constant.

**Files changed:** `src/lib/colors.ts` (shared palette + helper), `src/components/ui/GsqacGradeLegend.tsx` (use shared map), `src/screens/KpiDetail.tsx` (grade-based line colour), `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

> Note: high participation values keep both CET & CGMS in the green A-tier, so the lines are distinct green shades (e.g. A4★ vs A3★); the chart legend labels disambiguate them.

---

## sq_d5 CET/CGMS lines reuse the Assessment participation data (Pass 13)

The two lines on `kpi/sq_d5`'s "Yearly trend: CET & CGMS (State Exams)" graph (and the two rows on its School Quality card) now use the **exact same series** as the "Participation · Yearly trend" graphs on `/kpi/asm_cet` and `/kpi/asm_cgms`.

- New optional `KpiMetricDef.sourceKpiId` — a metric can reuse another (sub-)indicator's series verbatim while keeping its own label. `metricKpiDef` adopts that id, so value, benchmark **and** trend (seeded on `kpi.id`) are byte-identical to the source.
- `sq_d5` metrics: **CET** → `sourceKpiId: "asm_cet__participation"`, **CGMS** → `sourceKpiId: "asm_cgms__participation"`. Previously these were derived from the seed's D5 score (ratios 0.87/1.13); that derivation and the `sq_d5__cet`/`sq_d5__cgms` anchors + provider special-case are removed (no longer referenced).
- Result: sq_d5's CET line ≡ asm_cet Participation; sq_d5's CGMS line ≡ asm_cgms Participation — identical curve and values at every level.

**Files changed:** `src/types/index.ts` (`sourceKpiId`), `src/engine/score.ts` (`metricKpiDef` id), `src/config/kpiCatalog.ts` (sq_d5 metrics + removed anchors), `src/data/provider/mockProvider.ts` (removed D5-derivation special-case), `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Manual QA:** open `/kpi/asm_cet` (Participation · Yearly trend) and `/kpi/sq_d5` (CET line) — same curve/values; same for `/kpi/asm_cgms` vs the CGMS line.

---

## GSQAC grade-scale legend on School Quality page (Pass 12)

Added a compact **grade-scale legend** at the foot of the School Quality page (`/app/domain/school_quality`) explaining the GSQAC grading pattern — grade + % range + colour — verbatim from the `GSQAC_Report_2024_25_English.pdf` footer:

`>95% A5★ · >90–95% A4★ · >85–90% A3★ · >80–85% A2★ · >75–80% A1★ · >50–75% B · >25–50% C · >0–25% D`

- New `GsqacGradeLegend` component: maps `GSQAC_BANDS` to rows (ranges derived from consecutive band mins, so they stay in sync with the scale) with report-faithful colours (green → lime → amber → orange → red).
- Rendered in `DomainView` only when `ds.domain.kind === "output"` (School Quality) — not on input-domain pages.
- Minimal by design (title + one-line hint + 8 colour-chip rows); no scoring math, per request.

**Files changed:** `src/components/ui/GsqacGradeLegend.tsx` (new), `src/screens/DomainView.tsx`, `src/i18n/en.ts`, `src/i18n/gu.ts` (`scorecard.gradeScale` / `gradeScaleHint`), `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

---

## GSQAC follow-ups — CET & CGMS split + overall-page breakdown removed (Pass 11)

Three targeted GSQAC tweaks:

1. **Removed the "Sub-domain breakdown" card from the overall GSQAC score page** (`/kpi/sq_gsqac`). The breakdown now renders only on the five individual domain detail pages (`sq_d1`…`sq_d5`), not on the overall score. `GsqacBreakdown` simplified to single-domain; render gated with `kpi.id !== "sq_gsqac"`.
2. **CET & CGMS (State Exams) `sq_d5` is now multi-metric** — two sub-metrics **CET** and **CGMS** (both %).
   - **Scorecard (School Quality page / `DomainView`):** the card renders via `KpiCardAuto → MultiMetricKpiCard`, so it shows **two rows** (CET · CGMS), each with value · N+1 · delta.
   - **Detail page (`/kpi/sq_d5`):** a single line chart with **two lines** (CET, CGMS) and a legend, titled **"Yearly trend: CET & CGMS (State Exams)"** — new `MultiTrendChart` (multi-series) + `GsqacMultiTrend` wrapper. Other multi-metric KPIs keep one-chart-per-metric.
3. **Data:** CET/CGMS values are derived from the seed's D5 domain score in `mockProvider` (report ratios CET 40% · CGMS 52% vs D5 46% → ×0.87 / ×1.13), so the two lines carry genuinely different data at every level. N+1 anchors added (`sq_d5__cet`, `sq_d5__cgms`). All school-and-above entities carry `gsqac.domains.D5`, so both resolve at school→state (sq_d5 isn't shown at grade/section).

**Files changed:** `src/config/kpiCatalog.ts` (sq_d5 `metrics` + anchors), `src/data/provider/mockProvider.ts` (CET/CGMS derivation), `src/components/ui/TrendChart.tsx` (`MultiTrendChart`), `src/screens/KpiDetail.tsx` (`GsqacMultiTrend`, breakdown gating), `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Manual QA:**

- [ ] `/kpi/sq_gsqac` shows no "Sub-domain breakdown" card (trend + formula only)
- [ ] `/kpi/sq_d1`…`sq_d4` still show their sub-domain breakdown
- [ ] School Quality page: "CET & CGMS (State Exams)" card shows two rows (CET, CGMS)
- [ ] `/kpi/sq_d5` shows one chart with two lines (CET, CGMS) + legend, titled "Yearly trend: CET & CGMS (State Exams)"; below it the sub-domain breakdown + per-metric formulas

---

## KPI sheet + GSQAC re-audit — multi-metric & official grade bands (Pass 10)

### Source of truth

- **KPI sheet:** `Docs/GJ _ Unified App KPIs.xlsx` (Sheet1, 1 sheet, 45 populated rows). Re-parsed in full; columns: Focus Area · Home Page Indicator · sub-Domain · Indicator · Data Source · Available in Data Lake · Formula/Logic · Delta.
- **GSQAC report:** `Docs/GSQAC_Report_2024_25_English.pdf` (Gunotsav 2.0 School Report Card 2024–25, Chhabhadiya Pri. Sch., 68.1% / grade B). Used for the 5 domains, sub-domains, indicator breakdown, and official grade bands.

### 1. Attendance multi-metric fixes

Every sheet row whose Formula/Logic defines ≥2 formulas is now a single multi-metric indicator (`metrics: KpiMetricDef[]`), rendered as a `MultiMetricKpiCard` (one row per metric) and one trend chart per metric on the detail page.

| Indicator                                        | id            | Metrics (unit, direction)                                                                                                                 |
| ------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Teacher attendance                               | `att_teacher` | Present (%, ↑) · Submitted (%, ↑)                                                                                                         |
| Student attendance                               | `att_student` | Present (%, ↑) · Submitted (%, ↑)                                                                                                         |
| Schools and Class Sections Submitting Attendance | `att_report`  | Schools (%, ↑) · Class sections (%, ↑) — already multi-metric; class-sections formula corrected to "… / Total Classrooms × 100" per sheet |

- New `METRIC_PUBLISHED` anchors: `att_teacher__present` (= parent), `att_teacher__submitted`, `att_student__present` (= parent), `att_student__submitted` (incl. `section` level). Each resolves its own value, N+1 peer, benchmark, trend and delta through the existing `metricKpiDef → getValueSeries → valueAt` machinery — no UI hardcoding.
- Formula text per metric, cleaned per sheet (e.g. `Present: Teachers Present / Total Teachers × 100`, `Submitted: Teachers Submitted / Total Teachers × 100`).
- **`att_chronic`** ("Students absent from past 7+ **consecutive** days") — kept single-metric **count** for UX (count_with_rate); formula text now ties to the sheet's rate definition (`… / Total Enrolled Students × 100`) as supporting context. Rename already applied app-wide in Pass 8 (catalog, i18n, cards, detail, Compare, Leaderboard, Export).
- **`att_mdm`** kept single-metric (one formula in sheet).

### 2. Assessment multi-metric — re-verified against sheet

All five already multi-metric; metrics confirmed to match the latest sheet:

| Indicator                               | Metrics                                              |
| --------------------------------------- | ---------------------------------------------------- |
| SAT 1 / SAT 2 (`asm_SAT 1`/`asm_SAT 2`) | Avg score · Below `<hierarchy>` avg · Participation  |
| FLN-ORF (`asm_orf`)                     | CWPM score · Below `<hierarchy>` avg · Participation |
| CET (`asm_cet`)                         | Result · Participation (Class-5 present / enrolled)  |
| CGMS (`asm_cgms`)                       | Result · Participation (Class-8 present / enrolled)  |

ORF source kept as display alias "Oral Reading Fluency (ORF) Bot" (sheet: `ORFBot`); CET "Common Entrance Test (CET) Portal" (sheet: `CET Portal`); CGMS "CGMS Portal". No metric changes needed.

### 3. Administration multi-metric fix

| Indicator                    | id          | Metrics                                                              |
| ---------------------------- | ----------- | -------------------------------------------------------------------- |
| Average CPD Time Per Teacher | `cpd_hours` | **Average CPD time** (hours, ↑) · **Teachers engaged in CPD** (%, ↑) |

- Mixed-unit multi-metric: the hours metric renders `42.5 hrs`, the % metric `78.4%` via `formatValue(value, metric.unit)`.
- New anchors `cpd_hours__avgTime` (= parent hours anchor) + `cpd_hours__teachersEngaged` (%).
- Domain scoring unchanged: the parent `cpd_hours` is unit `hours` (not scored); `cpd_50` (%) still drives the CPD sub-domain score. Adding `metrics` does not introduce new scored rows.
- All other Administration rows re-audited against the sheet — each defines a single formula → kept single-metric (CRCC/URC visits, observations, ICT/Library/WASH/SMC, classroom observation, lesson plans, teacher diaries, dropout, re-enrolment, 50-hour CPD target). No invented second metrics.

### 4. Dynamic `<hierarchy>` label

`resolveMetricLabel(name, name_gu, level, lang)` (added Pass 8) continues to replace "hierarchy"/"સ્તર" with the current scope level on cards, detail charts and formula breakdowns (e.g. **Below block avg** at block scope). Verified no literal "hierarchy" reaches the UI.

### 5. GSQAC / School Quality update (from report)

**5 domains** renamed to the report's wording (catalog `sq_d1…sq_d5` + `GSQAC_DOMAINS`):

| key | Name (was → now)                                             |
| --- | ------------------------------------------------------------ |
| D1  | Learning & Teaching → **Teaching and Learning**              |
| D2  | School Administration (unchanged)                            |
| D3  | Co-curricular Activities → **Co-scholastic Activities**      |
| D4  | Resources & their Use → **usage of Resources**               |
| D5  | Participation in Scholarships → **CET & CGMS (State Exams)** |

> D5 rename aligns the label with the seed data: `entity.meta.gsqac.domains.D5` ≈ 0.468 (= report's CET & CGMS domain 46%), confirming D5 was always the State-Exams domain, mislabelled.

**Sub-domains + indicators** — new `GSQAC_SUBDOMAINS` config (verbatim from the report card, pages 1–8): every sub-domain (e.g. Periodic/Formative Tests, Terminal Tests I & II, Reading-Writing-Arithmetic, …) with its full indicator list. Surfaced on **School Quality detail pages** via a new `GsqacBreakdown` card ("Sub-domain breakdown"): the overall GSQAC detail shows all 5 domains grouped; each `sq_dN` detail shows that domain's sub-domains, each with its indicators as a muted caption. Reference structure only — not fabricated per-entity scores. Homepage/domain cards unchanged (not overloaded).

**Official grade bands** — `GSQAC_BANDS` replaced with the report footer's official scale:

| Band | min ≥ | group |
| ---- | ----- | ----- |
| A5★  | 95    | A     |
| A4★  | 90    | A     |
| A3★  | 85    | A     |
| A2★  | 80    | A     |
| A1★  | 75    | A     |
| B    | 50    | B     |
| C    | 25    | C     |
| D    | 0     | D     |

`gradeGroupOf` keys off the first character, so all `A#★` → group A (green), B → amber, C → red, D → black; `RatingBadge`/colors/Export pick up the new labels automatically. 68.1% → B (matches the report).

### Files changed

- `src/config/ratingBands.ts` — official GSQAC grade bands (A5★…D)
- `src/config/kpiCatalog.ts` — `att_teacher`/`att_student`/`cpd_hours` multi-metric + anchors; `att_report` class-sections formula; `att_chronic` formula text; 5 GSQAC domain renames; new `GSQAC_SUBDOMAINS`; `presentSubmittedMetrics` helper; doc comments
- `src/screens/KpiDetail.tsx` — `GsqacBreakdown` sub-domain card for `sq_*` detail pages
- `src/i18n/en.ts`, `src/i18n/gu.ts` — `kpi.subdomains` label
- `src/components/ui/MultiMetricKpiCard.tsx` — doc comment
- `QA_REPORT.md` — this section

### Build

`npm run build` passes — `tsc --noEmit` clean, `vite build` ✓ (only the pre-existing `entities` seed chunk-size warning).

### Assumptions / notes

- **Sub-metric anchor values** (Present/Submitted spreads, Teachers-engaged %, Class-sections %) are deterministic demo figures chosen to be plausible (submission slightly above presence); they are not real data-lake values.
- **Grade bands are framework-wide** (`rating_bands: GSQAC_BANDS`): the official A#★ scale now labels the Input Composite + input-domain grades too, not just GSQAC. This is consistent with the product's Gunotsav-2.0-aligned model; flagged in case a separate input-only band set is later desired.
- **GSQAC sub-domain breakdown shows structure, not per-entity scores** — the report's marks are school-specific, so reproducing them across all entities would be misleading. Per-entity sub-domain scoring needs a real GSQAC sub-domain feed.
- Export/Compare/Leaderboard show the **primary/parent value** for multi-metric indicators (tabular context); they auto-pick the renamed GSQAC domains and new grade labels.

### Manual QA checklist

- [ ] Teacher attendance card shows **Present** and **Submitted** rows (each value · N+1 · delta)
- [ ] Student attendance card shows **Present** and **Submitted**
- [ ] Attendance submission card shows **Schools** and **Class sections**
- [ ] Average CPD Time Per Teacher shows **Average CPD time** (hrs) and **Teachers engaged in CPD** (%)
- [ ] SAT 1/SAT 2/ORF show Avg score · Below {level} avg · Participation; CET/CGMS show Result · Participation
- [ ] Single-metric KPIs unchanged (MDM, dropout, visits, observations, etc.)
- [ ] Absentee KPI reads "Students absent from past 7+ **consecutive** days"
- [ ] "Below hierarchy avg" never visible — resolves to "Below block avg" etc.
- [ ] No KPI card shows Parent avg / Rate / Latest / Count / Score clutter labels
- [ ] Multi-metric detail pages: one chart per metric with a clear title; per-metric formula breakdown
- [ ] GSQAC uses the 5 report domains and official A5★…D bands (68.1% → B)
- [ ] School Quality detail shows the **Sub-domain breakdown** card with report sub-domains + indicators
- [ ] Export GSQAC section uses the renamed domains + new grade labels

---

## KPI detail metric summary strip removed (Pass 9)

### Summary

Removed the multi-column metric summary strip from every KPI detail page (both single-metric and multi-metric indicators). The page now goes directly from the title/meta header to the trend chart cards — no value tiles, no delta pills, no N+1 comparisons above the charts.

### What changed

**`src/screens/KpiDetail.tsx`**

- Removed the `{isMulti ? (<div mt-4 grid 3-col>metricRecs.map(MetricSummary)…</div>) : (<div mt-4 flex>ValueDisplay + NPlusOneLine + FrequencyDelta…</div>)}` block from inside the header `<div className="pb-2">`.
- Deleted the `MetricSummary` local function entirely (was only used in this strip; not referenced outside this file).
- Removed all variables that became unused after strip removal: `isContextDelta`, `parentRow`, `parentName`, `parentScore`, `peerLevel`, `valueTone`, `cadence`, `currentLabel`, `isGsqac`.
- Removed the `useKpiCascade` hook call (result was only used by `parentRow`).
- Removed unused imports: `useKpiCascade` (hook), `deltaToneClass` (colors), `getWorkingDateLabel` (format), `peerAvg`+`peerLevelOf` (peer), `RatingBadge`, `ValueDisplay`, `FrequencyDelta`, `NPlusOneLine`, `gradeFor`+`GSQAC_BANDS` (ratingBands), `cn`, `locNum`.
- `MetricTrendCard` (per-metric trend charts) — **kept unchanged**. Title, chart, height all preserved.
- Single-metric `TrendChart` card — **kept unchanged**.
- Formula `<Card>` — **kept unchanged**.
- Lightweight page header (domain breadcrumb, h1, frequency badge, last updated, source icon) — **kept unchanged**.

### New KPI detail layout

```
← Back

[Domain]
[KPI title]
[FrequencyBadge] · [last updated] · [source]

[METRIC LABEL · CADENCE TREND]       ← chart title
[chart]

[METRIC LABEL · CADENCE TREND]
[chart]

How it's calculated
[formula]
```

No value row, no metric summary columns, no N+1 tiles, no delta pills above the charts.

### Files changed

- `src/screens/KpiDetail.tsx` — summary strip and MetricSummary removed; unused variables/imports cleaned up

### Build

`npm run build` passes. `tsc --noEmit` clean. No new warnings.

### Manual QA checklist

- [ ] SAT 1 detail page: no 3-column metric summary strip at top
- [ ] SAT 2 detail page: no metric summary strip
- [ ] ORF / CET / CGMS detail pages: no metric summary strip
- [ ] Attendance KPI detail pages: no top value summary
- [ ] Administration KPI detail pages: no top value summary
- [ ] School Quality KPI detail pages: no top value summary
- [ ] Single-metric KPI detail: page goes directly from meta header to the trend chart card
- [ ] All trend charts still render
- [ ] All chart titles still show (e.g. "AVG SCORE · YEARLY TREND", "30-day trend: Teacher attendance")
- [ ] No blank gap between meta header and first chart
- [ ] Formula card still shows below charts
- [ ] Build passes with no TypeScript errors

---

## Naming, label-cleanup, detail-page restructure, dynamic level labels (Pass 8)

### Summary

Comprehensive cleanup pass covering: KPI name renames, removal of metric-type labels from cards, removal of "Parent avg" label from cards, removal of the oversized KPI detail top card, graph titles that include KPI names, dynamic "Below {level} avg" resolution, and multi-metric support for `att_report`.

### 1. KPI renames

| ID            | Old name                          | New name                                          |
| ------------- | --------------------------------- | ------------------------------------------------- |
| `att_chronic` | Students absent from past 7+ days | **Students absent from past 7+ consecutive days** |
| `att_teacher` | Teachers present today            | **Teacher attendance**                            |
| `att_student` | Students present today            | **Student attendance**                            |

- `kpiCatalog.ts`: updated `name` and `name_gu` for all three.
- `gu.ts`: updated `principal.chronicAbs` to include "સળંગ" (consecutive).
- `en.ts` `principal.chronicAbs` was already correct ("consecutive" was already present).
- KPI IDs, formulas, values, frequency, delta logic unchanged.

### 2. Removed metric-type labels from KPI cards

Removed `RATE / COUNT / SCORE / LATEST` labels that appeared above the headline value on single-metric cards. The value is now shown directly without a type tag above it.

Also removed the inline "as on {date}" label from the card body — the date context now lives exclusively in the header frequency chip row (`Daily · 10 Jun`, `Monthly · Jun 2026`, etc.), which is the single authoritative period label.

**File:** `src/components/ui/KpiCard.tsx`

- Removed `headlineLabelKey()` function
- Removed the `<span>` rendering the unit label
- Removed `asOnLabel` variable; the header always receives `lastUpdated` as the context
- Added `!kpi.suppressDelta` guard to the delta display condition

### 3. Removed "Parent avg" label from KPI cards

The "PARENT AVG" uppercase label that appeared above the parent entity comparison value has been removed. The peer value (e.g. "Kachchh · 91%") is self-explanatory — the entity name makes the context clear without a label.

**Files affected:** `src/components/ui/KpiCard.tsx`

- Changed footer from `<KpiContextTile label={t("kpi.parentAvgLabel")} ...>` to a plain `<span>` showing `peerStr` directly.
- Source still shows with its "SOURCE" label (unchanged).
- Multi-metric cards already had no "Parent avg" label (metric rows inline via `KpiMetricRow`).
- KPI detail pages used `NPlusOneLine` which never showed a label — no change needed there.
- Export page uses `peerAvgLabel` for the column header (separate key `export.parentAvg`) — unchanged.

### 4. KPI detail page: removed oversized top summary card

The large `<Card>` that wrapped the entire header section (domain breadcrumb + h1 + frequency + value + cascade + delta) has been replaced with a compact borderless `<div>`. The page now starts with a plain header instead of a card-framed hero block.

New layout:

```
← Back
[Domain breadcrumb]
KPI title (h1)
[Frequency badge] · [Last updated] · [Source icon + name]
[Current value] [Parent N+1] [Delta pill]
───────────────────────────────────────────────
[Trend chart card(s)]
[Formula card]
```

**File:** `src/screens/KpiDetail.tsx`

- Removed `<Card className="card-pad">` wrapping the header block
- Replaced with `<div className="pb-2">` — no border, no background
- Value, N+1 comparison, and delta pill remain visible inline

### 5. KPI detail graph titles include KPI name

Single-metric charts now show the KPI name in the chart title:

- Before: `"30-day trend"` / `"Monthly trend"` / `"Yearly trend"`
- After: `"30-day trend: Teacher attendance"` / `"Monthly trend: No of CRCC/URC Visits per school"`

Multi-metric charts resolve the metric label and show cadence:

- `"Below block avg · Recent cycles"` (was `"Below hierarchy avg · Recent cycles"`)
- `"Avg score · Recent cycles"`

**File:** `src/screens/KpiDetail.tsx`

- Single-metric: `<SectionLabel>{t(trendTitleKey(trend.cadence))}: {name}</SectionLabel>`
- Multi-metric `MetricTrendCard`: now receives `level: Level` prop, uses `resolveMetricLabel` for the title

### 6. Dynamic "Below {level} avg" — replaces "Below hierarchy avg"

The literal word "hierarchy" no longer appears in the UI. A new helper `resolveMetricLabel(name, name_gu, level, lang)` replaces "hierarchy" with the current scope level.

Examples at different levels:

- State view → **Below state avg**
- District view → **Below district avg**
- Block view → **Below block avg**
- Cluster view → **Below cluster avg**
- School view → **Below school avg**

**File:** `src/lib/format.ts`

- Added `resolveMetricLabel(name, name_gu, level, lang)` with `LEVEL_NAME_EN` and `LEVEL_NAME_GU` maps.
- Gujarati: replaces "સ્તર" (generic "level") with the specific level name (e.g. "બ્લોક", "ક્લસ્ટર").

**usage sites updated:**

- `src/components/ui/MultiMetricKpiCard.tsx` — `MetricRow` label
- `src/screens/KpiDetail.tsx` — `MetricSummary` label, `MetricTrendCard` title, formula `<dt>` labels

### 7. att_report as multi-metric (Schools + Class sections)

`att_report` ("Schools and Class Sections Submitting Attendance") is now a multi-metric indicator matching its name. Two metrics:

| Metric id       | Label          | Formula                                                            |
| --------------- | -------------- | ------------------------------------------------------------------ |
| `schools`       | Schools        | Schools That Filled Attendance / Total Schools × 100               |
| `classSections` | Class sections | Class Sections That Filled Attendance / Total Class Sections × 100 |

**File:** `src/config/kpiCatalog.ts`

- Added `metrics: [...]` to the `att_report` RAW entry
- Added `METRIC_PUBLISHED` anchors: `att_report__schools` (= parent anchor) and `att_report__classSections`

> **Assumption / Needs Verification:** The class sections formula is inferred from the KPI name. Verify against `GJ _ Unified App KPIs(11).xlsx` before considering production-ready.

Other Attendance/Admin indicators audited for multi-metric:

- `vis_CRCC_count`: ratio/count — single metric (count of visits per school), no secondary metric in formula. Kept single.
- `ret_dropout`: count — absolute count only, kept single.
- `ret_reenroll`: % — single metric, kept single.
- All classroom observation / infrastructure indicators: single % metric each, kept single.

### Files changed

- `src/config/kpiCatalog.ts` — KPI name renames, att_report multi-metric, METRIC_PUBLISHED anchors
- `src/lib/format.ts` — `resolveMetricLabel` helper
- `src/components/ui/KpiCard.tsx` — removed unit label, removed Parent avg label, removed as-on inline
- `src/components/ui/MultiMetricKpiCard.tsx` — `resolveMetricLabel` in MetricRow
- `src/screens/KpiDetail.tsx` — header restructure, graph titles, resolveMetricLabel in sub-components
- `src/i18n/gu.ts` — `principal.chronicAbs` updated (consecutive)
- `QA_REPORT.md` — this update

### Build

`npm run build` passes. `tsc --noEmit` clean. Only the pre-existing `entities` seed chunk-size warning (expected, not a regression).

### Manual QA checklist

- [ ] `att_chronic` KPI card reads "Students absent from past 7+ **consecutive** days"
- [ ] `att_teacher` card reads "Teacher attendance" (not "Teachers present today")
- [ ] `att_student` card reads "Student attendance" (not "Students present today")
- [ ] No KPI card shows "RATE", "COUNT", "SCORE", or "LATEST" label above the value
- [ ] No KPI card shows "PARENT AVG" or "Parent avg" label — peer value shows as "Kachchh · 91%" etc.
- [ ] `att_report` card shows two metric rows: Schools % + Class sections %
- [ ] KPI detail pages: no oversized Card frame around the header
- [ ] KPI detail single-metric chart title includes the KPI name (e.g. "30-day trend: Teacher attendance")
- [ ] KPI detail multi-metric chart title uses resolved level (e.g. "Below block avg · Recent cycles")
- [ ] "Below hierarchy avg" is **never** visible in the UI at any level
- [ ] At block level: multi-metric label shows "Below block avg"
- [ ] At cluster level: multi-metric label shows "Below cluster avg"
- [ ] Gujarati mode: "Below block avg" → "બ્લોક સરેરાશથી નીચે"
- [ ] Date/frequency chip still visible in card header (Daily · 10 Jun, Monthly · Jun 2026, etc.)
- [ ] Source still visible in card footer (multi-metric as muted footer; single-metric as SOURCE tile)
- [ ] KPI detail trend charts still render (no regression)

---

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
- No change to KPI catalog, values, formulas, names, multi-metric SAT 1/SAT 2/ORF/CET/CGMS logic, delta/N+1/date/frequency logic, access control, routing, homepage, Export, Compare, Leaderboard, GSQAC, or provider architecture.

**Files changed:** `screens/DomainView.tsx`, `components/ui/OperationalKpiCard.tsx` (deleted), `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

---

## Assessment IA split — Operational Indicator vs Assessment Outcomes

Forcing the single-metric operational KPI into the same tall analytical card as the SAT 1/SAT 2/ORF/CET/CGMS outcome cards still read wrong. Fixed by **information architecture**, not more height tuning: the Assessment domain page now splits into two labelled sections, and the operational KPI gets a purpose-built compact card. Scoped to the Assessment domain page only — Attendance, Administration, School Quality, Export, Compare, Leaderboard and KPI detail are untouched.

- **Two sections** ([DomainView.tsx](app/src/screens/DomainView.tsx)): a domain with no sub-domains that carries **both** single-metric and multi-metric indicators now renders **`Operational Indicator`** (compact card stack) above **`Assessment Outcomes`** (the multi-metric grid). The split is config-driven by `kpi.metrics` (only Assessment has the mix today), so every other domain keeps its single uniform grid. No catalog/metadata change.
- **Compact operational card** ([OperationalKpiCard.tsx](app/src/components/ui/OperationalKpiCard.tsx), new): a slim full-width horizontal row for `SAT reports downloaded in classrooms` — left: title + `Daily` + `as on 9 Jun`; right: the value + N+1 (`Gujarat · 86%`), with a small sparkline between on wide screens. No footer tile grid, no blank middle, ~one-row height. Reuses the shared atoms (FrequencyBadge, ValueDisplay, NPlusOneLine, FrequencyDelta, Sparkline) so typography stays in the same family. Keeps value, N+1, and the as-on date.
- **Outcome cards unchanged**: SAT 1/SAT 2/ORF/CET/CGMS keep the analytical `MultiMetricKpiCard` (title, frequency/date, primary metric, N+1, delta, trend, secondary tiles) and stay equal-height within their grid.
- **i18n**: `domain.operationalIndicator` / `domain.assessmentOutcomes` (en + gu).

**Result:** the oversized sparse first card is gone; the operational health-check and the analytical outcomes are visually and conceptually separated, and the outcome grid aligns cleanly on its own.

**Files changed:** `components/ui/OperationalKpiCard.tsx` (new), `screens/DomainView.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Note:** I dropped the redundant outer "KPIs in Assessment" heading for the split view in favour of the two specific section headers (`Operational Indicator` / `Assessment Outcomes`), which reads cleaner than three stacked labels. Single-grid domains keep their "KPIs in {domain}" heading.

---

## KPI card shell + composition (single = multi card family)

The earlier equal-height pass stretched rows but left short cards sparse: `SAT reports downloaded in classrooms` had a big blank middle while SAT 1/SAT 2/ORF looked dense, so they read as different card types. This pass fixes the **internal composition** so every KPI card is the same component, not just the same height.

- **One canonical shell** ([kpiCardParts.tsx](app/src/components/ui/kpiCardParts.tsx), new): `KpiCardShell` (h-full, `min-h-[16.5rem]`, flex-col) → `KpiCardHeader` (title `line-clamp-2` with a reserved `min-h-[2.5rem]` so every header is the same height, + frequency·last-updated chip) → `KpiPrimary` (flex-1, centred, so modest content fills instead of leaving a gap) → `KpiFooter` (`mt-auto`, 2-up grid pinned to the bottom). Both card types now compose from these pieces, so header / primary / trend / footer rhythm and outer height are identical.
- **Single-metric cards fill the footer intelligently** ([KpiCard.tsx](app/src/components/ui/KpiCard.tsx)): rebuilt on the shell. Header has a headline metric label (Rate / Count / Score / Latest, by unit — matches the multi cards' sub-metric label rhythm without inventing data), the big value + delta or `as on <date>`, then the trend. The footer is **always two compact context tiles** drawn from already-available data: `Parent avg` (N+1), `Source`, falling back to `Updated`. No blank middle, no oversized first card.
- **`SAT reports downloaded in classrooms`** now reads: header `Daily`, primary `RATE / 76.5% / as on 9 Jun` + sparkline, footer `Parent avg · Gujarat · 86%` + `Source · Gyan Prabhav bot`. Same density and height as its neighbours; the date appears once (no header/primary/footer triplication).
- **Multi-metric cards** ([MultiMetricKpiCard.tsx](app/src/components/ui/MultiMetricKpiCard.tsx)): rebuilt on the same shell. Triple-metric (SAT 1/SAT 2/ORF) keep primary + 2 sub-metric tiles; **dual-metric (CET/CGMS)** fill the spare footer slot with a `Source` context tile so they're the same height as the triple cards (no obvious empty box, §4). Sub-metric tiles, N+1, deltas and micro-sparklines are unchanged.
- **Typography unified** (§8): title, chip, metric label (`uppercase 2xs muted`), primary value (`size lg`), N+1, delta and the primary sparkline (height 32 on every card) share one scale across single and multi cards.
- **Grid** ([PageSection.tsx](app/src/components/layout/PageSection.tsx)) keeps `sm:auto-rows-fr` as row-alignment support; the real fix is the card internals, so the target height is set by the dense SAT/ORF card, not the sparse single card.

**Files changed:** `components/ui/kpiCardParts.tsx` (new), `components/ui/KpiCard.tsx`, `components/ui/MultiMetricKpiCard.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Known tradeoffs:** (a) the footer holds sub-metric tiles on multi cards (which include micro-sparklines) vs text context tiles on single/dual cards, so triple-metric footers carry slightly more ink, but every card now has a filled 2-up footer of equal height with no blank gaps. (b) On a dual-metric card the metric tile is taller than the source context tile beside it, so the source tile top-aligns with a little space below; deliberate, and far less jarring than an empty box. (c) Single-metric primary shows N+1 in the footer rather than inline (multi shows it inline) to avoid duplicating it; both cards display N+1 exactly once.

---

## Equal-height KPI cards (layout consistency pass)

Multi-metric cards (SAT 1/SAT 2/ORF) were taller than dual-metric (CET/CGMS) and single-metric (SAT reports) cards, so the Assessment page looked uneven across rows. Made every KPI card in a grid row share one height, with balanced internal spacing. **Layout only — no KPI logic, values, formulas, deltas, N+1, graph data, provider, routing, access, Compare/Export, or GSQAC changes.**

- **Grid equalises rows** ([PageSection.tsx](app/src/components/layout/PageSection.tsx)): the `cols="kpi"` grid gained **`sm:auto-rows-fr`** (`grid-cols-1 sm:grid-cols-2 sm:auto-rows-fr xl:grid-cols-3`). From the 2-up breakpoint up, every row track is equal height so cards stretch to match the tallest in the row. Deliberately **omitted at the 1-col mobile breakpoint** so phone cards keep their natural full-width height (§1). Only the KPI grid is touched — the homepage `domain` grid and the sub-domain `two` grid are unchanged.
- **Shared sizing contract** — both card types now use `h-full flex flex-col` so they fill the row track:
  - [KpiCard.tsx](app/src/components/ui/KpiCard.tsx) (single-metric): header pinned top, **value + sparkline wrapped in a `flex-1` centred region**, N+1 pinned to the foot. A short card (e.g. "SAT reports downloaded") fills the shared height with balanced spacing instead of leaving blank white space — content stays centred, nothing clipped (§4).
  - [MultiMetricKpiCard.tsx](app/src/components/ui/MultiMetricKpiCard.tsx) (SAT 1/SAT 2/ORF/CET/CGMS): header top, **primary metric block in a `flex-1` region**, secondary compact tiles pinned to the foot. The secondary `grid-cols-2` keeps a **dual-metric card (one tile) the same height as a triple-metric card (two tiles)** — the empty cell reserves the slot (§3/§6).
- **Consistent card system everywhere** ([SubDomainView.tsx](app/src/screens/SubDomainView.tsx)): switched from `KpiCard` to the same `KpiCardAuto` selector used by DomainView, so Administration sub-domain cards share the identical sizing path (they're single-metric, so they render via KpiCard exactly as before, now with `h-full`).
- **Typography untouched** (§7): title/badge/primary-value/secondary-label/N+1/delta/sparkline sizes and the chevron position are all unchanged. No one-off large/small cards.

**Assessment page result:** SAT 1 = SAT 2, CET = CGMS, ORF and the single-metric SAT-reports card all align to the row height; cards in a row align vertically.

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

New shared helper [`getLastUpdatedLabel(kpi, date, lang)`](app/src/lib/trend.ts) maps cadence → label: **Daily → `9 Jun`** (working date) · **Monthly → `Jun 2026`** · **SAT 1/SAT 2 (scheduleNote) → `Sep 2025` / `Mar 2026`** · **Twice/Half-yearly → cycle month + year** · **Yearly/Annual → `2026`** · else → `Latest available`. The sheet flag `showLastUpdatedOnUi` (column H = Yes) gates whether the chip shows. Wired into `KpiCard`, `MultiMetricKpiCard`, and `KpiDetail` headers. No `Latest: 1 Jun` is shown anywhere (`kpi.latestOn` is unused).

### 4–7 · Multi-metric indicator cards (SAT 1 / SAT 2 + ORF / CET / CGMS)

Indicators whose Formula/Logic carries 2–3 metrics now render as a single **[MultiMetricKpiCard](app/src/components/ui/MultiMetricKpiCard.tsx)** instead of separate top-level cards:

- **Schema** ([types/index.ts](app/src/types/index.ts)): `KpiMetricDef { id, label, label_gu, unit, direction, formula }` + `KpiDef.metrics?`. Config-driven — `SAT 1/SAT 2` → `Avg score · Below hierarchy avg · Participation`; `ORF` → `CWPM score · Below hierarchy avg · Participation`; `CET/CGMS` → `Result · Participation`. Re-audited from the sheet (not hardcoded to SAT only).
- **Data** ([kpiCatalog.ts](app/src/config/kpiCatalog.ts) `METRIC_PUBLISHED`, [mockProvider.ts](app/src/data/provider/mockProvider.ts)): each sub-metric has its own per-level anchor under `<parentId>__<metricId>` and flows through the **existing** value/benchmark/trend/PM-Shri machinery. No values hardcoded in UI components (§9/§12). [score.ts `metricKpiDef`](app/src/engine/score.ts) synthesises a single-value KpiDef per metric; [engine `getKpiMetricRecords`](app/src/engine/index.ts) + [`useKpiMetrics`](app/src/hooks/index.ts) expose them.
- **Card layout**: title → `Yearly · Sep 2025` chip → a primary metric row (label · big value · N+1 · delta · one sparkline) → the secondary metrics in a compact 2-up grid (small type, own N+1, direction-aware delta, tiny micro-sparkline). Each metric shows **value + N+1 + delta + compact trend**; calm palette (status hue for the primary spark, muted slate for the micro-sparks) to avoid clutter/colour overload.
- **Lower-is-better** (§8): `Below hierarchy avg` uses `direction: "lower"`, so a fall reads **green** and a rise **red** (shared `deltaToneClass`). `Students absent 7+ days`, `Identified Dropout Students` keep their existing lower-is-better logic.

### 8–10 · KPI detail for multi-metric indicators

[KpiDetail.tsx](app/src/screens/KpiDetail.tsx): for SAT 1/SAT 2/ORF/CET/CGMS the page shows a **compact 3-up metric summary** at top, then **one trend chart per metric** (never a single chart that hides the others), then a clean **`How it's calculated`** breakdown listing each metric's plain-language formula (Avg % score / Below hierarchy avg / Participation). Frequency, source and last-updated stay visible. Single-metric detail pages are unchanged.

### KPI / domain name reconciliation (per the latest sheet)

- `att_chronic` → **Students absent from past 7+ days** · `att_report` → **Schools and Class Sections Submitting Attendance** · `vis_ict` → **Schools using ICT Labs (%)** · `vis_library` → **Schools using Library (%)**.
- GSQAC D1–D5 display names aligned to the canonical GSQAC model + sheet: **Learning & Teaching · School Administration · Co-curricular Activities · Resources & their Use · Participation in Scholarships** (catalog `sq_d*` + `GSQAC_DOMAINS`, en + gu). GSQAC scores, grade bands, D1–D5 _values_ and colours unchanged.

**Files changed:** `types/index.ts`, `config/kpiCatalog.ts`, `lib/trend.ts`, `engine/score.ts`, `engine/index.ts`, `hooks/index.ts`, `components/ui/MultiMetricKpiCard.tsx` (new), `components/ui/KpiCard.tsx`, `components/ui/DomainSummaryCard.tsx`, `components/ui/GsqacSummaryCard.tsx`, `screens/KpiDetail.tsx`, `screens/DomainView.tsx`, `screens/Export.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`.

**Build:** `npm run build` passes (`tsc --noEmit` clean; only the pre-existing entities-seed chunk-size warning).

**Assumptions:** (a) `Show Last Updated on UI` (Yes/No) gates _whether_ to show the label; the cadence/`scheduleNote` decides the _format_. (b) SAT/ORF/CET/CGMS sub-metric demo numbers are deterministic anchors (avg = parent value; below-hierarchy ~20–34%; participation ~84–95%) since the live data lake isn't wired — kept config-driven so swapping in real values is a data change. (c) `metrics` was applied to every Assessment indicator that clearly carries multiple formulas, not only SAT 1/SAT 2 (§6). No changes to access control, routing, PM-Shri, login, Compare selection, Export structure (only labels/date-context), GSQAC score/grade/D1–D5 logic, provider architecture, or the homepage top-indicator split.

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
- **Header** realigned: real logo chip vertically centred with a bold entity title, muted `Level · Pocket VSK · 4A` line, and the generated-date line; a small school-filter chip (All Schools / PM SHRI) on the right; divider below.
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

**Seed compatibility (per §9):** the new product rule is Teacher/Principal **8-digit** ID. The committed seed had 10-digit teacher/principal IDs (collided with the new "10 = cluster officer"), so [appUsers.json](app/src/data/seed/appUsers.json) + [meta.json](app/src/data/seed/meta.json) teacher/principal `login_id`s were shortened to 8 digits (`"24" + last 6`, e.g. 2400000001 → 24000001; principal 2400000002 → 24000002). CRCC stays 10-digit (cluster), BRC 6, DEO 4, State 2 (+ PIN). Demo logins updated and still work: 24000001/School 24010100101 (teacher), 24/0000 (state), 2401/3456 (deo), 240101/2345 (brc), 2401010005/1234 (CRCC).

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

Re-parsed the latest sheet (re-uploaded over `GJ _ Unified App KPIs.xlsx`, modified today). It added a **Delta** column and shifted columns; only **Attendance / Assessment / Administration** were updated. **School Quality / GSQAC (sq\_\*, D1–D5, grade colours, GsqacSummaryCard) was not touched.**

**Names + data sources + frequency (catalog [kpiCatalog.ts](app/src/config/kpiCatalog.ts), all per sheet):**

- Attendance (src "Attendance bot", Daily): Students absent from past 7+ consecutive days (HP) · Teachers present today · Students present today · Students consuming Mid-day Meal (MDM) · Schools submitting Attendance.
- Assessment: SAT reports downloaded in classrooms (HP, src "Gyan Prabhav bot", **now Daily**) · Semester Assessment Test 1 (SAT 1) · SAT 2 (src "Xamta bot", **Yearly**) · **FLN - Oral Reading Fluency** (src "Oral Reading Fluency (ORF) Bot", Monthly) · **Common Entrance Test (CET)** (Yearly) · **Chief Minister Gyan Sadhna Merit Scholarship (CGMS)** (Yearly). The old ORF/CET/CGMS participation+improvement pairs were **collapsed to one each** (ids `asm_orf`/`asm_cet`/`asm_cgms`); `asm_below` ("Students below avg") and `Assessment result %` are **removed** (not in sheet).
- Administration (sub-domains now School Observation · **Classroom Observation** (new) · Student Retention · CPD): renamed all to sheet wording — No of CRCC/URC Visits per school (HP), School observations completed by CRCC/URC, ICT Lab usage in Schools, Library/Urinals & Toilets/Handwash/Drinking Water/SMC, Schools Visited for Classroom Observation, Classrooms following monthly lesson plans, Classrooms with Completed Teacher Diaries, **Identified Dropout Students**, Re-enrolment of Out-of-School Students, **Average CPD Time Per Teacher**, Teachers Achieving the 50-Hour CPD Target. Sources updated to SMA / CTS + EWS / PLC.

**Source labels** shortened to sheet values everywhere (catalog `data_source` → KPI-detail badge / Export tables): "Attendance Monitoring System (Attendance Bot)" → "Attendance bot", "Student Monitoring App (SMA)…" → "SMA", etc.

**Score / value vs delta** — main value is the actual score (`%`, count, `score` for ORF CWPM, `hours` for avg CPD). No KPI uses `delta_cycle` any more (the improvement KPIs were collapsed), so no formula/delta text leaks into the value.

**Delta + main-value colour now follow movement direction** (`ValueDisplay` gained an optional `toneClass`; cards derive it from `deltaToneClass(trend.delta, kpi.direction)`): up = green, down = red, **flat = neutral**, with the lower-is-better exception applied automatically by `kpi.direction` (so **Students absent from past 7+ consecutive days** and **Identified Dropout Students** show green when falling, red when rising). Applied consistently to KpiCard, DomainSummaryCard (home + page), KpiDetail summary, and the Top-Indicators strip. **GSQAC values keep their grade/status tone** (skipped via `sq_*` guard).

**Frequency wording** stays sheet-driven: Daily → "today", Monthly → "this month", Yearly → "this year", Half-yearly → "this half-year". No "this week"/"Weekly" on any KPI.

**SAT 1/SAT 2** — now annual (`Yearly`), `noTrend` removed → they show the trend graph + delta + N+1 + frequency badge like other cards, with a schedule note (**SAT 1 "September", SAT 2 "March"**, via new `KpiDef.scheduleNote`, rendered on KpiCard + KpiDetail).

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

So every Daily KPI (Teacher/Student Attendance, MDM served %, Students absent from past 7+ consecutive days, Attendance reporting compliance %) now reads e.g. "Latest: 1 Jun" + "↗ +3.4% **today**"; SAT-reports (Monthly) → "this month"; dropout/re-enrolment (Half-yearly) → "this half-year"; SAT 1/SAT 2 (Twice-a-year, snapshot) → "this cycle"; GSQAC (Yearly) → "this year". Date context for Daily details unchanged ("Latest: {date}"). Frequency badges already drive off the catalog `frequency` (no "Weekly" KPI exists, so no Weekly badge renders); the dead `Weekly` i18n key is unused. Doc comment in [FrequencyDelta.tsx](app/src/components/ui/FrequencyDelta.tsx) updated.

**Assumption / out of scope:** the Leaderboard "Top movers this week" and the school-risk-table "this week" are composite **week-over-week** movements (the scorecard periods are weekly), not a single daily KPI's frequency — left as-is (correct for the weekly comparison; not a per-KPI frequency label). Legacy unused strings (`scorecard.whatChanged`, `kpi.deltaWeek`, `kpi.weeklyTrend`, `ogm.thisWeek`) are not rendered anywhere and were left untouched.

**Files:** `i18n/en.ts`, `i18n/gu.ts`, `FrequencyDelta.tsx`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No catalog/formula/id/access/routing/Compare/Export/provider changes.

---

## Domain pages: top summary card removed · KPI charts: average line removed

1. **Domain-page top summary card removed** — [DomainView.tsx](app/src/screens/DomainView.tsx) no longer renders the `DomainSummaryCard` (`variant="page"`) / `GsqacSummaryCard` header on any domain page (Attendance, Assessment, Administration, School Quality). The back link is now followed directly by the indicator section (`KPIS IN …`, or Administration's sub-domain cards). Removed the now-unused scaffolding (`useScopeStats`, `domainWoW`, `hero`/`parentPercent`/`gsqacCoverage`, the `sq_gsqac` filter) — so the School Quality page now shows **GSQAC score** as a normal indicator card too (no separate hero card). `DomainSummaryCard`/`GsqacSummaryCard` are untouched and still used by the **homepage** only.
2. **Average/reference line removed from KPI charts** — [TrendChart.tsx](app/src/components/ui/TrendChart.tsx) dropped the dashed benchmark `ReferenceLine` and its `Avg {n}` / `સરેરાશ` label (and the `benchmark` prop + `ReferenceLine` import; the Y-axis now fits the trend data only). [KpiDetail.tsx](app/src/screens/KpiDetail.tsx) no longer passes `benchmark`. The trend line/area, axes, dots and tooltip remain. (The Compare `ComparisonBars` has no average line; the underlying `benchmark` value still feeds RAG status only — not a chart overlay.)

**Files:** `DomainView.tsx`, `TrendChart.tsx`, `KpiDetail.tsx`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No changes to KPI catalog/formulas/ids, access control, routing, PM-Shri, Compare, Export, or provider architecture.

---

## Assessment: SAT 1/SAT 2 replace "Assessment result %" (snapshot, no trend)

Per the latest `GJ _ Unified App KPIs.xlsx` (Assessment focus area), "Assessment result %" is gone; the sheet defines two SAT result indicators.

- **Removed** `asm_result` ("Assessment result %") from the catalog (`PUBLISHED` + KPI def). It was only referenced in the catalog (provider is config-driven), so it disappears from Domain/KPI-detail/Compare/Leaderboard/Export automatically.
- **Added** [kpiCatalog.ts](app/src/config/kpiCatalog.ts):
  - `asm_SAT 1` — **"Semester Assessment Test 1 (SAT 1)"** (gu "સેમેસ્ટર મૂલ્યાંકન કસોટી 1 (SAT 1)")
  - `asm_SAT 2` — **"Semester Assessment Test 2 (SAT 2)"** (gu "સેમેસ્ટર મૂલ્યાંકન કસોટી 2 (SAT 2)")
  - Sheet metadata: domain Assessment, data source **Xamta Bot**, DL yes, PM-Shri yes, **visible to teacher** (no `roleVisibility`), direction higher, unit %, `frequency: "Twice a Year"`, `displayStrategy: "snapshot_latest"`. `PUBLISHED` result-% values added per level (SAT 1 72→83, SAT 2 74→84) so all hierarchy levels resolve.
- **No graph for SAT 1/SAT 2** — new `KpiDef.noTrend` flag. [KpiCard](app/src/components/ui/KpiCard.tsx) skips the sparkline and shows a cycle context line ("Current cycle") instead; [KpiDetail](app/src/screens/KpiDetail.tsx) renders no trend chart (and no EmptyNA), keeping the snapshot summary (value + N+1 + cycle label + formula/source/frequency). The KPI-detail summary label already reads "Current cycle" (cadence = twice). New `snapshotContextKey` helper in [trend.ts](app/src/lib/trend.ts).
- **Domain page order** (Assessment): SAT 1 · SAT 2 · Students below `<hierarchy>` avg · ORF participation/improvement · CET participation/improvement · CGMS participation/improvement · SAT reports downloaded in classrooms — matches the sheet/task order (asm_result replaced in-place, so SAT 1/SAT 2 lead).
- **Homepage Assessment card** unchanged — still "SAT reports downloaded in classrooms" (the sheet's Home-Page indicator); SAT 1/SAT 2 are normal indicators (`hero:false`).
- **Compare/Export/Leaderboard** inherit the catalog: SAT 1/SAT 2 appear as separate rows/cards, no "Assessment result %", and (being `noTrend`) no sparkline.

**Assumptions** (documented): SAT date isn't in the mock, so the context line shows the cycle ("Current cycle") rather than a literal date; frequency set to "Twice a Year" (the sheet's free-text "SAT 1 to SAT 1 …" describes a per-cycle YoY comparison); value shown as the SAT result % snapshot (no fabricated previous-cycle delta). Gujarati labels translated (not English fallback).

**Files:** `types/index.ts` (`noTrend`), `kpiCatalog.ts`, `trend.ts`, `KpiCard.tsx`, `KpiDetail.tsx`, `QA_REPORT.md`. **Build:** `npm run build` passes clean.

---

## Absentee KPI = absolute count · hierarchy bar chart removed from KPI detail

1. **Rename** — `att_chronic` → **"Students absent from past 7+ consecutive days"** (en + gu) in [kpiCatalog.ts](app/src/config/kpiCatalog.ts); same id/direction (lower-is-better). Flows everywhere via `kpi.name`; the dead `principal.chronicAbs` legacy string updated too. No old variants remain (grep-clean).
2. **Absolute-count semantics** — the value is already anchored to the published per-level **count** (`PUBLISHED.att_chronic` = section 4 → school 18 → cluster 62 → block 215 → district 790 → state 4100), shown via `formatValue(count)` — never a percentage or per-school average.
3. **N+1 = absolute parent count** — KPI-detail N+1 now uses `peerAvg(att_chronic, level)` (the published parent-level count, e.g. cluster scope → "Lakhapat · 215"), matching the cards. Compare (`cmpVal`) now **exempts `att_chronic`** from the `schoolsImplied` per-school normalization (deliberate exception); all other count KPIs unchanged.
4. **"How it's calculated"** — updated to absolute-count prose: _"Counts unique students absent for 7 or more consecutive school days as of the selected/latest date. ."_ Description no longer mentions "rate"/"average per school".
5. **Hierarchy comparison bar chart removed from ALL KPI detail pages** — deleted the "How {KPI} compares up the hierarchy" `ComparisonBars` card + the "Shown as average per school" subtitle from [KpiDetail.tsx](app/src/screens/KpiDetail.tsx) (cascade is still read only for the parent N+1 name). N+1 remains in the summary card + KPI cards only. `ComparisonBars` itself is untouched and still used by the Compare screen.
6. **Trend charts kept** — the frequency-aware time-trend chart (30-day / monthly / half-yearly / yearly) is unchanged.

**Files:** `kpiCatalog.ts`, `KpiDetail.tsx`, `CascadeComparison.tsx`, `i18n/en.ts`, `i18n/gu.ts`, `QA_REPORT.md`. **Build:** `npm run build` passes clean. No changes to access control, routing, PM-Shri, Compare selection, Export structure, provider, or non-absentee formulas.

---

## KPI display cleanup — absentee rename · detail labels · domain top cards · freq badges

1. **Absentee rename** — `att_chronic` name "Students absent from 7+ days" → **"Students absent since last 7+ consecutive days"** (en + gu) in [kpiCatalog.ts](app/src/config/kpiCatalog.ts). Same id/formula/direction (lower-is-better). Flows to home/domain/top-indicators/detail/Compare/Leaderboard/Export via `kpi.name` (no hardcoded copies remain — grep-clean).
2. **`CURRENT VALUE` removed from KPI detail** — [KpiDetail.tsx](app/src/screens/KpiDetail.tsx) now derives a frequency-aware label from the indicator's cadence: Daily → **"Latest: {date}"** (last trend point, or "Latest available" if none) · Monthly → "Current month" · Twice-a-Year → "Current cycle" · Half-yearly → "Current half-year" · Yearly → "Current year". New `kpi.*` i18n keys (en + gu). (Export keeps "Current value" as a table **column header** — not a detail page.)
3. **Lowest-level text removed** — dropped the visible `Lowest level: {level}` line from KPI detail; `kpi.lowestLevel` applicability logic untouched (only the UI render removed).
4. **Domain page top card = homepage indicator** — [DomainSummaryCard](app/src/components/ui/DomainSummaryCard.tsx) `page` variant now uses the same hero-indicator logic as `home` (value/unit/delta/N+1 + indicator label under the domain name); [DomainView](app/src/screens/DomainView.tsx) passes `heroRec` (= `ds.records.find(r => r.kpi.hero)`). Attendance → Students absent since last 7+ consecutive days · Assessment → SAT reports downloaded in classrooms · Administration → No of CRCC/URC Visits per school · School Quality → GSQAC score (`GsqacSummaryCard`). No more generic domain aggregate as the top-card primary value (aggregate fallback only where the hero is role-hidden, e.g. teacher).
5. **Frequency badge on KPI cards** — [KpiCard.tsx](app/src/components/ui/KpiCard.tsx) now renders a `FrequencyBadge` (driven by `kpi.frequency` from the sheet) under the indicator name. Verified catalog frequencies vs the sheet: Attendance = Daily, SAT reports + CRCC visits + observations = Monthly, dropout + re-enrolment = Half-yearly, GSQAC + ORF/CET/CGMS + CPD = Yearly, Assessment result = Twice-a-Year — all already correct.
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

- **`hero`** = the domain's "Home Page Indicator for any hierarchy" → drives the **domain card** primary value (unchanged): Students absent from 7+ days · SAT reports downloaded in classrooms · No of CRCC/URC Visits per school · GSQAC score.
- **`topIndicator`** (new optional `KpiDef` flag) = top intervention indicators → drives the bottom strip, now relabelled **"Top Indicators"**. Set `topIndicator: true` on `ret_dropout` (Reduction in dropout %) and `ret_reenroll` (Re-enrolment of OoSC… against target %) only.
- [HeroKpiStrip](app/src/components/ui/HeroKpiStrip.tsx) now filters `r.kpi.topIndicator` (was `r.kpi.hero`) and uses the new `ogm.topIndicators` label — so the bottom section no longer repeats the four domain-card indicators.

Catalog flags now: **4 `hero` + 2 `topIndicator`** (Teacher% completing 50 hours has neither → absent from the strip, as required). Config-driven: changing the strip later needs only catalog flags, no UI edits. Direction-aware colour preserved (both Top Indicators are higher-is-better). Domain cards, School Quality card, Compare and Export unchanged (Export has no bottom Key-Indicators strip).

**Files:** `types/index.ts` (`topIndicator?`), `kpiCatalog.ts` (flags on dropout + re-enrolment), `HeroKpiStrip.tsx` (filter + label), `i18n/en.ts` + `gu.ts` (`ogm.topIndicators`), `ScorecardHome.tsx` (comment). **Build:** `npm run build` passes clean.

---

## Latest KPI sheet re-audit (now has explicit "Home Page Indicator" column)

Re-parsed the **latest** `GJ _ Unified App KPIs.xlsx` from scratch (treated as source of truth). New structure vs the version the prior pass saw:

- New columns: **Focus Area** (col A) = app _domain_; **Home Page Indicator for any hierarchy** (col B) = the explicit homepage/hero indicator per focus area; **Domain** (col C) = app _sub-domain_.
- The "Home Page Indicator" cells are green-filled and list exactly one per focus area.

**Home Page Indicator column (authoritative homepage + hero mapping):**
Attendance → Students absent from 7+ days · Assessment → SAT reports downloaded in classrooms · Administration → No of CRCC/URC Visits per school · School Quality → GSQAC score.

**Reconciliation result — the previous pass's 4-hero mapping is confirmed correct by the new explicit column.** (The green fills in the _Indicator_ column on Reduction-in-dropout / Re-enrolment / Teacher%-50h are NOT in the Home-Page-Indicator column, so they stay non-hero per the column's authority.)

**Mismatches found & fixed:**

- `att_teacher` name **"Teacher attendance %" → "Teacher Attendance"** (sheet drops the %); `name_gu` "શિક્ષક હાજરી %" → "શિક્ષક હાજરી".
- `att_student` name **"Student attendance %" → "Student Attendance"**; `name_gu` → "વિદ્યાર્થી હાજરી".
- Administration sub-domain labels aligned to the sheet's _Domain_ column: `adm_visits` **"Visits & Observations" → "School Observation"** (gu "શાળા નિરીક્ષણ"); `adm_retention` **"Retention" → "Student Retention"** (gu "વિદ્યાર્થી જાળવણી"). (`adm_cpd` kept the correctly-spelled "Continuous Professional Development".)

**Already correct (verified against the latest sheet, no change):**

- Hero/homepage indicators (4, one per domain) — `hero: true` only on att_chronic, asm_remediation, vis_CRCC_count, sq_gsqac; homepage domain-card value = that hero indicator (config-driven via `kpi.hero`, no hardcoded domain→id map).
- All other indicator display names (Students absent from 7+ days, SAT reports downloaded in classrooms, Assessment result %, Students below <hierarchy> avg, ORF/CET/CGMS participation+improvement, all School-Observation indicators, Reduction in dropout %, Re-enrolment of OoSC…, CPD hours, Teacher% completing 50 hours, GSQAC score).
- GSQAC D1–D5 labels (Teaching & Learning · School Management · Co-curricular activities · Use of Resources · Exam Participation) — match the sheet's School-Quality _Domain_ rows; en + gu.
- Teacher visibility — every row's "Visible to teacher" matches current `roleVisibility` (Teacher Attendance, CET/CGMS, all School-Observation rows, GSQAC = hidden; rest visible). No change.
- Frequency (Daily / Twice-a-Year / Yearly / Monthly / Half-yearly), direction (Students-absent = lower-is-better; rest higher), domain mapping, PM-Shri applicability — all consistent.

**Hero indicators before → after:** unchanged (Students absent from 7+ days · SAT reports downloaded in classrooms · No of CRCC/URC Visits per school · GSQAC score). Teacher% completing 50 hours stays non-hero (normal Administration · CPD indicator, teacher-visible).

**Export / Compare** read names from the catalog, so the two renamed attendance indicators flow through automatically; export's domain summary still headlines each focus area's home-page indicator.

**Files changed:** `kpiCatalog.ts` (att*teacher/att_student names), `frameworks.ts` (adm_visits/adm_retention sub-domain labels), `QA_REPORT.md`. **Build:** `npm run build` passes clean. **KPI sheet:** latest `GJ * Unified App KPIs.xlsx` (with Focus Area + Home Page Indicator columns). **Remaining assumptions:** CRCC/URC Visits is the Administration home-page indicator (no sub-domain in the sheet) but is kept inside the School-Observation sub-domain for the drill-down so it isn't an orphan; "Continous Professional Development (CPD)" kept as the correctly-spelled "Continuous Professional Development".

---

## KPI sheet re-alignment · homepage hero = sheet's Home-Page indicator (one per domain)

Re-parsed `GJ _ Unified App KPIs.xlsx` (now source of truth). The sheet has no "Home Page Indicator" column — the note _"Green coloured are Hero KPIs"_ marks heroes by green Indicator-cell fill. Per the task this is narrowed to exactly one homepage/hero indicator per domain (the green cells also flag dropout/re-enrolment/Teacher%-50h, which the task explicitly demotes to normal).

**Hero indicators are now exactly four** (config-driven via `kpi.hero`, never a hardcoded list — [kpiCatalog.ts](app/src/config/kpiCatalog.ts) `HERO_KPIS = VSK_KPIS.filter(k => k.hero)`):

- Attendance → **Students absent from 7+ days** (`att_chronic`)
- Assessment → **SAT reports downloaded in classrooms** (`asm_remediation`)
- Administration → **No of CRCC/URC Visits per school** (`vis_CRCC_count`)
- School Quality → **GSQAC score** (`sq_gsqac`)

`hero` removed from `cpd_50` (Teacher% completing 50 hours), `ret_dropout`, `ret_reenroll` — they stay as normal Administration indicators (verified: only 4 `hero: true` remain). `Teacher% completing 50 hours` keeps `visibleToTeacher` (no `roleVisibility`).

**Indicator renames (catalog `name`/`name_gu`):** `att_chronic` "Chronic absentee students…" → **"Students absent from 7+ days"**; `asm_remediation` → **"SAT reports downloaded in classrooms"**; `cpd_50` → **"Teacher% completing 50 hours"**; GSQAC D1–D5 → **Teaching & Learning · School Management · Co-curricular activities · Use of Resources · Exam Participation** (both `sq_d*` KPIs and `GSQAC_DOMAINS`). All other names already matched the sheet. Gujarati names updated alongside.

**Homepage domain card value = the domain's hero indicator** (not the weighted aggregate). [DomainSummaryCard](app/src/components/ui/DomainSummaryCard.tsx) `home` variant now takes a `heroRec` and renders that indicator's value (unit-aware), frequency-aware delta and N+1, with the indicator label under the domain name; [ScorecardHome](app/src/screens/ScorecardHome.tsx) passes `d.records.find(r => r.kpi.hero)` per input domain. School Quality keeps `GsqacSummaryCard` (score + grade + N+1 + vs-last-cycle). Falls back to the aggregate where a domain's hero is role-hidden (e.g. CRCC visits for a teacher).

**Export** domain summary now headlines each domain's hero indicator (name + value + N+1 + Δ; School Quality shows score · grade · vs-last-cycle) instead of the aggregate — [Export.tsx](app/src/screens/Export.tsx). Per-indicator detail tables + GSQAC D1–D5 detail unchanged.

**Role visibility** confirmed against the sheet's "Visible to teacher" column — current `roleVisibility` already matches exactly (Teacher Attendance, CET/CGMS, all visits/observations, GSQAC = NON_TEACHER; the rest visible). No changes needed; access logic untouched.

**Direction-aware colours** preserved: `att_chronic` is `direction: "lower"` so a rising count is red and a falling count green (via `ValueDisplay`/`FrequencyDelta`); all rate heroes higher-is-better. Names flow automatically into Domain/Sub-domain/KPI-detail/Compare/Leaderboard/Export since those read `kpi.name`/`name_gu`. (Legacy `principal.*`/`teacher.*` i18n strings are unused/unrendered — left as-is.)

**Build** — `npm run build` (tsc + vite) passes clean. Playwright not run (per instructions).

**Manual checks (code-level):** 4 `hero: true` in catalog (one per domain); homepage domain cards driven by hero record; hero strip shows the 4; `Teacher% completing 50 hours` not a hero, still present in Administration; renamed labels match sheet; Export uses hero-indicator summary; Compare/Export pull names from the catalog. **Known risks:** count-hero N+1 shows the parent's raw count (naturally larger); domain-card value is now an indicator (not the aggregate %) by design — the aggregate still drives the domain _page_ header and Export detail.

---

## Overall-score removal · domain/GSQAC card parity · Export reframe · Compare selection

Five focused product/UI fixes, all composing the existing shared components (no new product features, no formula/provider/access changes).

**1. Overall Score / Input Composite hero removed everywhere.** Deleted the circular ring + grade badge + 30-day trend hero from [ScorecardHome](app/src/screens/ScorecardHome.tsx) and the ring/grade block from [Export](app/src/screens/Export.tsx). No screen references `RatingRing`/`overallPercent`/`inputComposite` any more (grep-clean). The homepage now opens straight on Domain cards → School Quality → Key indicators. (The "Key indicators" `HeroKpiStrip` is actionable KPI content and stays.)

**2. Domain page top = homepage domain-card grammar.** [DomainSummaryCard](app/src/components/ui/DomainSummaryCard.tsx) gained a `variant: 'home' | 'page'`. [DomainView](app/src/screens/DomainView.tsx) replaced the banner/long-progress header with the expanded `page` variant (icon chip + name + scope name + value + N+1 + frequency delta + compact progress). School Quality pages use the `GsqacSummaryCard` instead, and the D1–D5 indicator cards render below (the `sq_gsqac` overall tile is filtered out to avoid duplication).

**3. School Quality homepage card fixed.** [GsqacSummaryCard](app/src/components/ui/GsqacSummaryCard.tsx) is now compact and in the domain-card rhythm (white card + subtle pink accent chip): title · `OUTPUT · ANNUAL` · GSQAC score · official grade badge · **N+1 line** (`Kachchh · 64%`) · `vs last cycle: +1.4%` · coverage · chevron. **The 5 GSQAC domain bars were removed from the homepage** — they live on the School Quality detail page (as the D1–D5 indicator cards). No daily trend; grade uses official colours via `RatingBadge`/`GRADE_GROUP`.

**4. Export reframed.** Removed the Input-Composite ring, grade hero, weightage/contribution columns and the "Input composite" total row. Domain summary is now **Domain · Value · {parent} avg (N+1) · Δ** across the 4A inputs + School Quality (output shows score · grade · vs-last-cycle). Header shows entity · level · framework · period · PM-Shri (if active). GSQAC D1–D5 bars kept under a dedicated "School Quality · D1–D5" detail section. Tables use the shared `ResponsiveDataTable`.

**5. Compare selection fixed.** [CascadeComparison](app/src/screens/CascadeComparison.tsx): **Unit 1 is fixed to the user's own scope** (primary chip); Units 2–4 start empty with `Select a unit` placeholders. Selecting a unit **removes it from the other dropdowns** (no duplicates); a `Clear` row frees it again. Comparison bars render **only for selected units**; with just Unit 1 an empty state shows _"Select another unit to compare KPIs."_ Access rules unchanged (pool = same-level peers + one-level-below subtree only; comparison units non-navigable).

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

- `roles-smoke` **6/6** (teacher · principal · CRCC · brc · deo · state — each scoped correctly, 0 errors)
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

**3. Value/delta colouring fixed app-wide — red only for _bad_** (direction-aware):

- **Reduction in dropout % "+16.2%"** now renders **green** (verified `rgb(21,128,61)`) — higher-is-better, so a positive change is good, not red. Fixed on the hero card and the indicator detail.
- **Chronic absentees** (lower-is-better): a decrease "−117" renders **green** (verified) — down is good; its value/dot are green when healthy.
- **Re-enrolment / remediation / assessment** (higher-is-better): up = green, down = red.
- Applied via the helpers to the hero strip, indicator detail, domain/input cards, the GSQAC vs-last-cycle delta, and the leaderboard "vs avg" gap. `DeltaPill` was already direction-aware (kept). A good value or delta is **never red**; flat = neutral.

**Verified** (production build · Playwright): dropout/chronic/re-enrolment colour correctly; SQ value neutral + badge official; domain page has no D1–D5 section; `tsc` + build clean; **roles 6/6 · access 20/20 · functional 21/21 · 0 console errors**. Screenshot: `audit-home-colours.png` (repo root). Note: "watch/amber" headline numbers are rendered **neutral** (per the rule "a healthy headline is neutral/brand or green, never red"); the status dot + grade badge carry the amber signal.

---

## Frequency-aware trend graphs + delta tags

Every indicator now carries a **frequency-appropriate trend graph** (on the cards and the detail) plus a **delta tag whose wording is derived from `frequency`** — never a weekly axis or a "Δ this week" tag for non-daily data. All driven from one engine ([lib/trend.ts](app/src/lib/trend.ts)), so cadence + tag are config, not per-card.

| Frequency                                                                  | Graph x-axis (verified)                                         | Delta tag (verified) |
| -------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------- |
| **Daily** (Student attendance, Chronic absentees)                          | last 30 days — daily line (3 May…1 Jun)                         | **Δ this week**      |
| **Monthly** (CRCC/URC visits, School observation, Data-Driven Remediation) | Jan…Jun (months); CRCC plotted on a 0–2 axis                    | **Δ this month**     |
| **Twice a Year** (Assessment result/SAT, Students-below)                   | SAT 1'23 · SAT 2'23 · SAT 1'24 · SAT 2'24 · SAT 1'25 · SAT 2'25 | **Δ this cycle**     |
| **Half yearly** (Reduction in dropout, Re-enrolment)                       | Sept'23 · Mar'24 · Sept'24 · Mar'25 · Sept'25 · Mar'26          | **Δ this time**      |
| **Yearly** (GSQAC, CET, CGMS, ORF, CPD)                                    | 2021 · 2022 · 2023 · 2024 · 2025 (+ GSQAC grade)                | **Δ this year**      |

- **History** is believable dummy data (gently trends, can dip), deterministic (seeded by kpi + entity), and **pinned to the real current value** at the latest point, so the headline number and the graph agree. The delta = current minus one tag-period back (≈7 days for daily, 1 point otherwise).
- **Clarification applied:** annual / half-yearly indicators **now get a graph** (with yearly / half-year x-points) — consistent with the earlier "no fake weekly line for annual data" rule; GSQAC also keeps its **snapshot + grade**.
- **Specific cases fixed:** CRCC/URC visits + School observation → monthly graphs with month labels & "Δ this month"; dropout → half-year graph & "Δ this time"; GSQAC/annual → yearly graph & "Δ this year".
- **Charts** ([TrendChart.tsx](app/src/components/ui/TrendChart.tsx)): nice ascending Y-ticks fitted to data (e.g. 63–68 for GSQAC, 1.2–2 for CRCC, 80–100 for a 90% series), "Avg N" reference, last x-label no longer clipped, entry animation disabled (snappy + clean).
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

**Indicator names** aligned **exactly to `GJ _ Unified App KPIs.xlsx`** (column C) for all indicators (e.g. "Mid Day Meal (MDM) served %", "Chronic absentee students (7 consecutive days)", "Participation rate in ORF Reading (ORF)", "No of CRCC/URC Visits per school", "Re-enrolment of OoSC (Out of School) against target %", "Data Driven Remediation %"). The Data-Driven-Remediation **GP report-card-download** mechanic is retained in its description/formula. GSQAC's 5 sub-rows keep the descriptive D1–D5 domain names (the sheet's repeated "GSQAC domain" placeholder isn't useful).

**Re-verified:** `tsc` + build clean; **roles 6/6 · access 20/20 · functional 21/21 · 0 console errors**; charts agree (month labels / 30-day / no annual line) with sane Y-axes; hero tiles uniform; 0 overflow at 320 px in EN + ગુ.

---

## OGM 3.0 — Officer Command Center (Pass 1 of phased build)

Decision-first, government-officer-first upgrade built **exactly** on `Docs/OGM 3.0 - Indicators.csv` (definitive). Per the agreed scope: **Pass 1 = OGM-3.0 catalog + schema + frequency-aware cards + N+1 comparison + official GSQAC colours + data-lake/freshness states + Officer Command Center (page 1)**. Pass 2 (Domain drill-down, Indicator Detail page, School Profile drawer) is deferred. Confirmed defaults applied: _My decision-critical heroes_, _Phased — foundation first_, _Park all indicators not in OGM 3.0_. The engine stayed config-driven, so most of this was config + a thin component layer.

### What changed (Pass 1)

| Area                                                                                     | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Indicator catalog** ([kpiCatalog.ts](app/src/config/kpiCatalog.ts))                    | Rebuilt to the OGM 3.0 set exactly: Attendance (5) · Assessment (12, incl. ORF/CET/CGMS participation+improvement, NAS, merit, classroom prep) · Administration → **CPD / Visits & Observations / Retention** · School Quality (GSQAC + 5 domains + vs-cycle). Each indicator carries `formula`, `data_source`, `frequency`, `availableInDataLake`, `displayStrategy`, `hero`, `pmShriApplicable`, `roleVisibility`, `lowestLevel`, `dataLagNote`. Everything **not** in OGM 3.0 is parked. |
| **Schema** ([types/index.ts](app/src/types/index.ts))                                    | `KpiDef` extended with the OGM 3.0 metadata (mapped onto the existing shape, minimum churn); added `Frequency` / `DisplayStrategy` types; `Unit` gained `ratio`/`grade`.                                                                                                                                                                                                                                                                                                                    |
| **Sub-domains** ([frameworks.ts](app/src/config/frameworks.ts))                          | Administration's 7 → **3** (CPD · Visits & Observations · Retention), per the sheet.                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Frequency-aware display** ([HeroKpiStrip.tsx](app/src/components/ui/HeroKpiStrip.tsx)) | Daily → 30-day **sparkline**; Twice-a-year / Half-yearly → **vs-last-cycle delta**; Monthly → **compliance %**; Yearly → **snapshot + GSQAC grade**; counts → **count + rate**; CRCC visits → **x / 2** ratio. Never a fabricated daily trend for annual data.                                                                                                                                                                                                                              |
| **N+1 comparison** ([lib/peer.ts](app/src/lib/peer.ts))                                  | Each level vs its **next level up** (School↔Cluster, Cluster↔Block …) shown as a signed gap ("State 73 · −5.3 behind"), not a rank, and not for raw counts. Replaces the static state baseline. State has no N+1 (correctly hidden).                                                                                                                                                                                                                                                        |
| **Official GSQAC colours** ([lib/colors.ts](app/src/lib/colors.ts))                      | Grade colours = GSQAC guidelines: **A green `#1B7F4B`, B yellow `#E0A400`, C red `#D33A2C`, D black `#2B2B2B`** (text darkened for AA where needed; verified computed: B = `rgb(176,126,0)` on `rgba(224,164,0,.14)`). Operational status (On Track / Watch / …) kept separate.                                                                                                                                                                                                             |
| **Data-state badges** ([DataBadges.tsx](app/src/components/ui/DataBadges.tsx))           | `FrequencyBadge` · `FreshnessBadge` (cadence-appropriate) · `SourceBadge`. (A "Demo data — not in data lake yet" badge was built then removed at the user's request.)                                                                                                                                                                                                                                                                                                                       |
| **GSQAC domains** ([mockProvider.ts](app/src/data/provider/mockProvider.ts))             | `sq_d1..d5` now sourced from **real** `entity.meta.gsqac.domains`; output domain score pinned to `sq_gsqac` (D1–D5 are context, not re-averaged).                                                                                                                                                                                                                                                                                                                                           |
| **Officer Command Center** ([ScorecardHome.tsx](app/src/screens/ScorecardHome.tsx))      | Composite ring + "what changed" + biggest-opportunity callout, **Hero KPI strip** (6 decision-critical indicators, frequency-aware + N+1), 4A domain cards, School Quality (real GSQAC, D1–D5), and a **risk-first "Where to focus first" table** (units below you, worst composite first; reuses the child leaderboard, performant).                                                                                                                                                       |
| **Mock realism** ([mockProvider.ts](app/src/data/provider/mockProvider.ts))              | `ratio`/`hours` get proportional spread; **context-delta %s (YoY / dropout) kept tight (~±2.4) and allowed to dip negative** — a real decline becomes a "needs attention" signal instead of being swamped by ±9 jitter.                                                                                                                                                                                                                                                                     |

### Verification (production build · preview 4174)

- `tsc --noEmit` clean · `npm run build` clean (main 31 KB gz; seed lazy chunk 408 KB gz).
- **Functional `verify.mjs` 21/21**, **access/dropdown `verify-access.mjs` 20/20**, **all-roles `roles-smoke.mjs` 6/6** — **0 console/page errors**.
- Playwright MCP: State Command Center (hero strip, 4A cards, real GSQAC D1–D5 B-grade, risk table), drill State → District (N+1 peer bands appear: "State 92% · −0.1% behind", "State 73 · −5.3 behind"), frequency-aware tiles (Daily sparkline, YoY/half-yearly deltas, monthly %, yearly GSQAC grade), official GSQAC B colour verified by computed style.
- Responsive: **0 horizontal overflow at 320 px** in **English and ગુજરાતી**; all `ogm` strings + Gujarati numerals render; scope drill + access clamps intact.

### Command Center — review round (hero set, attention strip, transparency)

Follow-up addressing the #1–#5 checklist + the official hero list:

| Item                             | Change                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hero set (#2)**                | `kpi.hero` now flags **exactly the official 7** (config-driven; asserted `HERO_KPIS` = the set): Chronic absentees · Data-Driven Remediation % · Teachers completing 50 hrs % · CRCC/URC visits · Reduction in dropout % · Re-enrolment of OoSC · GSQAC score. Strip reframed **"What to act on — intervention levers, not headline numbers"**, ordered most-at-risk first, all 7 frequency-aware, demo/data-lake badges carried (5 of 7 are DL=No). |
| **"What needs attention?" (#1)** | New **computed** insight strip ([insights.ts](app/src/lib/insights.ts) + [AttentionStrip.tsx](app/src/components/ui/AttentionStrip.tsx)) — biggest N+1 gap, weakest input domain, biggest decline vs cycle, chronic absentees + rate, GSQAC coverage gap — ranked by severity, distinct from the hero strip and risk table. Nothing hardcoded.                                                                                                       |
| **PM-Shri (#3)**                 | Confirmed top-bar, Cluster+ only (hidden Teacher/Principal); now also reachable on mobile.                                                                                                                                                                                                                                                                                                                                                           |
| **Coverage honesty (#4)**        | GSQAC "real / measured" school counts via `getScopeStats` ([mockProvider](app/src/data/provider/mockProvider.ts)) — chip on the School Quality card + a coverage insight, so missing data ≠ low performance.                                                                                                                                                                                                                                         |
| **Composite-risk sort (#5)**     | Formula made transparent: info tooltip ("30% Attendance + 30% Assessment + 40% Administration, lowest first") + each row shows its 4A breakdown as accent dots ([SchoolRiskTable](app/src/components/ui/SchoolRiskTable.tsx); `LeaderboardEntry.domainPercents`).                                                                                                                                                                                    |
| **State N+1 (minor)**            | Falls back to vs-previous-period, gated to Daily/Weekly/Monthly so annual KPIs never show a fabricated weekly delta.                                                                                                                                                                                                                                                                                                                                 |

**Adversarial review (3 parallel lenses — correctness · taste · a11y/i18n).** No blockers. Fixed: em dashes in rendered copy removed (both locales + `dataLagNote`, per the impeccable law); GSQAC excluded from the N+1 peer band and the peer-gap insight (its real value has no real next-level-up baseline in the mock — the grade is the signal); GSQAC status dot now derives from its grade band (can't disagree with the badge); risk-formula info is a focusable button + coverage line has an accessible label; info-severity insights use neutral grey so only red/amber carry urgency. Documented: chronic rate is illustrative (count and enrolment are independently sourced in the mock).

**Re-verified:** `tsc` + build clean; all-roles 6/6 · access 20/20 · functional 21/21, **0 console errors**; 7 heroes + attention strip render at desktop and 320px in EN + ગુજરાતી (Gujarati numerals); 0 horizontal overflow; official GSQAC grade colours intact.

### Reconciliation to `GJ _ Unified App KPIs.xlsx` + IA cleanup

Definitive list switched to the **Excel sheet** (parsed via openpyxl: 35 rows = 30 indicators + 5 GSQAC-domain rows). The catalog is now reconciled to it **exactly** — `merit-list`, `NAS`, `classroom-prep`, `avg-CPD-hours` and a standalone `GSQAC-improvement` KPI were parked (not in the sheet); the **Compare screen renders all 35** and Export lists all of them.

| #                                                                                                                            | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Two-axis visibility** ([applicability.ts](app/src/config/applicability.ts), [kpiCatalog.ts](app/src/config/kpiCatalog.ts)) | Config-driven, no hardcoded id lists. **`lowestLevel`** = level applicability: school-and-above (teacher attendance, MDM, reporting, ALL Administration, GSQAC) are hidden at grade/section; classroom (student attendance, chronic, ALL assessment) go to section. **`roleVisibility`** = sheet column J: the 20 "No" rows exclude the teacher persona (officers/principal keep them). Verified live: at Section 1-A a teacher sees Student attendance + Chronic + assessment, while **Teacher attendance / MDM / Administration / GSQAC / CET / CGMS are gone** (the screenshot bug is fixed). |
| **A1 Demo badge removed**                                                                                                    | The "not in data lake" badge no longer renders anywhere; every indicator shows (demo values where no live feed). `availableInDataLake` flag retained in config.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **A2 Sections removed**                                                                                                      | Screen + route + nav item deleted. Nav is **Scorecard · Compare · Leaderboard · Export** (desktop + mobile).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **A3 / A4**                                                                                                                  | Biggest-opportunity card already gone; **"vs benchmark" copy removed everywhere** (KpiCard, Leaderboard, KpiDetail, and engine [story.ts](app/src/engine/story.ts)) in favour of N+1 "vs {level} avg" language.                                                                                                                                                                                                                                                                                                                                                                                  |
| **B Frequency-aware trend** ([KpiDetail.tsx](app/src/screens/KpiDetail.tsx))                                                 | Daily → 30-day line; Monthly → monthly; **Twice/Yearly/Half-yearly → cycle-over-cycle (no weekly line)**; GSQAC → snapshot + grade + vs-last-cycle. Verified: GSQAC detail shows "Cycle over cycle" + "Annual snapshot", **no weekly trend**.                                                                                                                                                                                                                                                                                                                                                    |
| **C Cross-level = upward only** ([engine/index.ts](app/src/engine/index.ts) `getKpiCascade`)                                 | Own level + ancestors up to State (never descendants); **hidden entirely for a State user**. Verified.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **D Hero → detail** ([ScorecardHome.tsx](app/src/screens/ScorecardHome.tsx))                                                 | Key-indicator (and insight) cards open the indicator's detail page directly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **E Compare = 4 single-selects** ([CascadeComparison.tsx](app/src/screens/CascadeComparison.tsx))                            | Exactly four single-select slots; options scoped to the user's **own level (peers) or one level below** (e.g. Block → Blocks or Clusters; never District/State). Access-control test updated + passing.                                                                                                                                                                                                                                                                                                                                                                                          |
| **G Data-Driven Remediation reframed**                                                                                       | Now **"GP report-card downloads %"** — Gyan Prabhav generates a report card at every level; the metric is downloads ÷ total at that level × 100.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **I Export comprehensive** ([Export.tsx](app/src/screens/Export.tsx))                                                        | 4A summary + per-domain tables of **every applicable indicator** (★ heroes highlighted) with value · N+1 · Δ-by-frequency · source · grade, scoped to level. Verified: 7 hero rows highlighted, all indicators present.                                                                                                                                                                                                                                                                                                                                                                          |

**Re-verified (production build):** `tsc` + build clean; **roles 6/6 · access 20/20 · functional 21/21 · 0 console errors**; teacher-at-section applicability fixed; Compare offers Block-peers + Cluster-one-below (no District/State); 0 horizontal overflow at 320 px; EN + ગુજરાતી (i18n parity type-enforced); no "demo data" / "benchmark" copy anywhere.

### Deferred to Pass 2 (by agreement)

Domain Drill-down (metric-first + geography-first), Indicator Detail page (full formula/source/cascade/data-lineage), School Profile drawer. PM-Shri filter UI exists from the prior round (Cluster+); per-indicator PM-Shri denominator application and the 3-band "students below hierarchy avg" distribution are Pass-2 refinements. Several Visits & Retention indicators are `DL=No` (demo) pending data-lake availability — flagged in-UI.

---

# QA Report (4A Input-Output reframe — prior round)

Structural migration from the 5A model to the **4A Input-Output** model (per `Mini-App_Action_Plan_4A.md` + `OGM 3.0 - KPIs_6th June_draft 1.csv`), with real GSQAC data for School Quality. The engine stayed **config-driven** — most of this was config + data + a few screens.

**Method.** Read the reference files first (action plan, OGM Table 1/3, real `GSQAC/gsqac 2024-25.csv`) without modifying them. Verified with the **Playwright MCP** (now connected) plus the Node Playwright suites, against the **production build** (`npm run build` → `npm run preview`). Skills applied: `impeccable` + `design-taste-frontend` (6-second-rule, decision-first, no "rangoli"); `owasp-security` (access control); e2e/integration/performance patterns (coverage). Two data-integration forks were confirmed with the user before building (GSQAC source; vs-last-cycle).

---

## What changed

| Area                                                                                                                           | Change                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework** ([frameworks.ts](app/src/config/frameworks.ts))                                                                  | 5 domains → **4**: Attendance (input 30%), Assessment (input 30%), Administration (input 40%), **School Quality** (output). Administration gets **7 sub-domains**. Renamed "Pocket VSK · 4A". `kind: input/output` + `INPUT_DOMAIN_IDS`/`OUTPUT_DOMAIN_ID`.                                                                    |
| **Catalog** ([kpiCatalog.ts](app/src/config/kpiCatalog.ts))                                                                    | Rebuilt from §2 (~50 indicators) with `unit` (type), `direction`, `data_source`, `sub_domain`, sample numbers, "—"=NA markers, and `// TODO` notes on the CSV-flagged ambiguous metrics. Added `context` flag + per-KPI `rag`. `GSQAC_DOMAINS` (D1-D5).                                                                        |
| **Scoring** ([score.ts](app/src/engine/score.ts))                                                                              | Headline = **Input Composite** (30/30/40 over the 3 inputs, output excluded). **School Quality shown as-is** (the GSQAC `score`, not averaged). **Sub-domain rollups** (domain = mean of sub-domains = mean of indicators). lower-is-better inverted; **count + delta indicators are CONTEXT** (shown, not folded into the %). |
| **School Quality** ([attachGsqac.mjs](app/scripts/attachGsqac.mjs), [mockProvider.ts](app/src/data/provider/mockProvider.ts))  | **Real GSQAC** joined by UDISE: **775/1000 schools real**, 225 synth from the real distribution, rolled up enrolment-weighted to cluster→state. Provider sources `sq_*` from `meta.gsqac` — **annual/flat** (no WoW); "vs last cycle" is a flagged synth delta.                                                                |
| **Home** ([ScorecardHome.tsx](app/src/screens/ScorecardHome.tsx))                                                              | **4A homepage for every role**: composite ring + 3 input cards (score, RAG, WoW, vs-parent peer gap) + **School Quality output card** (GSQAC + grade + D1-D5 + vs last cycle). Removed the score-breakdown table and bespoke `PrincipalView`/`TeacherView` ("rangoli" + duplication).                                          |
| **Drill (3-click)** ([DomainView.tsx](app/src/screens/DomainView.tsx), [SubDomainView.tsx](app/src/screens/SubDomainView.tsx)) | Administration → **sub-domain cards** → indicators (3 taps); Attendance/Assessment → indicators (2 taps); School Quality → GSQAC D1-D5 breakdown. New `domain/:domainId/:subId` route. **Geography drill** = the "Explore below" children + breadcrumb (both journeys).                                                        |
| **Peer comparison** ([ui/Leaderboard.tsx](app/src/components/ui/Leaderboard.tsx))                                              | **Performance bands (A+/A/B) + "± vs benchmark"** (the peer-group/next-level-up average), **no integer ranks/medals/rank-movement**. Read-only for out-of-subtree peers. Input cards show the vs-parent-average gap.                                                                                                           |
| **Compliance boxes**                                                                                                           | Folded into Administration indicators — **PTR survives as `vis_ptr`**; the standalone class-capacity/enrolment boxes are gone (not KPIs in the new catalog).                                                                                                                                                                   |
| **i18n**                                                                                                                       | All new domain/sub-domain/indicator labels carry `name_gu`; new UI strings (Input composite, School Quality, vs last cycle, sub-domains, ahead/behind, peer comparison) added to en + gu.                                                                                                                                      |

---

## Verification (production build)

| Check                                                             | Result                                                                                                                                                                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsc --noEmit` · `npm run build`                                  | clean / passes (main chunk 30 KB gz; 21k-entity+GSQAC seed lazy-loaded ~408 KB gz)                                                                                                                  |
| Responsive sweep (roles × screens × {320,375,768,1440} × {en,gu}) | **0 overflow, 0 console errors**                                                                                                                                                                    |
| Functional (`verify.mjs`)                                         | **21/21** (login validation 10-digit ID / 11-digit UDISE / 4-digit PIN, screens load, no console errors)                                                                                            |
| Access control + dropdowns (`verify-access.mjs`)                  | **20/20**                                                                                                                                                                                           |
| All-6-roles login + scope (`roles-smoke.mjs`)                     | **6/6**                                                                                                                                                                                             |
| Playwright MCP visual                                             | 4A home (desktop + iPhone SE), 3-click drill (Administration → Retention → indicators), geography drill (district cards), School Quality real GSQAC D1-D5, peer-bands leaderboard, 0 console errors |

**Scoring sanity (State):** composite **91 (A++)** = 0.3·94 + 0.3·87 + 0.4·90 ✓; Administration **89%** = mean of its 7 sub-domains ✓; School Quality **67% (B)** = real rolled-up GSQAC (Scholarships D5 = 47%, matching the CSV's low D5) ✓.

### §5 carry-forward — re-verified, no regressions

- **Access control:** Block/Principal cannot reach an ancestor/peer via Compare, breadcrumb, leaderboard, or hand-edited `localStorage` (clamped to home; `isInScope` guard intact). Peer comparison read-only/non-navigable. Production-RLS comments retained.
- **Login:** 10-digit ID + 11-digit UDISE (teacher/principal) / ID + 4-digit PIN (officers), role by seed lookup, time-based greeting — all pass.
- **"—" = hidden** (no NA clutter); role-appropriate sets; PM SHRI hidden for Teacher/Principal; **Select All** in dropdowns; custom on-brand dropdowns with search + a11y; responsive 320–1440; bilingual; real registry retained.

### Bugs found & fixed during this round

| Issue                                                                                                     | Fix                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Input-card WoW trend distorted by count deltas (chronic absentees / merit list)                           | domain trend averages only scored %/score indicators                                                                                |
| "Reduction in dropout 16%" rendered **red** and dragged the score (delta scored as 16/100)                | delta indicators (dropout, student improvement, ORF/FLN) marked `context` + sensible per-KPI RAG → green, not folded into the score |
| (Prior round) grade band 77→A+, behind-benchmark green, iPhone SE overflow, 1000-node dropdown, dead code | all still fixed (bands A+ ≥85, gap-aware RAG, `grid-cols-1` reflow, Select cap, config-driven compliance)                           |

---

## Deferred / couldn't implement (and why)

- **Open metric definitions (pending Chaitanya / State)** — built with sample numbers + a `// TODO` label, logic deferred: _Performance of PM SHRI schools_ (metric?), _Grant & expenditure_ (what metric?), _Scheme delivery vs Payment completion_ (flagged "very similar"), _ICT/Library usage_ (may not apply to all schools), _Attendance reporting compliance_ and _Reports downloaded_ (exact definition). These render with real labels + data sources but their definitions are not final.
- **"Improvement vs last cycle"** — synthesized per-entity delta, flagged `// TODO: real prior-cycle data`, because `gsqac 2024-25.csv` is a single round (no prior cycle).
- **GSQAC coverage** — 775/1000 schools are real; 225 are synthesized from the real distribution (marked `synth`) to keep every level populated, per your decision. A re-seed to GSQAC-only schools would make it ~100% real but churn the registry/demo logins.
- **Per-KPI aggregation definitions** (Devpal) — the app rolls each indicator section→…→state by anchoring to the published per-level numbers (cascade-consistent); the exact production aggregation per indicator is pending.
- **Compliance class-capacity / enrolment boxes** — removed (folded per §3.11); only **PTR** survives as an indicator (`vis_ptr`), since the other two aren't indicators in the new catalog.
- **Prior-round Nits** (chart-hex centralization, level-ordering dedup, `perSchool` dedup) remain deferred — documented previously; none affect correctness.

All Blockers/Majors implemented and verified; the items above are data/definition dependencies on Chaitanya/Devpal/State, not build gaps.
