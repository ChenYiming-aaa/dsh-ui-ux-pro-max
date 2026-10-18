# Third-Party Notices

## Upstream project

This plugin packages the **ui-ux-pro-max** design intelligence database and
search/generation logic, adapted and optimized from the GitHub open-source
project:

- **Upstream:** [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
  — "An AI skill that provides design intelligence for building professional
  UI/UX across multiple platforms."
- **Upstream license:** [MIT](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/LICENSE)
- **What we did:** ported the CSV database (styles, colors, typography, UX
  guidelines, charts, landing patterns, icons, motion, React performance,
  app-interface, ui-reasoning, google-fonts, and 22 stack guideline files) and
  the BM25 search / design-system generation logic into a DeepSeek Harness
  plugin: pure-JavaScript reimplementation (no Python), offline-bundled JSON
  data, Chinese-first structured tool output, and three model tools
  (`design_recommend` / `design_review` / `design_search`).

The bundled data files (`data/index.json`, `data/fonts.json`) are a converted
copy of the CSV database shipped with the upstream skill.

### Source provenance

The provenance of the bundled snapshot is recorded in both `data/index.json`
and `data/meta.json`:

| Field | Value |
|---|---|
| `upstream` | `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill` (original project) |
| `upstreamRef` | `56ea9cf174ed86786187daa9de0e6247cb0747e4` (upstream commit, 2026-10-15) |
| `upstreamRefDate` | `2026-10-15T09:04:34+07:00` |
| `upstreamDataPath` | `cli/assets/data/` (upstream data directory) |
| `sourcePath` | `cli/assets/data/` (data source path) |
| `syncedAt` | `2026-10-18T03:59:34.490Z` (data generation time) |
| `lineageVerifiedAt` | `2026-10-18` (row/column comparison against upstream) |

The original upstream is **nextlevelbuilder/ui-ux-pro-max-skill**. Since 1.3.0
the bundled data was generated directly from its `cli/assets/data/` CSVs with a
quoted-field parser (no lossy transcode). The plugin itself does **not** fetch or
sync data at runtime or on a schedule. The current snapshot matches upstream
`56ea9cf` row-for-row and column-for-column:

- 88 style rows, 119 UX guidelines, 192 reasoning profiles;
- 22 stack tables (1,271 guideline rows) and 1,934 Google Fonts rows;
- all 11 domain tables match their upstream CSV columns and values.

The earlier 1.2.0 snapshot (`137597b`, transcoded via
`opencode/skills/ui-ux-pro-max/data/`) had 186 cells with stripped internal
double quotes; the 1.3.0 data generation repaired that by parsing the upstream
CSV with a proper quoted-field parser.

See `docs/DATA-PROVENANCE.md` for lineage details and current counts.

## Google Fonts metadata

`data/fonts.json` is derived from Google Fonts public metadata (font families
are OFL / Apache-2.0 licensed; the metadata itself is public API data). Font
names and URLs are used for reference only — no font files are bundled.

## Dependencies

This plugin has **no runtime npm dependencies**. It imports the DSH host APIs
declared as peer dependencies and resolved from the host runtime:

- `@deepseek-ai/cordis` — runtime composition framework (Apache-2.0 / MIT)
- `@deepseek-ai/dsh-tools` — tool definition API
- `@deepseek-ai/dsh-skill` — bundled skill provider API

All search, ranking (BM25), and design-system generation logic in `lib/` is an
independent reimplementation in plain JavaScript with no third-party code.
