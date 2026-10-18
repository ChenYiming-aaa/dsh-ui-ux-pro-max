# dsh-ui-ux-pro-max

[![GitHub stars](https://img.shields.io/github/stars/ChenYiming-aaa/dsh-ui-ux-pro-max)](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max/stargazers)
[![License](https://img.shields.io/github/license/ChenYiming-aaa/dsh-ui-ux-pro-max)](LICENSE)
[![npm](https://img.shields.io/npm/v/dsh-ui-ux-pro-max)](https://www.npmjs.com/package/dsh-ui-ux-pro-max)
[![CI](https://img.shields.io/github/actions/workflow/status/ChenYiming-aaa/dsh-ui-ux-pro-max/ci.yml?label=CI)](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max/actions)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-DeepSeek%20Harness-blue)](https://github.com/topics/dsh-plugin)

> UI/UX design intelligence plugin for **DeepSeek Harness (DSH)**, adapted and
> optimized from the open-source project
> [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
> (MIT License). Bundles **88 design styles, 192 color palettes, 74 font pairings,
> 119 UX guidelines, 25 chart types** across **22 technology stacks** plus 1900+
> Google Fonts records — fully offline, zero network, Chinese-first structured output.
>
> 中文说明见 [README.md](README.md)。

## Tools

| Tool | Purpose |
|------|---------|
| `design_recommend` | Product type + keywords → complete design system (ranked styles with reasons, HEX palette, font pairing, landing pattern, UX guidelines, anti-patterns, decision rules; optional stack + variance/motion/density dials) |
| `design_review` | UX checklist review of an existing UI, severity-ranked (Critical/High/Medium/Low) plus a pre-delivery checklist |
| `design_search` | Search the database by domain (`style/color/chart/landing/product/ux/typography/icons/gsap/react/web/google-fonts`) or by one of 22 stacks |

Chinese queries are auto-mapped to the English corpus (400+ term dictionary +
CJK bigram tokenization). A bundled `ui-ux-pro-max` skill teaches the model
when and how to use each tool. The plugin is **host-only** (no client UI).

## Install

### Plugin market / npm (recommended)

npm package: [dsh-ui-ux-pro-max](https://www.npmjs.com/package/dsh-ui-ux-pro-max).
Repository version **1.3.0**; use the version actually published on npm, or
install from source below if it is not published yet.

```powershell
dsh plugin --profile desktop add --save-exact dsh-ui-ux-pro-max@1.3.0   # DSH Desktop
dsh plugin --profile web     add --save-exact dsh-ui-ux-pro-max@1.3.0   # dsh web
```

> 💡 Note: DSH Desktop does not put the `dsh` command on PATH — open a **new
> terminal** (the desktop app ships its own host-commands); if the command is
> still missing, run `npm install -g @deepseek-ai/dsh` first.

> Verified against **DSH 0.2.0-rc.2** and **0.1.1-rc.2** (`@deepseek-ai/dsh`,
> `dsh-tools`, `dsh-skill`): tool-definition compilation, `execute`, output schema,
> `render`, `presentCall` / `presentResult` and bundled-skill registration.
> A local **0.0.1-rc.1** test runtime is used for schema/execute/apply unit checks,
> but it is outside the peer support range and is not a supported host line.
> The peer range declares the 0.1.0 / 0.1.1 / 0.2.0 / 0.2.1 pre-release lines and their
> stable releases (`<0.3.0-0`). See [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md) for the matrix.

### DSH Desktop (from source)

1. Copy this package into the profile's shared `node_modules`:
   `<profile>\node_modules\dsh-ui-ux-pro-max\`
   (example: `C:\Users\cwqjk\.dsh\profiles\desktop`; packages live in the sibling
   `...\profiles\node_modules\`)
2. Append to `<profile>\cordis.patch.yml`:

   ```yaml
   - insert:
       - id: ui-ux-pro-max
         name: dsh-ui-ux-pro-max
         config: {}
   ```

3. Restart DSH Desktop.

Or run the idempotent installer (backs up the patch automatically):

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

### Web / CLI

Add the package to the profile's `node_modules` and either append the insert
entry above, or launch with `pnpm dsh web --patch ./cordis.patch.yml`.

Peer dependencies (`@deepseek-ai/cordis`, `dsh-tools`, `dsh-skill`) are
resolved from the host runtime — no extra npm installs.

## Examples

Both are single-file, dependency-free and open offline — they show the generated
design system actually being honoured rather than only described:

- **`examples/fintech-dashboard.html`** — from `design_recommend("金融 SaaS 数据看板", stack: react)`:
  Data-Dense Dashboard + Heat Map (KPI cards, trend chart, donut, heat map, sortable table).
- **`examples/trip-planner-workbench.html`** — from
  `design_recommend("旅游行程规划工作台…", stack: react, variance 2 / motion 2 / density 8)`:
  Minimalism & Swiss + Financial Dashboard as a three-pane travel-planning workbench
  (day list · hour-by-hour timeline with drag/keyboard reorder · map, budget, bookings
  with live countdowns, pre-trip briefing, 7-theme render preview), four modes
  (full trip / single day / gap filling / live re-plan with diff), and the product's
  trust rules: `verified / estimated / needs official check` badges, a global
  degradation banner when `AMAP_KEY` is missing, and no booking or payment actions.
  Built for [better-trip-planner](https://github.com/ChenYiming-aaa/better-trip-planner).

## Testing

No network and no DSH runtime required (CI runs these on Node 22 and 24):

```bash
npm test
# = check-package → smoke → check-example → check-counts → check-i18n → contract
#   → check-imports → check-schema → check-sync-parser → dom-smoke
#   (dom-smoke auto-skips when jsdom is absent; CI installs jsdom in a separate dir)
```

`check-package.mjs` guards the failure modes actually hit in this project: a
UTF-8 BOM in `package.json` (breaks the DSH CLI's `JSON.parse`), a missing
`dsh.bundle.patch`, `files[]` entries that do not exist, lifecycle scripts
(rejected by the market), the `cordis.patch.yml` insert shape, the
parseability/consistency of `data/*.json`, and upstream provenance fields.

`smoke.mjs` covers plugin behaviour: bundled database, `design_recommend`
(Chinese query → full design system), `design_review` (severity ordering),
`design_search` (domain/stack/Chinese mapping), and Chinese structured output.

`check-counts.mjs` keeps README / SKILL.md / package.json capability numbers in
sync with `data/meta.json`; `check-i18n.mjs` guards the Chinese dictionary
(no duplicate keys, deduplicated expansion); `contract.mjs` enforces schema ↔
`execute` consistency; `check-imports.mjs` turns the layering rules, acyclicity
and `data/` path uniqueness into CI assertions; `check-schema.mjs` catches
SchemaSpec dialect mistakes that would otherwise only fail inside the host
runtime; `check-sync-parser.mjs` locks the CSV parser used by the upstream sync tool.

> Runtime compatibility is verified separately against a real DSH install
> (tool schema compilation, output schema, `render` / `presentCall` /
> `presentResult`, and the `apply()` registration path); that harness depends on
> local host paths and is therefore not shipped in this repository. See
> [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md).

## Contributor docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, dependency rules, where to add code
- [docs/DSH-COMPAT.md](docs/DSH-COMPAT.md) — verified hosts, SchemaSpec dialect, degradation contract
- [docs/UPSTREAM-SYNC.md](docs/UPSTREAM-SYNC.md) — upstream sync SOP (`npm run check:upstream` / `sync:upstream`) and diff board

## Credits

- **Upstream**: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
  (MIT) — data, search, and design-system logic ported and optimized for the DSH
  plugin form (pure JS, offline, Chinese-first, structured tool output).
- **Data snapshot**: upstream commit `56ea9cf` (2026-10-15), synced 2026-10-18;
  row/column lineage verification is documented in
  [docs/UPSTREAM-SYNC.md](docs/UPSTREAM-SYNC.md).
- Plugin patterns inspired by `zhaiyateng/dsh-design-skills`, `Viger1/dsh-design`,
  and `superdesigndev/superdesign-skill`.

## License

[MIT](LICENSE) © ChenYiming-aaa. Third-party data/algorithm sources are listed
in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
