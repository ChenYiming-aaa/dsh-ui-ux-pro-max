# dsh-ui-ux-pro-max

> UI/UX design intelligence plugin for **DeepSeek Harness (DSH)**:
> **88 design styles**, **192 color palettes**, **74 font pairings**,
> **119 UX guidelines**, **25 chart types** and **22 technology stacks** —
> fully offline, Chinese-first.

[![License](https://img.shields.io/github/license/ChenYiming-aaa/dsh-ui-ux-pro-max)](LICENSE)
[![npm](https://img.shields.io/npm/v/dsh-ui-ux-pro-max)](https://www.npmjs.com/package/dsh-ui-ux-pro-max)
[![CI](https://img.shields.io/github/actions/workflow/status/ChenYiming-aaa/dsh-ui-ux-pro-max/ci.yml?label=CI)](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max/actions)

Once installed, the `design_recommend` / `design_review` / `design_search` tools and the
bundled `ui-ux-pro-max` skill are available in the chat. The plugin runs host-side only:
no client UI, no network requests, no third-party runtime dependencies.

## Features

- **Three tools**: generate a design system, review UX, search by domain or stack.
- **Fully bundled data**: 4,319 rows shipped with the package; zero network, zero Python,
  zero third-party runtime dependencies.
- **Chinese-first**: Chinese output, 400+ term dictionary and CJK bigram tokenization;
  single-character queries (`图` / `色` / `字` / `动`) fall back to the detected domain.
- **Design dials**: `variance` / `motion` (with GSAP snippet) / `density`, each 1-10.
- **Pure JavaScript**: BM25 search + design-system generator; Node `^22.19 || >=24`.

## Install

Pick one of the three options. Current version **1.4.0**; use whatever is actually published
on [npm](https://www.npmjs.com/package/dsh-ui-ux-pro-max).

### Plugin market / npm

```powershell
dsh plugin --profile desktop add --save-exact dsh-ui-ux-pro-max@1.4.0
dsh plugin --profile web     add --save-exact dsh-ui-ux-pro-max@1.4.0
```

> DSH Desktop does not put `dsh` on PATH — open a new terminal afterwards. If the command is
> still missing, run `npm install -g @deepseek-ai/dsh`.

### From source (Windows)

```powershell
git clone https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max.git
cd dsh-ui-ux-pro-max
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

The installer copies only the `files[]` whitelist into the profile's shared `node_modules`
and idempotently appends the registration entry. `-ProfileDir` / `-ProfileName` are supported,
and `-WhatIf` previews the changes.

### Manual (any platform)

Copy the package into `<profile>\..\node_modules\dsh-ui-ux-pro-max\`, then append to the
profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: ui-ux-pro-max
      name: dsh-ui-ux-pro-max
      config: {}
```

Restart DSH Desktop, or run `npx @deepseek-ai/dsh web`.

To verify, ask "recommend a design system for a fintech dashboard".

## Usage

### The three tools

| Tool | Purpose | Main parameters |
|---|---|---|
| `design_recommend` | Product type + keywords → complete design system: ranked styles, HEX palette and CSS variables, font pairing, landing pattern, UX guidelines, anti-patterns, dials | `query` (required), `projectName`, `stack`, `variance`, `motion`, `density` |
| `design_review` | Review UI against UX + mobile + React performance guidelines, severity-ranked, with a pre-delivery checklist | `target` (required), `platform`, `maxRules` |
| `design_search` | Search design knowledge by domain or stack; optional `includeDeprecated` includes deprecated rows | `query` (required), `domain`, `stack`, `maxResults`, `includeDeprecated` |

`domain` values for `design_search`: `style` / `color` / `chart` / `landing` / `product` /
`ux` / `typography` / `icons` / `gsap` / `react` / `web` / `google-fonts`. `stack` accepts one
of the 22 stacks (`react`, `nextjs`, `vue`, `flutter`, `swiftui`, `javafx`, …) and is mutually
exclusive with `domain`.

`platform` for `design_review`: `web` (default) / `mobile` / `desktop` / `react-native` /
`flutter`. It only orders rules within the same severity: matching rules first, mismatches
down-weighted but kept. `react-native` and `flutter` also add that stack's guidelines.

### Examples

```text
design_recommend("金融 SaaS 数据看板", projectName: "金融智控台", stack: "react", variance: 8)
design_review("移动端登录表单", platform: "mobile")
design_search("毛玻璃 深色", domain: "style")
design_search("表单 无障碍", domain: "ux", maxResults: 5)
```

### Design dials

All dials are integers from 1 to 10 and default to the value implied by the chosen style:

| Dial | 1 | 10 | Side effect |
|---|---|---|---|
| `variance` | centered, minimal, symmetric | bold, asymmetric, high contrast | shifts style and layout advice |
| `motion` | restrained | complex choreography | high values add a GSAP snippet |
| `density` | airy | compact, dashboard-like | overrides the spacing scale |

### Bundled data

| Category | Content |
|---|---|
| Design assets | Styles **88** · Palettes **192** · Font pairings **74** · Charts **25** · Landing patterns **34** |
| Components / motion | Icons **105** · GSAP presets **17** |
| Review rules | UX guidelines **119** · React performance **44** · Mobile interface **32** · Reasoning profiles **192** |
| Retrieval support | Product types **192** · Stacks **22** · Google Fonts **1934** (lazy-loaded) |

9 of the 88 styles are `deprecated` and excluded from search by default (79 searchable).
Deprecated rows (styles and stack guidelines) follow one rule: excluded by default, kept when
the query explicitly mentions `legacy` / `deprecated`.

Data is ported from `nextlevelbuilder/ui-ux-pro-max-skill@56ea9cf` (2026-10-15).

### Example pages

Two offline single-file HTML examples showing the generated design system applied:

- [examples/fintech-dashboard.html](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max/blob/main/examples/fintech-dashboard.html) — fintech dashboard: KPI
  cards, trend chart, donut, heat map, sortable table.
- [examples/trip-planner-workbench.html](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max/blob/main/examples/trip-planner-workbench.html) — trip-planning
  workbench: timeline, map, budget, booking countdowns, four modes, re-plan diff.

## Style atlas (hosted)

[**chenyiming-aaa.github.io/dsh-ui-ux-pro-max/gallery/**](https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/gallery/) turns all 88 styles into a browsable static site. Every style has its own page with a Chinese editorial intro, a live rendered sample (light/dark switch), palette, capability matrix, best-for / avoid lists, implementation checklist and a copyable prompt.

- All previews share one component skeleton; only design tokens and material effect classes change, so styles can be compared side by side.
- Filter by category, search by keyword, sort by index / name / complexity; responsive on desktop and mobile.
- Fully static with zero external requests, generated from `data/index.json`.

```bash
npm run build:gallery   # regenerate gallery/ from data/
npm run serve:gallery   # gallery only, mounted at the root
npm run serve           # both: /gallery/ and /handbook/
```

Pushes to `main` rebuild and publish `gallery/` through `.github/workflows/pages.yml` (set Pages source to “GitHub Actions”). Chinese copy and preview themes live in `tools/showcase/theme-data.mjs`.

**Layout**: `gallery/` and `handbook/` sit side by side; the site root `index.html` redirects to `/gallery/`. The sibling layout makes relative links such as `../handbook/` resolve identically when opening files directly and when deployed.

## Design handbook (sister site)

The gallery shows *what it looks like*; [**/handbook/**](https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/handbook/) covers *how to decide*. It builds and ships **on its own** — output goes to `handbook/` at the repo root, with no build-order dependency on `gallery/`. The two sites link to each other from every page.

| Domain | Content |
| --- | --- |
| Palettes | 192 sets × 16 semantic tokens, rendered as real buttons / inputs / cards / focus rings, with 7 WCAG contrast checks and CSS / Tailwind / JSON export |
| Type | 74 heading + body pairings with **91 latin subsets self-hosted (~2.9 MB)** — real rendering, adjustable size and leading |
| Charts | 25 data types: best chart, alternatives, when to use / avoid, SVG vs Canvas thresholds, a11y risk and fallback |
| Landing | 34 page skeletons with section order drawn as wireframes, CTA placement and color strategy |
| Practices | 195 UX / React / Web rules with good/bad code side by side, filterable by severity |
| Recipes | 192 product types: primary and secondary styles, palette, type, landing pattern, decision rules and anti-patterns |

- **Recipe composer** (`/handbook/compose.html`): pick a product type, get the whole recipe, export as CSS variables / Tailwind config / JSON.
- **Chinese-native UI**: all 192 product types, 88 recommended patterns, 34 landing patterns, 36 decision-rule keys and every style name have Chinese labels. Lists lead with the Chinese name and keep the English original as a subtitle; search matches both (type 「仪表盘」 or `dashboard`). Free-form prose (color direction, anti-patterns, key considerations) stays in the upstream English and is marked with a small “原文” badge instead of being machine-translated.
- The product / color / reasoning tables share the same 192 keys, and all 764 style references resolve to the 88 gallery pages.
- **Findable**: the gallery keeps a persistent “设计手册 →” item in its nav plus a banner on the home page; the handbook has a “风格图鉴 ↗” button on every page and a matching banner. Both remain visible on mobile.
- **Self-contained**: handbook pages link to each other with `./` only. The single outbound direction is the gallery (`../index.html`, `../style/<id>.html`), resolved relative to the same origin by default; set `SHOWCASE_BASE=https://example.com/` at build time to point at another host.
- Fully static, zero external requests — fonts ship in the repo.

```bash
npm run fonts             # one-off: fetch the latin subsets for 91 families
npm run build             # build both sites (= build:gallery + build:handbook)
npm run build:handbook    # handbook only → handbook/
npm run serve             # preview both: / and /handbook/
npm run serve:handbook    # handbook only, mounted at the root path
```

The handbook needs only `tools/atlas/`, `data/` and `assets/atlas-fonts/` — it builds without `gallery/` present (`tests/check-atlas.mjs` skips the outbound-link check when the gallery output is missing).

## Configuration

The plugin exposes three optional settings under the registration entry's `config`:

```yaml
- insert:
    - id: ui-ux-pro-max
      name: dsh-ui-ux-pro-max
      config:
        maxResults: 3      # default result count for design_search, 1-8
        reviewRules: 8     # default rule count for design_review, 1-20
        skill: true        # register the bundled ui-ux-pro-max skill
```

| Key | Type | Default | Range | Meaning |
|---|---|---|---|---|
| `maxResults` | integer | `3` | 1-8 | Default `design_search` result count; a per-call value overrides it |
| `reviewRules` | integer | `8` | 1-20 | Default `design_review` rule count; a per-call value overrides it |
| `skill` | boolean | `true` | `true` / `false` | `false` registers the three tools without the skill |

Unknown keys are ignored; invalid types or ranges raise at load time instead of starting in a
broken state.

## FAQ

**The tools or skill don't show up after installing.**
Check, in order: `dsh` points at the right profile; the profile's `cordis.patch.yml` has an
`insert` entry with `id: ui-ux-pro-max`; Node satisfies `^22.19 || >=24`; DSH was restarted.

**npm has an older version than the repository.**
Install a published version explicitly, or use the source install:

```powershell
dsh plugin --profile desktop add dsh-ui-ux-pro-max@1.4.0
```

**Does it need network access?**
No. All data ships with the package, the Google Fonts list is a local file, and the plugin
makes no requests at runtime.

**Why are some styles missing from search results?**
They may be marked `deprecated` and excluded by default. Mention `legacy` or `deprecated` in
the query to include them.

**Single-character queries (`图` / `色` / `字` / `动`) give weak results.**
One character carries little signal. Registered characters are first mapped to their domain;
if the expansion still matches nothing, the plugin returns that domain's default rows and marks
them with `fallback`. A concrete phrase works better, e.g. "金融 配色" or "图表 对比".

**Which DSH versions are supported?**
The 0.1.0 / 0.1.1 / 0.2.0 / 0.2.1 pre-release lines and their stable releases (upper bound
`<0.3.0-0`). Verified on 0.1.1-rc.1, 0.2.0-rc.2 and 0.2.1-rc.2 for tool definitions,
execution, output schema, rendering and skill registration. See
[DSH-COMPAT.md](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max/blob/main/docs/DSH-COMPAT.md).

**Can I replace or extend the data?**
The data lives in `data/index.json` and `data/fonts.json` and is shipped with the package.
Loading external data files at runtime is not supported — edit and repackage instead.

**Can I use the tools without the skill?**
Yes — set `skill` to `false`; all three model tools remain available.

## Credits & license

Data and algorithms are ported from
[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
(MIT), rewritten for the DSH plugin form in pure JS, offline and Chinese-first.
Third-party sources: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

[MIT](LICENSE) © ChenYiming-aaa.
