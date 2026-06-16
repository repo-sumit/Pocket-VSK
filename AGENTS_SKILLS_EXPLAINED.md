# Agents and Skills Explained

> Analysis & documentation only. No app code was changed to produce this file.
> Location of the folder described here: **`app/.agents/skills/`** (it lives under `app/`, not the repo root).

## Summary

- **What `.agents` is** — a folder that stores reusable "skills" for AI coding agents (Claude Code, Cursor, Codex, etc.). It is *not* application code and is never imported by the Pocket VSK build. It is reference material the agent can read.
- **What `.agents/skills` is** — a library of **14 skill folders**. Each skill is a Markdown playbook (a `SKILL.md` with a YAML header of `name` + `description`, then detailed rules). One skill (`huashu-design`) is a larger multi-file toolkit with scripts, references and media.
- **How Claude Code uses these skills** — Claude reads each skill's `name` + `description` to know it exists. A skill's full rules are loaded **only when it is invoked** — either you name it ("use the `redesign-existing-projects` skill…"), or the harness/config routes to it. They do **not** auto-run on every message and they do **not** silently rewrite your app.
- **Do they change code or only guide?** — Almost all are **guidance / "review-lens"** skills: they shape *how* Claude designs, critiques, or writes UI. Only the ones you explicitly point at code (e.g. `image-to-code`, or a design skill used during an implementation task) cause file edits — and only because you asked for an implementation. `brandkit`, `imagegen-frontend-web/mobile` produce **images**, not code. `huashu-design` produces **HTML prototypes / decks / animations / videos**, not production React.

## Quick Recommendation

