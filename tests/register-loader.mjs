/**
 * register-loader.mjs — 注册 dsh-loader.mjs 为 ESM 解析钩子
 * 用法: node --import ./tests/register-loader.mjs tests/validate-tools.mjs
 */
import { register } from 'node:module'

register(new URL('./dsh-loader.mjs', import.meta.url).href, import.meta.url)
