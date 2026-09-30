<template>
  <div class="orbit">
    <header class="orbit-head">
      <h1>星际轨道</h1>
      <p>
        轨道要素来自 <b>Python</b>：<code>scripts/orbit-data.py</code> 用 JPL 的 J2000 要素
        （含每儒略世纪变化率）外推到历元 {{ meta.epoch.slice(0, 10) }}，解开普勒方程
        <code>M = E - e·sinE</code>，输出日心黄道三维坐标。前端只负责压缩、投影和动画。
      </p>
    </header>

    <section class="orbit-card">
      <div class="orbit-stage">
        <canvas
          ref="stage"
          class="orbit-canvas"
          @pointermove="onPointerMove"
          @pointerleave="hoverIndex = -1"
          @click="onClickStage"
        />
        <!-- 参数面板常显（默认锁定地球）—— 真实量，不留占位符 -->
        <div class="orbit-panel">
          <div class="orbit-panel__title">
            <span class="orbit-panel__dot" :style="{ background: focused.color }" />
            <b>{{ focused.name }}</b>
            <em>{{ focused.en }}</em>
            <i v-if="pinned" class="orbit-panel__pin">已锁定</i>
          </div>
          <dl class="orbit-panel__grid">
            <div><dt>日心距 r</dt><dd>{{ focusedRadius.toFixed(3) }} AU</dd></div>
            <div><dt>瞬时速度</dt><dd>{{ focusedSpeed.toFixed(2) }} km/s</dd></div>
            <div><dt>半长轴 a</dt><dd>{{ focused.a.toFixed(4) }} AU</dd></div>
            <div><dt>偏心率 e</dt><dd>{{ focused.e.toFixed(4) }}</dd></div>
            <div><dt>轨道倾角 i</dt><dd>{{ focused.incl.toFixed(2) }}°</dd></div>
            <div><dt>公转周期 P</dt><dd>{{ periodText(focused) }}</dd></div>
            <div><dt>近日点</dt><dd>{{ focused.perihelionAU.toFixed(4) }} AU</dd></div>
            <div><dt>远日点</dt><dd>{{ focused.aphelionAU.toFixed(4) }} AU</dd></div>
            <div><dt>速度区间</dt><dd>{{ focused.speed.perihelion.toFixed(2) }} ~ {{ focused.speed.aphelion.toFixed(2) }}</dd></div>
            <div><dt>所处区段</dt><dd>{{ focusedZone }}</dd></div>
          </dl>
          <p class="orbit-panel__note">
            {{ focused.note }}<br />
            平均半径 {{ focused.radiusKm.toLocaleString() }} km · 质量 {{ focused.massEarth }} 地球<template
              v-if="focused.moons > 0"
            > · 已知卫星 {{ focused.moons }} 颗（画布上示意 {{ Math.min(focused.moons, 4) }} 颗）</template>
          </p>
        </div>
      </div>

      <div class="orbit-controls">
        <span class="orbit-label">比例模式</span>
        <el-radio-group :model-value="scaleMode" size="small" @change="onScaleMode">
          <el-radio-button v-for="m in SCALE_MODES" :key="m.key" :value="m.key" :title="m.hint">
            {{ m.label }}
          </el-radio-button>
        </el-radio-group>

        <span class="orbit-label">视角</span>
        <el-slider v-model="tilt" :min="0" :max="80" :step="1" :format-tooltip="(v) => `${v}°`" style="width: 96px" />
        <el-tag size="small" type="info">{{ tilt }}°</el-tag>

        <span class="orbit-label">时间倍速</span>
        <el-slider
          v-model="speedExp" :min="0" :max="4" :step="0.05"
          :format-tooltip="(v) => speedText(10 ** v)" style="width: 150px"
        />
        <el-tag size="small" type="info">{{ speedText(daysPerSec) }}</el-tag>

        <el-button size="small" :type="paused ? 'success' : 'default'" @click="paused = !paused">
          {{ paused ? '继续' : '暂停' }}
        </el-button>
        <el-button size="small" @click="resetEpoch">回到历元</el-button>

        <el-checkbox v-model="showOrbits" label="轨道线" size="small" />
        <el-checkbox v-model="showTrails" label="轨迹" size="small" />
        <el-checkbox v-model="showLabels" label="名称" size="small" />

        <span class="orbit-spacer" />
        <el-tag size="small" type="info">点画布上的行星可锁定</el-tag>
        <el-tag size="small" type="success">{{ clockText }}</el-tag>
      </div>

      <p class="orbit-hint">{{ currentMode.hint }}</p>
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
        数据：{{ meta.source.split('(')[0].trim() }} · 历元 {{ meta.epoch }}（JD {{ meta.julianDay }}，
        J2000 后 {{ meta.centuriesSinceJ2000 }} 儒略世纪）· 每颗行星 {{ SAMPLES }} 个采样点 ·
        中心天体 <b>{{ SUN.name }}</b> 半径 {{ SUN.radiusKm.toLocaleString() }} km ·
        生成脚本 <code>scripts/orbit-data.py</code>
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ORBIT_DATA } from '../data/orbit.js'
import { clamp, hexToRgbaString, lerp } from '../utils'