- **Best for Pocket VSK UI/design work** — `redesign-existing-projects` (audit-and-upgrade without breaking logic), `design-taste-frontend` (its "AI tells" + "redesign protocol" sections), and `minimalist-ui` (matches Pocket VSK's clean, blue-grey, government-dashboard feel).
- **Best for QA/testing** — **none of these are testing skills.** The closest QC aid is `full-output-enforcement` (forces complete, non-truncated output). For real QA use Claude's general code-review/testing skills (installed globally, not in this folder) and the existing Playwright MCP flow.
- **Best for implementation prompts** — `full-output-enforcement` (anti-truncation) + a design skill used strictly as a *review lens* with "do not redesign from scratch".
- **Best to avoid overusing** — the high-intensity aesthetic skills: `high-end-visual-design`, `gpt-taste`, `industrial-brutalist-ui`, `imagegen-*`, `brandkit`, and `huashu-design`. They push bold/expressive output that can fight Pocket VSK's restrained, data-dense, mobile-first style and burn tokens.

## Folder Inventory

| Folder | Purpose | Main files | Safe to keep? | Notes |
|---|---|---|---|---|
| `brandkit` | Generate brand-guideline **image** boards (logos, identity decks) | `SKILL.md` (~20K) | Keep (optional) | Image generation, not code. Rarely needed for an existing app. |
| `design-taste-frontend` | Anti-"slop" frontend design system + redesign protocol + "AI tells" blocklist | `SKILL.md` (~88K, largest single file) | Keep | Strong **review lens**; use the audit/AI-tells parts, ignore "build from scratch" parts. |
| `design-taste-frontend-v1` | Older v1 of the above, kept for backward-compat | `SKILL.md` (~24K) | Keep (optional) | Redundant with v2 unless something pins v1. |
| `full-output-enforcement` | Forces complete code output, bans placeholders/"// rest unchanged" | `SKILL.md` (~4K) | **Keep** | Smallest + most generally useful for implementation/QC tasks. |
| `gpt-taste` | GSAP motion + AIDA marketing structure + editorial type | `SKILL.md` (~8K) | Keep (optional) | Marketing-site flavored; over-design risk for a dashboard. |
| `high-end-visual-design` | "Design like an award-winning agency" — fonts, shadows, motion, anti-patterns | `SKILL.md` (~12K) | Keep (optional) | Use only for marketing/landing surfaces, not core KPI screens. |
| `huashu-design` | HTML hi-fi prototypes, clickable demos, slide decks, animation → MP4/GIF, voiceover videos, design-direction advisor, 5-axis design review | `SKILL.md`, `README*.md`, `references/` (25 md), `scripts/` (node/py/sh), `assets/` (bgm mp3, jsx frames), `demos/` (HTML); `.env.example`, `package.json` | Keep (optional) | **32 MB of the 33 MB total** (media). Great for pitch/prototype/explainer videos; **not** for production React app code. |
| `image-to-code` | Image-FIRST: generate design images, analyze them, then build matching web UI | `SKILL.md` (~40K) | Keep (optional) | Codex-oriented; good for greenfield pages from a visual target. |
| `imagegen-frontend-mobile` | Generate premium **mobile app screen images** (in phone mockups) | `SKILL.md` (~44K) | Keep (optional) | Images only, no code. Useful for concept exploration. |
| `imagegen-frontend-web` | Generate premium **web design reference images** (one image per section) | `SKILL.md` (~40K) | Keep (optional) | Images only, no code. |
| `industrial-brutalist-ui` | A specific look: Swiss/brutalist/military-terminal | `SKILL.md` (~12K) | Keep (optional) | Style preset; **off-brand** for Pocket VSK. |
| `minimalist-ui` | Clean editorial, monochrome, flat bento, no heavy shadows | `SKILL.md` (~8K) | **Keep** | Closest aesthetic match to Pocket VSK. |
| `redesign-existing-projects` | Audit an existing app, find generic AI patterns, upgrade **without breaking functionality** | `SKILL.md` (~16K) | **Keep** | **Best fit** for Pocket VSK polish work. |
| `stitch-design-taste` | Generate a `DESIGN.md` design-system spec via tunable "dials" | `SKILL.md` + `DESIGN.md` (~24K) | Keep (optional) | Produces a design-system doc, not code. |

Total: **14 skill folders**, **~33 MB on disk** (≈32 MB is `huashu-design` media), **14 `SKILL.md` files**.

## Detailed Skill Notes

Each note answers, compactly: *what it is, what's inside, what it's for, why/when to use, benefit, how it affects Claude, productivity, how to reuse, best situations, overuse risk, keep?* and gives a Pocket-VSK example prompt.

### brandkit
- **What / files:** A single `SKILL.md` (~20K) for premium **brand-kit image generation** (3×3 brand boards, logo systems, identity decks).
- **Used for / when:** Creating new logo/brand visuals or a brand-guidelines board — a *branding* task, not app code.
- **Benefit / effect on Claude:** Pushes Claude to produce art-directed, intentional brand imagery instead of generic clip-art. Affects **image output**, not the React app.
- **Productivity / reuse:** Fast brand concepting; reuse any time you need identity visuals. Invoke by name.
- **Best situations:** A future Pocket VSK brand/identity refresh, a pitch deck cover, an app-icon exploration.
- **Overuse risk:** Irrelevant to day-to-day feature work; can waste image-gen tokens.
- **Keep?** Optional-keep.
- **Example:** `Use brandkit to propose 3 logo directions for a "Pocket VSK" wordmark in the existing blue palette. Image concepts only — do not touch app code.`

### design-taste-frontend
- **What / files:** The biggest single skill (`SKILL.md`, ~88K, 1206 lines). A full anti-"slop" frontend system: brief inference, "three dials" (creativity/density/variance), design-system map, performance/a11y guardrails, a **"AI TELLS — forbidden patterns"** blocklist, a **REDESIGN PROTOCOL**, a block library, and a final pre-flight check.
- **Used for / when:** New landing pages/portfolios, or as a **review lens** to catch generic-AI design tells in existing UI.
- **Benefit / effect on Claude:** Strongly raises design quality and consistency; makes Claude self-audit against known "cheap AI" patterns before shipping.
- **Productivity / reuse:** One reusable standard so you don't re-explain "make it not look templated" each session.
- **Best situations:** Pocket VSK polish reviews (spacing/hierarchy/typography), or a new marketing page.
- **Overuse risk:** Its "default architecture / build from scratch" parts can over-design a constrained dashboard if you don't constrain it.
- **Keep?** Keep.
- **Example:** `Use design-taste-frontend ONLY as a review lens (sections "AI Tells" + "Redesign Protocol"). Audit Pocket VSK's KPI cards for AI-slop tells and spacing. List findings; do not redesign or change data.`

### design-taste-frontend-v1
- **What / files:** `SKILL.md` (~24K, 226 lines) — the **original v1** of the taste skill, preserved for backward compatibility.
- **Used for / when:** Only if you need the exact older behavior; otherwise prefer v2.
- **Benefit / risk:** Stability for anything pinned to v1; otherwise redundant and a potential source of confusion (two similar skills).
- **Keep?** Optional-keep (harmless; remove only if you're sure nothing references v1).
- **Example:** `Only if v2 changed behavior you disliked: use design-taste-frontend-v1 as the review lens instead.`

### full-output-enforcement
- **What / files:** Tiny `SKILL.md` (~4K, 49 lines). Overrides the model's tendency to truncate: **bans placeholders** like `// ... rest unchanged`, forbids "(implementation omitted)", and defines a clean continuation protocol when output nears the token limit.
- **Used for / when:** Any task requiring complete, copy-pasteable code or exhaustive lists.
- **Benefit / effect on Claude:** Fewer "lazy" partial diffs; full files. Behavior/prompting skill — does not impose any visual style.
- **Productivity:** Saves the "please paste the full file" round-trips.
- **Best situations:** Large refactors, full-file rewrites, big QA enumerations.
- **Overuse risk:** Low. On *huge* outputs it can increase token usage (by design).
- **Keep?** **Keep** (most broadly useful here).
- **Example:** `Apply full-output-enforcement: output the complete updated KpiDetail.tsx with no elisions or placeholders.`

### gpt-taste
- **What / files:** `SKILL.md` (~8K, 74 lines). An "elite UX + advanced GSAP motion" preset: AIDA page structure, wide editorial typography, gapless bento grids, scroll-pinning/scrubbing, big section spacing.
- **Used for / when:** Expressive **marketing** pages with heavy scroll animation.
- **Benefit / risk:** Striking motion-rich pages; **high over-design risk** for a data dashboard (animation + huge spacing fights Pocket VSK's density and mobile-first goals).
- **Keep?** Optional-keep.
- **Example:** `Use gpt-taste only for a standalone Pocket VSK marketing/launch page — not for in-app screens.`

### high-end-visual-design
- **What / files:** `SKILL.md` (~12K, 98 lines). "Design like an award-winning agency": exact font/spacing/shadow/card recipes, a creative-variance engine, motion choreography, and an **"Absolute Zero" anti-pattern** list.
- **Used for / when:** Making a surface feel premium/expensive; blocking generic defaults.
- **Benefit / effect on Claude:** Elevates polish and motion; bans cheap defaults.
- **Best situations:** Hero/landing surfaces, a "wow" demo screen.
- **Overuse risk:** Pushes shadows/motion/variance that can clash with a clean government dashboard; can over-animate.
- **Keep?** Optional-keep.
- **Example:** `Use high-end-visual-design's anti-pattern checklist to critique our login screen's polish. Suggestions only; keep the current layout and tokens.`

### huashu-design
- **What / files:** A full multi-file toolkit (Chinese "花叔Design"; bilingual `README.md`/`README.en.md`). Contains `SKILL.md`; **`references/`** (25 guides: animation, slide-decks, voiceover pipeline, critique guide, design-styles library, brand-asset protocol…); **`scripts/`** (Node/Python/Bash: video export, PPTX/PDF export, TTS, image fetch); **`assets/`** (BGM `.mp3`s, `.jsx` device frames, showcases); **`demos/`** (HTML prototypes); plus `package.json`, `.env.example`, `.gitignore`.
- **Used for / when:** Producing **HTML hi-fi prototypes, clickable app demos, editable slide decks, 60fps animations exported to MP4/GIF, narrated explainer videos**, and acting as a design-direction advisor / 5-axis design reviewer. It triggers on prototype/animation/deck/video intents.
- **Benefit / effect on Claude:** Turns a one-line prompt into agency-grade *prototype/marketing artifacts*. It generates **HTML/media**, not your production React/Vite app.
- **Productivity:** Huge for pitches, launch films, onboarding explainers, stakeholder demos.
- **Best situations:** A Pocket VSK investor/stakeholder pitch, a "what is GSQAC" explainer video, an animated feature teaser.
- **Overuse risk:** **Heaviest skill (~32 MB)**; its scripts expect Node/Python/ffmpeg and an optional TTS API key; wrong tool for editing the live app.
- **Keep?** Optional-keep (keep if you'll make demos/videos; otherwise the only real candidate for size-based trimming — see repo-safety section).
- **Example:** `Use huashu-design to build a 30s HTML→MP4 explainer of the Pocket VSK scorecard drilldown. Output a standalone HTML artifact; do not modify the app.`

### image-to-code
- **What / files:** `SKILL.md` (~40K, 1228 lines). An **image-first** website workflow for Codex: generate large, section-specific design images, deeply analyze them, then implement web UI that matches — with strict rules (no cropping old images, no nested-box clutter, clean hero, responsive first view).
- **Used for / when:** Building a **new** page/site where you want the visual designed first, then coded to match.
- **Benefit / effect on Claude:** Higher visual fidelity than coding blind; forces analysis before implementation.
- **Best situations:** A brand-new Pocket VSK page where you have/generate a target mockup.
- **Overuse risk:** For an existing component-driven app it can fight the established design system; image-gen cost.
- **Keep?** Optional-keep.
- **Example:** `Use image-to-code to build a NEW standalone "District summary" page from this mockup, but reuse Pocket VSK's existing components/tokens instead of inventing new ones.`

### imagegen-frontend-mobile
- **What / files:** `SKILL.md` (~44K, 1465 lines). Generates **premium mobile app screen images** inside phone mockups (multi-screen flows, consistent palette, custom iconography). **Images only — does not write code.**
- **Used for / when:** Concepting mobile screens/flows before building.
- **Benefit / risk:** Fast visual exploration; but it's concept art, not implementation — don't expect runnable UI.
- **Best situations:** Exploring a redesigned Pocket VSK mobile flow before committing to code.
- **Keep?** Optional-keep.
- **Example:** `Use imagegen-frontend-mobile to mock 3 concepts of the Pocket VSK home scorecard on iPhone. Images only.`

### imagegen-frontend-web
- **What / files:** `SKILL.md` (~40K, 987 lines). Generates **web design reference images**, with a hard rule: **one image per section** (an 8-section page → 8 images), varied hero scales, consistent palette. **Images only.**
- **Used for / when:** Producing reference comps a developer/coding model can later recreate.
- **Benefit / risk:** Great art-direction references; not code, and many images = token cost.
- **Keep?** Optional-keep.
- **Example:** `Use imagegen-frontend-web to art-direct a reference comp for a Pocket VSK landing page. Reference images only.`

### industrial-brutalist-ui
- **What / files:** `SKILL.md` (~12K, 92 lines). A specific aesthetic: Swiss type + military-terminal, rigid grids, extreme type contrast, "declassified blueprint" vibe.
- **Used for / when:** Data-heavy dashboards/editorial that *want* a raw, technical look.
- **Benefit / risk:** Distinctive; **off-brand** for Pocket VSK's friendly government style — use only for an intentional experiment.
- **Keep?** Optional-keep.
- **Example:** `(Experiment only) Use industrial-brutalist-ui to mock an alternate "ops console" theme for an internal admin view.`

### minimalist-ui
- **What / files:** `SKILL.md` (~8K, 85 lines). Clean editorial style: warm monochrome, typographic contrast, flat bento grids, muted pastels, **no gradients/heavy shadows**.
- **Used for / when:** Keeping UI calm, readable, and uncluttered — **closely aligned with Pocket VSK's existing look**.
- **Benefit / effect on Claude:** Nudges restraint (whitespace, hierarchy, flat surfaces) — exactly what a government KPI dashboard needs.
- **Best situations:** Any Pocket VSK card/screen polish where you want to *reduce* visual noise.
- **Overuse risk:** Low; could feel too plain if applied to a marketing page.
- **Keep?** **Keep.**
- **Example:** `Use minimalist-ui as the review lens to simplify the Administration card: improve hierarchy/spacing, keep all data and the existing tokens.`

### redesign-existing-projects
- **What / files:** `SKILL.md` (~16K, 178 lines). Sections: **How This Works → Design Audit → Upgrade Techniques → Fix Priority → Rules**. Explicitly: audit current design, spot generic AI patterns, and **upgrade without breaking functionality**, framework-agnostic.
- **Used for / when:** Improving an **already-built** app — the exact situation of Pocket VSK.
- **Benefit / effect on Claude:** Makes Claude *audit first* and apply targeted upgrades while preserving behavior — lowest risk for production work.
- **Productivity:** Turns vague "make it look better" into a prioritized, safe punch-list.
- **Best situations:** Iterative Pocket VSK polish passes.
- **Overuse risk:** Low, *if* you keep its "don't break functionality" rule front-and-center.
- **Keep?** **Keep (best fit).**
- **Example:** `Use redesign-existing-projects to audit the Pocket VSK KPI detail page. Produce a prioritized fix list (spacing, hierarchy, mobile). Apply only low-risk visual fixes; do not change routing, data, or compare logic.`

### stitch-design-taste
- **What / files:** `SKILL.md` (~24K) **plus a `DESIGN.md`**. It generates an agent-friendly **`DESIGN.md` design-system spec** driven by tunable "dials" (Creativity / Density / Variance / Motion) with palette, typography, spacing and motion rules.
- **Used for / when:** Producing or refreshing a written **design-system contract** other agents/sessions can follow.
- **Benefit / effect on Claude:** A reusable, explicit standard → more consistent output across sessions without re-explaining.
- **Best situations:** If you want a single Pocket VSK `DESIGN.md` source-of-truth (note: the app already encodes tokens in `tailwind.config.ts` + `index.css`).
- **Overuse risk:** Could drift from the real tokens if the generated doc isn't reconciled with the codebase.
- **Keep?** Optional-keep.
- **Example:** `Use stitch-design-taste to draft a DESIGN.md that documents Pocket VSK's EXISTING palette/spacing (from tailwind.config.ts), Density low, Motion low. Document only — don't invent new styles.`

## How These Skills Affect Responses

- **Design quality** — design skills (`design-taste-frontend`, `high-end-visual-design`, `minimalist-ui`, `redesign-existing-projects`) raise polish and reduce "generic AI" output.
- **Visual consistency** — `stitch-design-taste` / `design-taste-frontend` give a repeatable standard so different sessions converge.
- **Prompt strictness** — `full-output-enforcement` makes Claude produce complete, placeholder-free output.
- **QA quality** — *No dedicated QA skill here.* `full-output-enforcement` helps QA *thoroughness* (full lists). Real testing comes from Claude's general review skills + the Playwright MCP flow already used in this repo.
- **Code-generation behavior** — only when you point a skill at an implementation task; otherwise they're advisory. Image/`huashu` skills generate images/HTML/video, **not** production React.
- **Risk of over-designing** — high-intensity skills (`gpt-taste`, `high-end-visual-design`, `industrial-brutalist-ui`, `huashu-design`) can push bold layouts/motion that clash with a restrained, dense, mobile-first government dashboard.
- **Risk of token usage** — large skills load lots of context (`design-taste-frontend` ~88K; the image-gen and `huashu` skills also generate many images/media). Invoke only the one(s) you need.

## How They Improve Productivity

- **Faster design reviews** — a ready audit checklist (`redesign-existing-projects`, `design-taste-frontend` AI-tells).
- **Better UI polish** — agency-grade spacing/type/shadow recipes on demand.
- **Stronger frontend prompts** — encoded standards mean shorter prompts and fewer corrections.
- **Reusable standards** — `stitch-design-taste`/`DESIGN.md` as a shared contract.
- **Less repeated explanation** — you stop re-typing "make it not look templated, keep it minimal."
- **Better consistency across sessions** — every session can be told to use the same lens.

## When To Use Which Skill

### For new UI design
- `design-taste-frontend`, `minimalist-ui` (to stay on-brand), optionally `high-end-visual-design` for a hero/marketing surface.

### For redesigning existing pages
- `redesign-existing-projects` (primary), `design-taste-frontend` (AI-tells + redesign protocol), `minimalist-ui` (restraint).

### For converting screenshots/images to UI
- `image-to-code` (image → matching web UI). Pair with "reuse existing Pocket VSK components/tokens."

### For mobile-first UI
- `minimalist-ui` + `redesign-existing-projects` for in-app screens; `imagegen-frontend-mobile` for *concept images* (not code).

### For strict implementation/QC
- `full-output-enforcement` (complete, placeholder-free output) + a design skill used *only* as a review lens.

## Suggested Prompt Patterns

### Design prompt pattern
```text
Use the installed design skills, especially redesign-existing-projects and minimalist-ui,
to review the Pocket VSK UI for spacing, hierarchy, mobile usability, and visual
consistency. Keep the existing tokens (tailwind.config.ts) and the current layout.
Output a prioritized findings list. Do not change data or product logic.
```

### Claude Code implementation prompt pattern
```text
Use the installed skills ONLY as review lenses. Do NOT redesign from scratch.
Implement only the specific change requested, preserve routing/providers/compare logic,
and apply full-output-enforcement so the edited files are complete with no placeholders.
```

### QA prompt pattern
```text
Use the installed design skills as audit lenses and full-output-enforcement for completeness.
Find bugs and design/spacing/hierarchy issues only. Do NOT fix or refactor.
Return a complete, prioritized issue list with file:line references.
```

## Practical Examples for Pocket VSK

### Good use
```text
Use redesign-existing-projects and minimalist-ui to review Pocket VSK KPI cards for
mobile spacing, hierarchy, and government-user readability. Apply only low-risk visual
fixes. Do not change data, routing, or product logic.
```
Why it's good: scoped, on-brand, preserves behavior, uses the skills as *lenses*.

### Bad use
```text
Use all design skills and redesign the whole app freely.
```
Why it's risky:
- Conflicting aesthetics (brutalist vs minimalist vs high-end-agency) produce incoherent UI.
- "Freely" invites breaking routing, compare logic, providers, and the established token system.
- Loading every skill wastes large amounts of context/tokens.
- High over-design risk for a dense, mobile-first, government dashboard whose priority is clarity, not flair.

## Suggested Future Usage Table

| Situation | Best skill(s) | How to instruct Claude |
|---|---|---|
| Create a new mobile dashboard design | `design-taste-frontend`, `high-end-visual-design`, `minimalist-ui` | Use as design lenses; keep Pocket VSK tokens/style; mobile-first |
| Convert screenshot to React UI | `image-to-code` | Match the screenshot but **reuse existing components/tokens** |
| Improve card spacing/hierarchy | `redesign-existing-projects`, `minimalist-ui` | Review spacing/hierarchy only; do not change data or logic |
| Polish an existing screen safely | `redesign-existing-projects` | Audit → prioritized fix list → low-risk fixes only |
| Keep output complete on big edits | `full-output-enforcement` | Output full files, no placeholders/elisions |
| QA audit | `full-output-enforcement` + general review/testing skills + Playwright MCP | Find bugs/issues only; do not fix |
| Keep brand consistent / make brand visuals | `brandkit` | Follow logo/color/brand rules; images only |
| Build a pitch/explainer prototype or video | `huashu-design` | Output a standalone HTML/MP4 artifact; don't touch the app |
| Document the design system | `stitch-design-taste` | Document the EXISTING tokens; don't invent new styles |

## Key Concepts (plain-language)

- **The `.agents` folder** — a home for agent skills/config. Reference material for AI tools; not shipped, not imported by the build.
- **Skills** — Markdown playbooks (a `SKILL.md` with `name` + `description` header) that teach an agent how to behave for a task. Loaded on demand.
- **Design skills** — encode visual taste/rules (spacing, type, color, motion, anti-patterns). Here: `design-taste-frontend(-v1)`, `high-end-visual-design`, `minimalist-ui`, `industrial-brutalist-ui`, `gpt-taste`, `redesign-existing-projects`, `stitch-design-taste`.
- **Testing skills** — encode QA/test strategy. **None are present in this folder** (use Claude's global review/testing skills + Playwright MCP).
- **Prompting/behavior skills** — change *how the model responds* regardless of style. Here: `full-output-enforcement`.
- **Image-to-code skills** — design a visual first (as images), then build code to match. Here: `image-to-code`.
- **Brand / design-system skills** — produce brand visuals or a design-system spec. Here: `brandkit` (images), `stitch-design-taste` (a `DESIGN.md`).

**Important truths to remember:**
- Skills **do not magically run** unless Claude Code is instructed or configured to use them.
- Skills are best used as **review lenses and behavior guidance**, not autopilot.
- Some design skills make output more polished but can cause **over-design** if not constrained.
- For production implementation, always say **"do not redesign from scratch"** when using design skills, and name the *specific* skill(s) rather than "all of them."

## Repo Safety Note

### Security / secrets scan
A scan of `.agents` for `api_key|secret|password|token` found **no real secrets** — only:
- `app/.agents/skills/huashu-design/.env.example` → key name **`DOUBAO_TTS_API_KEY=your_api_key_here`** (a placeholder template; the real `.env` is gitignored by that skill).
- Demo/showcase HTML containing `api_key="your-key"` placeholders, and a `%SHOPIFY_API_KEY%` template comment in `design-taste-frontend`.
- Other "token" matches are about **LLM tokens / design tokens**, not credentials.

No credential values are present. (If a real `.env` is ever added under `huashu-design`, its `.gitignore` already excludes it — verify before committing.)

### Disk size
- `du -sh .agents` → **33M**
- Largest by far: `huashu-design` → **32M** (BGM `.mp3`s, device-frame `.jsx`, showcase/demo HTML/media).
- Every other skill is small (4K–88K). Full per-skill breakdown is in the Folder Inventory above.

### Should these folders be committed?
- **If `.agents/skills` is part of the team's Claude Code workflow → keep it committed.** It makes AI-assisted design/redesign work repeatable for everyone.
- **If it's personal/local-only → consider adding `app/.agents/` (or just `app/.agents/skills/huashu-design/`) to `.gitignore`** to avoid bloating the repo.
- **Do not delete without confirming the team workflow.**
- **If repo size is the concern,** the only meaningful target is `huashu-design` (~32 MB of media); the other 13 skills together are well under 1 MB.
- **Decision summary:**
  - **Keep:** `redesign-existing-projects`, `minimalist-ui`, `design-taste-frontend`, `full-output-enforcement` (highest value for Pocket VSK).
  - **Optional / keep-if-used:** `brandkit`, `high-end-visual-design`, `gpt-taste`, `industrial-brutalist-ui`, `image-to-code`, `imagegen-frontend-web`, `imagegen-frontend-mobile`, `stitch-design-taste`, `design-taste-frontend-v1`.
  - **Do not remove without team sign-off:** the whole `.agents/skills` set (it's shared workflow tooling).
  - **Unsure / size watch:** `huashu-design` (keep if you produce demos/videos; otherwise the one candidate for `.gitignore` on size grounds).

## Final Notes

- This folder is **tooling/guidance**, not Pocket VSK source code — nothing here ships to users.
- For this product, **lead with `redesign-existing-projects` + `minimalist-ui`** and always constrain design skills with "review only / do not change data or logic / keep existing tokens."
- There are **no testing skills here** — pair Claude's general review skills with the repo's existing **Playwright MCP** verification for QA.
- The skill names overlap with Claude Code's globally-available skills list; this `.agents/skills` folder is the **project-local copy** Claude can read for Pocket VSK work.
