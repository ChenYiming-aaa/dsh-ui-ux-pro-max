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
