/**
 * 25 类图表的手绘 SVG 示意（120×80）。
 * 目标不是画真图，而是让人一眼认出"这类图长什么样"。
 */

const A = '#e4501e';
const N = '#b3aea2';
const L = '#e6e2d8';
const D = '#4a4740';

const wrap = (inner) =>
  `<svg viewBox="0 0 120 80" width="120" height="80" aria-hidden="true" focusable="false">${inner}</svg>`;

const bars = (vals, color = A) => {
  const w = 12;
  const gap = 6;
  return vals
    .map((v, i) => {
      const h = Math.round(v * 52);
      const x = 14 + i * (w + gap);
      return `<rect x="${x}" y="${66 - h}" width="${w}" height="${h}" rx="2" fill="${color}" opacity="${0.45 + i * 0.13}"/>`;
    })
    .join('');
};

const grid = (cols, rows) => {
  let out = '';
  const cw = 96 / cols;
  const ch = 56 / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      out += `<rect x="${12 + c * cw + 1}" y="${14 + r * ch + 1}" width="${cw - 2}" height="${ch - 2}" fill="${L}"/>`;
    }
  }
  return out;
};

const linePath = (pts) => `M${pts.map((p) => p.join(' ')).join(' L')}`;

export function chartSvg(rawType) {
  const t = String(rawType || '').toLowerCase();

  if (t.includes('candlestick')) {
    let out = '';
    const data = [
      [22, 30, 14, 20],
      [42, 22, 10, 16],
      [62, 12, 8, 14],
      [82, 26, 12, 18],
      [102, 18, 8, 22],
    ];
    for (const [x, top, bodyH, bot] of data) {
      out += `<line x1="${x}" y1="${top - 6}" x2="${x}" y2="${top + bodyH + bot}" stroke="${D}" stroke-width="1"/>`;
      out += `<rect x="${x - 5}" y="${top}" width="10" height="${bodyH}" fill="${top % 2 ? A : N}"/>`;
    }
    return wrap(`<line x1="10" y1="70" x2="112" y2="70" stroke="${L}" stroke-width="1"/>${out}`);
  }

  if (t.includes('waterfall')) {
    const seg = [
      [10, 40, 20, A],
      [30, 30, 16, A],
      [50, 34, 12, N],
      [62, 46, 10, N],
      [72, 36, 18, A],
      [90, 26, 14, A],
    ];
    const body = seg
      .map(([x, y, h, c]) => `<rect x="${x}" y="${y}" width="14" height="${66 - y}" fill="${c}" opacity="0.75"/>`)
      .join('');
    const conn = `<path d="M24 40 L30 40 M44 30 L50 30 M64 46 L72 46 M86 36 L90 36" stroke="${N}" stroke-width="1" stroke-dasharray="2 2" fill="none"/>`;
    return wrap(`<line x1="8" y1="66" x2="112" y2="66" stroke="${L}" stroke-width="1"/>${body}${conn}`);
  }

  if (t.includes('radar') || t.includes('spider')) {
    const cx = 60;
    const cy = 42;
    const R = 26;
    const ring = [1, 0.66, 0.33]
      .map((k) => {
        const pts = [0, 1, 2, 3, 4, 5].map((i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          return `${cx + Math.cos(a) * R * k} ${cy + Math.sin(a) * R * k}`;
        });
        return `<polygon points="${pts.join(',')}" fill="none" stroke="${L}" stroke-width="1"/>`;
      })
      .join('');
    const data = [0.9, 0.5, 0.75, 0.4, 0.85, 0.55]
      .map((v, i) => {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        return `${cx + Math.cos(a) * R * v} ${cy + Math.sin(a) * R * v}`;
      })
      .join(',');
    return wrap(`${ring}<polygon points="${data}" fill="${A}" fill-opacity="0.22" stroke="${A}" stroke-width="1.5"/>`);
  }

  if (t.includes('box plot')) {
    let out = '';
    const boxes = [
      [30, 30, 14, 46],
      [60, 24, 18, 56],
      [90, 34, 10, 42],
    ];
    for (const [x, q1, q3, med] of boxes) {
      out += `<rect x="${x - 9}" y="${q1}" width="18" height="${q3 - q1}" fill="${L}" stroke="${N}" stroke-width="1"/>`;
      out += `<line x1="${x - 9}" y1="${med}" x2="${x + 9}" y2="${med}" stroke="${A}" stroke-width="2"/>`;
      out += `<line x1="${x}" y1="${q1 - 8}" x2="${x}" y2="${q1}" stroke="${N}" stroke-width="1"/>`;
      out += `<line x1="${x}" y1="${q3}" x2="${x}" y2="${q3 + 8}" stroke="${N}" stroke-width="1"/>`;
      out += `<line x1="${x - 5}" y1="${q1 - 8}" x2="${x + 5}" y2="${q1 - 8}" stroke="${N}" stroke-width="1"/>`;
      out += `<line x1="${x - 5}" y1="${q3 + 8}" x2="${x + 5}" y2="${q3 + 8}" stroke="${N}" stroke-width="1"/>`;
    }
    return wrap(`<line x1="10" y1="70" x2="112" y2="70" stroke="${L}" stroke-width="1"/>${out}`);
  }

  if (t.includes('bullet')) {
    let out = '';
    const rows = [
      [14, 0.82],
      [32, 0.55],
      [50, 0.68],
    ];
    for (const [y, v] of rows) {
      out += `<rect x="14" y="${y}" width="90" height="10" rx="2" fill="${L}"/>`;
      out += `<rect x="14" y="${y}" width="${90 * v}" height="10" rx="2" fill="${A}" opacity="0.8"/>`;
      out += `<line x1="${14 + 90 * 0.9}" y1="${y - 2}" x2="${14 + 90 * 0.9}" y2="${y + 12}" stroke="${D}" stroke-width="2"/>`;
    }
    return wrap(out);
  }

  if (t.includes('gauge')) {
    return wrap(
      `<path d="M20 60 A40 40 0 0 1 100 60" fill="none" stroke="${L}" stroke-width="10" stroke-linecap="round"/>` +
        `<path d="M20 60 A40 40 0 0 1 74 24" fill="none" stroke="${A}" stroke-width="10" stroke-linecap="round"/>` +
        `<circle cx="60" cy="60" r="4" fill="${D}"/>` +
        `<path d="M60 60 L84 34" stroke="${D}" stroke-width="2" stroke-linecap="round"/>`,
    );
  }

  if (t.includes('waffle')) {
    let out = '';
    const total = 60;
    const filled = 38;
    for (let i = 0; i < total; i += 1) {
      const c = i % 10;
      const r = Math.floor(i / 10);
      out += `<rect x="${12 + c * 9.6}" y="${14 + r * 8.5}" width="7.6" height="6.5" rx="1" fill="${i < filled ? A : L}" opacity="${i < filled ? 0.55 + (i / total) * 0.45 : 1}"/>`;
    }
    return wrap(out);
  }

  if (t.includes('sunburst')) {
    const arcs = [
      ['M60 40 L60 12 A28 28 0 0 1 88 40 Z', A, 0.85],
      ['M60 40 L88 40 A28 28 0 0 1 60 68 Z', A, 0.5],
      ['M60 40 L60 68 A28 28 0 0 1 32 40 Z', N, 0.55],
      ['M60 40 L32 40 A28 28 0 0 1 60 12 Z', N, 0.3],
      ['M60 40 L60 24 A16 16 0 0 1 76 40 Z', D, 0.35],
      ['M60 40 L76 40 A16 16 0 0 1 60 56 Z', L, 1],
      ['M60 40 L60 56 A16 16 0 0 1 44 40 Z', L, 1],
      ['M60 40 L44 40 A16 16 0 0 1 60 24 Z', L, 1],
    ];
    return wrap(
      arcs.map(([d, c, o]) => `<path d="${d}" fill="${c}" opacity="${o}" stroke="#fff" stroke-width="1"/>`).join(''),
    );
  }

  if (t.includes('decomposition')) {
    return wrap(
      `<rect x="46" y="12" width="28" height="12" rx="2" fill="${A}"/>` +
        `<path d="M60 24 L60 32 M30 32 L90 32 M30 32 L30 40 M60 32 L60 40 M90 32 L90 40" stroke="${N}" stroke-width="1" fill="none"/>` +
        `<rect x="18" y="40" width="24" height="10" rx="2" fill="${L}" stroke="${N}" stroke-width="1"/>` +
        `<rect x="48" y="40" width="24" height="10" rx="2" fill="${L}" stroke="${N}" stroke-width="1"/>` +
        `<rect x="78" y="40" width="24" height="10" rx="2" fill="${L}" stroke="${N}" stroke-width="1"/>` +
        `<path d="M30 50 L30 58 M90 50 L90 58" stroke="${N}" stroke-width="1" fill="none"/>` +
        `<rect x="18" y="58" width="24" height="10" rx="2" fill="${L}" stroke="${N}" stroke-width="1"/>` +
        `<rect x="78" y="58" width="24" height="10" rx="2" fill="${L}" stroke="${N}" stroke-width="1"/>`,
    );
  }

  if (t.includes('word cloud')) {
    const words = [
      [24, 30, 30, 9],
      [62, 24, 26, 8],
      [30, 44, 22, 7],
      [58, 38, 20, 6],
      [82, 34, 18, 6],
      [24, 54, 18, 6],
      [48, 52, 24, 7],
      [76, 50, 16, 5],
    ];
    return wrap(
      words
        .map(
          ([x, y, w, h], i) =>
            `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${i % 3 === 0 ? A : N}" opacity="${i % 3 === 0 ? 0.8 : 0.45}"/>`,
        )
        .join(''),
    );
  }

  if (t.includes('process map')) {
    return wrap(
      `<circle cx="22" cy="26" r="8" fill="${A}"/>` +
        `<circle cx="60" cy="20" r="7" fill="${N}"/>` +
        `<circle cx="98" cy="28" r="8" fill="${L}" stroke="${N}" stroke-width="1"/>` +
        `<circle cx="40" cy="56" r="7" fill="${L}" stroke="${N}" stroke-width="1"/>` +
        `<circle cx="82" cy="56" r="9" fill="${A}" opacity="0.6"/>` +
        `<path d="M30 27 L53 22 M67 22 L90 26 M26 33 L37 50 M47 55 L73 55 M90 35 L84 47" stroke="${N}" stroke-width="1.2" fill="none"/>`,
    );
  }

  if (t.includes('sankey') && !t.includes('funnel')) {
    return wrap(
      `<path d="M18 16 C60 16 62 30 102 30" stroke="${A}" stroke-width="8" fill="none" opacity="0.55" stroke-linecap="round"/>` +
        `<path d="M18 36 C60 36 62 44 102 44" stroke="${N}" stroke-width="6" fill="none" opacity="0.5" stroke-linecap="round"/>` +
        `<path d="M18 52 C60 52 62 58 102 60" stroke="${A}" stroke-width="4" fill="none" opacity="0.4" stroke-linecap="round"/>`,
    );
  }

  if (t.includes('funnel')) {
    const steps = [
      [14, 22, 92, 10],
      [24, 36, 72, 9],
      [34, 49, 52, 8],
      [44, 61, 32, 7],
    ];
    return wrap(
      steps
        .map(
          ([x, y, w, h], i) =>
            `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${A}" opacity="${0.85 - i * 0.15}"/>`,
        )
        .join(''),
    );
  }

  if (t.includes('heat map')) {
    const shades = [
      [0.15, 0.5, 0.8, 0.3, 0.1],
      [0.4, 0.9, 1, 0.6, 0.2],
      [0.2, 0.7, 0.85, 0.45, 0.15],
    ];
    let out = grid(5, 3);
    let idx = 0;
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        const v = shades[r][c];
        out += `<rect x="${12 + c * 19.2 + 1}" y="${14 + r * 18.67 + 1}" width="17.2" height="16.67" fill="${A}" opacity="${v}"/>`;
        idx += 1;
      }
    }
    return wrap(out);
  }

  if (t.includes('choropleth') || t.includes('bubble map')) {
    return wrap(
      `<path d="M18 22 L44 16 L52 34 L38 50 L20 44 Z" fill="${A}" opacity="0.25"/>` +
        `<path d="M56 18 L86 20 L92 42 L70 52 L54 40 Z" fill="${A}" opacity="0.55"/>` +
        `<path d="M30 54 L56 50 L60 68 L34 66 Z" fill="${A}" opacity="0.4"/>` +
        `<path d="M70 48 L96 44 L100 64 L74 66 Z" fill="${N}" opacity="0.35"/>` +
        `<circle cx="76" cy="50" r="5" fill="${A}"/><circle cx="34" cy="30" r="3" fill="${D}"/>`,
    );
  }

  if (t.includes('treemap')) {
    return wrap(
      `<rect x="12" y="14" width="52" height="52" rx="2" fill="${A}" opacity="0.75"/>` +
        `<rect x="64" y="14" width="44" height="30" rx="2" fill="${N}" opacity="0.55"/>` +
        `<rect x="64" y="44" width="24" height="22" rx="2" fill="${L}" stroke="${N}" stroke-width="1"/>` +
        `<rect x="88" y="44" width="20" height="22" rx="2" fill="${A}" opacity="0.35"/>` +
        `<rect x="14" y="16" width="22" height="22" rx="1" fill="#fff" opacity="0.35"/>`,
    );
  }

  if (t.includes('network')) {
    return wrap(
      `<path d="M30 24 L58 18 M30 24 L44 48 M58 18 L82 30 M44 48 L82 30 M58 18 L64 52 M44 48 L64 52 M82 30 L64 52 M82 30 L96 54 M64 52 L96 54" stroke="${N}" stroke-width="1" fill="none"/>` +
        `<circle cx="30" cy="24" r="6" fill="${A}"/>` +
        `<circle cx="58" cy="18" r="5" fill="${A}" opacity="0.7"/>` +
        `<circle cx="82" cy="30" r="7" fill="${D}"/>` +
        `<circle cx="44" cy="48" r="5" fill="${N}"/>` +
        `<circle cx="64" cy="52" r="6" fill="${A}" opacity="0.5"/>` +
        `<circle cx="96" cy="54" r="4" fill="${N}"/>`,
    );
  }

  if (t.includes('3d')) {
    return wrap(
      `<path d="M20 62 L20 24 L92 16 M20 62 L98 56 M92 16 L98 56" stroke="${L}" stroke-width="1" fill="none"/>` +
        `<circle cx="44" cy="40" r="5" fill="${A}" opacity="0.85"/><circle cx="62" cy="32" r="3.5" fill="${A}" opacity="0.6"/>` +
        `<circle cx="74" cy="44" r="6" fill="${A}" opacity="0.45"/><circle cx="38" cy="52" r="3" fill="${D}" opacity="0.6"/>` +
        `<circle cx="84" cy="30" r="4" fill="${D}" opacity="0.45"/>`,
    );
  }

  if (t.includes('streaming') || (t.includes('area') && !t.includes('line'))) {
    return wrap(
      `<path d="M12 56 C30 40 40 54 56 44 C72 34 84 48 108 30 L108 68 L12 68 Z" fill="${A}" opacity="0.28"/>` +
        `<path d="M12 62 C30 52 42 62 58 54 C74 46 86 58 108 46 L108 68 L12 68 Z" fill="${N}" opacity="0.35"/>` +
        `<path d="M12 56 C30 40 40 54 56 44 C72 34 84 48 108 30" stroke="${A}" stroke-width="1.8" fill="none"/>`,
    );
  }

  if (t.includes('confidence')) {
    return wrap(
      `<path d="M12 46 L34 34 L56 40 L78 26 L106 32" stroke="${A}" stroke-width="1.8" fill="none"/>` +
        `<path d="M12 40 L34 26 L56 32 L78 18 L106 24 L106 40 L78 34 L56 48 L34 42 L12 52 Z" fill="${A}" opacity="0.16"/>`,
    );
  }

  if (t.includes('highlight')) {
    return wrap(
      `<path d="M12 54 L34 42 L56 46 L78 24 L106 34" stroke="${N}" stroke-width="1.6" fill="none"/>` +
        `<circle cx="78" cy="24" r="9" fill="${A}" opacity="0.18"/>` +
        `<circle cx="78" cy="24" r="3.4" fill="${A}"/>` +
        `<path d="M78 24 L78 60" stroke="${A}" stroke-width="1" stroke-dasharray="2 2"/>`,
    );
  }

  if (t.includes('pie') || t.includes('donut')) {
    return wrap(
      `<path d="M60 40 L60 12 A28 28 0 0 1 84 56 Z" fill="${A}" opacity="0.85"/>` +
        `<path d="M60 40 L84 56 A28 28 0 0 1 38 62 Z" fill="${N}" opacity="0.55"/>` +
        `<path d="M60 40 L38 62 A28 28 0 0 1 60 12 Z" fill="${L}" stroke="${N}" stroke-width="1"/>` +
        `<circle cx="60" cy="40" r="12" fill="#fff"/>`,
    );
  }

  if (t.includes('scatter')) {
    return wrap(
      `<line x1="12" y1="66" x2="110" y2="66" stroke="${L}" stroke-width="1"/>` +
        `<line x1="12" y1="14" x2="12" y2="66" stroke="${L}" stroke-width="1"/>` +
        [
          [30, 52, 3],
          [42, 44, 5],
          [50, 56, 3],
          [62, 32, 6],
          [70, 38, 4],
          [80, 24, 7],
          [90, 30, 4],
          [98, 46, 3],
          [56, 20, 3],
        ]
          .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${A}" opacity="0.55"/>`)
          .join(''),
    );
  }

  if (t.includes('line')) {
    return wrap(
      `<path d="M12 62 L34 44 L56 52 L78 30 L106 38" stroke="${A}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<line x1="12" y1="66" x2="110" y2="66" stroke="${L}" stroke-width="1"/>`,
    );
  }

  if (t.includes('bar')) {
    return wrap(`<line x1="10" y1="66" x2="112" y2="66" stroke="${L}" stroke-width="1"/>${bars([0.3, 0.55, 0.42, 0.78, 0.62])}`);
  }

  return wrap(`<rect x="14" y="18" width="92" height="44" rx="3" fill="${L}" stroke="${N}" stroke-width="1"/>`);
}
