<template>
  <div class="viz">
    <header class="viz-head">
      <h1>可视化实验室</h1>
      <p>三张 canvas 手绘图 —— 不引图表库，演示「布局算法 + 逐帧渲染」这两件事</p>
    </header>

    <!-- ① 力导向关系图 -->
    <section class="viz-card">
      <h3>① 力导向关系图 <span class="hint">弹簧 + 斥力，逐帧收敛</span></h3>
      <p class="desc">
        每条边是一根弹簧（胡克定律），每对节点互相排斥（平方反比）。
        迭代几十帧后自动落成一个不重叠的团 —— 这就是 d3-force 的核心两行。
      </p>
      <canvas ref="graphCanvas" class="viz-canvas" height="280" @pointerdown="onGraphDown" @pointerup="onGraphUp" @pointermove="onGraphMove" />
      <div class="viz-metrics">
        <span class="viz-tag">节点 {{ graphNodes.length }}</span>
        <span class="viz-tag">连线 {{ graphLinks.length }}</span>
        <span class="viz-tag ok">帧 {{ graphFrame }}</span>
        <span class="viz-tag info">拖动任一节点可手动摆位</span>
      </div>
    </section>

    <!-- ② 词云 -->
    <section class="viz-card">
      <h3>② 螺旋词云 <span class="hint">阿基米德螺线 + 包围盒避让</span></h3>
      <p class="desc">
        按权重从大到小逐个放置，每个词沿螺线往外试位，直到找到不覆盖已放置词的位置。
        比随机撒点稳定得多，且不会出现"大词被挤到角落"。
      </p>
      <canvas ref="wordCanvas" class="viz-canvas" height="260" />
      <div class="viz-metrics">
        <span v-for="(w, i) in WORDS.slice(0, 6)" :key="w.text" class="viz-tag">
          #{{ i + 1 }} {{ w.text }}（{{ w.weight }}）
        </span>
      </div>
    </section>

    <!-- ③ 热力图 -->
    <section class="viz-card">
      <h3>③ 热力矩阵 <span class="hint">颜色插值 + 悬停读数</span></h3>
      <p class="desc">
        7×24 的「时段 × 星期」热度矩阵。颜色用线性插值生成，数值走 tabular-nums 对齐。
      </p>
      <div class="heat-wrap">
        <canvas ref="heatCanvas" class="viz-canvas viz-canvas--heat" height="240" @pointermove="onHeatMove" />
        <div class="heat-readout" :style="{ opacity: hoverCell ? 1 : 0 }">
          <b>{{ hoverCell ? hoverCell.label : '—' }}</b>
          <em>{{ hoverCell ? hoverCell.value : '' }}</em>
        </div>
      </div>
      <div class="viz-metrics">
        <span class="viz-tag">总量 {{ heatTotal }}</span>
        <span class="viz-tag ok">峰值 {{ heatPeak.label }} · {{ heatPeak.value }}</span>
        <span class="viz-tag info">颜色范围 0 → {{ heatMax }}</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { clamp, hexToRgb, lerp, mapRange, randomInt, rgbToHex } from '../utils'

/* ============================ ① 力导向图 ============================ */

const graphCanvas = ref(null)
const graphFrame = ref(0)

