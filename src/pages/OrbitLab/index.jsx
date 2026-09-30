import { useCallback, useEffect, useRef, useState } from 'react'
import { ORBIT_DATA } from './orbitData.js'
import './index.scss'

/**
 * 星际轨道（React 主应用版）
 *
 * **数据全部来自 Python**：`scripts/orbit-data.py` 用 JPL 的 J2000 轨道要素（带每儒略世纪
 * 变化率）外推到目标历元，解开普勒方程，输出日心黄道三维坐标采样点 + 真实周期 / 速度 / 距离。
 * 本页只做三件事：比例压缩、视角投影、动画插值 —— 一行天体力学都不算。
 *
 * 为什么必须有个「比例模式」
 *   真实比例下海王星 a = 30.07 AU、水星 a = 0.387 AU，相差 78 倍。1:1 画出来，
 *   水星到太阳只有 3.5px，直接埋进太阳的光晕里 —— 这就是「真实比例下地球只有一个像素」。
 *   所以提供三种径向压缩：真实比例 / 平方根 / 对数。
 *
 * 渲染约定：逐帧变化的东西（日心距、瞬时速度、所处区段、模拟时钟）由 rAF 直写 DOM；
 * 只有「点了才会变」的才进 React state（比例模式 / 视角 / 倍速 / 开关 / 锁定星体）。
 * 于是 60fps 的动画完全不触发 reconciliation。
 *
 * 与之对应的另外两版：`micro-apps/vue-app/src/pages/OrbitLab.vue`、
 * `micro-apps/angular-app/src/app/views/orbit-lab-view.ts`。
 */

/* ============================ 数据解包（模块级，只做一次） ============================ */

const { meta, sun: SUN, planets: BODIES } = ORBIT_DATA
const SAMPLES = meta.samples
const AU_KM = 149597870.7
const DAY_MS = 86400000
const EPOCH_MS = Date.parse(meta.epoch)
const TAU = Math.PI * 2
const DEG = Math.PI / 180

/** 默认锁定地球（它在数据里是第 3 项，下标 2） */
const DEFAULT_PICK = 2

/* ============================ 纯函数 ============================ */

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
const lerp = (a, b, t) => a + (b - a) * t

/** #rrggbb → rgba(...) */
const withAlpha = (hex, alpha) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? '').trim())
  if (!m) return hex
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** 星体绘制半径：真实半径取对数压缩，否则木星要画成水星的 29 倍 */
const sizeOf = (radiusKm) => Math.max(2.8, 3.0 + 2.6 * Math.log10(radiusKm / 2400))

/**
 * 径向压缩：把「日心距 r」映射成「画布半径 r'」。
 * 三个模式是刻意并列的对照 —— 越往下的模式把内侧拉开得越多，但相对间距就越不真实。
 */
const COMPRESS = {
  /* r → r：1:1。海王星撑满画布时，水星只有 3.5px */
  linear: (r) => r,
  /* r → √r：折中，内行星能看清，外行星间距仍接近真实排序 */
  sqrt: (r) => Math.sqrt(r),
  /* r → log₁₀(1 + r/0.2)：最狠，八条轨道几乎等间距 */
  log: (r) => Math.log10(1 + r / 0.2),
}

const SCALE_MODES = [
  { key: 'linear', label: '真实比例', hint: '1 : 1 线性 —— 内行星会挤进太阳的光晕里，这就是「真实比例下地球只有一个像素」' },
  { key: 'sqrt', label: '平方根', hint: 'r → √r —— 内行星拉开到看得见，外行星的相对间距还保留' },
  { key: 'log', label: '对数', hint: 'r → log₁₀(1 + r/0.2) —— 压缩最狠，八条轨道几乎等间距' },
]

/** 每种压缩模式下「最外圈」（海王星远日点）的压缩半径 —— 只跟模式有关，与画布尺寸无关 */
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

/**
 * 瞬时速度（km/s）：对 Python 给的相邻采样点做数值微分。
 * 相邻采样点的间隔恒为 P/SAMPLES 天，所以这就是 |Δr|/Δt，不需要再解任何方程。
 */
