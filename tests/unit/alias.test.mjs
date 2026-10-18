/**
 * 别名体系的回归守卫。
 *
 * ── 为什么值得为几条 import 路径写测试 ──────────────────────
 * 别名同时存在于 vite.config.js / tsconfig.json / scripts/aliases.mjs 三处，
 * 任一处漏改的表现都很隐蔽：编辑器跳转正常、跑 examples 也正常，
 * 但换一条链路（比如 npm test 的纯 Node 加载）就炸 ERR_MODULE_NOT_FOUND。
 * 这里把「三处必须同源」钉成断言，而不是靠人记得同步。
 *
 * ── 另一类被守住的坏味道 ────────────────────────────────────
 * 最后一条用例规定 src/ 下（creative 除外）不允许再出现 ../../../ 这类
 * 随层级膨胀的相对路径 —— 存量已全量迁移，这里防止它悄悄长回来。
 */
import { eq, ok, deepEq } from './harness.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALIAS_TARGETS, ROOT, TSCONFIG_PATHS, VITE_ALIAS, resolveAliasPath } from '../../scripts/aliases.mjs'

const HUB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC_EXT = ['.js', '.jsx', '.ts', '.tsx']

/** 递归收集目录下指定扩展名的文件，跳过 node_modules 与必须保持相对路径的 creative */
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (SRC_EXT.includes(path.extname(entry.name))) acc.push(full)
  }
  return acc
}

export default [
  ['ROOT 指向项目根', () => {
    eq(ROOT, HUB)
    ok(fs.existsSync(path.join(ROOT, 'package.json')), 'ROOT 下找不到 package.json')
  }],

  ['每个别名指向的目标目录真实存在', () => {
    for (const [key, rel] of Object.entries(ALIAS_TARGETS)) {
      ok(fs.existsSync(path.join(ROOT, rel)), `别名 ${key} 的目标 ${rel} 不存在`)
    }
  }],

  ['tsconfig paths 与别名表逐项一致（防三处配置漂移）', () => {
    const ts = JSON.parse(fs.readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf8'))
    deepEq(ts.compilerOptions.paths, TSCONFIG_PATHS)
  }],

  ['vite.config.js 从 aliases.mjs 取别名，而非重新硬编码', () => {
    const src = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf8')
    ok(src.includes("from './scripts/aliases.mjs'"), 'vite.config.js 未引入 aliases.mjs')
    ok(src.includes('...VITE_ALIAS'), 'vite.config.js 未展开 VITE_ALIAS')
    for (const key of Object.keys(ALIAS_TARGETS)) {
      ok(key in VITE_ALIAS, `VITE_ALIAS 缺少 ${key}`)
    }
  }],

  ['短别名不会吃掉长别名（@ 与 @i18n 可共存）', () => {
    eq(resolveAliasPath('@i18n'), path.join(ROOT, 'src', 'i18n'))
    eq(resolveAliasPath('@/i18n/index.js'), path.join(ROOT, 'src', 'i18n', 'index.js'))
    eq(resolveAliasPath('@components/Clock.jsx'), path.join(ROOT, 'src', 'components', 'Clock.jsx'))
    eq(resolveAliasPath('@lib/earth/glossary.js'), path.join(ROOT, 'src', 'lib', 'earth', 'glossary.js'))
    eq(resolveAliasPath('@root/tests/test_pages.py'), path.join(ROOT, 'tests', 'test_pages.py'))
    // 非别名必须原样放行
    eq(resolveAliasPath('react'), null)
    eq(resolveAliasPath('node:fs'), null)
    eq(resolveAliasPath('./helper.js'), null)
    eq(resolveAliasPath('@myorg/react-svg-charts'), null)
  }],

  ['src 下不得再出现两层以上的相对引用（creative 例外）', () => {
    const deepJunk = []
    for (const file of walk(path.join(ROOT, 'src'))) {
      if (file.includes(`${path.sep}creative${path.sep}`)) continue
      const text = fs.readFileSync(file, 'utf8')
      for (const line of text.split('\n')) {
        if (/^\s*(import|export)\b.*from\s+['"](\.\.\/){2,}/.test(line) ||
            /^\s*import\s+['"](\.\.\/){2,}/.test(line)) {
          deepJunk.push(`${path.relative(ROOT, file)}: ${line.trim()}`)
        }
      }
    }
    deepEq(deepJunk, [])
  }],
]
