/**
 * 情绪词 → 字体关键词 的同义映射。
 *
 * reasoning 表里的 Typography_Mood 是自然语言（如 "Professional + Clean hierarchy"），
 * typography 表里的 Mood/Style Keywords 是标签集合。两者没有共同主键，
 * 只靠字面重合只能覆盖约三成，因此这里补一张人工映射表。
 *
 * 键是归一化后的情绪词（去掉 "typography" / "hierarchy" 后缀、小写），
 * 值是该情绪在字体标签里的同义表达。未收录的词直接忽略。
 */
export const MOOD_MAP = {
  professional: ['professional', 'corporate', 'business', 'b2b', 'enterprise', 'formal'],
  bold: ['bold', 'heavy', 'strong', 'loud', 'shouty', 'uppercase', 'impactful'],
  hierarchy: ['headlines', 'display', 'typographic', 'hierarchical', 'editorial'],
  clear: ['clear', 'legible', 'readable', 'accessible', 'wcag'],
  friendly: ['friendly', 'approachable', 'warm', 'gentle', 'human', 'bubbly'],
  clean: ['clean', 'minimal', 'simplified', 'flat', 'swiss'],
  modern: ['modern', 'contemporary', 'versatile', 'startup', 'tech', 'geometric'],
  elegant: ['elegant', 'refined', 'sophisticated', 'premium', 'luxury', 'high-end'],
  readable: ['readable', 'legible', 'accessible', 'dyslexia-friendly', 'bookish'],
  'sans-serif': ['geometric', 'swiss', 'modern', 'clean', 'system'],
  large: ['oversized', 'display', 'headlines', 'heavy'],
  playful: ['playful', 'fun', 'quirky', 'bubbly', 'candy', 'meme', 'kids'],
  rounded: ['rounded', 'bubbly', 'soft', 'gentle', 'friendly'],
  energetic: ['energetic', 'high-energy', 'dynamic', 'athletic', 'sports', 'loud', 'kinetic'],
  functional: ['functional', 'utility', 'system', 'dashboard', 'product'],
  engaging: ['dynamic', 'expressive', 'creative', 'innovative', 'kinetic'],
  'high contrast': ['high contrast', 'high-contrast', 'stark', 'brutal', 'heavy'],
  'high-contrast': ['high contrast', 'high-contrast', 'stark', 'brutal'],
  'light on dark': ['dark', 'oled', 'near-black'],
  monospace: ['monospace', 'monospaced', 'code', 'terminal', 'cli', 'developer'],
  technical: ['technical', 'tech', 'developer', 'code', 'monospace', 'terminal'],
  'gradient-friendly': ['kinetic', 'dynamic', 'futuristic', 'neon'],
  formal: ['formal', 'serious', 'austere', 'traditional', 'corporate', 'legal', 'classic'],
  warm: ['warm', 'human warmth', 'organic', 'handmade', 'craft', 'artisan'],
  expressive: ['expressive', 'dynamic', 'creative', 'kinetic', 'type-as-hero'],
  impactful: ['impactful', 'heavy', 'bold', 'oversized', 'loud'],
  minimal: ['minimal', 'minimalist', 'clean', 'simplified'],
  scientific: ['scientific', 'science', 'research', 'academic', 'precise'],
  futuristic: ['futuristic', 'sci-fi', 'cyberpunk', 'neon', 'tech', 'innovative'],
  humanist: ['humanist', 'human', 'warm', 'organic', 'natural'],
  natural: ['natural', 'organic', 'craft', 'handmade', 'artisan'],
  'community-first': ['inclusive', 'accessible', 'human', 'approachable'],
  'scan-friendly': ['legible', 'readable', 'neutral', 'utility', 'system'],
  hierarchical: ['headlines', 'display', 'typographic', 'editorial', 'hierarchical'],
  academic: ['academic', 'scholarly', 'university', 'research', 'journal', 'literary'],
  variable: ['kinetic', 'dynamic', 'expressive', 'modern'],
  trustworthy: ['trustworthy', 'professional', 'banking', 'financial', 'corporate'],
  efficient: ['utility', 'system', 'condensed', 'compact', 'functional'],
  calming: ['calm', 'relaxing', 'gentle', 'soft', 'wellness'],
  appetizing: ['foodie', 'culinary', 'restaurant', 'menu'],
  motivational: ['energetic', 'athletic', 'strong', 'competitive', 'bold'],
  confident: ['confident', 'strong', 'bold', 'premium', 'authoritative'],
  inspirational: ['creative', 'expressive', 'dynamic', 'innovative'],
  romantic: ['romance', 'wedding', 'bridal', 'feminine', 'script'],
  authoritative: ['authoritative', 'serious', 'formal', 'legal', 'banking', 'financial'],
  heartfelt: ['handwritten', 'handwriting', 'script', 'personal', 'warm'],
  inviting: ['invitation', 'approachable', 'friendly', 'warm', 'hospitality'],
  artisanal: ['artisan', 'craft', 'handmade', 'organic', 'leather'],
  heritage: ['traditional', 'classic', 'antique', 'victorian', '1920s'],
  editorial: ['editorial', 'magazine', 'publishing', 'news', 'literary'],
  welcoming: ['invitation', 'approachable', 'friendly', 'warm', 'hospitality'],
  dramatic: ['dramatic', 'cinematic', 'poster', 'loud', 'heavy'],
  precise: ['precision', 'technical', 'mechanical', 'geometric', 'swiss'],
  architectural: ['architectural', 'bauhaus', 'constructivist', 'geometric', 'spatial'],
  'content-focused': ['editorial', 'readable', 'bookish', 'literary', 'publishing'],
  spatial: ['spatial', 'glass', 'futuristic'],
  subtle: ['subtle', 'soft', 'neutral', 'minimal'],
  soft: ['soft', 'gentle', 'rounded', 'soft ui'],
  monochromatic: ['monochromatic', 'monochrome', 'tonal', 'neutral'],
  nostalgic: ['nostalgic', 'retro', 'vintage', 'old-school', '1920s', 'antique'],
  neon: ['neon', 'cyberpunk', 'glitch', 'electric', 'luminescent'],
  'serif body': ['bookish', 'literary', 'editorial', 'classic'],
  neutral: ['neutral', 'system', 'utility', 'legible'],
  versioned: ['technical', 'monospace', 'code', 'system'],
  marketplace: ['ecommerce', 'retail', 'shopping', 'conversion'],
  emotional: ['expressive', 'warm', 'romantic', 'human'],
  immediate: ['bold', 'impactful', 'heavy', 'shouty'],
  urgent: ['bold', 'impactful', 'loud', 'shouty'],
  'document-readable': ['readable', 'bookish', 'literary', 'accessible'],
  instructional: ['readable', 'informative', 'accessible', 'utility'],
  'ui-focused': ['system', 'dashboard', 'product'],
  'search-friendly': ['neutral', 'legible', 'system', 'utility'],
  'code-friendly': ['code', 'monospace', 'monospaced', 'terminal', 'cli'],
  'resume-friendly': ['professional', 'formal', 'classic', 'serious'],
  'review-first': ['readable', 'informative', 'editorial'],
  operational: ['dashboard', 'data', 'utility', 'analytics', 'technical'],
  'form-first': ['clean', 'clear', 'functional', 'accessible', 'neutral'],
  calm: ['calm', 'relaxing', 'gentle', 'soft'],
  'social-proof': ['readable', 'approachable', 'warm', 'human'],
  event: ['poster', 'display', 'music', 'loud'],
  status: ['financial', 'fintech', 'analytics', 'dashboard', 'data'],
};

const NOISE = /^[\s()]+$/;

/** 把一段 Typography_Mood 拆成归一化情绪词 */
export function moodTokens(mood) {
  const out = new Set();
  for (const raw of String(mood || '').toLowerCase().split(/[+/,]/)) {
    let t = raw.trim().replace(/\(.*?\)/g, '').trim();
    if (!t || NOISE.test(t)) continue;
    t = t
      .replace(/\s+typography$/, '')
      .replace(/\s+hierarchy$/, '')
      .replace(/\s+type$/, '')
      .trim();
    if (!t || t.length < 3) continue;
    if (/[^a-z0-9 -]/.test(t)) continue;
    out.add(t);
  }
  return [...out];
}

/** 情绪 → 去重后的字体关键词列表 */
export function moodKeywords(mood) {
  const kws = new Set();
  for (const t of moodTokens(mood)) {
    for (const k of MOOD_MAP[t] || []) kws.add(k);
  }
  return [...kws];
}