const graphNodes = [
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

const graphLinks = [
  ['host', 'vue'], ['host', 'ng'], ['vue', 'router'], ['vue', 'utils'],
  ['vue', 'kit'], ['ng', 'router'], ['ng', 'utils'], ['kit', 'charts'],
  ['vue', 'store'], ['utils', 'http'], ['ng', 'store'],
].map(([a, b]) => ({ a, b }))

let sim = []
let dragging = null
let graphRaf = 0
let graphFrames = 0

const seedGraph = () => {
  const el = graphCanvas.value
  const w = el.clientWidth
  const h = el.clientHeight
  sim = graphNodes.map((n) => ({
    ...n,
    x: w / 2 + (Math.random() - 0.5) * w * 0.7,
    y: h / 2 + (Math.random() - 0.5) * h * 0.7,
    vx: 0,
    vy: 0,
  }))
}

const graphStep = () => {
  const el = graphCanvas.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  const byId = Object.fromEntries(sim.map((n) => [n.id, n]))

  // 斥力：任意两节点互相推开
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

  // 弹簧：边长收到 rest 附近
  for (const link of graphLinks) {
    const a = byId[link.a]
    const b = byId[link.b]
    const rest = 86
    const dx = b.x - a.x
    const dy = b.y - a.y
    const d = Math.max(Math.hypot(dx, dy), 0.01)
    const f = (d - rest) * 0.035
    const ux = (dx / d) * f
    const uy = (dy / d) * f
    a.vx += ux
    a.vy += uy
    b.vx -= ux
    b.vy -= uy
  }

  for (const n of sim) {
    if (n === dragging) { n.vx = 0; n.vy = 0; continue }
    // 向心：避免整团飘出画布
    n.vx += (w / 2 - n.x) * 0.0016
    n.vy += (h / 2 - n.y) * 0.0016
    n.vx *= 0.86
    n.vy *= 0.86
    n.x = clamp(n.x + n.vx, n.r + 4, w - n.r - 4)
    n.y = clamp(n.y + n.vy, n.r + 4, h - n.r - 4)
  }
}

const graphDraw = () => {
  const el = graphCanvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  const w = el.clientWidth
  const h = el.clientHeight
  ctx.clearRect(0, 0, w, h)

  const byId = Object.fromEntries(sim.map((n) => [n.id, n]))
  ctx.strokeStyle = 'rgba(66, 184, 131, 0.35)'
  ctx.lineWidth = 1.4
  for (const link of graphLinks) {
    const a = byId[link.a]
    const b = byId[link.b]
    if (!a || !b) continue
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  for (const n of sim) {
    ctx.beginPath()
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
    ctx.fillStyle = n.id === 'host' ? '#2e9e6d' : n.id === 'vue' ? '#42b883' : '#7fd6ae'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#1f2d27'
    ctx.font = '11px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(n.label, n.x, n.y + n.r + 13)
  }
}

const tickGraph = () => {
  graphStep()
  graphDraw()
  graphFrames += 1
  if (graphFrames % 30 === 0) graphFrame.value = graphFrames
  graphRaf = requestAnimationFrame(tickGraph)
}

const pickNode = (e) => {
  const el = graphCanvas.value
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  return sim.find((n) => Math.hypot(n.x - x, n.y - y) <= n.r + 6) || null
}
const onGraphDown = (e) => { dragging = pickNode(e) }
const onGraphUp = () => { dragging = null }
const onGraphMove = (e) => {
  if (!dragging) return
  const rect = graphCanvas.value.getBoundingClientRect()
  dragging.x = clamp(e.clientX - rect.left, 8, rect.width - 8)
  dragging.y = clamp(e.clientY - rect.top, 8, rect.height - 8)
}

/* ============================ ② 螺旋词云 ============================ */

const wordCanvas = ref(null)
const WORDS = [
  { text: 'Vue 3', weight: 100 }, { text: '组合式函数', weight: 86 },
  { text: 'qiankun', weight: 78 }, { text: '虚拟滚动', weight: 66 },
  { text: 'Signal', weight: 60 }, { text: 'vite', weight: 56 },
  { text: 'Pinia', weight: 50 }, { text: '指令', weight: 46 },
  { text: 'canvas', weight: 42 }, { text: 'Tree-shaking', weight: 38 },
  { text: 'SSR', weight: 34 }, { text: '微前端', weight: 32 },
  { text: '响应式', weight: 30 }, { text: 'HMR', weight: 26 },
  { text: 'Teleport', weight: 24 }, { text: 'Suspense', weight: 22 },
  { text: 'Proxy', weight: 20 }, { text: 'Diff', weight: 18 },
  { text: 'chunk', weight: 16 }, { text: '路由守卫', weight: 15 },
]

const drawWordCloud = () => {
  const el = wordCanvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  const w = el.clientWidth
  const h = el.clientHeight
  ctx.clearRect(0, 0, w, h)

  const max = Math.max(...WORDS.map((x) => x.weight))
  const min = Math.min(...WORDS.map((x) => x.weight))
  const placed = []
  const cx = w / 2
  const cy = h / 2
  const palette = ['#2e9e6d', '#42b883', '#5fc79c', '#8ad9b6', '#409eff', '#e6a23c']

  WORDS.forEach((word, index) => {
    const size = Math.round(lerp(13, 42, mapRange(word.weight, [min, max], [0, 1])))
    ctx.font = `700 ${size}px -apple-system, "PingFang SC", sans-serif`
    const tw = ctx.measureText(word.text).width
    const th = size * 1.12

    // 阿基米德螺线：半径随角度线性增长，逐点尝试直到不覆盖
    let angle = 0
    let radius = 0
    let box = null
    for (let step = 0; step < 900; step += 1) {
      const px = cx + Math.cos(angle) * radius
      const py = cy + Math.sin(angle) * radius * 0.62 // 压扁成椭圆，贴合宽扁画布
      const candidate = { x: px - tw / 2, y: py - th / 2, w: tw, h: th }
      const outside = candidate.x < 2 || candidate.y < 2 || candidate.x + tw > w - 2 || candidate.y + th > h - 2
      const clash = !outside && placed.some((p) => (
        candidate.x < p.x + p.w && candidate.x + candidate.w > p.x
        && candidate.y < p.y + p.h && candidate.y + candidate.h > p.y
      ))
      if (!outside && !clash) { box = candidate; break }
      angle += 0.31
      radius += 0.62
    }
    if (!box) return // 放不下就放弃这个词，而不是硬塞

    placed.push(box)
    ctx.fillStyle = palette[index % palette.length]
    ctx.globalAlpha = lerp(0.62, 1, mapRange(word.weight, [min, max], [0, 1]))
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(word.text, box.x, box.y)
    ctx.globalAlpha = 1
  })

  // 中心十字准线（提示"从中心向外生长"）
  ctx.strokeStyle = 'rgba(66, 184, 131, 0.18)'
  ctx.beginPath()
  ctx.moveTo(cx, 6)
  ctx.lineTo(cx, h - 6)
  ctx.moveTo(6, cy)
  ctx.lineTo(w - 6, cy)
  ctx.stroke()
}

/* ============================ ③ 热力矩阵 ============================ */

const heatCanvas = ref(null)
const hoverCell = ref(null)
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
/** 用 ref 持有：heatMax / heatTotal / heatPeak 是 computed，需要能被追踪 */
const heat = ref([])

const buildHeat = () => {
  heat.value = DAYS.map((day, d) => (
    Array.from({ length: 24 }, (_, hour) => {
      // 造一条"双峰"曲线：上午 10 点与下午 15 点各一个高峰，周末整体走低
      const peak = 90 * Math.exp(-((hour - 10) ** 2) / 14) + 76 * Math.exp(-((hour - 15) ** 2) / 18)
      const weekend = d >= 5 ? 0.32 : 1
      return { day, hour, value: Math.round(peak * weekend + randomInt(0, 8)) }
    })
  ))
}

const heatMax = computed(() => Math.max(...heat.value.flat().map((c) => c.value), 1))
const heatTotal = computed(() => heat.value.flat().reduce((acc, c) => acc + c.value, 0))
const heatPeak = computed(() => heat.value.flat().reduce(
  (best, c) => (c.value > best.value ? c : best), { label: '—', value: 0 },
))

/** 冷色→暖色线性插值（#eef7f2 → #e6a23c → #d9480f） */
const heatColor = (ratio) => {
  const stops = [
    { at: 0, hex: '#f2f9f5' },
    { at: 0.45, hex: '#8ad9b6' },
    { at: 0.72, hex: '#e6a23c' },
    { at: 1, hex: '#d9480f' },
  ]
  const t = clamp(ratio, 0, 1)
  let lo = stops[0]
  let hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (t >= stops[i].at && t <= stops[i + 1].at) { lo = stops[i]; hi = stops[i + 1]; break }
  }
  const span = hi.at - lo.at || 1
  const a = hexToRgb(lo.hex)
  const b = hexToRgb(hi.hex)
  const k = (t - lo.at) / span
  return rgbToHex({
    r: a.r + (b.r - a.r) * k,
    g: a.g + (b.g - a.g) * k,
    b: a.b + (b.b - a.b) * k,
  })
}

let heatLayout = { cw: 0, ch: 0, ox: 0, oy: 0 }

const drawHeat = () => {
  const el = heatCanvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  const w = el.clientWidth
  const h = el.clientHeight
  ctx.clearRect(0, 0, w, h)

  const padLeft = 44
  const padTop = 22
  const padBottom = 20
  const cw = (w - padLeft - 10) / 24
  const ch = (h - padTop - padBottom) / 7
  heatLayout = { cw, ch, ox: padLeft, oy: padTop, padLeft, padTop }

  ctx.font = '10px -apple-system, sans-serif'
  ctx.fillStyle = '#a9b3ad'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  DAYS.forEach((d, i) => ctx.fillText(d, padLeft - 6, padTop + i * ch + ch / 2))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let hh = 0; hh < 24; hh += 4) {
    ctx.fillText(`${hh}时`, padLeft + hh * cw + cw / 2, 5)
  }

  const max = heatMax.value
  heat.value.forEach((row, r) => {
    row.forEach((cell, c) => {
      ctx.fillStyle = heatColor(cell.value / max)
      ctx.fillRect(padLeft + c * cw + 0.6, padTop + r * ch + 0.6, cw - 1.2, ch - 1.2)
    })
  })
}

