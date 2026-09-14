#!/usr/bin/env node
/**
 * 零依赖单元测试 runner（不需要 vitest / jest）
 *
 * 自动发现 tests/unit/*.test.mjs，每个文件 default 导出：
 *   [ [用例名, async () => { ...断言... }], ... ]
 *
 * 用法：
 *   npm test                 # 全部
 *   node scripts/run-tests.mjs utils   # 只跑文件名包含 utils 的
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIR = path.join(ROOT, 'tests', 'unit')

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m',
  green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m',
}

const filter = process.argv[2] || ''

function discover() {
  if (!fs.existsSync(DIR)) return []
  return fs.readdirSync(DIR)
    .filter((f) => f.endsWith('.test.mjs'))
    .filter((f) => !filter || f.includes(filter))
    .sort()
}

async function runFile(file) {
  const mod = await import(pathToFileURL(path.join(DIR, file)).href)
  const cases = mod.default
  if (!Array.isArray(cases)) {
    throw new Error(`${file} 需 default 导出用例数组`)
  }
  const results = []
  for (const [name, fn] of cases) {
    const started = Date.now()
    try {
      await fn()
      results.push({ name, pass: true, ms: Date.now() - started })
    } catch (e) {
      results.push({ name, pass: false, ms: Date.now() - started, error: e })
    }
  }
  return results
}

async function main() {
  const files = discover()
  if (!files.length) {
    console.log(`${C.yellow}未发现测试用例${C.reset}（tests/unit/*.test.mjs）`)
    process.exit(0)
  }

  console.log(`\n${C.bold}${C.cyan}▶ 单元测试${C.reset} ${C.dim}(零依赖 node runner)${C.reset}\n`)

  let total = 0
  let passed = 0
  const failures = []
  const t0 = Date.now()

  for (const file of files) {
    let results
    try {
      results = await runFile(file)
    } catch (e) {
      console.log(`${C.red}✗ ${file}${C.reset} 加载失败: ${e.message}`)
      failures.push({ file, name: '(加载)', error: e })
      continue
    }
    const filePass = results.filter((r) => r.pass).length
    total += results.length
    passed += filePass
    const bad = results.length - filePass
    const tag = bad ? `${C.red}✗${C.reset}` : `${C.green}✓${C.reset}`
    console.log(`${tag} ${C.bold}${file}${C.reset} ${C.dim}${filePass}/${results.length}${C.reset}`)
    results.filter((r) => !r.pass).forEach((r) => {
      failures.push({ file, name: r.name, error: r.error })
      console.log(`   ${C.red}✗${C.reset} ${r.name}`)
      console.log(`     ${C.dim}${C.red}${r.error?.message}${C.reset}`)
    })
  }

  const ms = Date.now() - t0
  console.log(`\n${C.bold}结果${C.reset}: ${passed}/${total} 通过 ${C.dim}(${ms}ms)${C.reset}`)
  if (failures.length) {
    console.log(`${C.red}${failures.length} 个用例失败${C.reset}`)
    process.exit(1)
  }
  console.log(`${C.green}全部通过${C.reset}\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