/* ============================ 数据解包 ============================ */

const { meta, sun: SUN, planets: BODIES } = ORBIT_DATA
const SAMPLES = meta.samples
const AU_KM = 149597870.7
const DAY_MS = 86400000
const EPOCH_MS = Date.parse(meta.epoch)
const TAU = Math.PI * 2
const DEG = Math.PI / 180

/** 默认锁定地球（数据里第 3 项，下标 2） */
const DEFAULT_PICK = 2

/* ============================ 纯函数 ============================ */

/** 星体绘制半径：真实半径取对数压缩，否则木星要画成水星的 29 倍 */
const sizeOf = (radiusKm) => Math.max(2.8, 3.0 + 2.6 * Math.log10(radiusKm / 2400))

/**
 * 径向压缩：日心距 r → 画布半径 r'。
 * 三个模式刻意并列对照 —— 越往下把内侧拉得越开，但相对间距越不真实。
 */
const COMPRESS = {
  linear: (r) => r,
  sqrt: (r) => Math.sqrt(r),
  log: (r) => Math.log10(1 + r / 0.2),
}

const SCALE_MODES = [
  { key: 'linear', label: '真实比例', hint: '1 : 1 线性 —— 内行星会挤进太阳的光晕里，这就是「真实比例下地球只有一个像素」' },
  { key: 'sqrt', label: '平方根', hint: 'r → √r —— 内行星拉开到看得见，外行星的相对间距还保留' },
  { key: 'log', label: '对数', hint: 'r → log₁₀(1 + r/0.2) —— 压缩最狠，八条轨道几乎等间距' },
]

const MAX_COMPRESSED = Object.fromEntries(
  SCALE_MODES.map(({ key }) => [key, COMPRESS[key](BODIES[BODIES.length - 1].aphelionAU)]),
)

/**
 * 按周期比例取当前位置（线性插值）。
 * 采样点下标 k 对应平近点角 M = meanAnomaly + 360·k/SAMPLES，而 M 与时间成正比，
 * 所以「按时间均匀」=「按下标均匀」，插值误差在屏幕上小于 0.04px。
 */