const onHeatMove = (e) => {
  const el = heatCanvas.value
  const rect = el.getBoundingClientRect()
  const { cw, ch, padLeft, padTop } = heatLayout
  const col = Math.floor((e.clientX - rect.left - padLeft) / cw)
  const row = Math.floor((e.clientY - rect.top - padTop) / ch)
  if (row < 0 || row > 6 || col < 0 || col > 23) { hoverCell.value = null; return }
  const cell = heat.value[row][col]
  hoverCell.value = { label: `${cell.day} ${String(cell.hour).padStart(2, '0')}:00`, value: `${cell.value} 次` }
}

/* ============================ 生命周期 ============================ */

let ro = null

const setupCanvas = (el) => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  el.width = el.clientWidth * dpr
  el.height = el.clientHeight * dpr
  el.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
}

const redrawAll = () => {
  for (const el of [graphCanvas.value, wordCanvas.value, heatCanvas.value]) {
    if (el) setupCanvas(el)
  }
  seedGraph()
  drawWordCloud()
  drawHeat()
}

onMounted(() => {
  buildHeat()
  redrawAll()
  tickGraph()
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => { redrawAll() })
    for (const el of [graphCanvas.value, wordCanvas.value, heatCanvas.value]) if (el) ro.observe(el)
  } else {
    window.addEventListener('resize', redrawAll)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(graphRaf)
  ro?.disconnect()
  window.removeEventListener('resize', redrawAll)
})
</script>