const instantSpeed = (body, phase) => {
  const a = positionAt(body, phase)
  const b = positionAt(body, phase + 1 / SAMPLES)
  const dr = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
  const dt = (body.periodDays / SAMPLES) * 86400
  return (dr * AU_KM) / dt
}

/** 由日心距判断跑到轨道哪一段了 */
const phaseTextOf = (body, phase) => {
  const r = radiusOf(positionAt(body, phase))
  const mid = (body.perihelionAU + body.aphelionAU) / 2
  if (r < lerp(body.perihelionAU, mid, 0.34)) return '近日点附近（最快）'
  if (r < mid) return '离开近日点'
  if (r < lerp(mid, body.aphelionAU, 0.66)) return '接近远日点'
  return '远日点附近（最慢）'
}

/** 模拟时钟：起始历元 + 已流逝天数 */
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

/** 命中测试：从最外层往回找（外层后画，压在上层） */
function hitTest(el, screen, e) {
  if (!el) return -1
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  for (let i = BODIES.length - 1; i >= 0; i -= 1) {
    const p = screen[i]
    if (!p) continue
    if (Math.hypot(p.x - x, p.y - y) <= sizeOf(BODIES[i].radiusKm) + 9) return i
  }
  return -1
}

/* ============================ 组件 ============================ */

