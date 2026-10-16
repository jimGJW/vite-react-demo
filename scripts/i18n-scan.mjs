#!/usr/bin/env node
/**
 * i18n 迁移进度扫描：列出 src 下仍硬编码中文（未走 t()）的文件与行数。
 *
 * 用途：全量文案迁移是逐页推进的，这个脚本回答「还剩下哪些页面没接」。
 *   node scripts/i18n-scan.mjs            # 全量汇总 + Top 20
 *   node scripts/i18n-scan.mjs AstroBoard # 只看某个目录/文件
 *
 * 判定口径（两个都要看）：
 *   UI 行  —— 剥掉块注释/行注释后仍含 CJK 的源码行，即用户可见文案，迁移的唯一目标
 *   注释行 —— 只在注释里出现中文，不是文案，无需处理
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')
const filter = process.argv[2] || ''

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (/\.(jsx?|mjs)$/.test(e.name)) out.push(p)
  }
  return out
}

/** 剥掉块注释与行注释（粗略但足够统计；URL 后的 // 不当注释） */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

const rows = []
for (const f of walk(SRC)) {
  const rel = path.relative(ROOT, f)
  if (filter && !rel.includes(filter)) continue
  const raw = fs.readFileSync(f, 'utf8').split('\n')
  const ui = stripComments(raw.join('\n')).split('\n').filter((l) => CJK.test(l)).length
  const cmt = raw.length && raw.filter((l) => CJK.test(l)).length - ui
  if (ui > 0) rows.push({ file: rel, ui, cmt })
}

rows.sort((a, b) => b.ui - a.ui)
const totalUi = rows.reduce((s, r) => s + r.ui, 0)
const totalCmt = rows.reduce((s, r) => s + r.cmt, 0)

console.log(`\ni18n 迁移进度：${rows.length} 个文件仍有用户可见中文文案，共 ${totalUi} 行（另有 ${totalCmt} 行注释中文，无需处理）\n`)
console.log('UI行  注释行  文件')
console.log('────  ─────  ──────────────────────────────────────────────')
for (const r of rows.slice(0, 20)) {
  console.log(String(r.ui).padStart(4) + '  ' + String(r.cmt).padStart(4) + '   ' + r.file)
}
if (rows.length > 20) console.log(`… 其余 ${rows.length - 20} 个文件见完整列表（去掉 filter 无参数运行）`)

/* 按目录聚合，看「哪个模块还没开工」 */
const byDir = {}
for (const r of rows) {
  const dir = path.dirname(r.file)
  byDir[dir] = (byDir[dir] || 0) + r.ui
}
console.log('\n按目录聚合（UI 行数）:')
for (const [dir, n] of Object.entries(byDir).sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(String(n).padStart(4) + '  ' + dir)
}
console.log('')
