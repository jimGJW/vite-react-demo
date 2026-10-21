/**
 * Motion · animate.css 纯逻辑单测（零依赖）
 * 覆盖 src/motion/animate/effects.js。
 *
 * 为什么值得单测：效果清单 / 速度映射 / 类名组合是 <Animate> 组件的「单一真源」，
 * 抽成纯逻辑后既被组件复用，也在此钉死不变量 —— 任何「效果分类被改坏 /
 * 跨类重复 / 速度档位映射错位 / 越界 repeat 误进类名」都会在 CI 红。
 */
import { eq, length, ok, deepEq } from './harness.mjs'
import {
  ANIMATE_EFFECTS,
  ALL_ANIMATE_EFFECTS,
  SPEED_CLASS,
  buildAnimateClasses,
} from '../../src/motion/animate/effects.js'

export default [
  ['效果分类固定为 4 类', () => {
    const keys = Object.keys(ANIMATE_EFFECTS).sort()
    deepEq(keys, ['attention', 'entrance', 'exit', 'special'])
  }],

  ['每个分类都是非空字符串数组', () => {
    for (const k of Object.keys(ANIMATE_EFFECTS)) {
      const arr = ANIMATE_EFFECTS[k]
      ok(Array.isArray(arr) && arr.length > 0, `${k} 应为非空数组`)
      for (const e of arr) eq(typeof e, 'string')
    }
  }],

  ['效果名跨分类 / 分类内无重复', () => {
    const seen = new Map()
    for (const [cat, arr] of Object.entries(ANIMATE_EFFECTS)) {
      for (const e of arr) {
        ok(!seen.has(e), `效果 ${e} 在 ${seen.get(e)} 与 ${cat} 重复`)
        seen.set(e, cat)
      }
    }
    // 平铺数组无重复（与上面等价，双保险）
    eq(new Set(ALL_ANIMATE_EFFECTS).size, ALL_ANIMATE_EFFECTS.length)
  }],

  ['SPEED_CLASS 仅 4 档且映射正确', () => {
    const keys = Object.keys(SPEED_CLASS).sort()
    deepEq(keys, ['fast', 'faster', 'slow', 'slower'])
    eq(SPEED_CLASS.slow, 'animate__slow')
    eq(SPEED_CLASS.slower, 'animate__slower')
    eq(SPEED_CLASS.fast, 'animate__fast')
    eq(SPEED_CLASS.faster, 'animate__faster')
  }],

  ['buildAnimateClasses 默认仅含 animated + 默认名', () => {
    deepEq(buildAnimateClasses(), ['animate__animated', 'animate__fadeIn'])
  }],

  ['buildAnimateClasses 自定义 name 进入类名', () => {
    const c = buildAnimateClasses({ name: 'zoomIn' })
    ok(c.includes('animate__zoomIn'))
    eq(c.length, 2)
  }],

  ['buildAnimateClasses 合法 speed 追加速度类', () => {
    const c = buildAnimateClasses({ name: 'fadeInUp', speed: 'fast' })
    ok(c.includes('animate__fast'))
    ok(c.includes('animate__fadeInUp'))
  }],

  ['buildAnimateClasses 非法 speed 被忽略（等于默认）', () => {
    deepEq(buildAnimateClasses({ speed: 'ultra' }), ['animate__animated', 'animate__fadeIn'])
  }],

  ['buildAnimateClasses infinite 追加循环类', () => {
    ok(buildAnimateClasses({ infinite: true }).includes('animate__infinite'))
  }],

  ['buildAnimateClasses repeat 仅在 1~3 生效、越界忽略', () => {
    ok(buildAnimateClasses({ repeat: 2 }).includes('animate__repeat-2'))
    ok(!buildAnimateClasses({ repeat: 0 }).some((x) => x.startsWith('animate__repeat')))
    ok(!buildAnimateClasses({ repeat: 4 }).some((x) => x.startsWith('animate__repeat')))
  }],
]
