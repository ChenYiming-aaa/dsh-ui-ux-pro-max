# dsh-ui-ux-pro-max

> UI/UX design intelligence plugin for **DeepSeek Harness (DSH)**:
> **88 design styles**, **192 color palettes**, **74 font pairings**,
> **119 UX guidelines**, **25 chart types** and **22 technology stacks** —
> fully offline, Chinese-first.

[![License](https://img.shields.io/github/license/ChenYiming-aaa/dsh-ui-ux-pro-max)](LICENSE)
[![npm](https://img.shields.io/npm/v/dsh-ui-ux-pro-max)](https://www.npmjs.com/package/dsh-ui-ux-pro-max)
[![CI](https://img.shields.io/github/actions/workflow/status/ChenYiming-aaa/dsh-ui-ux-pro-max/ci.yml?label=CI)](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max/actions)

Host-only DSH plugin: registers the `design_recommend` / `design_review` /
`design_search` model tools and the bundled `ui-ux-pro-max` skill. No client UI,
no network calls, no runtime dependencies.

> Repository version **1.3.0**. Use the version actually published on
> [npm](https://www.npmjs.com/package/dsh-ui-ux-pro-max), or install from source.
>
> Compatibility: declares the 0.1.0 / 0.1.1 / 0.2.0 / 0.2.1 DSH pre-release lines
> and their stable releases (`<0.3.0-0`). Verified on **0.2.0-rc.2** and
> **0.1.1-rc.2** for tool definitions, `execute`, output schema, `render`,
> `presentCall` / `presentResult` and skill registration. See
> [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md).

## Features

- **Three model tools**: generate a design system, review UX, search by domain or stack.
- **Fully bundled data**: 4,319 rows shipped with the package; zero network,
  zero Python, zero third-party runtime dependencies.
- **Chinese-first**: Chinese output, 400+ term dictionary and CJK bigram tokenization.
- **Design dials**: `variance` / `motion` (with GSAP snippet) / `density`, each 1-10.
- **Pure JavaScript**: BM25 search + design-system generator; Node `^22.19 || >=24`.

## Install

### Plugin market / npm

```powershell
dsh plugin --profile desktop add --save-exact dsh-ui-ux-pro-max@1.3.0
dsh plugin --profile web     add --save-exact dsh-ui-ux-pro-max@1.3.0
```

> DSH Desktop does not put `dsh` on PATH — open a new terminal. If the command is
> still missing, run `npm install -g @deepseek-ai/dsh`.

### From source

```powershell
git clone https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max.git
cd dsh-ui-ux-pro-max
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

The installer copies only the `files[]` whitelist into the profile's shared
`node_modules`, and appends the `cordis.patch.yml` insert entry idempotently.
`-ProfileDir` / `-ProfileName` are supported.

### Manual

Copy the package into `<profile>\..\node_modules\dsh-ui-ux-pro-max\` and append:

```yaml
- insert:
    - id: ui-ux-pro-max
      name: dsh-ui-ux-pro-max
      config: {}
```

Restart DSH Desktop, or run `npx @deepseek-ai/dsh web`.

## Tools

| Tool | Purpose |
|---|---|
| `design_recommend` | Product type + keywords → complete design system: ranked styles, HEX palette and CSS variables, font pairing, landing pattern, UX guidelines, anti-patterns, dials |
| `design_review` | Review UI against UX + mobile + React performance guidelines, severity-ranked, with a pre-delivery checklist |
| `design_search` | Search by domain (`style/color/chart/landing/product/ux/typography/icons/gsap/react/web/google-fonts`) or one of 22 stacks |

All tools return structured Chinese output; `render` produces Markdown and
`design_recommend` adds a token-summary card after execution.

## Bundled data

| Category | Content |
|---|---|
| Design assets | Styles **88** · Palettes **192** · Font pairings **74** · Charts **25** · Landing patterns **34** |
| Components / motion | Icons **105** · GSAP presets **17** |
| Review rules | UX guidelines **119** · React performance **44** · Mobile interface **32** · Reasoning profiles **192** |
| Retrieval support | Product types **192** · Stacks **22** · Google Fonts **1934** (lazy-loaded) |

- 9 of the 88 styles are `deprecated` and excluded from search by default (79 searchable).
- Deprecated stack rows are excluded unless the query explicitly mentions `legacy` / `deprecated`.
- Data source: `nextlevelbuilder/ui-ux-pro-max-skill@56ea9cf` (2026-10-15).
  Provenance fields and caveats: [docs/DATA-PROVENANCE.md](docs/DATA-PROVENANCE.md).

## Examples

```text
design_recommend("金融 SaaS 数据看板", projectName: "金融智控台", stack: "react", variance: 8)
design_review("移动端登录表单", platform: "mobile")
design_search("毛玻璃 深色", domain: "style")
```

Two offline single-file examples:

- [examples/fintech-dashboard.html](examples/fintech-dashboard.html) — fintech dashboard:
  KPI cards, trend chart, donut, heat map, sortable table.
- [examples/trip-planner-workbench.html](examples/trip-planner-workbench.html) — trip-planning
  workbench: timeline, map, budget, booking countdowns, four modes, re-plan diff.

## Layout

```
dsh-ui-ux-pro-max/
├── index.js                # thin entry: re-exports the plugin layer
├── lib/
│   ├── plugin/             # L5 host adapter (apply / skill / SchemaSpec dialect)
│   ├── tools/              # L4 one file per tool
│   ├── presentation/       # L3 Markdown rendering
│   ├── domain/             # L3 design system / review / dials / reasoning / checklist
│   ├── search/             # L2 BM25 + retriever facade
│   ├── repo/               # L2 data access + capability stats
│   ├── i18n/               # L1 Chinese labels / dictionary / query expansion
│   └── config.js           # L0 cross-cutting constants
├── data/                   # bundled database
├── skills/ui-ux-pro-max/   # SKILL.md
├── references/             # pre-delivery checklist
├── examples/               # single-file examples
├── tests/                  # tests (not published)
├── docs/                   # contributor docs (not published)
├── install.ps1
└── cordis.patch.yml
```

Dependency direction:
`plugin → tools → presentation/domain → search/repo → i18n → config`.

## Testing

No network and no DSH runtime required:

```bash
npm test
```

Covers manifest/data integrity, offline behaviour, example-page conformance and
DOM interaction, capability counts, Chinese dictionary, schema contract, layering,
and SchemaSpec dialect. `dom-smoke` auto-skips when jsdom is absent.

Real-host validation depends on a local DSH install and is not shipped; see
[docs/DSH-COMPAT.md](docs/DSH-COMPAT.md).

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, dependency rules, where to add code
- [docs/DATA-PROVENANCE.md](docs/DATA-PROVENANCE.md) — data source, counts and caveats
- [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md) — host matrix, SchemaSpec dialect, degradation contract
- [docs/refactor-plan.md](docs/refactor-plan.md) — structural refactor plan (historical)

## Credits & license

Data and algorithms are ported from
[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
(MIT), rewritten for the DSH plugin form in pure JS, offline and Chinese-first.
Third-party sources: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

[MIT](LICENSE) © ChenYiming-aaa.
