/**
 * i18n 十语种完整性体检 —— 找出「键结构对齐但内容没翻译」的条目。
 *
 * ── 为什么需要它 ────────────────────────────────────────
 * tests/unit/i18n.test.mjs 只钉住了「各语种键结构一致」和「非空」。
 * 于是历史上出现过这样的局面：把 zh-CN 原文整体复制到另外 9 个语种，
 * 3261 个键一个不缺、全都非空，所有断言全绿 —— 但界面上显示的还是中文。
 * 本脚本专查这类「结构完美、内容没翻译」的退化。
 *
 * ── 查什么 ─────────────────────────────────────────────
 *   缺文件 / 缺键 / 多余键 / 空值或非字符串 / 与 zh-CN 逐字相同 / 其中含汉字（真漏译）
 *
 * ── 用法 ───────────────────────────────────────────────
 *   node scripts/i18n-audit.mjs --snapshot              # 建立 zh-CN 基准缓存
 *   LANGS=en node scripts/i18n-audit.mjs                # 体检指定语种（逗号分隔）
 *   LANGS=ja node scripts/i18n-audit.mjs --dump         # 导出待译清单到 /tmp/pending-*.json
 *   LANGS=en node scripts/i18n-audit.mjs --detail       # 打印缺键/空值明细
 *
 * 说明：一次只跑少量语种是刻意的 —— 全量读取 locales（10 语种 × 43 文件）
 * 在受限环境里会被资源限制杀掉，分批跑才稳。
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const BASE = path.join(process.cwd(), 'src/i18n/locales')
const SNAPSHOT = path.join(os.tmpdir(), 'i18n-baseline.json')
const MAP_DIR = process.env.MAP_DIR || os.tmpdir()
const LANGS = (process.env.LANGS || 'zh-CN').split(',').filter(Boolean)
const DETAIL = process.argv.includes('--detail')

/** 嵌套 JSON 扁平化成 'a.b.c' -> value */
function flatten(obj, prefix = '', acc = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, acc)
    else acc[p] = v
  }
  return acc
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    return { __parseError: e.message }
  }
}

/** --snapshot: 把 zh-CN 的键值落成缓存，后续调用不再重复读这 43 个文件 */
if (process.argv.includes('--snapshot')) {
  const nsFiles = fs.readdirSync(path.join(BASE, 'zh-CN')).filter((f) => f.endsWith('.json'))
  const snap = {}
  for (const ns of nsFiles) snap[ns] = flatten(readJson(path.join(BASE, 'zh-CN', ns)))
  fs.writeFileSync(SNAPSHOT, JSON.stringify(snap))
  const total = Object.values(snap).reduce((n, o) => n + Object.keys(o).length, 0)
  console.log(`快照已生成: ${Object.keys(snap).length} 个 ns / ${total} 个键 -> ${SNAPSHOT}`)
  process.exit(0)
}

const baseline = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
const nsFiles = Object.keys(baseline)
const report = {}

for (const lang of LANGS) {
  const r = { missingFiles: [], missingKeys: [], extraKeys: [], badValues: [], same: [], sameCjk: [], total: 0 }
  for (const ns of nsFiles) {
    const file = path.join(BASE, lang, ns)
    const baseFlat = baseline[ns]
    if (!fs.existsSync(file)) {
      r.missingFiles.push(ns)
      continue
    }
    const data = readJson(file)
    if (data.__parseError) {
      r.badValues.push(`${ns}: JSON 解析失败 -> ${data.__parseError}`)
      continue
    }
    const flat = flatten(data)
    const baseKeys = Object.keys(baseFlat)
    r.total += Object.keys(flat).length
    for (const k of baseKeys) {
      if (!(k in flat)) {
        r.missingKeys.push(`${ns}:${k}`)
        continue
      }
      const v = flat[k]
      if (v === null || v === undefined || v === '') {
        r.badValues.push(`${ns}:${k} = ${JSON.stringify(v)}`)
      } else if (typeof v !== 'string') {
        r.badValues.push(`${ns}:${k} 非字符串 -> ${typeof v}`)
      } else if (lang !== 'zh-CN' && v === baseFlat[k]) {
        r.same.push(`${ns}:${k} = ${JSON.stringify(v)}`)
        // 目标语种的值里出现汉字/假名/谚文 —— 几乎必然是漏译。
        // 专有名词、数字、缩写不会触发这条，它们天然不含这些字符。
        if (/[一-鿿぀-ヿ가-힯]/.test(v)) r.sameCjk.push(`${ns}:${k} = ${JSON.stringify(v)}`)
      }
    }
    for (const k of Object.keys(flat)) if (!baseKeys.includes(k)) r.extraKeys.push(`${ns}:${k}`)
  }
  report[lang] = r
}

console.log(`基准快照: ${nsFiles.length} 个 ns`)
console.log('')
console.log('语种     键总数   缺文件  缺键   多余键  空/非法值   同原文   其中真漏译')
console.log('─'.repeat(78))
for (const lang of LANGS) {
  const r = report[lang]
  console.log(
    `${lang.padEnd(8)} ${String(r.total).padStart(6)}  ${String(r.missingFiles.length).padStart(5)}  ` +
      `${String(r.missingKeys.length).padStart(5)}  ${String(r.extraKeys.length).padStart(6)}  ` +
      `${String(r.badValues.length).padStart(8)}  ${String(r.same.length).padStart(6)}  ` +
      `${String(r.sameCjk.length).padStart(8)}`,
  )
}

if (DETAIL) {
  for (const lang of LANGS) {
    const r = report[lang]
    if (!r.missingKeys.length && !r.badValues.length && !r.missingFiles.length) continue
    console.log(`\n===== ${lang} =====`)
    if (r.missingFiles.length) console.log('  缺文件: ' + r.missingFiles.join(', '))
    if (r.missingKeys.length) {
      console.log(`  缺键 ${r.missingKeys.length} 个:`)
      for (const k of r.missingKeys.slice(0, 60)) console.log('    ' + k)
      if (r.missingKeys.length > 60) console.log(`    … 另有 ${r.missingKeys.length - 60} 个`)
    }
    if (r.badValues.length) {
      console.log(`  空/非法值 ${r.badValues.length} 个:`)
      for (const k of r.badValues.slice(0, 40)) console.log('    ' + k)
      if (r.badValues.length > 40) console.log(`    … 另有 ${r.badValues.length - 40} 个`)
    }
  }
}

/** --dump: 导出「真漏译」条目，交给 i18n-apply.mjs 消费 */
if (process.argv.includes('--dump')) {
  for (const lang of LANGS) {
    const r = report[lang]
    const items = r.sameCjk.map((line) => {
      const idx = line.indexOf(' = ')
      const p = line.slice(0, idx)
      const value = JSON.parse(line.slice(idx + 3))
      const dot = p.indexOf(':')
      return { ns: p.slice(0, dot), key: p.slice(dot + 1), zh: value }
    })
    const out = path.join(MAP_DIR, `pending-${lang}.json`)
    fs.writeFileSync(out, JSON.stringify(items))
    console.log(`${lang}: 导出 ${items.length} 条 -> ${out}`)
  }
}
