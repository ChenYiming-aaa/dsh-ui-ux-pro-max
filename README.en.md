# dsh-ui-ux-pro-max

> UI/UX design intelligence plugin for **DeepSeek Harness (DSH)**:
> **88 design styles**, **192 color palettes**, **74 font pairings**, **119 UX guidelines**,
> **25 chart types** and **192 product recipes** — 195 interface rules in total, fully offline,
> Chinese-first.
>
> The most direct way in is not this document: it is the two hosted sites —
> **[Style Atlas](https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/gallery/)** and
> **[Design Handbook](https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/handbook/)**.

[![License](https://img.shields.io/github/license/ChenYiming-aaa/dsh-ui-ux-pro-max)](LICENSE)
[![npm](https://img.shields.io/npm/v/dsh-ui-ux-pro-max)](https://www.npmjs.com/package/dsh-ui-ux-pro-max)
[![CI](https://img.shields.io/github/actions/workflow/status/ChenYiming-aaa/dsh-ui-ux-pro-max/ci.yml?label=CI)](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max/actions)

| Site | In one line | Open |
| --- | --- | --- |
| **Style Atlas** ★ | 88 design styles, each rendered for real and comparable side by side | [chenyiming-aaa.github.io/…/gallery/](https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/gallery/) |
| **Design Handbook** (the other view of the same corpus) | Six domains: palettes, type, charts, landing pages, practices, recipes | [chenyiming-aaa.github.io/…/handbook/](https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/handbook/) |
| Recipe composer | Pick a product type, get the whole recipe | [handbook/compose.html](https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/handbook/compose.html) |

## ★ Style Atlas: see 88 styles before you pick one

<p align="center">
  <a href="https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/gallery/">
    <img src="docs/images/gallery-home.png" alt="Style Atlas home: 88 design styles, browsable by category" width="900" />
  </a>
</p>

**Every card is rendered from the same component skeleton** — only design tokens and material
effect classes are swapped, so what you see is a real interface, not a paragraph of adjectives.
Filter by category, search by keyword, sort by index / name / complexity; responsive on desktop
and mobile.

Each style also gets its own page. The one below
([Liquid Glass ↗](https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/gallery/style/liquid-glass.html))
shows the rendering engine at its best: layered frost, edge highlights and refraction, all produced
by CSS tokens plus material classes.

<p align="center">
  <a href="https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/gallery/style/liquid-glass.html">
    <img src="docs/images/gallery-style.png" alt="Style detail page: Liquid Glass with editorial intro, live preview, palette and capability matrix" width="900" />
  </a>
</p>

A single page holds: editorial intro and original name, a **live preview with light/dark toggle**,
palette with HEX, capability matrix, best-for and avoid lists, implementation checklist, a copyable
AI prompt, and related styles. All 88 pages are static with zero external requests.

Entering the site plays a ~1.4s opening: the four-tile mark converges from the corners → the
wordmark rises character by character out of a mask → an orange rule sweeps out → the paper sheet
splits and the first screen settles into place. Transform / opacity / clip-path only, pure CSS
(no GSAP, no third-party script), once per session, and skipped when the OS asks for reduced motion.
See `tools/intro.mjs`.

Switching between the two sites is one wipe of the same paper sheet: the current page closes in
360ms (with the destination name printed on the sheet), then the target opens from that closed state
in 560ms. Exit is faster than entry, and the easing curve is the one the opening already uses.
See `tools/xnav.mjs`.

## Design Handbook: the other view of the same data

The atlas browses by style, the handbook browses by decision — both read the same 4,319-row
corpus, so they are two views of one thing rather than two separate sites.

<p align="center">
  <a href="https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/handbook/">
    <img src="docs/images/handbook-home.png" alt="Design Handbook home: palettes, type, charts, landing pages, practices, recipes" width="900" />
  </a>
</p>

| Domain | Content |
| --- | --- |
| Palettes | 192 sets × 16 semantic tokens, rendered as real buttons / inputs / cards / focus rings, with 7 WCAG contrast checks and CSS / Tailwind / JSON export |
| Type | 74 heading + body pairings with **91 latin subsets self-hosted (~2.9 MB)** — real rendering |
| Charts | 25 data types: best chart, alternatives, when to avoid, SVG/Canvas thresholds, a11y risk |
| Landing | 34 page skeletons with section order drawn as wireframes, CTA placement and color strategy |
| Practices | 195 UX / React / Web rules with good/bad code side by side, filterable by severity |
| Recipes | 192 product types: primary and secondary styles, 16 tokens, type, landing pattern, decision rules and anti-patterns |

The **recipe composer** aligns three tables (product / color / reasoning) by the same product keys,
so one pick yields the whole recipe. All 192 product types, 88 recommended patterns, 34 landing
patterns, 36 decision-rule keys and every style name are localized to Chinese, and search matches
both languages. All 764 style references resolve to atlas detail pages — no dangling links.

<p align="center">
  <a href="https://chenyiming-aaa.github.io/dsh-ui-ux-pro-max/handbook/compose.html">
    <img src="docs/images/handbook-compose.png" alt="Recipe composer: pick a product type, get styles, tokens, type and rules; export as CSS / Tailwind / JSON" width="900" />
  </a>
</p>

## Features

- **Three tools**: generate a design system, review UX, search by domain or stack.
- **Fully bundled data**: 4,319 rows shipped with the package; zero network, zero Python,
  zero third-party runtime dependencies.
- **Chinese-first**: Chinese output, 400+ term dictionary and CJK bigram tokenization;
  single-character queries (`图` / `色` / `字` / `动`) fall back to the detected domain.
- **Design dials**: `variance` / `motion` (with GSAP snippet) / `density`, each 1-10.
- **Pure JavaScript**: BM25 search + design-system generator; Node `^22.19 || >=24`.

## Install

Pick one of the three options. Current version **1.4.1**; use whatever is actually published
on [npm](https://www.npmjs.com/package/dsh-ui-ux-pro-max).

### Plugin market / npm

```powershell
dsh plugin --profile desktop add --save-exact dsh-ui-ux-pro-max@1.4.1
dsh plugin --profile web     add --save-exact dsh-ui-ux-pro-max@1.4.1
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

Pick the tool by what you are actually doing, and pass the details you already have:

```text
# New project: get a full design system first
design_recommend("财务 数据看板 深色 高密度", projectName: "财务中台", stack: "react")

# Revamp: describe the page together with the symptom
design_review("移动端登录页，提交后没有任何反馈", platform: "mobile")

# Only one piece missing: search that domain
design_search("毛玻璃 深色", domain: "style")
design_search("金融 信任蓝", domain: "color")
```

Queries can be Chinese or English — Chinese maps onto the English corpus (「金融」→ fintech).
For `gsap` / `react` / `web` / `google-fonts` the rows are English, so keep the terms
(`scroll reveal`, `memo`) for better hits.

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

## Building & deploying the sites

`gallery/` and `handbook/` sit side by side; the site root `index.html` redirects to `/gallery/`.
The sibling layout makes relative links such as `../handbook/` resolve identically when opening
files directly and when deployed. The handbook **builds on its own** — it needs only
`tools/atlas/`, `data/` and `assets/atlas-fonts/`, not `gallery/`.

```bash
npm run fonts             # one-off: fetch the latin subsets for 91 families
npm run build             # build both sites (= build:gallery + build:handbook)
npm run build:gallery     # gallery only → gallery/
npm run build:handbook    # handbook only → handbook/
npm run serve             # preview both: /gallery/ and /handbook/
npm run serve:gallery     # gallery only, mounted at the root path
```

Pushes to `main` rebuild both sites, run the structure checks, and publish one merged Pages
artifact through `.github/workflows/pages.yml` (Pages source is “GitHub Actions”). Chinese copy and
preview themes live in `tools/showcase/theme-data.mjs`; handbook data derivation lives in
`tools/atlas/data.mjs`.

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
dsh plugin --profile desktop add dsh-ui-ux-pro-max@1.4.1
```

**Does it need network access?**
No. All data ships with the package, the Google Fonts list is a local file, and the plugin
makes no requests at runtime; both sites are equally self-contained.

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
