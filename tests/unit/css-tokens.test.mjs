/**
 * 全局设计令牌守卫
 *
 * 为什么值得单测：SCSS 里写 `var(--c-violet-600)` 而该 token 根本没定义时，
 * 浏览器不会报错 —— 整条声明在计算值阶段失效。若这条声明同时配了
 * `-webkit-text-fill-color: transparent`（渐变文字的标准写法），
 * 结果就是**标题直接隐形**。2026-10-23 就在 StarArray 的 h2 上踩到过一次。
 *
 * 规则：全局族 token（--c-* / --sp-* / --r-* / --sh-* / --grad-* / --glass-* /
 * --t / --t-fast / --focus-ring / --mesh-bg）出现在 var() 里且**不带兜底值**时，
 * 必须在 src/index.scss 或 ThemeProvider.scss（暗色覆盖）里声明过。
 * 带兜底的写法（var(--x, 0.2s)）不校验，因为它本身就是降级路径。
 */
import { ok, deepEq } from './harness.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HUB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = path.join(HUB, 'src')
const TOKEN_SOURCES = ['src/index.scss', 'src/components/ThemeProvider/ThemeProvider.scss']

const FAMILIES = 'c|sp|r|sh|grad|glass'
const VAR_RE = new RegExp(String.raw`var\(\s*(--(?:${FAMILIES})-[a-z0-9-]+|--t|--t-fast|--focus-ring|--mesh-bg)\s*\)`, 'g')

/** 递归收集 scss（creative 是独立演示区，自成一套变量） */
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'creative') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (entry.name.endsWith('.scss')) acc.push(full)
  }
  return acc
}

const DECLARED = new Set(
  TOKEN_SOURCES.flatMap((rel) =>
    [...fs.readFileSync(path.join(HUB, rel), 'utf8').matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
  ),
)

export default [
  ['全局 token 源文件可读且声明了核心令牌', () => {
    ok(DECLARED.size > 40, `只解析到 ${DECLARED.size} 个 token 声明`)
    for (const t of ['--c-primary', '--c-text-1', '--c-card', '--r-lg', '--sh-sm', '--sp-lg']) {
      ok(DECLARED.has(t), `缺少核心令牌 ${t}`)
    }
  }],

  ['scss 中不带兜底的全局 token 全部有定义', () => {
    const bad = []
    for (const file of walk(SRC)) {
      const text = fs.readFileSync(file, 'utf8')
      text.split('\n').forEach((line, i) => {
        for (const m of line.matchAll(VAR_RE)) {
          if (!DECLARED.has(m[1])) bad.push(`${path.relative(HUB, file)}:${i + 1} → ${m[1]}`)
        }
      })
    }
    deepEq(bad, [])
  }],

  ['暗色主题只覆盖既有 token，不发明新名字', () => {
    const dark = fs.readFileSync(path.join(HUB, TOKEN_SOURCES[1]), 'utf8')
    const block = dark.slice(dark.indexOf("[data-theme='dark']"), dark.indexOf('color-scheme: dark'))
    const declared = [...block.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1])
    ok(declared.length > 20, `暗色覆盖只解析到 ${declared.length} 项`)
    const light = fs.readFileSync(path.join(HUB, TOKEN_SOURCES[0]), 'utf8')
    const unknown = declared.filter((t) => !light.includes(`${t}:`))
    deepEq(unknown, [], '暗色里出现了亮色主题未定义的 token')
  }],
]
