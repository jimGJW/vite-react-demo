import { useCallback, useEffect, useRef, useState } from 'react'
import {
  meta, SUN, BODIES, DEFAULT_PICK, COMPRESS, SCALE_MODES, MAX_COMPRESSED,
  positionAt, radiusOf, instantSpeed, phaseTextOf, simDate, formatDays,
  hitTest, clamp, lerp, withAlpha, sizeOf, SAMPLES, AU_KM, DAY_MS, EPOCH_MS, TAU, DEG,
} from './components/orbitCore.js'
import OrbitInfoPanel from './components/OrbitInfoPanel.jsx'
import OrbitControls from './components/OrbitControls.jsx'
import './index.scss'

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
          <OrbitInfoPanel focused={focused} pinned={pinned} />
        </div>

        <OrbitControls
          scaleMode={scaleMode} tilt={tilt} speedExp={speedExp} speedLabel={speedLabel}
          paused={paused} showOrbits={showOrbits} showTrails={showTrails} showLabels={showLabels}
          onScaleMode={onScaleMode} onTilt={onTilt} onSpeed={onSpeed}
          togglePause={togglePause} resetEpoch={resetEpoch} toggle={toggle}
        />

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
