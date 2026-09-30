#!/usr/bin/env node
/**
 * 把 `src/creative/`（工具层 + 7 个分组目录）整体镜像到两个子应用。
 *
 * 为什么用生成而不是各写一份
 * --------------------------
 * 全部创意 demo 是纯 canvas 的「算法 + 逐帧绘制」，跟框架无关。
 * 三份手写拷贝必然会漂移（改了一处忘了另两处），所以只维护一份真相，
 * 另外两份由本脚本生成，并在每个文件头打上「自动生成」的横幅。
 *
 * 两个目标的差别
 * --------------
 *   vue-app     → 原样复制（.js）
 *   angular-app → 改后缀为 .ts，并把相对 import 里的 `.js` 去掉
 *
 * 为什么要去掉 `.js`：TypeScript 的 `moduleResolution: bundler` 允许 `.ts` 文件里写
 * `./foo.js`（会映射到 foo.ts），但 **打包器不会** —— Angular 走 esbuild，
 * `./foo.js` 会真的去找 foo.js 然后找不到。写成不带后缀的 `./foo`，tsc 和 esbuild 都能解。
 *
 * 用法
 *   npm run sync:demos                             写入两份拷贝
 *   node scripts/sync-creative-demos.mjs --check   只比对，不一致则 exit 1（给 CI / 单测用）
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs'
import { dirname, resolve, relative, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = resolve(ROOT, 'src/creative')

const TARGETS = [
  { dir: 'micro-apps/vue-app/src/creative', ext: 'js' },
  { dir: 'micro-apps/angular-app/src/creative', ext: 'ts' },
]

const BANNER = (ext) => `/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 \`npm run sync:demos\`。
 */
${ext === 'ts' ? '/* eslint-disable */\n' : ''}`

/** 递归收集目录下的 .js 文件，返回相对 SRC_DIR 的 posix 路径 */
const walk = (dir, base = '') => {
  const out = []
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    const rel = base ? `${base}/${name}` : name
    if (statSync(abs).isDirectory()) out.push(...walk(abs, rel))
    else if (name.endsWith('.js')) out.push(rel)
  }
  return out
}

/** 把相对 import 的 `.js` 后缀去掉 —— 只有 Angular 目标需要（见文件头说明） */
const stripJsExt = (code) => code
  .replace(/(\bfrom\s*['"])(\.\.?\/[^'"]*?)\.js(['"])/g, '$1$2$3')
  .replace(/(\bimport\s*['"])(\.\.?\/[^'"]*?)\.js(['"])/g, '$1$2$3')

const check = process.argv.includes('--check')
const relRoot = (p) => p.replace(`${ROOT}/`, '')
const files = walk(SRC_DIR)

let drifted = 0
let wrote = 0
let removed = 0

for (const target of TARGETS) {
  const outDir = resolve(ROOT, target.dir)
  const expected = new Map()

  for (const rel of files) {
    const src = readFileSync(join(SRC_DIR, rel), 'utf8')
    const body = target.ext === 'ts' ? stripJsExt(src) : src
    const outRel = rel.replace(/\.js$/, `.${target.ext}`)
    expected.set(outRel, BANNER(target.ext) + body)
  }

  if (check) {
    for (const [outRel, want] of expected) {
      const abs = resolve(outDir, outRel)
      if (!existsSync(abs) || readFileSync(abs, 'utf8') !== want) {
        drifted += 1
        console.error(`✗ 与源文件不一致：${relRoot(abs)}`)
      }
    }
    /* 多余的文件也算漂移：说明源目录里删了东西，拷贝没跟上 */
    if (existsSync(outDir)) {
      for (const stale of staleFiles(outDir, expected, target.ext)) {
        drifted += 1
        console.error(`✗ 源目录已无对应文件：${relRoot(stale)}`)
      }
    }
    if (!drifted) console.log(`✓ 已同步：${target.dir}（${expected.size} 个文件）`)
    continue
  }

  mkdirSync(outDir, { recursive: true })
  for (const [outRel, want] of expected) {
    const abs = resolve(outDir, outRel)
    mkdirSync(dirname(abs), { recursive: true })
    if (existsSync(abs) && readFileSync(abs, 'utf8') === want) continue
    writeFileSync(abs, want)
    wrote += 1
  }
  for (const stale of staleFiles(outDir, expected, target.ext)) {
    rmSync(stale)
    removed += 1
    console.log(`– 清理 ${relRoot(stale)}`)
  }
  console.log(`→ ${relRoot(outDir)}：${expected.size} 个文件`)
}

/** 目标目录里「源目录已经没有」的文件 —— 包括旧的单文件 demos.js / demos.ts */
function staleFiles(outDir, expected, ext) {
  if (!existsSync(outDir)) return []
  const keep = new Set(expected.keys())
  const out = []
  const scan = (dir) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name)
      if (statSync(abs).isDirectory()) {
        scan(abs)
        continue
      }
      if (!name.endsWith(`.${ext}`)) continue
      if (keep.has(relative(outDir, abs))) continue
      out.push(abs)
    }
  }
  scan(outDir)
  return out
}

if (check) {
  if (drifted) {
    console.error(`\n${drifted} 处漂移，跑 \`npm run sync:demos\` 重新生成。`)
    process.exit(1)
  }
  console.log(`\n全部 ${TARGETS.length} 份拷贝与源目录一致（共 ${files.length} 个源文件）。`)
} else {
  console.log(`\n完成：源 ${relRoot(SRC_DIR)} → 写入 ${wrote} 个文件、清理 ${removed} 个，共 ${files.length} 个源。`)
}
