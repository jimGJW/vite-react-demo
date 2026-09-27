/**
 * 性能实验室 · 纯函数单测（零依赖）
 * 覆盖 src/components/PerfLab/virtual.js 与 workerClient.js 的纯函数部分。
 * virtual.js 是虚拟滚动的核心，边界（滚到底 / 空数据 / 非法行高）必须锁死。
 */
import {
  clamp,
  computeVisibleRange,
  summarizeFrames,
  toPolylinePoints,
} from '../../src/components/PerfLab/virtual.js'
import { fib, sortHuge, crunch } from '../../src/components/PerfLab/workerClient.js'
import { eq, ok, close, length as len } from './harness.mjs'

export default [
  /* ---------- clamp ---------- */
  ['clamp 区间截断', () => {
    eq(clamp(5, 0, 10), 5, '区间内原样返回')
    eq(clamp(-1, 0, 10), 0, '低于下界取下界')
    eq(clamp(11, 0, 10), 10, '高于上界取上界')
  }],
  ['clamp 非数字回落下界', () => {
    eq(clamp(NaN, 3, 9), 3)
    eq(clamp('abc', 3, 9), 3)
    eq(clamp(undefined, 3, 9), 3)
  }],

  /* ---------- computeVisibleRange ---------- */
  ['computeVisibleRange 停在顶部', () => {
    const r = computeVisibleRange({ scrollTop: 0, viewportHeight: 100, itemHeight: 10, total: 1000, overscan: 2 })
    eq(r.start, 0, '顶部时首行为 0，overscan 不会溢出到负数')
    eq(r.end, 12, '可见 10 行 + 下方 overscan 2 行')
    eq(r.rendered, 12)
    eq(r.padTop, 0)
    eq(r.padBottom, 9880)
    eq(r.totalHeight, 10000)
  }],
  ['computeVisibleRange 滚到中间', () => {
    const r = computeVisibleRange({ scrollTop: 5000, viewportHeight: 100, itemHeight: 10, total: 1000, overscan: 2 })
    eq(r.start, 498, '上方多留 2 行缓冲')
    eq(r.end, 512, '下方多留 2 行缓冲')
    eq(r.rendered, 14)
    eq(r.padTop, 4980)
    eq(r.padBottom, 4880)
  }],
  ['computeVisibleRange 滚到底部不越界', () => {
    const r = computeVisibleRange({ scrollTop: 9999, viewportHeight: 100, itemHeight: 10, total: 1000, overscan: 2 })
    eq(r.end, 1000, 'end 最多到 total')
    eq(r.padBottom, 0, '底部无剩余占位')
    ok(r.start < 1000, 'start 不能等于 total')
    eq(r.padTop + r.rendered * 10 + r.padBottom, r.totalHeight, '占位 + 内容必须等于总高度')
  }],
  ['computeVisibleRange 三段占位始终等于总高度', () => {
    const cases = [0, 137, 2500, 9999]
    cases.forEach((top) => {
      const r = computeVisibleRange({ scrollTop: top, viewportHeight: 100, itemHeight: 10, total: 1000, overscan: 3 })
      eq(r.padTop + r.rendered * 10 + r.padBottom, r.totalHeight, `scrollTop=${top} 时高度守恒`)
    })
  }],
  ['computeVisibleRange overscan=0 时不留缓冲', () => {
    const r = computeVisibleRange({ scrollTop: 300, viewportHeight: 100, itemHeight: 10, total: 1000, overscan: 0 })
    eq(r.start, 30)
    eq(r.end, 40)
    eq(r.rendered, 10)
  }],
  ['computeVisibleRange 空数据返回全零', () => {
    const r = computeVisibleRange({ scrollTop: 0, viewportHeight: 300, itemHeight: 30, total: 0 })
    eq(r.start, 0)
    eq(r.end, 0)
    eq(r.rendered, 0)
    eq(r.totalHeight, 0)
    eq(r.padTop, 0)
    eq(r.padBottom, 0)
  }],
  ['computeVisibleRange 非法行高兜底为 1', () => {
    const r = computeVisibleRange({ scrollTop: 0, viewportHeight: 10, itemHeight: 0, total: 10, overscan: 0 })
    eq(r.totalHeight, 10, '行高被兜底成 1，不能算出 0 高度')
    eq(r.rendered, 10)
  }],
  ['computeVisibleRange 数据量少于视口时全部渲染', () => {
    const r = computeVisibleRange({ scrollTop: 0, viewportHeight: 1000, itemHeight: 10, total: 3, overscan: 2 })
    eq(r.start, 0)
    eq(r.end, 3, 'end 被 total 截断')
    eq(r.rendered, 3)
    eq(r.padBottom, 0)
  }],
  ['computeVisibleRange 缺省参数不崩', () => {
    const r = computeVisibleRange()
    eq(r.rendered, 0)
    eq(r.totalHeight, 0)
  }],

  /* ---------- summarizeFrames ---------- */
  ['summarizeFrames 空输入全零', () => {
    const s = summarizeFrames([])
    eq(s.frames, 0)
    eq(s.avgFps, 0)
    eq(s.jank, 0)
    eq(s.worstFrame, 0)
  }],
  ['summarizeFrames 恒定 16.67ms 约等于 60fps', () => {
    const s = summarizeFrames(new Array(10).fill(16.67))
    close(s.avgFps, 60, 0.5)
    close(s.maxFps, 60, 0.5)
    close(s.minFps, 60, 0.5)
    eq(s.jank, 0, '没有超过两帧预算的帧')
  }],
  ['summarizeFrames 识别掉帧', () => {
    const s = summarizeFrames([16.67, 100])
    eq(s.frames, 2)
    close(s.maxFps, 60, 0.5)
    close(s.minFps, 10, 0.5)
    eq(s.jank, 1, '100ms 远超 33ms 预算，计一次掉帧')
    close(s.jankRatio, 50, 0.5)
    eq(s.worstFrame, 100)
  }],
  ['summarizeFrames 过滤非法值', () => {
    const s = summarizeFrames([16.67, 0, -5, NaN, null, 20])
    eq(s.frames, 2, '只保留正数有限值')
  }],
  ['summarizeFrames 非数组输入不崩', () => {
    eq(summarizeFrames(undefined).frames, 0)
    eq(summarizeFrames(null).frames, 0)
  }],

  /* ---------- toPolylinePoints ---------- */
  ['toPolylinePoints 空序列返回空串', () => {
    eq(toPolylinePoints([], { width: 200, height: 50 }), '')
    eq(toPolylinePoints(null), '')
  }],
  ['toPolylinePoints 按满帧比例换算坐标', () => {
    const p = toPolylinePoints([60, 30, 0], { width: 200, height: 50 }, 60)
    eq(p, '0,0 100,25 200,50', '60fps 顶格、30fps 居中、0fps 贴底')
  }],
  ['toPolylinePoints 超出上限被夹到顶格', () => {
    const p = toPolylinePoints([120, 60], { width: 100, height: 50 }, 60)
    eq(p, '0,0 100,0', '120fps 与 60fps 都贴顶，不画到画布外')
  }],
  ['toPolylinePoints 单点不除零', () => {
    eq(toPolylinePoints([30], { width: 200, height: 50 }, 60), '0,25')
  }],

  /* ---------- workerClient 纯函数 ---------- */
  ['fib 基础值正确', () => {
    eq(fib(0), 0)
    eq(fib(1), 1)
    eq(fib(2), 1)
    eq(fib(10), 55)
    eq(fib(20), 6765)
  }],
  ['sortHuge 返回数组长度', () => {
    eq(sortHuge(1), 1)
    eq(sortHuge(500), 500)
    eq(sortHuge(0), 1, '0 被兜底成 1，不能生成空数组')
  }],
  ['crunch 组合两个负载并返回凭证', () => {
    const r = crunch({ n: 10, size: 20 })
    eq(r.a, 55, 'fib(10)')
    eq(r.b, 20, 'sortHuge(20)')
  }],
  ['crunch 缺省参数可跑', () => {
    const r = crunch()
    ok(r.a > 0)
    eq(r.b, 200000)
  }],
  ['crunch 结果可跨线程比对（主线程与 Worker 同源）', () => {
    // 同一个纯函数在主线程与 Worker 里跑出的结果必须一致，否则对照实验无意义
    const a = crunch({ n: 15, size: 100 })
    const b = crunch({ n: 15, size: 100 })
    eq(a.a, b.a)
    eq(a.b, b.b)
  }],
]
