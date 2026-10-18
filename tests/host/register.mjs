/**
 * register.mjs — 注册宿主解析钩子
 *
 * 用法: node --import ./tests/host/register.mjs tests/host/verify-host.mjs
 */
import { register } from 'node:module'

register('./resolve-host.mjs', import.meta.url)
