/**
 * 把「中文原文 → 译文」的映射批写进 src/i18n/locales/<lang>/*.json。
 *
 * ── 配套流程 ───────────────────────────────────────────
 *   1. node scripts/i18n-audit.mjs --snapshot                    建立 zh-CN 基准
 *   2. LANGS=de node scripts/i18n-audit.mjs --dump               导出待译清单
 *   3. 按清单产出译文，写成若干个 [<中文>, <译文>] 二元组数组文件：
 *        ${MAP_DIR}/<lang>-map-01.json、<lang>-map-02.json …
 *   4. LANG=de node scripts/i18n-apply.mjs --dry                 预演
 *   5. LANG=de node scripts/i18n-apply.mjs                       写入
 *   6. LANGS=de node scripts/i18n-audit.mjs                      确认真漏译归零
 *   7. 把该语种加进 tests/unit/i18n.test.mjs 的 STRICT 名单，锁死不再退化
 *
 * ── 三重安全约束 ───────────────────────────────────────
 *   1. 只替换「值与 zh-CN 完全相同」的叶子：已翻译过的条目一律不动，
 *      即便它也在映射表里 —— 保护人工改过的译文。
 *   2. 替换前校验 {占位符} 集合与 zh-CN 一致，不一致就跳过并报错，
 *      免得 "{n} 条" 被译成别的东西导致运行时插值失效。
 *   3. 保持 2 空格缩进 + 结尾换行，与原文件一致，不制造格式噪音。
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const LANG = process.env.LANG || 'en'
const DRY = process.argv.includes('--dry')
const BASE = path.join(process.cwd(), 'src/i18n/locales')
const MAP_DIR = process.env.MAP_DIR || os.tmpdir()

const mapFiles = fs
  .readdirSync(MAP_DIR)
  .filter((f) => f.startsWith(`${LANG}-map-`) && f.endsWith('.json'))
  .sort()
if (!mapFiles.length) {
  console.error(`找不到映射文件：${MAP_DIR}/${LANG}-map-*.json`)
  process.exit(1)
}

const MAP = new Map()
for (const f of mapFiles) {
  for (const pair of JSON.parse(fs.readFileSync(path.join(MAP_DIR, f), 'utf8'))) {
    MAP.set(pair[0], pair[1])
  }
}
console.log(`映射表: ${mapFiles.length} 个文件 / ${MAP.size} 条`)

const varsOf = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(',')

/** 递归替换；返回被替换的叶子数量 */
function apply(objZh, objLang, trace = '') {
  let n = 0
  for (const [k, zh] of Object.entries(objZh)) {
    const p = trace ? `${trace}.${k}` : k
    if (zh && typeof zh === 'object' && !Array.isArray(zh)) {
      n += apply(zh, objLang[k] ?? {}, p)
      continue
    }
    const cur = objLang[k]
    if (cur !== zh) continue // 已翻译过，保护它
    const out = MAP.get(zh)
    if (!out) continue
    if (varsOf(out) !== varsOf(zh)) {
      console.error(`占位符不匹配，已跳过: ${p}\n  zh: ${zh}\n  ${LANG}: ${out}`)
      continue
    }
    objLang[k] = out
    n++
  }
  return n
}

const nsFiles = fs.readdirSync(path.join(BASE, 'zh-CN')).filter((f) => f.endsWith('.json'))
let total = 0
let touched = 0
for (const ns of nsFiles) {
  const zh = JSON.parse(fs.readFileSync(path.join(BASE, 'zh-CN', ns), 'utf8'))
  const file = path.join(BASE, LANG, ns)
  const lang = JSON.parse(fs.readFileSync(file, 'utf8'))
  const n = apply(zh, lang)
  if (n > 0) {
    total += n
    touched++
    if (!DRY) fs.writeFileSync(file, JSON.stringify(lang, null, 2) + '\n')
  }
}
console.log(`${DRY ? '预演' : '已写入'}: ${touched} 个文件 / ${total} 处替换`)
