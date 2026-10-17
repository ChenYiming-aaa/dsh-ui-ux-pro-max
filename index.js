/**
 * dsh-ui-ux-pro-max — UI/UX 设计智能库插件（薄入口）
 *
 * 只负责重导出；具体实现分层在 lib/ 下：
 *   plugin/       宿主适配（apply / skill / SchemaSpec 方言）
 *   tools/        三个工具（definition + execute + render）
 *   presentation/ Markdown 渲染
 *   domain/       设计系统生成 / 审查 / 旋钮 / 规则
 *   search/       BM25 引擎与检索门面
 *   repo/         内置数据访问与能力数字
 *   i18n/         中文标签与查询扩展
 *
 * 数据完全内置（data/index.json + data/fonts.json），零网络依赖。
 * @module dsh-ui-ux-pro-max
 */

export { name, inject } from './lib/plugin/meta.js'
export { apply, buildTools } from './lib/plugin/index.js'
