/**
 * Node 侧的别名解析器（服务于不走 Vite 的纯 Node 链路，主要是 npm test）。
 *
 * ── 为什么必须有它 ────────────────────────────────────────
 * 别名定义在 vite.config.js 的 resolve.alias，只有走 Vite 管线的链路
 *（dev / build / ssrLoadModule）才生效。而 npm test 跑的是 scripts/run-tests.mjs，
 * 它用本机 Node 直接 dynamic import() src 下的模块 —— Node 不认识 '@/xxx'，
 * 会抛 ERR_MODULE_NOT_FOUND: Cannot find package '@/xxx'。
 * 本钩子把这条链路补齐，让同一份别名在 Vite 与 Node 下都能用。
 *
 * ── 别名表从哪里来 ────────────────────────────────────────
 * scripts/aliases.mjs（唯一真源）。这里不再自己维护一份，避免加别名时漏改。
 *
 * ── 覆盖范围刻意做窄 ──────────────────────────────────────
 * 只认别名表里登记的前缀，其余一律透传给 Node 默认解析；
 * 候选文件只试 .js / .json / 目录 index.js —— Node 本身无法解析 JSX，
 * 能被单测直接 import 的必然是不含 JSX 的纯逻辑模块。
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { resolveAliasPath } from './aliases.mjs'

function candidates(target) {
  return [target, `${target}.js`, `${target}.json`, path.join(target, 'index.js')]
}

export async function resolve(specifier, context, next) {
  const aliased = resolveAliasPath(specifier)
  if (!aliased) return next(specifier, context)

  for (const candidate of candidates(aliased)) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { url: pathToFileURL(candidate).href, shortCircuit: true }
    }
  }
  // 兜底：交给 Node 按默认规则报错，异常信息比我们手写的更贴近真实原因
  return next(specifier, context)
}
