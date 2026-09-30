import {
  ChangeDetectionStrategy, Component, ElementRef, type OnDestroy, afterNextRender,
  computed, signal, viewChild,
} from '@angular/core'
import { clamp, hexToRgbaString, lerp } from '../../utils'
import { ORBIT_DATA, type OrbitBody as OrbitalBody } from '../../data/orbit'

/**
 * 星际轨道（Angular 版）
 *
 * **数据全部来自 Python**：`scripts/orbit-data.py` 用 JPL 的 J2000 轨道要素（带每儒略世纪
 * 变化率）外推到目标历元，解开普勒方程，输出日心黄道三维坐标采样点 + 真实周期 / 速度 / 距离。
 * 本视图只做三件事：比例压缩、视角投影、动画插值 —— 一行天体力学都不算。
 *
 * 与 vue-app 的 `pages/OrbitLab.vue`、主应用的 `pages/OrbitLab` 一一对应。
 *
 * 渲染约定（和三端都不一样的做法）：
 *   画布用普通字段 `simDays` 逐帧推进，**不碰信号**；面板需要的快照按 ~8Hz `set` 进 `elapsed` 信号。
 *   如果让信号每帧变一次，OnPush 组件会被 60fps 重渲染（Angular 的模板函数调用比 Vue/React 贵）。
 *   对照：React 版是 rAF 直写 DOM，Vue 版是节流回写 ref。
 */

/* ============================ 数据解包（模块级，只做一次） ============================ */

const { meta, sun: SUN, planets: BODIES } = ORBIT_DATA
const SAMPLES = meta.samples
const AU_KM = 149597870.7
const DAY_MS = 86400000
const EPOCH_MS = Date.parse(meta.epoch)
const TAU = Math.PI * 2
const DEG = Math.PI / 180

/** 默认锁定地球（数据里第 3 项，下标 2） */
const DEFAULT_PICK = 2

/** 星体绘制半径：真实半径取对数压缩，否则木星要画成水星的 29 倍 */
const sizeOf = (radiusKm: number) => Math.max(2.8, 3.0 + 2.6 * Math.log10(radiusKm / 2400))

/**
 * 径向压缩：日心距 r → 画布半径 r'。
 * 三个模式刻意并列对照 —— 越往下把内侧拉得越开，但相对间距越不真实。
 */
const COMPRESS: Record<string, (r: number) => number> = {
  linear: (r) => r,
  sqrt: (r) => Math.sqrt(r),
  log: (r) => Math.log10(1 + r / 0.2),
}

const SCALE_MODES = [
  { key: 'linear', label: '真实比例', hint: '1 : 1 线性 —— 内行星会挤进太阳的光晕里，这就是「真实比例下地球只有一个像素」' },
  { key: 'sqrt', label: '平方根', hint: 'r → √r —— 内行星拉开到看得见，外行星的相对间距还保留' },
  { key: 'log', label: '对数', hint: 'r → log₁₀(1 + r/0.2) —— 压缩最狠，八条轨道几乎等间距' },
]

const MAX_COMPRESSED: Record<string, number> = Object.fromEntries(
  SCALE_MODES.map(({ key }) => [key, COMPRESS[key](BODIES[BODIES.length - 1].aphelionAU)]),
)

/**
 * 按周期比例取当前位置（线性插值）。
 * 采样点下标 k 对应平近点角 M = meanAnomaly + 360·k/SAMPLES，而 M 与时间成正比，
 * 所以「按时间均匀」=「按下标均匀」，插值误差在屏幕上小于 0.04px。
 */
function positionAt(body: OrbitalBody, phase: number) {
  const { x, y, z } = body.orbit
  const f = (((phase % 1) + 1) % 1) * SAMPLES
  const i0 = Math.floor(f) % SAMPLES
  const i1 = (i0 + 1) % SAMPLES
  const t = f - Math.floor(f)
  return {
    x: lerp(x[i0], x[i1], t),
    y: lerp(y[i0], y[i1], t),
    z: lerp(z[i0], z[i1], t),
  }
}

const radiusOf = (p: { x: number; y: number; z: number }) => Math.hypot(p.x, p.y, p.z)

/** 瞬时速度（km/s）：对相邻采样点做数值微分 —— 间隔恒为 P/SAMPLES 天，只读数据 */
function instantSpeed(body: OrbitalBody, phase: number) {
  const a = positionAt(body, phase)
  const b = positionAt(body, phase + 1 / SAMPLES)
  const dr = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
  const dt = (body.periodDays / SAMPLES) * 86400
  return (dr * AU_KM) / dt
}

