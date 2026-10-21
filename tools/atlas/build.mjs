#!/usr/bin/env node
/**
 * 生成设计手册站点 → handbook/（独立站点，仓库根）
 *
 * 与图鉴站（site/）完全脱钩：不读 site/、不清 site/、站内只用相对路径，
 * 可单独部署到任意路径，也可以只构建本站在没有 site/ 的情况下跑通。
 * 唯一的外部跳转是「风格图鉴」，走 SHOWCASE_BASE 的绝对 URL（可被环境变量覆盖）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadAtlas } from './data.mjs';
import * as P from './pages.mjs';
import { favicon, SHOWCASE_BASE } from './layout.mjs';
import { xnavCss, xnavJs } from '../xnav.mjs';
import { squircleCss, squircleJs } from '../squircle.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'handbook');
const ASSETS = path.join(ROOT, 'tools/atlas/assets');
const FONT_SRC = path.join(ROOT, 'assets/atlas-fonts');

function rmInside(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    try {
      fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
    } catch (err) {
      console.warn(`  ⚠ 无法清理 ${entry}: ${err.message}`);
    }
  }
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  for (const entry of fs.readdirSync(from)) {
    const src = path.join(from, entry);
    const dest = path.join(to, entry);
    if (fs.statSync(src).isDirectory()) n += copyDir(src, dest);
    else {
      fs.copyFileSync(src, dest);
      n += 1;
    }
  }
  return n;
}

function main() {
  if (!fs.existsSync(path.join(FONT_SRC, 'google.css'))) {
    console.error('✗ 缺少本地字体。请先运行：node tools/atlas/fetch-fonts.mjs');
    process.exit(1);
  }

  const a = loadAtlas();
  fs.mkdirSync(OUT, { recursive: true });
  rmInside(OUT);
  fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

  const pages = {
    'index.html': P.indexPage(a),
    'palettes.html': P.palettesPage(a),
    'pairings.html': P.pairingsPage(a),
    'charts.html': P.chartsPage(a),
    'landing.html': P.landingPage(a),
    'practices.html': P.practicesPage(a),
    'recipes.html': P.recipesPage(a),
    'compose.html': P.composePage(a),
    'about.html': P.aboutPage(a),
    '404.html': P.notFound(a),
  };

  let total = 0;
  for (const [name, html] of Object.entries(pages)) {
    fs.writeFileSync(path.join(OUT, name), html, 'utf8');
    const kb = Math.round(Buffer.byteLength(html) / 1024);
    total += kb;
    console.log(`  ${name.padEnd(16)} ${String(kb).padStart(5)} KB`);
  }

  for (const f of ['atlas.css', 'app.js']) {
    // 跨站切换动效与曲率连续圆角与图鉴共用 tools/xnav.mjs / tools/squircle.mjs，
    // 构建时追加，保证两站节奏一致
    fs.writeFileSync(
      path.join(OUT, 'assets', f),
      fs.readFileSync(path.join(ASSETS, f), 'utf8') +
        (f.endsWith('.css') ? xnavCss() + squircleCss() : xnavJs() + squircleJs()),
    );
  }
  fs.writeFileSync(path.join(OUT, 'assets', 'favicon.svg'), favicon, 'utf8');
  fs.copyFileSync(path.join(FONT_SRC, 'google.css'), path.join(OUT, 'assets', 'fonts.css'));

  const fontFiles = copyDir(FONT_SRC, path.join(OUT, 'fonts'));
  fs.copyFileSync(path.join(FONT_SRC, 'manifest.json'), path.join(OUT, 'fonts', 'manifest.json'));

  const fontBytes = fs
    .readdirSync(path.join(OUT, 'fonts'))
    .filter((f) => f.endsWith('.woff2'))
    .reduce((acc, f) => acc + fs.statSync(path.join(OUT, 'fonts', f)).size, 0);

  console.log('');
  console.log(`✓ handbook/ 生成完成：${Object.keys(pages).length} 页，HTML ${total} KB（独立站点）`);
  console.log(`  配色 ${a.stats.palettes} · 字体 ${a.stats.pairings} · 配方 ${a.stats.recipes} · 图表 ${a.stats.charts} · 落地页 ${a.stats.landings} · 规范 ${a.stats.practices}`);
  console.log(`  本地字体 ${fontFiles} 个文件 / ${(fontBytes / 1024 / 1024).toFixed(2)} MB（含 manifest）`);
  console.log(`  出站到图鉴：${a.stats.styleRefsResolved} 处风格名 → ${SHOWCASE_BASE || '../gallery/（同级目录，可用 SHOWCASE_BASE 覆盖）'}`);
  console.log(`  落地页映射：${a.stats.landingLinked}/${a.stats.recipes} · 字体匹配：${a.stats.fontMatched}/${a.stats.recipes}`);

  if (a.stats.landingLinked < a.stats.recipes) {
    console.log(`  · ${a.stats.recipes - a.stats.landingLinked} 类产品无对应落地页模式（已在指南页说明）`);
  }
}

main();
