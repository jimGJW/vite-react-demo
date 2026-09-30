import { useEffect, useRef } from 'react'
import './index.scss'

/**
 * 可视化实验室（React 主应用版）
 *
 * 三张 canvas 手绘图，与两个子应用的同名页面对应：
 *   力导向关系图（弹簧 + 斥力） · 螺旋词云（包围盒避让） · 热力矩阵（颜色插值 + 悬停读数）
 *
 * 不引任何图表库 —— 重点是「布局算法 + 逐帧渲染」本身。
 * 悬停读数用受控 state（鼠标停下才更新，频率低），其余全部写 DOM / canvas，不进 React 渲染。
 */

/* ============================ 本地数学小工具（本页专用，不进公共模块） ============================ */

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1)
const mapRange = (v, inMin, inMax, outMin, outMax) => (
  inMax === inMin ? outMin : outMin + ((clamp(v, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin)
)

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
const hexToRgb = (hex) => {
  const m = HEX_RE.exec(String(hex ?? '').trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const num = parseInt(h, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}
const rgbToHex = ({ r = 0, g = 0, b = 0 }) => {
  const to2 = (v) => clamp(Math.round(Number(v) || 0), 0, 255).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

/* ============================ 常量数据（模块级，避免每次渲染重建） ============================ */

const NODES = [
  { id: 'host', label: '主应用', r: 15 },
  { id: 'vue', label: 'Vue 子应用', r: 13 },
  { id: 'ng', label: 'Angular 子应用', r: 13 },
  { id: 'router', label: 'router', r: 9 },
  { id: 'utils', label: 'utils', r: 9 },
  { id: 'kit', label: 'Kit', r: 9 },
  { id: 'charts', label: 'Charts', r: 8 },
  { id: 'store', label: 'store', r: 8 },
  { id: 'http', label: 'http', r: 8 },
]

const LINKS = [
  ['host', 'vue'], ['host', 'ng'], ['vue', 'router'], ['vue', 'utils'],
  ['vue', 'kit'], ['ng', 'router'], ['ng', 'utils'], ['kit', 'charts'],
  ['vue', 'store'], ['utils', 'http'], ['ng', 'store'],
].map(([a, b]) => ({ a, b }))

const WORDS = [
  { text: 'React 19', weight: 100 }, { text: 'Hooks', weight: 90 },
  { text: 'qiankun', weight: 80 }, { text: 'Suspense', weight: 72 },
  { text: 'useMemo', weight: 64 }, { text: '并发渲染', weight: 58 },
  { text: 'ECharts', weight: 52 }, { text: 'antd', weight: 48 },
  { text: 'canvas', weight: 44 }, { text: 'React Compiler', weight: 40 },
  { text: 'SSR', weight: 36 }, { text: '微前端', weight: 33 },
  { text: '虚拟滚动', weight: 30 }, { text: 'HMR', weight: 27 },
  { text: 'Runtime', weight: 24 }, { text: 'lazy', weight: 22 },
  { text: '虚拟 DOM', weight: 20 }, { text: 'memo', weight: 18 },
  { text: 'chunk', weight: 16 }, { text: '错误边界', weight: 15 },
]

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

/** 热力数据：双峰曲线（上午 10 点 + 下午 15 点），周末整体走低；模块级生成一次 */
const HEAT = DAYS.map((day, d) => Array.from({ length: 24 }, (_, hour) => {
  const peak = 90 * Math.exp(-((hour - 10) ** 2) / 14) + 76 * Math.exp(-((hour - 15) ** 2) / 18)
  const weekend = d >= 5 ? 0.32 : 1
  const jitter = ((d * 31 + hour * 17) % 9)
  return { day, hour, value: Math.round(peak * weekend + jitter) }
}))

const HEAT_FLAT = HEAT.flat()
const HEAT_MAX = Math.max(...HEAT_FLAT.map((c) => c.value), 1)
const HEAT_TOTAL = HEAT_FLAT.reduce((acc, c) => acc + c.value, 0)
const HEAT_PEAK = HEAT_FLAT.reduce((best, c) => (c.value > best.value ? c : best), { day: '—', hour: 0, value: 0 })

/** 冷 → 暖色带（与子应用一致：浅蓝 → 靛 → 橙 → 朱） */
const HEAT_STOPS = [
  { at: 0, hex: '#eef2ff' },
  { at: 0.45, hex: '#93c5fd' },
  { at: 0.72, hex: '#f59e0b' },
  { at: 1, hex: '#dc2626' },
]
const heatColor = (ratio) => {
  const t = clamp(ratio, 0, 1)
  let lo = HEAT_STOPS[0]
  let hi = HEAT_STOPS[HEAT_STOPS.length - 1]
  for (let i = 0; i < HEAT_STOPS.length - 1; i += 1) {
    if (t >= HEAT_STOPS[i].at && t <= HEAT_STOPS[i + 1].at) {
      lo = HEAT_STOPS[i]
      hi = HEAT_STOPS[i + 1]
      break
    }
  }
  const k = (t - lo.at) / (hi.at - lo.at || 1)
  const a = hexToRgb(lo.hex)
  const b = hexToRgb(hi.hex)
  return rgbToHex({
    r: a.r + (b.r - a.r) * k,
    g: a.g + (b.g - a.g) * k,
    b: a.b + (b.b - a.b) * k,
  })
}

/* ============================ 组件 ============================ */

export default function DataVizLab() {
  const graphRef = useRef(null)
  const wordRef = useRef(null)
  const heatRef = useRef(null)
  const readoutRef = useRef(null)
  const simRef = useRef([])
  const dragRef = useRef(null)
  const heatLayoutRef = useRef({ cw: 0, ch: 0, padLeft: 0, padTop: 0 })

  useEffect(() => {
    const graphEl = graphRef.current
    const wordEl = wordRef.current
    const heatEl = heatRef.current
    if (!graphEl || !wordEl || !heatEl) return undefined

    const ctxOf = (el) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      el.width = el.clientWidth * dpr
      el.height = el.clientHeight * dpr
      const ctx = el.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return ctx
    }
    const gctx = ctxOf(graphEl)

    /* ---------- ① 力导向图 ---------- */
    const seedGraph = () => {
      const w = graphEl.clientWidth
      const h = graphEl.clientHeight
      simRef.current = NODES.map((n) => ({
        ...n,
        x: w / 2 + (Math.random() - 0.5) * w * 0.7,
        y: h / 2 + (Math.random() - 0.5) * h * 0.7,
        vx: 0,
        vy: 0,
      }))
    }

    const graphStep = () => {
      const sim = simRef.current
      const w = graphEl.clientWidth
      const h = graphEl.clientHeight
      const byId = new Map(sim.map((n) => [n.id, n]))

      for (let i = 0; i < sim.length; i += 1) {
        for (let j = i + 1; j < sim.length; j += 1) {
          const a = sim[i]
          const b = sim[j]
          let dx = b.x - a.x
          let dy = b.y - a.y
          const d2 = Math.max(dx * dx + dy * dy, 64)
          const d = Math.sqrt(d2)
          const push = 5200 / d2
          dx /= d
          dy /= d
          a.vx -= dx * push
          a.vy -= dy * push
          b.vx += dx * push
          b.vy += dy * push
        }
      }

      for (const link of LINKS) {
        const a = byId.get(link.a)
        const b = byId.get(link.b)
        if (!a || !b) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.max(Math.hypot(dx, dy), 0.01)
        const f = (d - 86) * 0.035
        a.vx += (dx / d) * f
        a.vy += (dy / d) * f
        b.vx -= (dx / d) * f
        b.vy -= (dy / d) * f
      }

      for (const n of sim) {
        if (n === dragRef.current) {
          n.vx = 0
          n.vy = 0
          continue
        }
        n.vx += (w / 2 - n.x) * 0.0016
        n.vy += (h / 2 - n.y) * 0.0016
        n.vx *= 0.86
        n.vy *= 0.86
        n.x = clamp(n.x + n.vx, n.r + 4, w - n.r - 4)
        n.y = clamp(n.y + n.vy, n.r + 4, h - n.r - 4)
      }
    }

    const graphDraw = () => {
      const sim = simRef.current
      const w = graphEl.clientWidth
      const h = graphEl.clientHeight
      gctx.clearRect(0, 0, w, h)
      const byId = new Map(sim.map((n) => [n.id, n]))

      gctx.strokeStyle = 'rgba(22, 119, 255, 0.24)'
      gctx.lineWidth = 1.4
      for (const link of LINKS) {
        const a = byId.get(link.a)
        const b = byId.get(link.b)
        if (!a || !b) continue
        gctx.beginPath()
        gctx.moveTo(a.x, a.y)
        gctx.lineTo(b.x, b.y)
        gctx.stroke()
      }
      for (const n of sim) {
        gctx.beginPath()
        gctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        gctx.fillStyle = n.id === 'host' ? '#0958d9' : n.id === 'vue' ? '#1677ff' : '#91caff'
        gctx.fill()
        gctx.strokeStyle = '#fff'
        gctx.lineWidth = 2
        gctx.stroke()
        gctx.fillStyle = '#1f2937'
        gctx.font = '11px -apple-system, sans-serif'
        gctx.textAlign = 'center'
        gctx.fillText(n.label, n.x, n.y + n.r + 13)
      }
    }

    /* ---------- ② 词云 ---------- */
    const drawWordCloud = () => {
      const ctx = ctxOf(wordEl)
      const w = wordEl.clientWidth
      const h = wordEl.clientHeight
      ctx.clearRect(0, 0, w, h)

      const max = Math.max(...WORDS.map((x) => x.weight))
      const min = Math.min(...WORDS.map((x) => x.weight))
      const placed = []
      const cx = w / 2
      const cy = h / 2
      const palette = ['#0958d9', '#1677ff', '#4096ff', '#69b1ff', '#13c2c2', '#faad14']

      WORDS.forEach((word, index) => {
        const size = Math.round(lerp(13, 42, mapRange(word.weight, min, max, 0, 1)))
        ctx.font = `700 ${size}px -apple-system, "PingFang SC", sans-serif`
        const tw = ctx.measureText(word.text).width
        const th = size * 1.12

        let angle = 0
        let radius = 0
        let box = null
        for (let step = 0; step < 900; step += 1) {
          const px = cx + Math.cos(angle) * radius
          const py = cy + Math.sin(angle) * radius * 0.62
          const cand = { x: px - tw / 2, y: py - th / 2, w: tw, h: th }
          const outside = cand.x < 2 || cand.y < 2 || cand.x + tw > w - 2 || cand.y + th > h - 2
          const clash = !outside && placed.some((p) => (
            cand.x < p.x + p.w && cand.x + cand.w > p.x
            && cand.y < p.y + p.h && cand.y + cand.h > p.y
          ))
          if (!outside && !clash) {
            box = cand
            break
          }
          angle += 0.31
          radius += 0.62
        }
        if (!box) return

        placed.push(box)
        ctx.fillStyle = palette[index % palette.length]
        ctx.globalAlpha = lerp(0.62, 1, mapRange(word.weight, min, max, 0, 1))
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(word.text, box.x, box.y)
        ctx.globalAlpha = 1
      })

      ctx.strokeStyle = 'rgba(22, 119, 255, 0.14)'
      ctx.beginPath()
      ctx.moveTo(cx, 6)
      ctx.lineTo(cx, h - 6)
      ctx.moveTo(6, cy)
      ctx.lineTo(w - 6, cy)
      ctx.stroke()
    }

    /* ---------- ③ 热力矩阵 ---------- */
    const drawHeat = () => {
      const ctx = ctxOf(heatEl)
      const w = heatEl.clientWidth
      const h = heatEl.clientHeight
      ctx.clearRect(0, 0, w, h)

      const padLeft = 44
      const padTop = 22
      const padBottom = 20
      const cw = (w - padLeft - 10) / 24
      const ch = (h - padTop - padBottom) / 7
      heatLayoutRef.current = { cw, ch, padLeft, padTop }

      ctx.font = '10px -apple-system, sans-serif'
      ctx.fillStyle = '#9aa2ad'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      DAYS.forEach((d, i) => ctx.fillText(d, padLeft - 6, padTop + i * ch + ch / 2))
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (let hh = 0; hh < 24; hh += 4) {
        ctx.fillText(`${hh}时`, padLeft + hh * cw + cw / 2, 5)
      }

      HEAT.forEach((row, r) => {
        row.forEach((cell, c) => {
          ctx.fillStyle = heatColor(cell.value / HEAT_MAX)
          ctx.fillRect(padLeft + c * cw + 0.6, padTop + r * ch + 0.6, cw - 1.2, ch - 1.2)
        })
      })
    }

    const redrawAll = () => {
      ctxOf(graphEl)
      seedGraph()
      drawWordCloud()
      drawHeat()
    }

    /* ---------- 主循环：力导向图持续收敛，其余两张只在尺寸变化时重画 ---------- */
    let raf = 0
    const tick = () => {
      graphStep()
      graphDraw()
      raf = requestAnimationFrame(tick)
    }

    redrawAll()
    raf = requestAnimationFrame(tick)

    let ro = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => { redrawAll() })
      ro.observe(graphEl)
      ro.observe(wordEl)
      ro.observe(heatEl)
    } else {
      window.addEventListener('resize', redrawAll)
    }

    /* ---------- 交互 ---------- */
    const pickNode = (e) => {
      const rect = graphEl.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      return simRef.current.find((n) => Math.hypot(n.x - x, n.y - y) <= n.r + 6) || null
    }
    const onDown = (e) => { dragRef.current = pickNode(e) }
    const onUp = () => { dragRef.current = null }
    const onMove = (e) => {
      if (!dragRef.current) return
      const rect = graphEl.getBoundingClientRect()
      dragRef.current.x = clamp(e.clientX - rect.left, 8, rect.width - 8)
      dragRef.current.y = clamp(e.clientY - rect.top, 8, rect.height - 8)
    }
    const onHeatMove = (e) => {
      const rect = heatEl.getBoundingClientRect()
      const { cw, ch, padLeft, padTop } = heatLayoutRef.current
      const col = Math.floor((e.clientX - rect.left - padLeft) / cw)
      const row = Math.floor((e.clientY - rect.top - padTop) / ch)
      const tip = readoutRef.current
      if (!tip) return
      if (row < 0 || row > 6 || col < 0 || col > 23) {
        tip.style.opacity = '0'
        return
      }
      const cell = HEAT[row][col]
      tip.style.opacity = '1'
      tip.firstChild.textContent = `${cell.day} ${String(cell.hour).padStart(2, '0')}:00`
      tip.lastChild.textContent = `${cell.value} 次`
    }
    const onHeatLeave = () => {
      if (readoutRef.current) readoutRef.current.style.opacity = '0'
    }

    graphEl.addEventListener('pointerdown', onDown)
    graphEl.addEventListener('pointerup', onUp)
    graphEl.addEventListener('pointerleave', onUp)
    graphEl.addEventListener('pointermove', onMove)
    heatEl.addEventListener('pointermove', onHeatMove)
    heatEl.addEventListener('pointerleave', onHeatLeave)

    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener('resize', redrawAll)
      graphEl.removeEventListener('pointerdown', onDown)
      graphEl.removeEventListener('pointerup', onUp)
      graphEl.removeEventListener('pointerleave', onUp)
      graphEl.removeEventListener('pointermove', onMove)
      heatEl.removeEventListener('pointermove', onHeatMove)
      heatEl.removeEventListener('pointerleave', onHeatLeave)
    }
  }, [])

  return (
    <div className="data-viz-lab">
      <header className="dvl-head">
        <h1>可视化实验室</h1>
        <p>三张 canvas 手绘图 —— 不引图表库，演示「布局算法 + 逐帧渲染」这两件事</p>
      </header>

      <section className="dvl-card">
        <h3>① 力导向关系图 <span className="dvl-hint">弹簧 + 斥力，逐帧收敛</span></h3>
        <p className="dvl-desc">
          每条边是一根弹簧（胡克定律），每对节点互相排斥（平方反比）。
          迭代几十帧后自动落成一个不重叠的团 —— 这就是 d3-force 的核心两行。
        </p>
        <canvas ref={graphRef} className="dvl-canvas" />
        <div className="dvl-metrics">
          <span className="dvl-tag">节点 {NODES.length}</span>
          <span className="dvl-tag">连线 {LINKS.length}</span>
          <span className="dvl-tag dvl-tag--info">拖动任一节点可手动摆位</span>
        </div>
      </section>

      <section className="dvl-card">
        <h3>② 螺旋词云 <span className="dvl-hint">阿基米德螺线 + 包围盒避让</span></h3>
        <p className="dvl-desc">
          按权重从大到小逐个放置，每个词沿螺线往外试位，直到找到不覆盖已放置词的位置。
          比随机撒点稳定，且不会出现「大词被挤到角落」。
        </p>
        <canvas ref={wordRef} className="dvl-canvas" />
        <div className="dvl-metrics">
          {WORDS.slice(0, 6).map((w, i) => (
            <span className="dvl-tag" key={w.text}>#{i + 1} {w.text}（{w.weight}）</span>
          ))}
        </div>
      </section>

      <section className="dvl-card">
        <h3>③ 热力矩阵 <span className="dvl-hint">颜色插值 + 悬停读数</span></h3>
        <p className="dvl-desc">
          7×24 的「时段 × 星期」热度矩阵。悬停读数直接改 DOM 文本 —— 高频 pointermove 不该驱动 React 渲染。
        </p>
        <div className="dvl-heat-wrap">
          <canvas ref={heatRef} className="dvl-canvas dvl-canvas--heat" />
          <div className="dvl-readout" ref={readoutRef}>
            <b>—</b>
            <em />
          </div>
        </div>
        <div className="dvl-metrics">
          <span className="dvl-tag">总量 {HEAT_TOTAL}</span>
          <span className="dvl-tag dvl-tag--ok">峰值 {HEAT_PEAK.day} {String(HEAT_PEAK.hour).padStart(2, '0')}:00 · {HEAT_PEAK.value} 次</span>
          <span className="dvl-tag dvl-tag--info">颜色范围 0 → {HEAT_MAX}</span>
        </div>
      </section>
    </div>
  )
}
