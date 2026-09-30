/**
 * 创意 demo 合集测试（纯 node，无需浏览器）
 *
 * demos.js 是零依赖的纯 canvas 模块 —— 所以可以用一个假 2D context 直接把全部 82 个 demo
 * 真的跑起来几十帧，抓「一跑就抛」这类只有运行时才暴露的问题。
 * 这类断言的价值在于：这些 demo 全是逐帧数值循环，写错一个下标在 tsc / lint 阶段完全看不出来。
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEMOS, DEMO_GROUPS } from '../../src/creative/index.js'
import { eq, length, notEq, ok } from './harness.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/* ==================== 假 canvas ==================== */

function makeCtx(canvas) {
  return {
    canvas,
    /* 可读写的绘制状态：随便取值，只要求能赋值能读 */
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    lineDashOffset: 0,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    filter: 'none',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'inherit',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low',
    /* 状态栈 */
    save() {},
    restore() {},
    /* 变换 */
    translate() {},
    rotate() {},
    scale() {},
    transform() {},
    setTransform() {},
    resetTransform() {},
    /* 路径 —— 真实 2D context 的方法面，缺一个都会让「跑 20 帧」变成假失败 */
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    arcTo() {},
    ellipse() {},
    rect() {},
    roundRect() {},
    quadraticCurveTo() {},
    bezierCurveTo() {},
    clip() {},
    /* 绘制 */
    fill() {},
    stroke() {},
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    fillText() {},
    strokeText() {},
    setLineDash() {},
    getLineDash: () => [],
    drawImage() {},
    putImageData() {},
    createRadialGradient: () => ({ addColorStop() {} }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createConicGradient: () => ({ addColorStop() {} }),
    createPattern: () => null,
    measureText: (t) => ({ width: String(t).length * 6 }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
  }
}

function makeCanvas() {
  const canvas = { width: 0, height: 0 }
  canvas.getContext = () => makeCtx(canvas)
  return canvas
}

/* 逐像素 / 离屏合成的 demo 会 createElement('canvas') 拿缓冲，这里给它一个假的 */
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { createElement: () => makeCanvas() }
}

const W = 64
const H = 40

/** 把一个 demo 真的跑起来：resize → 若干帧 → 各类指针事件 → 参数 → 动作 → 清理 */
function exercise(demo) {
  const ctx = makeCtx(makeCanvas())
  const inst = demo.create(ctx)
  inst.resize(W, H)
  for (let i = 0; i < 8; i += 1) inst.frame(1000 + i * 16, 1 / 60)
  inst.pointer('move', W / 2, H / 2)
  inst.pointer('down', W / 2, H / 2)
  inst.pointer('move', W / 2 + 5, H / 2 + 3)
  inst.pointer('up', W / 2 + 5, H / 2 + 3)
  inst.pointer('leave', 0, 0)
  for (const p of demo.params) inst.setParam(p.key, p.value)
  for (const a of demo.actions) inst.action(a.key)
  /* 再跑几帧：很多 demo 的 action 是「换状态」，错误往往要下一帧才暴露 */
  for (let i = 8; i < 16; i += 1) inst.frame(1000 + i * 16, 1 / 60)
  inst.resize(W * 2, H * 2)
  for (let i = 16; i < 20; i += 1) inst.frame(1000 + i * 16, 1 / 60)
  inst.destroy()
  return inst
}

const CASES = [
  ['demo 数量恰为 82 个且 id 唯一', () => {
    eq(DEMOS.length, 82, `demo 数量应为 82，实际 ${DEMOS.length} 个`)
    const ids = DEMOS.map((d) => d.id)
    eq(new Set(ids).size, ids.length, 'demo id 有重复')
  }],

  ['分组表恰好铺满 DEMOS（连续、不重叠、不漏项）', () => {
    let cursor = 0
    for (const g of DEMO_GROUPS) {
      ok(typeof g.label === 'string' && g.label, '分组缺 label')
      ok(typeof g.hint === 'string' && g.hint, `${g.label} 缺 hint`)
      /* 分组是「连续区间」，所以每组起点必须紧接上一组终点 ——
         写错一个下标，页面上就会出现整组被错标（而这在浏览器里很难一眼看出来） */
      eq(g.from, cursor, `${g.label} 的起点应为 ${cursor}，实际 ${g.from}`)
      ok(g.to >= g.from, `${g.label} 的区间非法：${g.from}~${g.to}`)
      cursor = g.to + 1
    }
    eq(cursor, DEMOS.length, `分组只覆盖到第 ${cursor} 项，DEMOS 有 ${DEMOS.length} 项`)
  }],

  ['每个 demo 的元信息完整（id/title/tag/desc/bg/create）', () => {
    for (const d of DEMOS) {
      for (const key of ['id', 'title', 'tag', 'desc', 'bg']) {
        ok(typeof d[key] === 'string' && d[key].length > 0, `${d.id} 缺 ${key}`)
      }
      /* desc 是这个 demo「在讲什么原理」的说明，空话不算数 */
      ok(d.desc.length >= 25, `${d.id} 的 desc 太短：${d.desc.length} 字`)
      ok(typeof d.create === 'function', `${d.id} 没有 create`)
      ok(Array.isArray(d.params), `${d.id} 的 params 必须是数组`)
      ok(Array.isArray(d.actions), `${d.id} 的 actions 必须是数组`)
    }
  }],

  ['每个参数声明自洽（key/label/区间 且 默认值落在区间内）', () => {
    for (const d of DEMOS) {
      const keys = d.params.map((p) => p.key)
      eq(new Set(keys).size, keys.length, `${d.id} 的参数 key 有重复`)
      for (const p of d.params) {
        ok(typeof p.key === 'string' && p.key, `${d.id} 有参数缺 key`)
        ok(typeof p.label === 'string' && p.label, `${d.id}.${p.key} 缺 label`)
        for (const k of ['min', 'max', 'step', 'value']) {
          ok(Number.isFinite(p[k]), `${d.id}.${p.key} 的 ${k} 不是数字`)
        }
        ok(p.max > p.min, `${d.id}.${p.key} 区间非法：${p.min}~${p.max}`)
        ok(p.step > 0, `${d.id}.${p.key} step 必须为正`)
        ok(p.value >= p.min && p.value <= p.max, `${d.id}.${p.key} 默认值 ${p.value} 越界`)
      }
      for (const a of d.actions) {
        ok(typeof a.key === 'string' && a.key, `${d.id} 有动作缺 key`)
        ok(typeof a.label === 'string' && a.label, `${d.id}.${a.key} 缺 label`)
      }
    }
  }],

  ['create() 返回完整契约（resize/frame/pointer/setParam/action/destroy）', () => {
    for (const d of DEMOS) {
      const inst = d.create(makeCtx(makeCanvas()))
      for (const m of ['resize', 'frame', 'pointer', 'setParam', 'action', 'destroy']) {
        ok(typeof inst[m] === 'function', `${d.id} 的实例缺方法 ${m}`)
      }
      inst.destroy()
    }
  }],

  ['两份子应用拷贝与源文件保持一致（防漂移）', () => {
    execFileSync(process.execPath, [path.join(ROOT, 'scripts/sync-creative-demos.mjs'), '--check'], {
      cwd: ROOT,
      stdio: 'pipe',
    })
  }],
]

/* 每个 demo 单独一条用例，失败时能直接看出是哪一个 */
for (const d of DEMOS) {
  CASES.push([`${d.id} 跑 20 帧 + 各类交互不抛错`, () => {
    const inst = exercise(d)
    notEq(inst, null, `${d.id} 没返回实例`)
  }])
}

CASES.push(['同一 demo 可创建互相独立的多个实例', () => {
  const a = DEMOS[0].create(makeCtx(makeCanvas()))
  const b = DEMOS[0].create(makeCtx(makeCanvas()))
  notEq(a, b, 'create() 返回了同一个对象，说明实例状态被提到了模块级')
  a.destroy()
  b.destroy()
}])

CASES.push(['demo 列表长度与「82 个创意 demo」的要求一致', () => {
  eq(DEMOS.length, 82, `当前只有 ${DEMOS.length} 个`)
  length(DEMOS.filter((d) => d.params.length > 0), DEMOS.length, '有 demo 完全没有可调参数')
}])

export default CASES
