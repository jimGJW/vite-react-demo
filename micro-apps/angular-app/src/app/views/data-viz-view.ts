import {
  ChangeDetectionStrategy, Component, ElementRef, type OnDestroy, afterNextRender,
  computed, signal, viewChild,
} from '@angular/core'
import { clamp, hexToRgb, lerp, mapRange, randomInt, rgbToHex } from '../../utils'

interface HeatCell { day: string; hour: number; value: number }

/**
 * 可视化实验室（Angular 版）
 *
 * 与 vue-app 的 `pages/DataVizLab.vue` 一一对应：
 *   力导向关系图（弹簧 + 斥力） · 螺旋词云（包围盒避让） · 热力矩阵（颜色插值 + 悬停读数）
 *
 * 三张图全部手绘 canvas，不引图表库 —— 演示「布局算法 + 逐帧渲染」本身。
 */
@Component({
  selector: 'app-data-viz-view',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
        <canvas
          #graphCanvas
          class="viz-canvas"
          (pointerdown)="onGraphDown($event)"
          (pointerup)="dragging = null"
          (pointerleave)="dragging = null"
          (pointermove)="onGraphMove($event)"
        ></canvas>
        <div class="viz-metrics">
          <span class="viz-tag">节点 {{ NODES.length }}</span>
          <span class="viz-tag">连线 {{ LINKS.length }}</span>
          <span class="viz-tag ok">帧 {{ frame() }}</span>
          <span class="viz-tag info">拖动任一节点可手动摆位</span>
        </div>
      </section>

      <!-- ② 词云 -->
      <section class="viz-card">
        <h3>② 螺旋词云 <span class="hint">阿基米德螺线 + 包围盒避让</span></h3>
        <p class="desc">
          按权重从大到小逐个放置，每个词沿螺线往外试位，直到找到不覆盖已放置词的位置。
          比随机撒点稳定，且不会出现"大词被挤到角落"。
        </p>
        <canvas #wordCanvas class="viz-canvas"></canvas>
        <div class="viz-metrics">
          @for (w of WORDS.slice(0, 6); track w.text; let i = $index) {
            <span class="viz-tag">#{{ i + 1 }} {{ w.text }}（{{ w.weight }}）</span>
          }
        </div>
      </section>

      <!-- ③ 热力矩阵 -->
      <section class="viz-card">
        <h3>③ 热力矩阵 <span class="hint">颜色插值 + 悬停读数</span></h3>
        <p class="desc">7×24 的「时段 × 星期」热度矩阵。颜色用线性插值生成，数值走 tabular-nums 对齐。</p>
        <div class="heat-wrap">
          <canvas #heatCanvas class="viz-canvas viz-canvas--heat" (pointermove)="onHeatMove($event)"></canvas>
          <div class="heat-readout" [style.opacity]="hover() ? 1 : 0">
            <b>{{ hover()?.label || '—' }}</b>
            <em>{{ hover()?.value || '' }}</em>
          </div>
        </div>
        <div class="viz-metrics">
          <span class="viz-tag">总量 {{ heatTotal() }}</span>
          <span class="viz-tag ok">峰值 {{ heatPeak().label }} · {{ heatPeak().value }}</span>
          <span class="viz-tag info">颜色范围 0 → {{ heatMax() }}</span>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .viz { padding: 18px 22px 44px; }
    .viz-head h1 { margin: 0 0 4px; font-size: 20px; }
    .viz-head p { margin: 0 0 16px; font-size: 12.5px; color: #8a929f; }
    .viz-card { border: 1px solid #e3e6eb; border-radius: 10px; padding: 16px 18px; margin-bottom: 14px; background: #fff; }
    .viz-card h3 { margin: 0 0 6px; font-size: 15px; }
    .hint { margin-left: 6px; font-size: 11px; font-weight: 500; color: #4f46e5; background: #eef2ff; border-radius: 999px; padding: 1px 8px; }
    .desc { margin: 0 0 12px; font-size: 12.5px; color: #8a929f; line-height: 1.7; }
    .viz-canvas { display: block; width: 100%; height: 260px; border-radius: 10px; background: #fff; border: 1px solid #eef0f4; }
    .viz-canvas--heat { height: 240px; cursor: crosshair; }
    .viz-metrics { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .viz-tag { padding: 3px 9px; border-radius: 999px; background: #f0f2f5; color: #4b5563; font-size: 12px; font-variant-numeric: tabular-nums; }
    .viz-tag.ok { background: #eef2ff; color: #4f46e5; }
    .viz-tag.info { background: #ecf5ff; color: #2f7fd1; }
    .heat-wrap { position: relative; }
    .heat-readout { position: absolute; right: 10px; top: 10px; padding: 5px 11px; border-radius: 8px; background: rgba(15, 23, 42, 0.86); color: #fff; display: flex; align-items: baseline; gap: 8px; transition: opacity 0.16s; pointer-events: none; }
    .heat-readout b { font-size: 12px; font-weight: 600; }
    .heat-readout em { font-style: normal; font-size: 11px; opacity: 0.75; }
  `],
})
export class DataVizView implements OnDestroy {
  private readonly graphRef = viewChild<ElementRef<HTMLCanvasElement>>('graphCanvas')
  private readonly wordRef = viewChild<ElementRef<HTMLCanvasElement>>('wordCanvas')
  private readonly heatRef = viewChild<ElementRef<HTMLCanvasElement>>('heatCanvas')

  /* ==================== ① 力导向图 ==================== */

  readonly NODES = [
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

  readonly LINKS = [
    ['host', 'vue'], ['host', 'ng'], ['vue', 'router'], ['vue', 'utils'],
    ['vue', 'kit'], ['ng', 'router'], ['ng', 'utils'], ['kit', 'charts'],
    ['vue', 'store'], ['utils', 'http'], ['ng', 'store'],
  ].map(([a, b]) => ({ a, b }))

  readonly frame = signal(0)
  private sim: { id: string; label: string; r: number; x: number; y: number; vx: number; vy: number }[] = []
  dragging: { id: string; x: number; y: number; vx: number; vy: number } | null = null
  private graphRaf = 0
  private frameCount = 0

  private seedGraph() {
    const el = this.graphRef()?.nativeElement
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    this.sim = this.NODES.map((n) => ({
      ...n,
      x: w / 2 + (Math.random() - 0.5) * w * 0.7,
      y: h / 2 + (Math.random() - 0.5) * h * 0.7,
      vx: 0,
      vy: 0,
    }))
  }

  private graphStep() {
    const el = this.graphRef()?.nativeElement
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    const byId = new Map(this.sim.map((n) => [n.id, n]))

    // 斥力
    for (let i = 0; i < this.sim.length; i += 1) {
      for (let j = i + 1; j < this.sim.length; j += 1) {
        const a = this.sim[i]
        const b = this.sim[j]
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

    // 弹簧
    for (const link of this.LINKS) {
      const a = byId.get(link.a)
      const b = byId.get(link.b)
      if (!a || !b) continue
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

    for (const n of this.sim) {
      if (n === this.dragging) { n.vx = 0; n.vy = 0; continue }
      n.vx += (w / 2 - n.x) * 0.0016
      n.vy += (h / 2 - n.y) * 0.0016
      n.vx *= 0.86
      n.vy *= 0.86
      n.x = clamp(n.x + n.vx, n.r + 4, w - n.r - 4)
      n.y = clamp(n.y + n.vy, n.r + 4, h - n.r - 4)
    }
  }

  private graphDraw() {
    const el = this.graphRef()?.nativeElement
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const w = el.clientWidth
    const h = el.clientHeight
    ctx.clearRect(0, 0, w, h)
    const byId = new Map(this.sim.map((n) => [n.id, n]))

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.32)'
    ctx.lineWidth = 1.4
    for (const link of this.LINKS) {
      const a = byId.get(link.a)
      const b = byId.get(link.b)
      if (!a || !b) continue
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    for (const n of this.sim) {
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
      ctx.fillStyle = n.id === 'host' ? '#4f46e5' : n.id === 'vue' ? '#6366f1' : '#a5b4fc'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#1f2937'
      ctx.font = '11px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(n.label, n.x, n.y + n.r + 13)
    }
  }

  private tickGraph = () => {
    this.graphStep()
    this.graphDraw()
    this.frameCount += 1
    if (this.frameCount % 30 === 0) this.frame.set(this.frameCount)
    this.graphRaf = requestAnimationFrame(this.tickGraph)
  }

  private pickNode(e: PointerEvent) {
    const el = this.graphRef()?.nativeElement
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return this.sim.find((n) => Math.hypot(n.x - x, n.y - y) <= n.r + 6) || null
  }

  onGraphDown(e: PointerEvent) { this.dragging = this.pickNode(e) }

  onGraphMove(e: PointerEvent) {
    if (!this.dragging) return
    const el = this.graphRef()?.nativeElement
    if (!el) return
    const rect = el.getBoundingClientRect()
    this.dragging.x = clamp(e.clientX - rect.left, 8, rect.width - 8)
    this.dragging.y = clamp(e.clientY - rect.top, 8, rect.height - 8)
  }

  /* ==================== ② 螺旋词云 ==================== */

  readonly WORDS = [
    { text: 'Angular', weight: 100 }, { text: 'signals', weight: 88 },
    { text: 'qiankun', weight: 78 }, { text: 'standalone', weight: 70 },
    { text: 'DI 服务', weight: 62 }, { text: 'RxJS', weight: 56 },
    { text: '管道', weight: 50 }, { text: '指令', weight: 46 },
    { text: 'canvas', weight: 42 }, { text: 'zoneless', weight: 38 },
    { text: 'SSR', weight: 34 }, { text: '微前端', weight: 32 },
    { text: 'linkedSignal', weight: 30 }, { text: 'HMR', weight: 26 },
    { text: 'control flow', weight: 24 }, { text: 'lazy', weight: 22 },
    { text: 'guards', weight: 20 }, { text: 'resolver', weight: 18 },
    { text: 'chunk', weight: 16 }, { text: '路由守卫', weight: 15 },
  ]

  private drawWordCloud() {
    const el = this.wordRef()?.nativeElement
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const w = el.clientWidth
    const h = el.clientHeight
    ctx.clearRect(0, 0, w, h)

    const max = Math.max(...this.WORDS.map((x) => x.weight))
    const min = Math.min(...this.WORDS.map((x) => x.weight))
    const placed: { x: number; y: number; w: number; h: number }[] = []
    const cx = w / 2
    const cy = h / 2
    const palette = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#0ea5e9', '#f59e0b']

    this.WORDS.forEach((word, index) => {
      const size = Math.round(lerp(13, 42, mapRange(word.weight, [min, max], [0, 1])))
      ctx.font = `700 ${size}px -apple-system, "PingFang SC", sans-serif`
      const tw = ctx.measureText(word.text).width
      const th = size * 1.12

      let angle = 0
      let radius = 0
      let box: { x: number; y: number; w: number; h: number } | null = null
      for (let step = 0; step < 900; step += 1) {
        const px = cx + Math.cos(angle) * radius
        const py = cy + Math.sin(angle) * radius * 0.62
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

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.16)'
    ctx.beginPath()
    ctx.moveTo(cx, 6)
    ctx.lineTo(cx, h - 6)
    ctx.moveTo(6, cy)
    ctx.lineTo(w - 6, cy)
    ctx.stroke()
  }

  /* ==================== ③ 热力矩阵 ==================== */

  private readonly DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  /** 用 signal 持有：heatMax / heatTotal / heatPeak 是 computed，必须能被追踪到变化
   *  （若用普通字段，computed 在首轮变更检测时就固化了空数组的结果） */
  private readonly heat = signal<HeatCell[][]>([])
  readonly hover = signal<{ label: string; value: string } | null>(null)

  private buildHeat() {
    this.heat.set(this.DAYS.map((day, d) => (
      Array.from({ length: 24 }, (_, hour) => {
        // 双峰曲线：上午 10 点与下午 15 点各一个高峰，周末整体走低
        const peak = 90 * Math.exp(-((hour - 10) ** 2) / 14) + 76 * Math.exp(-((hour - 15) ** 2) / 18)
        const weekend = d >= 5 ? 0.32 : 1
        return { day, hour, value: Math.round(peak * weekend + randomInt(0, 8)) }
      })
    )))
  }

  private readonly heatFlat = computed(() => this.heat().flat())
  readonly heatMax = computed(() => Math.max(...this.heatFlat().map((c) => c.value), 1))
  readonly heatTotal = computed(() => this.heatFlat().reduce((acc, c) => acc + c.value, 0))
  readonly heatPeak = computed(() => this.heatFlat().reduce(
    (best, c) => (c.value > best.value ? c : best), { label: '—', value: 0 },
  ))

  private heatLayout = { cw: 0, ch: 0, padLeft: 0, padTop: 0 }

  /** 冷色 → 暖色线性插值（#f4f5ff → #a5b4fc → #f59e0b → #d9480f） */
  private heatColor(ratio: number): string {
    const stops = [
      { at: 0, hex: '#f4f5ff' },
      { at: 0.45, hex: '#a5b4fc' },
      { at: 0.72, hex: '#f59e0b' },
      { at: 1, hex: '#d9480f' },
    ]
    const t = clamp(ratio, 0, 1)
    let lo = stops[0]
    let hi = stops[stops.length - 1]
    for (let i = 0; i < stops.length - 1; i += 1) {
      if (t >= stops[i].at && t <= stops[i + 1].at) { lo = stops[i]; hi = stops[i + 1]; break }
    }
    const span = hi.at - lo.at || 1
    const a = hexToRgb(lo.hex)!
    const b = hexToRgb(hi.hex)!
    const k = (t - lo.at) / span
    return rgbToHex({
      r: a.r + (b.r - a.r) * k,
      g: a.g + (b.g - a.g) * k,
      b: a.b + (b.b - a.b) * k,
    })
  }

  private drawHeat() {
    const el = this.heatRef()?.nativeElement
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const w = el.clientWidth
    const h = el.clientHeight
    ctx.clearRect(0, 0, w, h)

    const padLeft = 44
    const padTop = 22
    const padBottom = 20
    const cw = (w - padLeft - 10) / 24
    const ch = (h - padTop - padBottom) / 7
    this.heatLayout = { cw, ch, padLeft, padTop }

    ctx.font = '10px -apple-system, sans-serif'
    ctx.fillStyle = '#a9b3c0'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    this.DAYS.forEach((d, i) => ctx.fillText(d, padLeft - 6, padTop + i * ch + ch / 2))
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let hh = 0; hh < 24; hh += 4) {
      ctx.fillText(`${hh}时`, padLeft + hh * cw + cw / 2, 5)
    }

    const max = this.heatMax()
    this.heat().forEach((row, r) => {
      row.forEach((cell, c) => {
        ctx.fillStyle = this.heatColor(cell.value / max)
        ctx.fillRect(padLeft + c * cw + 0.6, padTop + r * ch + 0.6, cw - 1.2, ch - 1.2)
      })
    })
  }

  onHeatMove(e: PointerEvent) {
    const el = this.heatRef()?.nativeElement
    if (!el) return
    const rect = el.getBoundingClientRect()
    const { cw, ch, padLeft, padTop } = this.heatLayout
    const col = Math.floor((e.clientX - rect.left - padLeft) / cw)
    const row = Math.floor((e.clientY - rect.top - padTop) / ch)
    const grid = this.heat()
    if (row < 0 || row > 6 || col < 0 || col > 23 || !grid.length) { this.hover.set(null); return }
    const cell = grid[row][col]
    this.hover.set({
      label: `${cell.day} ${String(cell.hour).padStart(2, '0')}:00`,
      value: `${cell.value} 次`,
    })
  }

  /* ==================== 生命周期 ==================== */

  private ro: ResizeObserver | null = null

  constructor() {
    afterNextRender(() => {
      this.buildHeat()
      this.redrawAll()
      this.tickGraph()
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this.redrawAll())
        for (const ref of [this.graphRef(), this.wordRef(), this.heatRef()]) {
          if (ref?.nativeElement) this.ro.observe(ref.nativeElement)
        }
      } else {
        window.addEventListener('resize', this.onWindowResize)
      }
    })
  }

  private readonly onWindowResize = () => this.redrawAll()

  private readonly redrawAll = () => {
    for (const ref of [this.graphRef(), this.wordRef(), this.heatRef()]) {
      const el = ref?.nativeElement
      if (!el) continue
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      el.width = el.clientWidth * dpr
      el.height = el.clientHeight * dpr
      el.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    this.seedGraph()
    this.drawWordCloud()
    this.drawHeat()
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.graphRaf)
    this.ro?.disconnect()
    window.removeEventListener('resize', this.onWindowResize)
  }
}
