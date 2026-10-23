/**
 * 页面外壳（PageShell）契约单测
 *
 * 覆盖两类只有"跑起来看一眼"才会发现的问题：
 *  1. pageShellStyle.js 的令牌解析——命名强调色必须翻成 var(--c-*)（硬编码 hex
 *     在暗色主题下会崩），非法值必须返回 null 让 CSS 兜底，错峰序号必须钳到上限
 *     （否则 30 项列表最后一项要等 2 秒才入场）。
 *  2. JSX 与 SCSS 的类名对齐——外壳写的 pg-* / m-* 类一旦拼错，不会报错，
 *     只会得到"没有样式的裸页面"。这里逐类校验其真的在样式表里定义过。
 */
import { eq, ok, deepEq } from './harness.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ACCENT_TOKENS,
  GAP_TOKENS,
  STAGGER_MAX,
  resolveAccent,
  resolveGap,
  shellStyle,
  stagger,
  isCountable,
} from '../../src/components/PageShell/pageShellStyle.js'

const HUB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = (rel) => fs.readFileSync(path.join(HUB, rel), 'utf8')

const JSX_SRC = read('src/components/PageShell/index.jsx')
const SCSS_SRC = read('src/components/PageShell/PageShell.scss')
const MOTION_SRC = read('src/motion/motion.scss')
const TOKEN_SRC = read('src/index.scss')

/** 从源码里抓出所有出现过的某前缀类名（含 BEM 的 __ / -- 后缀） */
function usedClasses(src, prefix) {
  const re = new RegExp(`\\b(${prefix}[a-z0-9_-]+)\\b`, 'g')
  return [...new Set([...src.matchAll(re)].map((m) => m[1]))]
}

/** 某个类名是否在样式表里作为选择器片段出现过 */
function definedIn(css, cls) {
  return css.includes(`.${cls}`)
}

export default [
  ['命名强调色解析为 CSS 变量（不吃硬编码色）', () => {
    eq(resolveAccent('primary'), 'var(--c-primary)')
    eq(resolveAccent('accent'), 'var(--c-accent)')
    eq(resolveAccent('cyan'), 'var(--c-accent-2)')
    for (const name of Object.keys(ACCENT_TOKENS)) {
      ok(resolveAccent(name)?.startsWith('var('), `${name} 应解析为 var(...)`)
    }
  }],

  ['裸色值原样透传，非法写法一律拒绝', () => {
    eq(resolveAccent('#08979c'), '#08979c')
    eq(resolveAccent('rgba(8,151,156,.5)'), 'rgba(8,151,156,.5)')
    eq(resolveAccent('var(--tl-accent)'), 'var(--tl-accent)')
    // 裸单词与渐变：写进自定义属性后 var() 兜底不生效 / color-mix 整条失效
    eq(resolveAccent('red'), null)
    eq(resolveAccent('purpl'), null)
    eq(resolveAccent('linear-gradient(90deg,#fff,#000)'), null)
    eq(resolveAccent(''), null)
    eq(resolveAccent(undefined), null)
    eq(resolveAccent(123), null)
  }],

  ['间距优先命名 token，其次放行合法裸尺寸', () => {
    eq(resolveGap('xl'), 'var(--sp-xl)')
    eq(resolveGap('fluid'), 'var(--sp-fluid)')
    eq(resolveGap('20px'), '20px')
    eq(resolveGap('calc(100% - 20px)'), 'calc(100% - 20px)')
    for (const name of Object.keys(GAP_TOKENS)) {
      ok(resolveGap(name).includes(GAP_TOKENS[name]), `${name} 未映射到 ${GAP_TOKENS[name]}`)
    }
  }],

  ['未识别的间距退回默认档位，不产出 undefined', () => {
    eq(resolveGap(undefined), 'var(--sp-lg)')
    eq(resolveGap('huge'), 'var(--sp-lg)')
    eq(resolveGap('16'), 'var(--sp-lg)')      // 无单位数字不是合法长度
    eq(resolveGap('nope', 'sm'), 'var(--sp-sm)')
    const bad = shellStyle({ accent: 'nope', gap: 'nope' })
    deepEq(bad, { '--pg-gap': 'var(--sp-lg)' })
    ok(!JSON.stringify(bad).includes('undefined'), '样式对象里出现 undefined')
  }],

  ['shellStyle 只在给到有效值时注入变量', () => {
    deepEq(shellStyle({}), {})
    deepEq(shellStyle({ accent: 'warning' }), { '--pg-accent': 'var(--c-warning)' })
    deepEq(shellStyle({ accent: '#1677ff', gap: 'md' }), {
      '--pg-accent': '#1677ff',
      '--pg-gap': 'var(--sp-md)',
    })
  }],

  ['错峰序号钳到上限，非法序号归零', () => {
    eq(stagger(0)['--i'], 0)
    eq(stagger(5)['--i'], 5)
    eq(stagger(STAGGER_MAX)['--i'], STAGGER_MAX)
    eq(stagger(STAGGER_MAX + 40)['--i'], STAGGER_MAX)
    eq(stagger(-3)['--i'], 0)
    eq(stagger('7')['--i'], 7)
    eq(stagger('x')['--i'], 0)
    eq(stagger(undefined)['--i'], 0)
    eq(stagger(2.8)['--i'], 2)
  }],

  ['KPI 只对有限数跑数字滚动', () => {
    ok(isCountable(0), '0 也应当滚动（曾被当成 falsy 漏掉）')
    ok(isCountable(1234))
    eq(isCountable(NaN), false)
    eq(isCountable(Infinity), false)
    eq(isCountable('1.2k'), false)
    eq(isCountable(null), false)
    eq(isCountable(undefined), false)
  }],

  ['外壳用的 pg-* 类都在 PageShell.scss 里定义', () => {
    const missing = usedClasses(JSX_SRC, 'pg-').filter((cls) => !definedIn(SCSS_SRC, cls))
    deepEq(missing, [])
  }],

  ['外壳引用的 m-* 类都在 motion.scss 里定义', () => {
    const missing = usedClasses(JSX_SRC, 'm-').filter((cls) => !definedIn(MOTION_SRC, cls))
    deepEq(missing, [])
  }],

  ['外壳消费的 token 全部在 index.scss 声明', () => {
    const used = [...new Set([...SCSS_SRC.matchAll(/var\(\s*(--sp-[a-z0-9]+|--r-[a-z0-9]+|--sh-[a-z0-9]+|--c-[a-z0-9-]+|--t[a-z-]*)\b/g)].map((m) => m[1]))]
    const missing = used.filter((t) => !TOKEN_SRC.includes(`${t}:`))
    ok(used.length > 8, `只抓到 ${used.length} 个 token，正则可能失效`)
    deepEq(missing, [])
  }],

  ['丰富档动效类与减少动效守卫同时存在', () => {
    const rich = ['m-blur-in', 'm-drop-in', 'm-lift-in', 'm-tilt', 'm-glow', 'm-grad-border', 'm-aurora', 'm-parallax', 'm-ken-burns', 'm-hover-lift']
    for (const cls of rich) ok(definedIn(MOTION_SRC, cls), `缺少丰富档工具类 ${cls}`)
    const guard = MOTION_SRC.slice(MOTION_SRC.lastIndexOf('@media (prefers-reduced-motion: reduce)'))
    for (const cls of rich) {
      ok(guard.includes(`.${cls}`), `${cls} 没有 reduced-motion 兜底`)
    }
  }],
]