function zoneTextOf(body: OrbitalBody, phase: number) {
  const r = radiusOf(positionAt(body, phase))
  const mid = (body.perihelionAU + body.aphelionAU) / 2
  if (r < lerp(body.perihelionAU, mid, 0.34)) return '近日点附近（最快）'
  if (r < mid) return '离开近日点'
  if (r < lerp(mid, body.aphelionAU, 0.66)) return '接近远日点'
  return '远日点附近（最慢）'
}

function simDate(days: number) {
  const d = new Date(EPOCH_MS + days * DAY_MS)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function formatDays(days: number) {
  const d = Math.max(0, days)
  if (d < 1000) return `${d.toFixed(1)} 天`
  if (d < 365250) return `${(d / 365.25).toFixed(2)} 年`
  return `${(d / 365250).toFixed(2)} 千年`
}

@Component({
  selector: 'app-orbit-lab-view',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="orbit">
      <header class="orbit-head">
        <h1>星际轨道</h1>
        <p>
          轨道要素来自 <b>Python</b>：<code>scripts/orbit-data.py</code> 用 JPL 的 J2000 要素
          （含每儒略世纪变化率）外推到历元 {{ meta.epoch.slice(0, 10) }}，解开普勒方程
          <code>M = E - e&#64;sinE</code>，输出日心黄道三维坐标。前端只负责压缩、投影和动画。
        </p>
      </header>

      <section class="orbit-card">
        <div class="orbit-stage">
          <canvas
            #stage
            class="orbit-canvas"
            (pointermove)="onPointerMove($event)"
            (pointerleave)="onPointerLeave()"
            (click)="onClickStage($event)"
          ></canvas>

          <!-- 参数面板常显（默认锁定地球）—— 真实量，不留占位符 -->
          <div class="orbit-panel">
            <div class="orbit-panel__title">
              <span class="orbit-panel__dot" [style.background]="focused().color"></span>
              <b>{{ focused().name }}</b>
              <em>{{ focused().en }}</em>
              @if (pinned()) {
                <i class="orbit-panel__pin">已锁定</i>
              }
            </div>
            <dl class="orbit-panel__grid">
              <div><dt>日心距 r</dt><dd>{{ focusedRadius().toFixed(3) }} AU</dd></div>
              <div><dt>瞬时速度</dt><dd>{{ focusedSpeed().toFixed(2) }} km/s</dd></div>
              <div><dt>半长轴 a</dt><dd>{{ focused().a.toFixed(4) }} AU</dd></div>
              <div><dt>偏心率 e</dt><dd>{{ focused().e.toFixed(4) }}</dd></div>
              <div><dt>轨道倾角 i</dt><dd>{{ focused().incl.toFixed(2) }}°</dd></div>
              <div><dt>公转周期 P</dt><dd>{{ periodText(focused()) }}</dd></div>
              <div><dt>近日点</dt><dd>{{ focused().perihelionAU.toFixed(4) }} AU</dd></div>
              <div><dt>远日点</dt><dd>{{ focused().aphelionAU.toFixed(4) }} AU</dd></div>
              <div>
                <dt>速度区间</dt>
                <dd>{{ focused().speed.perihelion.toFixed(2) }} ~ {{ focused().speed.aphelion.toFixed(2) }}</dd>
              </div>
              <div><dt>所处区段</dt><dd>{{ focusedZone() }}</dd></div>
            </dl>
            <p class="orbit-panel__note">
              {{ focused().note }}<br />
              平均半径 {{ focused().radiusKm.toLocaleString() }} km · 质量 {{ focused().massEarth }} 地球
              @if (focused().moons > 0) {
                · 已知卫星 {{ focused().moons }} 颗（画布上示意 {{ moonShown(focused()) }} 颗）
              }
            </p>
          </div>
        </div>

        <div class="orbit-controls">
          <span class="orbit-label">比例模式</span>
          <span class="orbit-tabs">
            @for (m of SCALE_MODES; track m.key) {
              <button
                type="button"
                class="orbit-tab"
                [class.is-on]="m.key === scaleMode()"
                [title]="m.hint"
                (click)="setScaleMode(m.key)"
              >{{ m.label }}</button>
            }
          </span>

          <span class="orbit-label">视角</span>
          <input type="range" min="0" max="80" step="1" [value]="tilt()" (input)="onTilt($event)" />
          <span class="orbit-tag">{{ tilt() }}°</span>

          <span class="orbit-label">时间倍速</span>
          <input type="range" min="0" max="4" step="0.05" [value]="speedExp()" (input)="onSpeed($event)" />
          <span class="orbit-tag">{{ speedText(daysPerSec()) }}</span>

          <button class="orbit-btn" [class.is-on]="paused()" (click)="paused.set(!paused())">
            {{ paused() ? '继续' : '暂停' }}
          </button>
          <button class="orbit-btn" (click)="resetEpoch()">回到历元</button>

          <label class="orbit-check">
            <input type="checkbox" [checked]="showOrbits()" (change)="toggle('orbits')" />轨道线
          </label>
          <label class="orbit-check">
            <input type="checkbox" [checked]="showTrails()" (change)="toggle('trails')" />轨迹
          </label>
          <label class="orbit-check">
            <input type="checkbox" [checked]="showLabels()" (change)="toggle('labels')" />名称
          </label>

          <span class="orbit-spacer"></span>
          <span class="orbit-tag info">点画布上的行星可锁定</span>
          <span class="orbit-tag ok">{{ clockText() }}</span>
        </div>

        <p class="orbit-hint">{{ currentMode().hint }}</p>
      </section>

      <section class="orbit-card">
        <h3>这份数据里能看出什么</h3>
        <ul class="orbit-notes">
          <li>
            <b>近日点更快</b>：瞬时速度那一栏是活的 —— 水星近日点 58.98 km/s、远日点 38.73 km/s，
            差出 52%（活力公式 v = √(GM(2/r − 1/a))，Python 侧算的）。
          </li>
          <li>
            <b>轨道倾角是真的</b>：把视角拉满 80° 看，八条轨道不在同一个平面 ——
            水星偏 7.0°、金星 3.4°、地球在黄道面内（0°），这就是「黄道」这个词的来历。
          </li>
          <li>
            <b>「真实比例」是有代价的</b>：切到 1:1 线性模式，海王星 30.07 AU 撑满画布，
            水星（0.31~0.47 AU）只剩 3px，直接埋进太阳光晕 —— 天文插图几乎都偷偷做过压缩。
          </li>
          <li>
            <b>周期差 683 倍</b>：水星 88 天、海王星 164.79 年。倍速拉到最大时内行星糊成光带、
            外行星才刚挪一点 —— 时间尺度没法同时伺候两者。
          </li>
        </ul>
        <p class="orbit-meta">
          数据：{{ sourceText() }} · 历元 {{ meta.epoch }}（JD {{ meta.julianDay }}，
          J2000 后 {{ meta.centuriesSinceJ2000 }} 儒略世纪）· 每颗行星 {{ SAMPLES }} 个采样点 ·
          中心天体 <b>{{ SUN.name }}</b> 半径 {{ SUN.radiusKm.toLocaleString() }} km ·
          生成脚本 <code>scripts/orbit-data.py</code>
        </p>
      </section>
    </div>
  `,
  styles: [`
    .orbit { padding: 18px 22px 44px; }
    .orbit-head h1 { margin: 0 0 4px; font-size: 20px; }
    .orbit-head p { margin: 0 0 16px; font-size: 12.5px; color: #8a929f; line-height: 1.85; }
    .orbit-head code { font-size: 11.5px; background: #f2f4f7; border-radius: 4px; padding: 1px 5px; }

    .orbit-card { border: 1px solid #e3e6eb; border-radius: 10px; padding: 16px 18px; margin-bottom: 14px; background: #fff; }
    .orbit-card h3 { margin: 0 0 8px; font-size: 15px; }

    .orbit-stage { position: relative; }
    .orbit-canvas { display: block; width: 100%; height: 520px; border-radius: 12px; background: #04060d; touch-action: none; }

    .orbit-panel { position: absolute; left: 14px; top: 14px; width: 300px; padding: 12px 14px; border-radius: 10px;
      background: rgba(9, 14, 26, 0.86); border: 1px solid rgba(140, 165, 220, 0.3); backdrop-filter: blur(6px);
      color: #e6ecfa; pointer-events: none; }
    .orbit-panel__title { display: flex; align-items: baseline; gap: 7px; margin-bottom: 9px; }
    .orbit-panel__dot { width: 9px; height: 9px; border-radius: 50%; }
    .orbit-panel__title b { font-size: 14px; }
    .orbit-panel__title em { font-style: normal; font-size: 11px; opacity: 0.6; }
    .orbit-panel__pin { margin-left: auto; font-style: normal; font-size: 10px; padding: 1px 7px; border-radius: 999px; color: #c7d5ff; background: rgba(99, 132, 255, 0.26); }
    .orbit-panel__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 10px; margin: 0; }
    .orbit-panel__grid div { display: flex; flex-direction: column; gap: 1px; }
    .orbit-panel__grid dt { font-size: 10px; opacity: 0.55; }
    .orbit-panel__grid dd { margin: 0; font-size: 12px; font-variant-numeric: tabular-nums; font-family: 'SF Mono', Monaco, ui-monospace, monospace; }
    .orbit-panel__note { margin: 10px 0 0; font-size: 11.5px; line-height: 1.7; opacity: 0.82; border-top: 1px solid rgba(140, 165, 220, 0.22); padding-top: 8px; }

    .orbit-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
    .orbit-label { font-size: 12.5px; color: #4b5563; }
    .orbit-spacer { flex: 1; }
    .orbit-controls input[type='range'] { width: 150px; accent-color: #6366f1; }
    .orbit-btn { border: 1px solid #d4d7de; border-radius: 6px; background: #fff; padding: 6px 14px; font-size: 12.5px; cursor: pointer; }
    .orbit-btn:hover { border-color: #6366f1; color: #6366f1; }
    .orbit-btn.is-on { border-color: #22c55e; color: #15803d; background: #f0fdf4; }
    .orbit-check { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: #4b5563; cursor: pointer; }
    .orbit-tag { padding: 3px 9px; border-radius: 999px; background: #f0f2f5; color: #4b5563; font-size: 12px; font-variant-numeric: tabular-nums; }
    .orbit-tag.ok { background: #eef2ff; color: #4f46e5; }
    .orbit-tag.info { background: transparent; border: 1px dashed #d4d7de; color: #6b7280; }

    /* 比例模式：三选一分段控件 */
    .orbit-tabs { display: inline-flex; padding: 2px; border: 1px solid #e3e6eb; border-radius: 7px; background: #f6f7f9; }
    .orbit-tab { border: 0; border-radius: 5px; padding: 4px 11px; font-size: 12px; color: #4b5563; background: transparent; cursor: pointer; }
    .orbit-tab:hover { color: #6366f1; }
    .orbit-tab.is-on { color: #fff; background: linear-gradient(135deg, #6366f1, #4338ca); }

    .orbit-hint { margin: 10px 0 0; padding-left: 10px; border-left: 2px solid #6366f1; font-size: 12px; color: #8a929f; line-height: 1.7; }

    .orbit-notes { margin: 0; padding-left: 18px; }
    .orbit-notes li { font-size: 12.5px; color: #4b5563; line-height: 2; }
    .orbit-notes code { font-size: 11.5px; background: #f2f4f7; border-radius: 4px; padding: 1px 5px; }

    .orbit-meta { margin: 12px 0 0; padding-top: 10px; border-top: 1px dashed #e3e6eb; font-size: 11.5px; color: #8a929f; line-height: 1.9; }
    .orbit-meta code { background: #f2f4f7; border-radius: 4px; padding: 1px 5px; }
  `],
})
export class OrbitLabView implements OnDestroy {
  private readonly stageRef = viewChild<ElementRef<HTMLCanvasElement>>('stage')

  readonly BODIES = BODIES
  readonly SCALE_MODES = SCALE_MODES
  readonly SAMPLES = SAMPLES
  readonly meta = meta
  readonly SUN = SUN

  /* ==================== 运行状态 ==================== */

  readonly scaleMode = signal('sqrt')
  readonly tilt = signal(25)
  readonly speedExp = signal(1.3)
  readonly paused = signal(false)
  readonly showOrbits = signal(true)
  readonly showTrails = signal(true)
  readonly showLabels = signal(true)
  readonly hoverIndex = signal(-1)
  /** 默认锁定地球（下标 2）—— 面板一进来就是完整的，不需要先点 */
  readonly pickedIndex = signal(DEFAULT_PICK)
  /** 面板显示用的时钟快照：按 ~8Hz 回写，不跟着 60fps 变（见类注释） */
  readonly elapsed = signal(0)

  readonly daysPerSec = computed(() => 10 ** this.speedExp())

  private readonly focusedIndex = computed(
    () => (this.hoverIndex() >= 0 ? this.hoverIndex() : this.pickedIndex()),
  )
  readonly focused = computed(() => BODIES[this.focusedIndex()] || BODIES[0])
  readonly pinned = computed(() => this.focusedIndex() === this.pickedIndex())
  private readonly focusedPhase = computed(() => this.elapsed() / this.focused().periodDays)
  readonly focusedRadius = computed(() => radiusOf(positionAt(this.focused(), this.focusedPhase())))
  readonly focusedSpeed = computed(() => instantSpeed(this.focused(), this.focusedPhase()))
  readonly focusedZone = computed(() => zoneTextOf(this.focused(), this.focusedPhase()))
  readonly clockText = computed(() => `${formatDays(this.elapsed())} · ${simDate(this.elapsed())}`)
  readonly currentMode = computed(
    () => SCALE_MODES.find((m) => m.key === this.scaleMode()) || SCALE_MODES[1],
  )
  readonly sourceText = computed(() => meta.source.split('(')[0].trim())

  setScaleMode(key: string) { this.scaleMode.set(key) }
  onTilt(e: Event) { this.tilt.set(Number((e.target as HTMLInputElement).value)) }
  onSpeed(e: Event) {
    this.speedExp.set(Number((e.target as HTMLInputElement).value))
    this.lastTs = 0 // 换挡时先吃一个 dt=0 的帧，避免进度跳变
  }

  toggle(which: 'orbits' | 'trails' | 'labels') {
    if (which === 'orbits') this.showOrbits.update((v) => !v)
    if (which === 'labels') this.showLabels.update((v) => !v)
    if (which === 'trails') {
      this.showTrails.update((v) => !v)
      // 关掉轨迹时清空历史，重新打开后从当前位置重新长出来
      if (!this.showTrails()) for (const t of this.trails) t.length = 0
    }
  }

  resetEpoch() {
    this.simDays = 0
    this.elapsed.set(0)
    this.lastTs = 0
    this.lastSync = 0
    for (const t of this.trails) t.length = 0
  }

  /* 模板里要用的纯函数（Angular 模板拿不到 Math 这类全局对象） */
  moonShown(body: OrbitalBody): number { return Math.min(body.moons, 4) }
  speedText(dps: number): string { return dps < 10 ? `${dps.toFixed(2)} 天/秒` : `${Math.round(dps)} 天/秒` }
  periodText(body: OrbitalBody): string {
    return body.periodYears >= 1
      ? `${body.periodYears.toFixed(2)} 年`
      : `${body.periodDays.toFixed(2)} 天`
  }

  /* ==================== 渲染 ==================== */

  /** 逐帧推进的真值 —— 刻意不进信号，理由见类注释 */
  private simDays = 0
  private lastSync = 0
  private readonly SYNC_MS = 120

  private ctx: CanvasRenderingContext2D | null = null
  private rafId = 0
  private lastTs = 0
  private stars: { nx: number; ny: number; r: number; a: number; tw: number }[] = []
  private trails: { x: number; y: number }[][] = []
  private moonAngle = 0
  private screen: { x: number; y: number }[] = []
  private k = 1
  private cacheKey = ''
  private paths: { x: number; y: number }[][] = []
  private ro: ResizeObserver | null = null

  private resize() {
    const el = this.stageRef()?.nativeElement
    if (!el) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    el.width = el.clientWidth * dpr
    el.height = el.clientHeight * dpr
    this.ctx = el.getContext('2d')
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.lastTs = 0
    this.cacheKey = ''
    // 星空位置用归一化坐标存，resize 时按新尺寸重排，星星不会跟着缩放漂移
    this.stars = Array.from({ length: 150 }, () => ({
      nx: Math.random(), ny: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      a: Math.random() * 0.55 + 0.25,
      tw: Math.random() * TAU,
    }))
  }

  private project(x: number, y: number, z: number, scale: number, tiltRad: number, cx: number, cy: number) {
    return {
      x: cx + x * scale,
      y: cy + (y * Math.cos(tiltRad) - z * Math.sin(tiltRad)) * scale,
    }
  }

  /** 把 Python 给的 180 个三维采样点做「径向压缩 → 视角投影」，得到每条轨道的屏幕折线 */
  private buildPaths(w: number, h: number) {
    const cx = w / 2
    const cy = h / 2
    const tiltRad = this.tilt() * DEG
    const mode = this.scaleMode()
    const compress = COMPRESS[mode]
    this.k = (Math.min(w, h) / 2 - 34) / MAX_COMPRESSED[mode]
    this.paths = BODIES.map((body) => {
      const { x, y, z } = body.orbit
      const pts: { x: number; y: number }[] = new Array(SAMPLES + 1)
      for (let i = 0; i <= SAMPLES; i += 1) {
        const j = i % SAMPLES
        const r = Math.hypot(x[j], y[j], z[j]) || 1e-9
        const f = compress(r) / r
        pts[i] = this.project(x[j] * f, y[j] * f, z[j] * f, this.k, tiltRad, cx, cy)
      }
      return pts
    })
  }

  private drawBackground(w: number, h: number, ts: number) {
    const ctx = this.ctx
    if (!ctx) return
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
    g.addColorStop(0, '#0e1830')
    g.addColorStop(1, '#04060d')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    for (const s of this.stars) {
      ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(ts / 900 + s.tw))
      ctx.fillStyle = '#dfe8ff'
      ctx.beginPath()
      ctx.arc(s.nx * w, s.ny * h, s.r, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private drawOrbitPath(index: number) {
    const ctx = this.ctx
    if (!ctx) return
    const pts = this.paths[index]
    ctx.beginPath()
    for (let i = 0; i <= SAMPLES; i += 1) {
      if (i === 0) ctx.moveTo(pts[0].x, pts[0].y)
      else ctx.lineTo(pts[i].x, pts[i].y)
    }
    ctx.strokeStyle = hexToRgbaString(BODIES[index].color, 0.3)
    ctx.lineWidth = 1
    ctx.stroke()
  }

  private drawSun(cx: number, cy: number, ts: number) {
    const ctx = this.ctx
    if (!ctx) return
    const pulse = 1 + 0.07 * Math.sin(ts / 620)
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30 * pulse)
    glow.addColorStop(0, 'rgba(255, 232, 160, 0.95)')
    glow.addColorStop(0.28, 'rgba(255, 186, 74, 0.4)')
    glow.addColorStop(1, 'rgba(255, 140, 20, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(cx, cy, 30 * pulse, 0, TAU)
    ctx.fill()

    ctx.fillStyle = '#fff3c4'
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, TAU)
    ctx.fill()
  }

  private drawBody(body: OrbitalBody, index: number, cx: number, cy: number, tiltRad: number) {
    const ctx = this.ctx
    if (!ctx) return { x: cx, y: cy }
    const phase = this.simDays / body.periodDays
    const raw = positionAt(body, phase)
    const r = radiusOf(raw) || 1e-9
    const f = COMPRESS[this.scaleMode()](r) / r
    const p = this.project(raw.x * f, raw.y * f, raw.z * f, this.k, tiltRad, cx, cy)
    const x = p.x
    const y = p.y
    const size = sizeOf(body.radiusKm)
    const isFocus = index === this.pickedIndex() || index === this.hoverIndex()

    if (this.showTrails()) {
      const trail = this.trails[index]
      trail.push({ x, y })
      if (trail.length > 90) trail.shift()
      for (let i = 1; i < trail.length; i += 1) {
        const a = (i / trail.length) * 0.55
        ctx.strokeStyle = hexToRgbaString(body.color, a)
        ctx.lineWidth = clamp(a * 5, 0.6, 2.4)
        ctx.beginPath()
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
        ctx.lineTo(trail[i].x, trail[i].y)
        ctx.stroke()
      }
    }

    /* 光环：视角越大看起来越「开」 */
    if (body.ring) {
      ctx.save()
      ctx.translate(x, y)
      for (const [rm, rw] of [[size * 2.2, 2.6], [size * 1.6, 1.8]]) {
        ctx.beginPath()
        ctx.ellipse(0, 0, rm, rm * lerp(0.18, 0.5, Math.abs(Math.cos(tiltRad))), 0, 0, TAU)
        ctx.strokeStyle = hexToRgbaString(body.color, 0.6)
        ctx.lineWidth = rw
        ctx.stroke()
      }
      ctx.restore()
    }

    if (isFocus) {
      ctx.beginPath()
      ctx.arc(x, y, size + 7, 0, TAU)
      ctx.strokeStyle = hexToRgbaString(body.color, 0.55)
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3])
      ctx.stroke()
      ctx.setLineDash([])
    }

    const grad = ctx.createRadialGradient(x - size * 0.35, y - size * 0.35, 0, x, y, size)
    grad.addColorStop(0, '#ffffff')
    grad.addColorStop(0.34, body.color)
    grad.addColorStop(1, hexToRgbaString(body.color, 0.75))
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, size, 0, TAU)
    ctx.fill()

    /* 卫星：真实数目最多 274 颗，画布上只示意 4 颗 */
    const shown = Math.min(body.moons, 4)
    for (let m = 0; m < shown; m += 1) {
      const ang = this.moonAngle + (m * TAU) / shown
      const rm = size + 7 + m * 4.5
      ctx.fillStyle = '#cfd6e4'
      ctx.beginPath()
      ctx.arc(x + Math.cos(ang) * rm, y + Math.sin(ang) * rm * 0.4, 1.6, 0, TAU)
      ctx.fill()
    }

    if (this.showLabels() || isFocus) {
      ctx.font = '11px -apple-system, "PingFang SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const tw = ctx.measureText(body.name).width
      ctx.fillStyle = 'rgba(6, 10, 20, 0.62)'
      ctx.fillRect(x - tw / 2 - 4, y + size + 4, tw + 8, 15)
      ctx.fillStyle = isFocus ? '#ffffff' : 'rgba(226, 234, 250, 0.82)'
      ctx.fillText(body.name, x, y + size + 6)
    }

    return { x, y }
  }

  private readonly frame = (ts: number) => {
    const el = this.stageRef()?.nativeElement
    if (!el || !this.ctx) return
    const w = el.clientWidth
    const h = el.clientHeight
    const dt = this.lastTs ? Math.min((ts - this.lastTs) / 1000, 0.05) : 0
    this.lastTs = ts

    if (!this.paused()) {
      this.simDays += dt * this.daysPerSec()
      this.moonAngle += dt * 0.6
    }
    /* 面板快照按 ~8Hz 回写信号，画布仍是 60fps */
    if (ts - this.lastSync > this.SYNC_MS) {
      this.lastSync = ts
      this.elapsed.set(this.simDays)
    }

    const tiltRad = this.tilt() * DEG
    const key = `${this.scaleMode()}|${this.tilt()}|${w}x${h}`
    if (key !== this.cacheKey) {
      this.cacheKey = key
      this.buildPaths(w, h)
    }

    this.drawBackground(w, h, ts)
    const cx = w / 2
    const cy = h / 2
    if (this.showOrbits()) for (let i = 0; i < BODIES.length; i += 1) this.drawOrbitPath(i)
    this.drawSun(cx, cy, ts)
    this.screen = BODIES.map((b, i) => this.drawBody(b, i, cx, cy, tiltRad))

    this.rafId = requestAnimationFrame(this.frame)
  }

  /* ==================== 交互 ==================== */

  private hitTest(e: PointerEvent | MouseEvent): number {
    const el = this.stageRef()?.nativeElement
    if (!el) return -1
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    for (let i = BODIES.length - 1; i >= 0; i -= 1) {
      const p = this.screen[i]
      if (!p) continue
      if (Math.hypot(p.x - x, p.y - y) <= sizeOf(BODIES[i].radiusKm) + 9) return i
    }
    return -1
  }

  onPointerMove(e: PointerEvent) {
    const i = this.hitTest(e)
    this.hoverIndex.set(i)
    const el = this.stageRef()?.nativeElement
    if (el) el.style.cursor = i >= 0 ? 'pointer' : 'default'
  }

  onPointerLeave() { this.hoverIndex.set(-1) }

  onClickStage(e: MouseEvent) {
    const i = this.hitTest(e)
    // 点空处不解锁 —— 保证面板永远有内容
    if (i < 0 || this.pickedIndex() === i) return
    this.pickedIndex.set(i)
  }

  /* ==================== 生命周期 ==================== */

  constructor() {
    this.trails = BODIES.map(() => [])
    afterNextRender(() => {
      this.resize()
      this.rafId = requestAnimationFrame(this.frame)
      const el = this.stageRef()?.nativeElement
      if (el && typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this.resize())
        this.ro.observe(el)
      } else {
        window.addEventListener('resize', this.onWindowResize)
      }
    })
  }

  private readonly onWindowResize = () => this.resize()

  ngOnDestroy() {
    cancelAnimationFrame(this.rafId)
    this.ro?.disconnect()
    window.removeEventListener('resize', this.onWindowResize)
  }
}
