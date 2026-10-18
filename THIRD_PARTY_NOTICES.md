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
| `upstreamRef` | `137597b02fc3c8689059af899bffef76ee6ae15c` (upstream commit, 2026-07-03) |
| `upstreamDataPath` | `cli/assets/data/` (upstream data directory used for verification) |
| `sourcePath` | `opencode/skills/ui-ux-pro-max/data/` (transcode path recorded by the snapshot) |
| `syncedAt` | `2026-08-19T09:37:40.268Z` (transcode time; content corresponds to the upstream commit above) |
| `lineageVerifiedAt` | `2026-10-18` (row/column comparison against upstream) |

The original upstream is **nextlevelbuilder/ui-ux-pro-max-skill**. The snapshot
was transcoded from the `opencode/skills/ui-ux-pro-max/data/` copy, whose data
matches upstream commit `137597b` row-for-row and column-for-column: all 11
domain tables (style/color/chart/landing/product/ux/typography/icons/gsap/react/web),
the 161 reasoning rows, all 22 stack tables and all 1,923 Google Fonts rows were
compared field-by-field. The only differences are 186 cells across 8 tables
where internal double quotes were stripped during CSV transcoding
(`icons` 100, `shadcn` 38, `nuxt-ui` 25, `javafx` 15, `nuxtjs` 5, `web` 1,
`wpf` 1, `uno` 1); no rows were added, removed, or replaced. That quote-stripping
is a transcode artifact, not a different data source, and should be repaired on
the next upstream sync.

Both the original upstream and the transcode path are recorded so the MIT
attribution chain can be traced; see `docs/UPSTREAM-SYNC.md` for the verification
method and sync procedure.

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