<style scoped>
.viz { padding: 18px 22px 44px; }
.viz-head h1 { margin: 0 0 4px; font-size: 20px; color: #303133; }
.viz-head p { margin: 0 0 16px; font-size: 12.5px; color: #909399; }

.viz-card {
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 14px;
  background: #fff;
}
.viz-card h3 { margin: 0 0 6px; font-size: 15px; color: #303133; }
.viz-card .hint {
  margin-left: 6px; font-size: 11px; font-weight: 500; color: #42b883;
  background: #eefaf3; border-radius: 999px; padding: 1px 8px;
}
.desc { margin: 0 0 12px; font-size: 12.5px; color: #909399; line-height: 1.7; }

.viz-canvas {
  display: block; width: 100%; border-radius: 10px;
  background: #fff; border: 1px solid #eef2f0;
}
.viz-canvas--heat { cursor: crosshair; }

.viz-metrics { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.viz-tag {
  padding: 3px 9px; border-radius: 999px; background: #f0f2f5;
  color: #606266; font-size: 12px; font-variant-numeric: tabular-nums;
}
.viz-tag.ok { background: #eefaf3; color: #2e8b5f; }
.viz-tag.info { background: #ecf5ff; color: #2f7fd1; }

.heat-wrap { position: relative; }
.heat-readout {
  position: absolute; right: 10px; top: 10px;
  padding: 5px 11px; border-radius: 8px;
  background: rgba(15, 23, 42, 0.86); color: #fff;
  display: flex; align-items: baseline; gap: 8px;
  transition: opacity 0.16s; pointer-events: none;
}
.heat-readout b { font-size: 12px; font-weight: 600; }
.heat-readout em { font-style: normal; font-size: 11px; opacity: 0.75; }
</style>
