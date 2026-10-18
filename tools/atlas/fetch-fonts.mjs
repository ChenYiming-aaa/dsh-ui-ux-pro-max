#!/usr/bin/env node
/**
 * 下载 74 组排版配对涉及的字体（去重后 91 个）的 latin 子集 woff2，
 * 落到 assets/atlas-fonts/，并生成完全离线的 @font-face 样式与清单。
 *
 * 只取 latin 子集：字体样张用英文排印，中文说明走系统字体栈。
 * 已存在的文件跳过，可重复运行。
 *
 * 用法：
 *   node tools/atlas/fetch-fonts.mjs            # 全量
 *   node tools/atlas/fetch-fonts.mjs --limit 3  # 只跑前 3 个（调试）
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT_DIR = path.join(ROOT, 'assets/atlas-fonts');
const CSS_PATH = path.join(OUT_DIR, 'google.css');
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CONCURRENCY = 4;
const MAX_TRIES = 3;

const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/index.json'), 'utf8'));
const fontsMeta = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fonts.json'), 'utf8')).googleFonts;
const metaByFamily = new Map(fontsMeta.map((f) => [f.Family.toLowerCase(), f]));

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = MAX_TRIES) {
  let lastErr;
  for (let i = 1; i <= tries; i += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (i < tries) await sleep(400 * i);
    }
  }
  throw lastErr;
}

/** 从 fonts.json 的 Styles 字段挑出 400 / 700 的可用正常字重 */
function pickWeights(family) {
  const meta = metaByFamily.get(family.toLowerCase());
  const all = String(meta?.Styles || '')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s && !s.endsWith('i'))
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const pool = all.length ? all : [400, 700];
  const nearest = (target) =>
    pool.reduce((best, n) => (Math.abs(n - target) < Math.abs(best - target) ? n : best), pool[0]);
  const w400 = nearest(400);
  const w700 = nearest(700);
  return [...new Set([w400, w700])].sort((a, b) => a - b);
}

const FONT_BLOCK = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;

function parseLatinFaces(css) {
  const faces = [];
  for (const m of css.matchAll(FONT_BLOCK)) {
    if (m[1] !== 'latin') continue;
    const body = m[2];
    const url = (body.match(/url\(([^)]+\.woff2)\)/) || [])[1];
    const weight = (body.match(/font-weight:\s*([^;]+);/) || [])[1]?.trim() || '400';
    const style = (body.match(/font-style:\s*([^;]+);/) || [])[1]?.trim() || 'normal';
    const range = (body.match(/unicode-range:\s*([^;]+);/) || [])[1]?.trim() || '';
    if (url) faces.push({ url: url.replace(/['"]/g, ''), weight, style, range });
  }
  return faces;
}

async function fetchFamily(family) {
  const meta = metaByFamily.get(family.toLowerCase());
  const weights = pickWeights(family);
  const enc = family.replace(/\s+/g, '+');
  const cssUrl = `https://fonts.googleapis.com/css2?family=${enc}:wght@${weights.join(';')}&display=swap`;
  let css = '';
  try {
    css = await (await get(cssUrl)).text();
  } catch {
    css = await (await get(`https://fonts.googleapis.com/css2?family=${enc}&display=swap`)).text();
  }
  let faces = parseLatinFaces(css);
  if (!faces.length) {
    const plain = await (await get(`https://fonts.googleapis.com/css2?family=${enc}&display=swap`)).text();
    faces = parseLatinFaces(plain);
  }
  if (!faces.length) throw new Error('无可用的 latin 子集');

  const slug = slugify(family);
  const byUrl = new Map();
  for (const f of faces) {
    if (!byUrl.has(f.url)) byUrl.set(f.url, []);
    byUrl.get(f.url).push(f);
  }

  const files = [];
  const oneFont = byUrl.size === 1 && faces.length > 1;
  for (const [url, group] of byUrl) {
    const name = oneFont ? `${slug}.woff2` : `${slug}-${group[0].weight}.woff2`;
    const dest = path.join(OUT_DIR, name);
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 512) {
      const buf = Buffer.from(await (await get(url)).arrayBuffer());
      if (buf.length < 512) throw new Error(`文件过小 ${buf.length}B`);
      fs.writeFileSync(dest, buf);
    }
    files.push({
      name,
      bytes: fs.statSync(dest).size,
      weights: group.map((g) => g.weight),
      style: group[0].style,
      range: group[0].range,
    });
  }

  return {
    family,
    slug,
    category: meta?.Category || '',
    subsets: meta?.Subsets || '',
    weights,
    variable: oneFont,
    files,
  };
}

async function main() {
  const typography = index.domains.typography;
  const families = [];
  const seen = new Set();
  for (const row of typography) {
    for (const key of ['Heading Font', 'Body Font']) {
      const name = String(row[key] || '').trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      families.push(name);
    }
  }
  const targets = families.slice(0, LIMIT);
  console.log(`字体配对 ${typography.length} 组，去重字体 ${families.length} 个，本次处理 ${targets.length} 个`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];
  const failures = [];
  let done = 0;

  const queue = [...targets];
  const worker = async () => {
    while (queue.length) {
      const family = queue.shift();
      try {
        const rec = await fetchFamily(family);
        manifest.push(rec);
        done += 1;
        const kb = Math.round(rec.files.reduce((a, f) => a + f.bytes, 0) / 1024);
        console.log(`  [${done}/${targets.length}] ${family} → ${rec.files.length} 文件 / ${kb} KB${rec.variable ? ' (variable)' : ''}`);
      } catch (err) {
        failures.push({ family, error: err.message });
        console.warn(`  [跳过] ${family}: ${err.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  manifest.sort((a, b) => a.family.localeCompare(b.family));

  const rules = [];
  for (const rec of manifest) {
    for (const file of rec.files) {
      const weightValue = file.weights.length > 1 ? `${Math.min(...file.weights.map(Number))} ${Math.max(...file.weights.map(Number))}` : file.weights[0];
      rules.push(
        `@font-face{font-family:'${rec.family}';font-style:${file.style};font-weight:${weightValue};font-display:swap;` +
          `src:url('../fonts/${file.name}') format('woff2');` +
          (file.range ? `unicode-range:${file.range};` : '') +
          '}',
      );
    }
  }

  fs.writeFileSync(
    CSS_PATH,
    `/* 本地化 Google Fonts latin 子集（由 tools/atlas/fetch-fonts.mjs 生成，勿手改） */\n${rules.join('\n')}\n`,
    'utf8',
  );
  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        source: 'https://fonts.googleapis.com/css2',
        subset: 'latin',
        families: manifest,
        failures,
      },
      null,
      2,
    ),
    'utf8',
  );

  const totalBytes = manifest.reduce((a, r) => a + r.files.reduce((x, f) => x + f.bytes, 0), 0);
  console.log(`\n✓ 完成 ${manifest.length}/${targets.length} 个字体，共 ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  ${path.relative(ROOT, CSS_PATH)} · ${rules.length} 条 @font-face`);
  if (failures.length) {
    console.log(`  ⚠ 失败 ${failures.length} 个：${failures.map((f) => f.family).join('、')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