const positionAt = (body, phase) => {
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

const radiusOf = (p) => Math.hypot(p.x, p.y, p.z)

/** 瞬时速度（km/s）：对相邻采样点做数值微分 —— 间隔恒为 P/SAMPLES 天，只读数据 */
const instantSpeed = (body, phase) => {
  const a = positionAt(body, phase)
  const b = positionAt(body, phase + 1 / SAMPLES)
  const dr = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
  const dt = (body.periodDays / SAMPLES) * 86400
  return (dr * AU_KM) / dt
}

const zoneTextOf = (body, phase) => {
  const r = radiusOf(positionAt(body, phase))
  const mid = (body.perihelionAU + body.aphelionAU) / 2
  if (r < lerp(body.perihelionAU, mid, 0.34)) return '近日点附近（最快）'
  if (r < mid) return '离开近日点'
  if (r < lerp(mid, body.aphelionAU, 0.66)) return '接近远日点'
  return '远日点附近（最慢）'
}

const simDate = (days) => {
  const d = new Date(EPOCH_MS + days * DAY_MS)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

const formatDays = (days) => {
  const d = Math.max(0, days)
  if (d < 1000) return `${d.toFixed(1)} 天`
  if (d < 365250) return `${(d / 365.25).toFixed(2)} 年`
  return `${(d / 365250).toFixed(2)} 千年`
}

const speedText = (dps) => (dps < 10 ? `${dps.toFixed(2)} 天/秒` : `${Math.round(dps)} 天/秒`)
const periodText = (body) => (
  body.periodYears >= 1 ? `${body.periodYears.toFixed(2)} 年` : `${body.periodDays.toFixed(2)} 天`
)

/* ============================ 运行状态 ============================ */

const stage = ref(null)
const scaleMode = ref('sqrt')
const tilt = ref(25)
const speedExp = ref(1.3)
const paused = ref(false)
const showOrbits = ref(true)
const showTrails = ref(true)
const showLabels = ref(true)

/** 模拟时间（天）；起始点是 Python 写进 meta 的历元 */
const elapsed = ref(0)
const hoverIndex = ref(-1)
const pickIndex = ref(DEFAULT_PICK)

const onScaleMode = (key) => { scaleMode.value = key }

const daysPerSec = computed(() => 10 ** speedExp.value)

/* --- 面板：真实量，跟着 elapsed 变（走响应式，Vue 的做法） --- */

const focused = computed(() => BODIES[hoverIndex.value >= 0 ? hoverIndex.value : pickIndex.value] || BODIES[0])
const pinned = computed(() => (hoverIndex.value >= 0 ? hoverIndex.value : pickIndex.value) === pickIndex.value)
const focusedPhase = computed(() => elapsed.value / focused.value.periodDays)
const focusedRadius = computed(() => radiusOf(positionAt(focused.value, focusedPhase.value)))
const focusedSpeed = computed(() => instantSpeed(focused.value, focusedPhase.value))
const focusedZone = computed(() => zoneTextOf(focused.value, focusedPhase.value))
const clockText = computed(() => `${formatDays(elapsed.value)} · ${simDate(elapsed.value)}`)
const currentMode = computed(() => SCALE_MODES.find((m) => m.key === scaleMode.value) || SCALE_MODES[1])

const resetEpoch = () => {
  simDays = 0
  elapsed.value = 0
  lastTs = 0
  lastSync = 0
  trails.forEach((t) => { t.length = 0 })
}

/* ============================ 渲染 ============================ */

/**
 * 逐帧推进的真值 —— **刻意不进响应式系统**。
 * 如果让 elapsed 每帧变一次，整个模板（含 el-slider / el-radio-group 这些 Element Plus 组件）
 * 会被 60fps 重渲染，CPU 白白烧掉。所以画布用这个普通变量，
 * 面板需要的快照按 ~8Hz 回写进 elapsed ref（时钟显示 8Hz 绰绰有余）。
 * 对照：React 版是 rAF 直写 DOM，Angular 版是节流 set signal。
 */
let simDays = 0
let lastSync = 0
const SYNC_MS = 120

let ctx = null
let rafId = 0
let lastTs = 0
let dpr = 1
let stars = []
let k = 1
let cacheKey = ''
let paths = []
/** 每颗行星的拖尾（屏幕坐标），滚动截断 */
const trails = BODIES.map(() => [])

const project = (x, y, z, scale, tiltRad, cx, cy) => ({
  x: cx + x * scale,
  y: cy + (y * Math.cos(tiltRad) - z * Math.sin(tiltRad)) * scale,
})

const resize = () => {
  const el = stage.value
  if (!el) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  el.width = el.clientWidth * dpr
  el.height = el.clientHeight * dpr
  ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  lastTs = 0
  cacheKey = ''
  stars = Array.from({ length: 150 }, () => ({
    nx: Math.random(), ny: Math.random(),
    r: Math.random() * 1.3 + 0.3,
    a: Math.random() * 0.55 + 0.25,
    tw: Math.random() * TAU,
  }))
}

/** 把 Python 给的 180 个三维采样点做「径向压缩 → 视角投影」，得到每条轨道的屏幕折线 */
const buildPaths = (w, h) => {
  const cx = w / 2
  const cy = h / 2
  const tiltRad = tilt.value * DEG
  const compress = COMPRESS[scaleMode.value]
  k = (Math.min(w, h) / 2 - 34) / MAX_COMPRESSED[scaleMode.value]
  paths = BODIES.map((body) => {
    const { x, y, z } = body.orbit
    const pts = new Array(SAMPLES + 1)
    for (let i = 0; i <= SAMPLES; i += 1) {
      const j = i % SAMPLES
      const r = Math.hypot(x[j], y[j], z[j]) || 1e-9
      const f = compress(r) / r
      pts[i] = project(x[j] * f, y[j] * f, z[j] * f, k, tiltRad, cx, cy)
    }
    return pts
  })
}

const drawBackground = (w, h, ts) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
  g.addColorStop(0, '#0e1830')
  g.addColorStop(1, '#04060d')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  for (const s of stars) {
    ctx.globalAlpha = s.a * (0.65 + 0.35 * Math.sin(ts / 900 + s.tw))
    ctx.fillStyle = '#dfe8ff'
    ctx.beginPath()
    ctx.arc(s.nx * w, s.ny * h, s.r, 0, TAU)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

const drawOrbitPath = (index) => {
  const pts = paths[index]
  ctx.beginPath()
  for (let i = 1; i <= SAMPLES; i += 1) {
    if (i === 1) ctx.moveTo(pts[0].x, pts[0].y)
    ctx.lineTo(pts[i].x, pts[i].y)
  }
  ctx.strokeStyle = hexToRgbaString(BODIES[index].color, 0.3)
  ctx.lineWidth = 1
  ctx.stroke()
}

const drawSun = (cx, cy, ts) => {
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

const drawBody = (body, index, cx, cy, tiltRad, moonAngle) => {
  const phase = simDays / body.periodDays
  const raw = positionAt(body, phase)
  const r = radiusOf(raw) || 1e-9
  const f = COMPRESS[scaleMode.value](r) / r
  const p = project(raw.x * f, raw.y * f, raw.z * f, k, tiltRad, cx, cy)
  const x = p.x
  const y = p.y
  const size = sizeOf(body.radiusKm)
  const isFocus = index === pickIndex.value || index === hoverIndex.value

  if (showTrails.value) {
    const trail = trails[index]
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

  const g = ctx.createRadialGradient(x - size * 0.35, y - size * 0.35, 0, x, y, size)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.34, body.color)
  g.addColorStop(1, hexToRgbaString(body.color, 0.75))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, size, 0, TAU)
  ctx.fill()

  /* 卫星：真实数目最多 274 颗，画布上只示意 4 颗 */
  const shown = Math.min(body.moons, 4)
  for (let m = 0; m < shown; m += 1) {
    const ang = moonAngle + (m * TAU) / shown
    const rm = size + 7 + m * 4.5
    ctx.fillStyle = '#cfd6e4'
    ctx.beginPath()
    ctx.arc(x + Math.cos(ang) * rm, y + Math.sin(ang) * rm * 0.4, 1.6, 0, TAU)
    ctx.fill()
  }

  if (showLabels.value || isFocus) {
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

let moonAngle = 0
let lastScreen = []

const frame = (ts) => {
  const el = stage.value
  if (!el || !ctx) return
  const w = el.clientWidth
  const h = el.clientHeight
  const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0
  lastTs = ts

  if (!paused.value) {
    simDays += dt * daysPerSec.value
    moonAngle += dt * 0.6
  }
  /* 面板快照按 ~8Hz 回写，画布仍是 60fps */
  if (ts - lastSync > SYNC_MS) {
    lastSync = ts
    elapsed.value = simDays
  }

  const tiltRad = tilt.value * DEG
  const key = `${scaleMode.value}|${tilt.value}|${w}x${h}`
  if (key !== cacheKey) {
    cacheKey = key
    buildPaths(w, h)
  }

  drawBackground(w, h, ts)
  const cx = w / 2
  const cy = h / 2
  if (showOrbits.value) for (let i = 0; i < BODIES.length; i += 1) drawOrbitPath(i)
  drawSun(cx, cy, ts)
  lastScreen = BODIES.map((b, i) => drawBody(b, i, cx, cy, tiltRad, moonAngle))

  rafId = requestAnimationFrame(frame)
}

/* ============================ 交互 ============================ */

const hitTest = (e) => {
  const el = stage.value
  if (!el) return -1
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  for (let i = BODIES.length - 1; i >= 0; i -= 1) {
    const p = lastScreen[i]
    if (!p) continue
    if (Math.hypot(p.x - x, p.y - y) <= sizeOf(BODIES[i].radiusKm) + 9) return i
  }
  return -1
}

const onPointerMove = (e) => {
  const i = hitTest(e)
  hoverIndex.value = i
  if (stage.value) stage.value.style.cursor = i >= 0 ? 'pointer' : 'default'
}

const onClickStage = (e) => {
  const i = hitTest(e)
  /* 点空处不解锁 —— 保证面板永远有内容 */
  if (i < 0 || pickIndex.value === i) return
  pickIndex.value = i
}

/* ============================ 生命周期 ============================ */

let ro = null
onMounted(() => {
  resize()
  rafId = requestAnimationFrame(frame)
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => resize())
    ro.observe(stage.value)
  } else {
    window.addEventListener('resize', resize)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  ro?.disconnect()
  window.removeEventListener('resize', resize)
})

/** 换倍速先吃一个 dt=0 的帧，避免进度跳变 */
watch(speedExp, () => { lastTs = 0 })
/** 关掉轨迹就清历史，重新打开时从当前位置重新长出来 */
watch(showTrails, (on) => { if (!on) trails.forEach((t) => { t.length = 0 }) })
</script>

<style scoped>
.orbit { padding: 18px 22px 44px; }
.orbit-head h1 { margin: 0 0 4px; font-size: 20px; color: #1f2d3d; }
.orbit-head p { margin: 0 0 16px; font-size: 12.5px; color: #8a929f; line-height: 1.85; }
.orbit-head code {
  font-size: 11.5px;
  background: #f2f4f7;
  border-radius: 4px;
  padding: 1px 5px;
}

.orbit-card {
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 14px;
  background: #fff;
}
.orbit-card h3 { margin: 0 0 8px; font-size: 15px; color: #1f2d3d; }

.orbit-stage { position: relative; }
.orbit-canvas {
  display: block;
  width: 100%;
  height: 520px;
  border-radius: 12px;
  background: #04060d;
  touch-action: none;
}

.orbit-panel {
  position: absolute;
  left: 14px;
  top: 14px;
  width: 292px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(9, 14, 26, 0.86);
  border: 1px solid rgba(140, 165, 220, 0.3);
  backdrop-filter: blur(6px);
  color: #e6ecfa;
  pointer-events: none;
}
.orbit-panel__title { display: flex; align-items: baseline; gap: 7px; margin-bottom: 9px; }
.orbit-panel__dot { width: 9px; height: 9px; border-radius: 50%; }
.orbit-panel__title b { font-size: 14px; }
.orbit-panel__title em { font-style: normal; font-size: 11px; opacity: 0.6; }
.orbit-panel__pin {
  margin-left: auto;
  font-style: normal;
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 999px;
  color: #c7d5ff;
  background: rgba(99, 132, 255, 0.26);
}
.orbit-panel__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 10px; margin: 0; }
.orbit-panel__grid div { display: flex; flex-direction: column; gap: 1px; }
.orbit-panel__grid dt { font-size: 10px; opacity: 0.55; }
.orbit-panel__grid dd {
  margin: 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', Monaco, ui-monospace, monospace;
}
.orbit-panel__note {
  margin: 10px 0 0;
  font-size: 11.5px;
  line-height: 1.7;
  opacity: 0.82;
  border-top: 1px solid rgba(140, 165, 220, 0.22);
  padding-top: 8px;
}

.orbit-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.orbit-label { font-size: 12.5px; color: #606266; }
.orbit-spacer { flex: 1; }

/* 当前比例模式的一句话解释：切换模式时换文案，避免"按了不知道发生了什么" */
.orbit-hint {
  margin: 10px 0 0;
  padding-left: 10px;
  border-left: 2px solid #42b883;
  font-size: 12px;
  color: #8a929f;
  line-height: 1.7;
}

.orbit-notes { margin: 0; padding-left: 18px; }
.orbit-notes li { font-size: 12.5px; color: #606266; line-height: 2; }
.orbit-notes code {
  font-size: 11.5px;
  background: #f2f4f7;
  border-radius: 4px;
  padding: 1px 5px;
}

.orbit-meta {
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed #e4e7ed;
  font-size: 11.5px;
  color: #8a929f;
  line-height: 1.9;
}
.orbit-meta code { background: #f2f4f7; border-radius: 4px; padding: 1px 5px; }
</style>
