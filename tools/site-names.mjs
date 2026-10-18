/**
 * 两个站点的名称 —— 唯一来源。
 *
 * 全站文案、<title>、导航、脚注、README 里出现的站名都从这里取，
 * 换名时只改这一个文件再重新构建。
 */

/** 主站：88 种风格的真实渲染 */
export const GALLERY = {
  name: '风格图鉴',
  en: 'Style Atlas',
  dir: 'gallery',
};

/**
 * 另一视图：配色 / 字体 / 图表 / 落地页 / 规范 / 配方 —— 回答「该定什么」。
 *
 * 两站共用同一套 4319 行知识库，只是切入方式不同：图鉴按「风格」翻，手册按「决策」翻，
 * 因此互称「另一视图」而不是「姊妹站」——它们不是两个独立站点，是同一份数据的两种看法。
 */
export const HANDBOOK = {
  name: '设计手册',
  en: 'Design Handbook',
  dir: 'handbook',
};

/** 一句话定位，用于两站的互相引用 */
export const GALLERY_LINE = '看长什么样';
export const HANDBOOK_LINE = '定用什么';
export const OTHER_VIEW = '另一视图';
