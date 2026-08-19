# dsh-ui-ux-pro-max

[![GitHub stars](https://img.shields.io/github/stars/ChenYiming-aaa/dsh-ui-ux-pro-max)](https://github.com/ChenYiming-aaa/dsh-ui-ux-pro-max/stargazers)
[![License](https://img.shields.io/github/license/ChenYiming-aaa/dsh-ui-ux-pro-max)](LICENSE)
[![dsh-plugin](https://img.shields.io/badge/dsh--plugin-DeepSeek%20Harness-blue)](https://github.com/topics/dsh-plugin)

> UI/UX design intelligence plugin for **DeepSeek Harness (DSH)**, adapted and
> optimized from the open-source project
> [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
> (MIT License). Bundles **67 design styles, 161 color palettes, 57 font pairings,
> 99 UX guidelines, 25 chart types** across **22 technology stacks** plus 1900+
> Google Fonts records — fully offline, zero network, Chinese-first structured output.
>
> 中文说明见 [README.md](README.md)。

## Tools

| Tool | Purpose |
|------|---------|
| `design_recommend` | Product type + keywords → complete design system (ranked styles with reasons, HEX palette, font pairing, landing pattern, UX guidelines, anti-patterns, decision rules; optional stack + variance/motion/density dials) |
| `design_review` | UX checklist review of an existing UI, severity-ranked (Critical/High/Medium/Low) plus a pre-delivery checklist |
| `design_search` | Search the database by domain (`style/color/chart/landing/product/ux/typography/icons/gsap/react/web/google-fonts`) or by one of 22 stacks |

Chinese queries are auto-mapped to the English corpus (300+ term dictionary +
CJK bigram tokenization). A bundled `ui-ux-pro-max` skill teaches the model
when and how to use each tool. The plugin is **host-only** (no client UI).

## Install

### DSH Desktop (recommended)

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

## Credits

- **Upstream**: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
  (MIT) — data, search, and design-system logic ported and optimized for the DSH
  plugin form (pure JS, offline, Chinese-first, structured tool output).
- Plugin patterns inspired by `zhaiyateng/dsh-design-skills`, `Viger1/dsh-design`,
  and `superdesigndev/superdesign-skill`.

## License

[MIT](LICENSE) © ChenYiming-aaa. Third-party data/algorithm sources are listed
in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).