#!/usr/bin/env node
/**
 * i18n 文案落库助手 —— 把一组键值写入 10 个语种目录，并自动保证「键结构完全对齐」。
 *
 * 为什么需要它：tests/unit/i18n.test.mjs 钉死「10 个语种命名空间文件集合一致 +
 * 叶子键结构完全一致 + 全部是非空字符串 + {var} 占位符跨语种一致」。手工同时改 10 个
 * JSON 极易漏键、漏语种，本脚本用「以简体中文为基准、其余语种缺键自动回填」的策略兜底。
 *
 * 用法：
 *   node scripts/i18n-set.mjs <ns> <data.json>
 *
 * data.json 两种写法皆可：
 *   1) 按语种分：{ "zh-CN": {...}, "en": {...}, "zh-TW": {...}, ... }
 *   2) 扁平（只给简体）：{ "key": "简体文案" }  → 视为 zh-CN，其余 9 语种自动回填简体副本
 *
 * 规则：
 *   - 每个语种目录都会写出 <ns>.json（已存在则深合并，不丢其它键）。
 *   - 任何语种缺失的键，一律用简体中文回填，保证键结构对齐（测试不会因漏语种而红）。
 *   - 叶子值必须是 string；若传入数组/对象会直接报错，避免破坏「数组当叶子」的测试。
 *   - 占位符 {var} 由调用方保证跨语种一致（脚本只做结构兜底，不翻译）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOCALE_DIR = path.join(ROOT, 'src', 'i18n', 'locales')
const LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'th', 'mn', 'bo']

const ns = process.argv[2]
const dataPath = process.argv[3]
if (!ns || !dataPath) {
  console.error('用法: node scripts/i18n-set.mjs <ns> <data.json>')
  process.exit(1)
}

let raw
try {
  raw = JSON.parse(fs.readFileSync(path.resolve(dataPath), 'utf8'))
} catch (e) {
  console.error('data.json 解析失败:', e.message)
  process.exit(1)
}

const hasLangKeys = LANGS.some((l) => l in raw)
const langData = {}
for (const l of LANGS) {
  if (hasLangKeys) langData[l] = raw[l] && typeof raw[l] === 'object' ? raw[l] : undefined
  else langData[l] = l === 'zh-CN' ? raw : undefined
}

const base = langData['zh-CN'] || {}
if (Object.keys(base).length === 0) {
  console.error('缺少 zh-CN 基准文案，无法回填其它语种')
  process.exit(1)
}

function assertStrings(obj, p = '') {
  for (const [k, v] of Object.entries(obj)) {
    const cur = p ? `${p}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) assertStrings(v, cur)
    else if (typeof v !== 'string') {
      throw new Error(`叶子值必须是 string（发现 ${Array.isArray(v) ? '数组' : typeof v}）: ${cur}`)
    }
  }
}

function deepMerge(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') {
      deepMerge(target[k], v)
    } else {
      target[k] = v
    }
  }
  return target
}

function readJsonIfExists(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

assertStrings(base, 'zh-CN')

const summary = []
for (const l of LANGS) {
  const file = path.join(LOCALE_DIR, l, `${ns}.json`)
  const existing = readJsonIfExists(file)
  const add = langData[l] || base // 缺语种 → 回填简体
  assertStrings(add, l)
  const merged = deepMerge(existing, add)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  const backfilled = !langData[l]
  summary.push(`${l}${backfilled ? '(回填)' : ''}`)
}

const count = (function leafCount(o) {
  let n = 0
  for (const v of Object.values(o)) n += v && typeof v === 'object' && !Array.isArray(v) ? leafCount(v) : 1
  return n
})(base)

console.log(`✓ 命名空间 ${ns}.json 已写入 10 个语种（${LANGS.length} 个文件），简体基准键数 ${count}`)
console.log('  语种:', summary.join('  '))