export default function OrbitLab() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const screenRef = useRef([])
  /**
   * 主循环对外的命令句柄。清空拖尾、重置时钟要动循环内部的可变数组，
   * 与其把数组挂到 ref 上让事件回调去改（嵌套可变值会被 react-hooks/immutability 拦），
   * 不如让循环自己注册两个函数，外部只负责调用。
   */
  const apiRef = useRef({ resetEpoch: () => {}, clearTrails: () => {} })

  /** 模拟运行态的唯一权威副本：事件回调同时写这里与 state（这里给 rAF 闭包读，state 给控件渲染） */
  const simRef = useRef({
    scaleMode: 'sqrt', tilt: 25, speedExp: 1.3, paused: false,
    showOrbits: true, showTrails: true, showLabels: true,
    picked: DEFAULT_PICK, hover: -1, days: 0, lastTs: 0, k: 1,
  })

  const [scaleMode, setScaleMode] = useState('sqrt')
  const [tilt, setTilt] = useState(25)
  const [speedExp, setSpeedExp] = useState(1.3)
  const [paused, setPaused] = useState(false)
  const [showOrbits, setShowOrbits] = useState(true)
  const [showTrails, setShowTrails] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [pickedIndex, setPickedIndex] = useState(DEFAULT_PICK)
  const [hoverIndex, setHoverIndex] = useState(-1)

  /* ---------- 控件 ---------- */

  const onScaleMode = useCallback((key) => {
    simRef.current.scaleMode = key
    setScaleMode(key)
  }, [])

  const onTilt = useCallback((e) => {
    const v = Number(e.target.value)
    simRef.current.tilt = v
    setTilt(v)
  }, [])

  const onSpeed = useCallback((e) => {
    const v = Number(e.target.value)
    simRef.current.speedExp = v
    simRef.current.lastTs = 0 // 换挡时先吃一个 dt=0 的帧，避免进度跳变
    setSpeedExp(v)
  }, [])

  const togglePause = useCallback(() => {
    const v = !simRef.current.paused
    simRef.current.paused = v
    setPaused(v)
  }, [])

  const toggle = useCallback((which) => {
    const key = { orbits: 'showOrbits', trails: 'showTrails', labels: 'showLabels' }[which]
    const v = !simRef.current[key]
    simRef.current[key] = v
    if (which === 'trails' && !v) apiRef.current.clearTrails()
    if (which === 'orbits') setShowOrbits(v)
    if (which === 'trails') setShowTrails(v)
    if (which === 'labels') setShowLabels(v)
  }, [])

  const resetEpoch = useCallback(() => {
    apiRef.current.resetEpoch()
  }, [])

  /* ---------- 交互 ---------- */

  const onPointerMove = useCallback((e) => {
    const i = hitTest(stageRef.current, screenRef.current, e)
    if (stageRef.current) stageRef.current.style.cursor = i >= 0 ? 'pointer' : 'default'
    setHoverIndex(i)
    simRef.current.hover = i
  }, [])

  const onPointerLeave = useCallback(() => {
    setHoverIndex(-1)
    simRef.current.hover = -1
  }, [])

  const onStageClick = useCallback((e) => {
    const i = hitTest(stageRef.current, screenRef.current, e)
    if (i < 0 || simRef.current.picked === i) return
    simRef.current.picked = i
    setPickedIndex(i)
  }, [])

  /* ---------- 主循环 ---------- */

  useEffect(() => {
    const el = stageRef.current
    if (!el) return undefined
    const ctx = el.getContext('2d')
    if (!ctx) return undefined

    let stars = []
    let moonAngle = 0
    let lastW = 0
    let lastH = 0
    let raf = 0
    /** 每颗行星的拖尾（屏幕坐标），滚动截断 */
    const trails = BODIES.map(() => [])
    /** 投影后的轨道折线缓存：只在「模式 / 视角 / 画布尺寸」变化时重算 */
    let cacheKey = ''
    let paths = []
    /** 逐帧读写的面板节点，一次性抓齐 */
    const live = {}

    const project = (x, y, z, k, tiltRad, cx, cy) => ({
      x: cx + x * k,
      y: cy + (y * Math.cos(tiltRad) - z * Math.sin(tiltRad)) * k,
    })

    const setup = (w, h) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      el.width = w * dpr
      el.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      /* 星空位置存归一化坐标：resize 按新尺寸重排，星星不会跟着缩放漂移 */
      stars = Array.from({ length: 150 }, () => ({
        nx: Math.random(), ny: Math.random(),
        r: Math.random() * 1.3 + 0.3,
        a: Math.random() * 0.55 + 0.25,
        tw: Math.random() * TAU,
      }))
      simRef.current.lastTs = 0
      cacheKey = ''
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

    /**
     * 把 Python 给的 180 个三维采样点做「径向压缩 → 视角投影」，
     * 得到每条轨道的屏幕折线。压缩是非线性的，所以轨道形状会随模式变（这是刻意的）。
     */
    const buildPaths = (w, h, mode, tiltRad) => {
      const cx = w / 2
      const cy = h / 2
      const compress = COMPRESS[mode]
      const pad = 34
      const k = (Math.min(w, h) / 2 - pad) / MAX_COMPRESSED[mode]
      simRef.current.k = k
      paths = BODIES.map((body) => {
        const { x, y, z } = body.orbit
        const pts = new Array(SAMPLES + 1)
        for (let i = 0; i <= SAMPLES; i += 1) {
          const j = i % SAMPLES
          const rx = x[j]
          const ry = y[j]
          const rz = z[j]
          const r = Math.hypot(rx, ry, rz) || 1e-9
          const f = compress(r) / r
          pts[i] = project(rx * f, ry * f, rz * f, k, tiltRad, cx, cy)
        }
        return pts
      })
    }

    const drawOrbits = (index) => {
      const body = BODIES[index]
      const pts = paths[index]
      ctx.beginPath()
      for (let i = 1; i <= SAMPLES; i += 1) {
        const a = pts[i - 1]
        const b = pts[i]
        if (i === 1) ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
      }
      ctx.strokeStyle = withAlpha(body.color, 0.3)
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

    const drawBody = (body, index, cx, cy, k, tiltRad) => {
      const sim = simRef.current
      const phase = sim.days / body.periodDays
      const raw = positionAt(body, phase)
      const r = radiusOf(raw)
      const f = COMPRESS[sim.scaleMode](r) / (r || 1e-9)
      const p = project(raw.x * f, raw.y * f, raw.z * f, k, tiltRad, cx, cy)
      const x = p.x
      const y = p.y
      const size = sizeOf(body.radiusKm)
      const isFocus = index === sim.picked || index === sim.hover

      if (sim.showTrails) {
        const trail = trails[index]
        trail.push({ x, y })
        if (trail.length > 90) trail.shift()
        for (let i = 1; i < trail.length; i += 1) {
          const a = (i / trail.length) * 0.55
          ctx.strokeStyle = withAlpha(body.color, a)
          ctx.lineWidth = clamp(a * 5, 0.6, 2.4)
          ctx.beginPath()
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
          ctx.lineTo(trail[i].x, trail[i].y)
          ctx.stroke()
        }
      }

      /* 光环：倾角越大看起来越「开」 */
      if (body.ring) {
        ctx.save()
        ctx.translate(x, y)
        for (const [rm, rw] of [[size * 2.2, 2.6], [size * 1.6, 1.8]]) {
          ctx.beginPath()
          ctx.ellipse(0, 0, rm, rm * lerp(0.18, 0.5, Math.abs(Math.cos(tiltRad))), 0, 0, TAU)
          ctx.strokeStyle = withAlpha(body.color, 0.6)
          ctx.lineWidth = rw
          ctx.stroke()
        }
        ctx.restore()
      }

      if (isFocus) {
        ctx.beginPath()
        ctx.arc(x, y, size + 7, 0, TAU)
        ctx.strokeStyle = withAlpha(body.color, 0.55)
        ctx.lineWidth = 1.5
        ctx.setLineDash([3, 3])
        ctx.stroke()
        ctx.setLineDash([])
      }

      const g = ctx.createRadialGradient(x - size * 0.35, y - size * 0.35, 0, x, y, size)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(0.34, body.color)
      g.addColorStop(1, withAlpha(body.color, 0.75))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, size, 0, TAU)
      ctx.fill()

      /* 卫星：真实数目最多 274 颗，画布上只示意 4 颗，面板里给真实数字 */
      const shown = Math.min(body.moons, 4)
      for (let m = 0; m < shown; m += 1) {
        const ang = moonAngle + (m * TAU) / shown
        const rm = size + 7 + m * 4.5
        ctx.fillStyle = '#cfd6e4'
        ctx.beginPath()
        ctx.arc(x + Math.cos(ang) * rm, y + Math.sin(ang) * rm * 0.4, 1.6, 0, TAU)
        ctx.fill()
      }

      if (sim.showLabels || isFocus) {
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

    const frame = (ts) => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w !== lastW || h !== lastH) {
        lastW = w
        lastH = h
        if (w && h) setup(w, h)
      }
      if (!w || !h) {
        raf = requestAnimationFrame(frame)
        return
      }

      const sim = simRef.current
      const dt = sim.lastTs ? Math.min((ts - sim.lastTs) / 1000, 0.05) : 0
      sim.lastTs = ts
      const daysPerSec = 10 ** sim.speedExp
      if (!sim.paused) {
        sim.days += dt * daysPerSec
        moonAngle += dt * 0.6
      }

      const tiltRad = sim.tilt * DEG
      const key = `${sim.scaleMode}|${sim.tilt}|${w}x${h}`
      if (key !== cacheKey) {
        cacheKey = key
        buildPaths(w, h, sim.scaleMode, tiltRad)
      }
      const k = sim.k

      drawBackground(w, h, ts)
      const cx = w / 2
      const cy = h / 2
      if (sim.showOrbits) for (let i = 0; i < BODIES.length; i += 1) drawOrbits(i)
      drawSun(cx, cy, ts)
      screenRef.current = BODIES.map((b, i) => drawBody(b, i, cx, cy, k, tiltRad))

      /* —— 面板里逐帧在动的读数：直写 DOM，不进渲染循环 —— */
      const body = BODIES[sim.hover >= 0 ? sim.hover : sim.picked] || BODIES[0]
      const phase = sim.days / body.periodDays
      if (live.radius) live.radius.textContent = `${radiusOf(positionAt(body, phase)).toFixed(3)} AU`
      if (live.speed) live.speed.textContent = `${instantSpeed(body, phase).toFixed(2)} km/s`
      if (live.phase) live.phase.textContent = phaseTextOf(body, phase)
      if (live.clock) live.clock.textContent = `${formatDays(sim.days)} · ${simDate(sim.days)}`
      if (live.pxau) {
        const outer = BODIES[BODIES.length - 1]
        live.pxau.textContent = `最外圈 海王星 ${outer.aphelionAU.toFixed(2)} AU ↔ ${(Math.min(w, h) / 2 - 34).toFixed(0)} px`
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    /* 一次性抓齐整页里所有实时节点（标了 data-live 的），循环里按 key 直写 */
    rootRef.current?.querySelectorAll('[data-live]').forEach((node) => {
      live[node.dataset.live] = node
    })

    apiRef.current.resetEpoch = () => {
      simRef.current.days = 0
      simRef.current.lastTs = 0
      trails.forEach((t) => { t.length = 0 })
    }
    apiRef.current.clearTrails = () => {
      trails.forEach((t) => { t.length = 0 })
    }

    return () => cancelAnimationFrame(raf)
  }, [])

  /* ---------- 渲染期只做纯计算 ---------- */

  const focusedIndex = hoverIndex >= 0 ? hoverIndex : pickedIndex
  const focused = BODIES[focusedIndex] || BODIES[0]
  const pinned = focusedIndex === pickedIndex
  const mode = SCALE_MODES.find((m) => m.key === scaleMode) || SCALE_MODES[1]
  const daysPerSec = 10 ** speedExp

  const speedLabel = daysPerSec < 10
    ? `${daysPerSec.toFixed(2)} 天/秒`
    : `${Math.round(daysPerSec)} 天/秒`

  return (
    <div className="orbit-lab" ref={rootRef}>
      <header className="ol-head">
        <h1>星际轨道</h1>
        <p>
          轨道要素来自 <b>Python</b>：<code>scripts/orbit-data.py</code> 用 JPL 的 J2000 要素
          （含每儒略世纪变化率）外推到历元 {meta.epoch.slice(0, 10)}，解开普勒方程
          <code>M = E - e·sinE</code>，输出日心黄道三维坐标。前端只负责压缩、投影和动画 —— 一行天体力学都不算。
        </p>
      </header>

      <section className="ol-card">
        <div className="ol-stage">
          <canvas
            ref={stageRef}
            className="ol-canvas"
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onClick={onStageClick}
          />

          {/* 参数面板常显（默认锁定地球）—— 真实量，不留占位符 */}
          <div className="ol-panel">
            <div className="ol-panel__title">
              <span className="ol-panel__dot" style={{ background: focused.color }} />
              <b>{focused.name}</b>
              <em>{focused.en}</em>
              {pinned && <i className="ol-panel__pin">已锁定</i>}
            </div>
            <dl className="ol-panel__grid">
              <div><dt>日心距 r</dt><dd data-live="radius">{radiusOf(positionAt(focused, 0)).toFixed(3)} AU</dd></div>
              <div><dt>瞬时速度</dt><dd data-live="speed">{instantSpeed(focused, 0).toFixed(2)} km/s</dd></div>
              <div><dt>半长轴 a</dt><dd>{focused.a.toFixed(4)} AU</dd></div>
              <div><dt>偏心率 e</dt><dd>{focused.e.toFixed(4)}</dd></div>
              <div><dt>轨道倾角 i</dt><dd>{focused.incl.toFixed(2)}°</dd></div>
              <div><dt>公转周期 P</dt><dd>{focused.periodYears >= 1 ? `${focused.periodYears.toFixed(2)} 年` : `${focused.periodDays.toFixed(2)} 天`}</dd></div>
              <div><dt>近日点</dt><dd>{focused.perihelionAU.toFixed(4)} AU</dd></div>
              <div><dt>远日点</dt><dd>{focused.aphelionAU.toFixed(4)} AU</dd></div>
              <div><dt>速度区间</dt><dd>{focused.speed.perihelion.toFixed(2)} ~ {focused.speed.aphelion.toFixed(2)}</dd></div>
              <div><dt>所处区段</dt><dd data-live="phase">近日点附近（最快）</dd></div>
            </dl>
            <p className="ol-panel__note">
              {focused.note}
              <br />
              平均半径 {focused.radiusKm.toLocaleString()} km · 质量 {focused.massEarth} 地球
              {focused.moons > 0 && <> · 已知卫星 {focused.moons} 颗（画布上示意 {Math.min(focused.moons, 4)} 颗）</>}
            </p>
          </div>
        </div>

        <div className="ol-controls">
          <span className="ol-label">比例模式</span>
          <span className="ol-tabs">
            {SCALE_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`ol-tab${m.key === scaleMode ? ' is-on' : ''}`}
                onClick={() => onScaleMode(m.key)}
                title={m.hint}
              >
                {m.label}
              </button>
            ))}
          </span>

          <span className="ol-label">视角</span>
          <input
            className="ol-range ol-range--sm"
            type="range" min="0" max="80" step="1"
            value={tilt} onChange={onTilt} aria-label="视角倾角"
          />
          <span className="ol-tag">{tilt}°</span>

          <span className="ol-label">时间倍速</span>
          <input
            className="ol-range"
            type="range" min="0" max="4" step="0.05"
            value={speedExp} onChange={onSpeed} aria-label="时间倍速"
          />
          <span className="ol-tag">{speedLabel}</span>

          <button type="button" className={`ol-btn${paused ? ' is-on' : ''}`} onClick={togglePause}>
            {paused ? '继续' : '暂停'}
          </button>
          <button type="button" className="ol-btn" onClick={resetEpoch}>回到历元</button>

          <label className="ol-check">
            <input type="checkbox" checked={showOrbits} onChange={() => toggle('orbits')} />轨道线
          </label>
          <label className="ol-check">
            <input type="checkbox" checked={showTrails} onChange={() => toggle('trails')} />轨迹
          </label>
          <label className="ol-check">
            <input type="checkbox" checked={showLabels} onChange={() => toggle('labels')} />名称
          </label>

          <span className="ol-spacer" />
          <span className="ol-tag ol-tag--info">点行星可锁定</span>
          <span className="ol-tag ol-tag--ok" data-live="clock">0.0 天 · {simDate(0)}</span>
        </div>

        <p className="ol-mode-hint">{mode.hint}</p>
      </section>

      <section className="ol-card">
        <h3>这份数据里能看出什么</h3>
        <ul className="ol-notes">
          <li>
            <b>近日点更快</b>：瞬时速度那一栏是活的 —— 水星在近日点 58.98 km/s、远日点 38.73 km/s，
            差出 52%（活力公式 <code>v = √(GM(2/r − 1/a))</code>，Python 侧算的）。
          </li>
          <li>
            <b>轨道倾角是真的</b>：把视角拉满 80° 看，八条轨道不在同一个平面上 ——
            水星偏 7.0°、金星 3.4°、地球在黄道面内（0°），这就是「黄道」这个词的来历。
          </li>
          <li>
            <b>「真实比例」是有代价的</b>：切到 1:1 线性模式，海王星 30.07 AU 撑满画布，
            水星（0.31~0.47 AU）只剩 3px，直接埋进太阳的光晕 —— 天文插图几乎都偷偷做过压缩。
          </li>
          <li>
            <b>周期差 683 倍</b>：水星 88 天、海王星 164.79 年。把倍速拉到最大，
            内行星会糊成一片光带，外行星才刚挪一点点 —— 时间尺度没法同时伺候两者。
          </li>
        </ul>
        <p className="ol-meta">
          数据：{meta.source.split('(')[0].trim()} · 历元 {meta.epoch}（JD {meta.julianDay}，
          J2000 后 {meta.centuriesSinceJ2000} 儒略世纪）· 每颗行星 {SAMPLES} 个采样点 ·
          中心天体 <b>{SUN.name}</b> 半径 {SUN.radiusKm.toLocaleString()} km（{SUN.massEarth.toLocaleString()}{' '}
          个地球质量）· 生成脚本 <code>scripts/orbit-data.py</code>，重跑即可更新
          <span className="ol-tag ol-tag--info ol-tag--end" data-live="pxau">最外圈 海王星 30.33 AU ↔ 满幅</span>
        </p>
      </section>
    </div>
  )
}
