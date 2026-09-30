import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './index.scss'

/**
 * 创意实验室（React 主应用版）
 *
 * 与两个子应用的创意页对称：同一批 demo 用三套框架各写一遍，可直接对照写法差异。
 * 这里刻意**不含命令面板** —— 主应用已有独立的「命令面板」页（/command-palette）
 * 与可复用组件 `src/components/CommandPalette`，重复造第二个没有意义。
 *
 * 六个 demo：粒子星轨 / 打字机 / 聚光卡片 / 3D 翻转 / 点击涟漪 / 磁性按钮
 */

/* —— 打字机语料：模块级常量，避免每次渲染新建数组 —— */
const TYPE_LINES = [
  'React 19 · Vite · antd 5',
  '三个项目 · 一套设计令牌',
  '创意 demo 也要能跑得起来才算数',
]

const SPOTLIGHT_CARDS = [
  { title: '指针事件', desc: 'pointermove 同时覆盖鼠标与触控' },
  { title: 'CSS 变量', desc: 'JS 只写两个数，渲染交给合成层' },
  { title: '零重排', desc: '光斑是渐变层，不改动布局' },
]

const FLIP_CARDS = [
  { front: '正面 · Hooks', back: '背面 · useEffect / useRef' },
  { front: '正面 · 渲染', back: '背面 · React.memo + useMemo' },
  { front: '正面 · 并发', back: '背面 · useTransition / useDeferredValue' },
]

const RIPPLE_BUTTONS = [
  { label: '点我看涟漪 1', tone: 'green' },
  { label: '点我看涟漪 2', tone: 'blue' },
  { label: '点我看涟漪 3', tone: 'amber' },
]

export default function CreativeLab() {
  /* ==================== 粒子星轨 ==================== */
  const canvasRef = useRef(null)
  const pointerRef = useRef({ x: -999, y: -999 })
  const particlesRef = useRef([])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return undefined
    const ctx = el.getContext('2d')
    let raf = 0
    let last = 0

    const fits = (force) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = el.clientWidth
      const h = el.clientHeight
      el.width = w * dpr
      el.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (force || !particlesRef.current.length) {
        particlesRef.current = Array.from({ length: 120 }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          r: 1 + Math.random() * 2,
        }))
      }
    }

    const tick = (ts) => {
      const w = el.clientWidth
      const h = el.clientHeight
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0
      last = ts
      const k = dt * 60

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0b1120'
      ctx.fillRect(0, 0, w, h)

      const { x: px, y: py } = pointerRef.current
      for (const p of particlesRef.current) {
        const dx = px - p.x
        const dy = py - p.y
        const d2 = Math.max(dx * dx + dy * dy, 400)
        const d = Math.sqrt(d2)
        const force = Math.min(3600 / d2, 0.9)
        p.vx += (dx / d) * force * 0.06 * k
        p.vy += (dy / d) * force * 0.06 * k
        p.vx *= 0.985 ** k
        p.vy *= 0.985 ** k
        p.x += p.vx * k
        p.y += p.vy * k
        if (p.x < 0) p.x += w
        if (p.x > w) p.x -= w
        if (p.y < 0) p.y += h
        if (p.y > h) p.y -= h
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(96, 165, 250, 0.92)'
        ctx.fill()
      }

      const g = ctx.createRadialGradient(px, py, 0, px, py, 64)
      g.addColorStop(0, 'rgba(56, 189, 248, 0.30)')
      g.addColorStop(1, 'rgba(56, 189, 248, 0)')
      ctx.fillStyle = g
      ctx.fillRect(px - 64, py - 64, 128, 128)

      raf = requestAnimationFrame(tick)
    }

    fits(true)
    raf = requestAnimationFrame(tick)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => fits(false)) : null
    ro?.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [])

  const onCanvasMove = useCallback((e) => {
    const el = canvasRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  /* ==================== 打字机 ==================== */
  const [typed, setTyped] = useState('')
  const [typing, setTyping] = useState(true)
  /** 游标 + 「刚写完一行，停一会儿再回删」的时刻，都放 ref，避免把它们塞进 state 触发额外渲染 */
  const cursorRef = useRef({ line: 0, char: 0, deleting: false, pauseUntil: 0 })

  useEffect(() => {
    if (!typing) return undefined
    const timer = setInterval(() => {
      const c = cursorRef.current
      if (c.pauseUntil) {
        if (Date.now() < c.pauseUntil) return
        c.pauseUntil = 0
      }
      const line = TYPE_LINES[c.line]
      if (!c.deleting) {
        c.char += 1
        setTyped(line.slice(0, c.char))
        if (c.char >= line.length) {
          c.deleting = true
          c.pauseUntil = Date.now() + 1400
        }
      } else {
        c.char -= 1
        setTyped(line.slice(0, c.char))
        if (c.char <= 0) {
          c.deleting = false
          c.line = (c.line + 1) % TYPE_LINES.length
        }
      }
    }, 90)
    return () => clearInterval(timer)
  }, [typing])

  /* ==================== 聚光卡片 ==================== */
  /** 光斑位置直接写进 CSS 变量，不进 React 状态 —— 否则每次 pointermove 都触发一次整树渲染 */
  const onSpotlight = useCallback((e) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }, [])
  const onSpotlightLeave = useCallback((e) => {
    e.currentTarget.style.setProperty('--mx', '-200px')
    e.currentTarget.style.setProperty('--my', '-200px')
  }, [])

  /* ==================== 3D 翻转 ==================== */
  const [flipped, setFlipped] = useState(() => FLIP_CARDS.map(() => false))
  const toggleFlip = useCallback((i) => {
    setFlipped((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }, [])

  /* ==================== 点击涟漪 ==================== */
  const spawnRipple = useCallback((e) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const span = document.createElement('span')
    span.className = 'cl-ripple'
    span.style.width = `${size}px`
    span.style.height = `${size}px`
    span.style.left = `${e.clientX - rect.left - size / 2}px`
    span.style.top = `${e.clientY - rect.top - size / 2}px`
    btn.appendChild(span)
    span.addEventListener('animationend', () => span.remove())
  }, [])

  /* ==================== 磁性按钮 ==================== */
  /** 按钮朝光标方向偏移一点点，离开时弹回 —— 同样是写 transform，不进状态 */
  const onMagnetMove = useCallback((e) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width
    const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height
    el.style.transform = `translate(${dx * 10}px, ${dy * 8}px)`
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }, [])
  const onMagnetLeave = useCallback((e) => {
    e.currentTarget.style.transform = 'translate(0, 0)'
  }, [])

  return (
    <div className="creative-lab">
      <header className="cl-head">
        <h1>创意实验室</h1>
        <p>
          六个「好看且有用」的交互 demo，零第三方依赖。命令面板另有独立页
          <Link className="cl-link" to="/command-palette">/command-palette</Link>
          可直接对照。
        </p>
      </header>

      {/* ① 粒子星轨 */}
      <section className="cl-card">
        <h3>① 粒子星轨 <span className="cl-hint">canvas + rAF</span></h3>
        <p className="cl-desc">
          鼠标移动即产生引力，粒子被拽向光标又互相弹开。rAF 里按 dt 归一化，掉帧时速度不会突跳。
        </p>
        <canvas ref={canvasRef} className="cl-canvas" onPointerMove={onCanvasMove} />
      </section>

      {/* ② 打字机 */}
      <section className="cl-card">
        <h3>② 打字机 <span className="cl-hint">setInterval + 光标闪烁</span></h3>
        <p className="cl-desc">逐字上屏、到末尾停顿再回删重来。游标状态放在 ref 里，不进渲染循环。</p>
        <p className="cl-typewriter">
          <span className="cl-typewriter__text">{typed}</span>
          <span className="cl-typewriter__caret" />
        </p>
        <button className="cl-btn cl-btn--ghost" type="button" onClick={() => setTyping((v) => !v)}>
          {typing ? '暂停' : '继续'}
        </button>
      </section>

      {/* ③ 聚光卡片 */}
      <section className="cl-card">
        <h3>③ 聚光卡片 <span className="cl-hint">CSS 变量 + pointermove</span></h3>
        <p className="cl-desc">
          光标位置写进 <code>--mx/--my</code>，由 CSS 的 radial-gradient 消费 —— 一点 React 状态都不碰。
        </p>
        <div className="cl-spotlight-row">
          {SPOTLIGHT_CARDS.map((c) => (
            <div className="cl-spotlight" key={c.title} onPointerMove={onSpotlight} onPointerLeave={onSpotlightLeave}>
              <span className="cl-spotlight__glow" />
              <b>{c.title}</b>
              <em>{c.desc}</em>
            </div>
          ))}
        </div>
      </section>

      {/* ④ 3D 翻转 */}
      <section className="cl-card">
        <h3>④ 3D 翻转卡片 <span className="cl-hint">preserve-3d</span></h3>
        <p className="cl-desc">点击翻面。backface-visibility 让背面不参与绘制，比切 DOM 更省。</p>
        <div className="cl-flip-row">
          {FLIP_CARDS.map((f, i) => (
            <button
              type="button"
              className={`cl-flip${flipped[i] ? ' is-flipped' : ''}`}
              key={f.front}
              onClick={() => toggleFlip(i)}
            >
              <span className="cl-flip__inner">
                <span className="cl-flip__face cl-flip__face--front">{f.front}</span>
                <span className="cl-flip__face cl-flip__face--back">{f.back}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ⑤ 点击涟漪 */}
      <section className="cl-card">
        <h3>⑤ 涟漪按钮 <span className="cl-hint">点击点扩散</span></h3>
        <p className="cl-desc">按点击坐标生成扩散圆，animationend 自动移除节点 —— DOM 不会越点越多。</p>
        <div className="cl-ripple-row">
          {RIPPLE_BUTTONS.map((b) => (
            <button
              type="button"
              key={b.label}
              className={`cl-btn cl-btn--${b.tone} cl-ripple-host`}
              onClick={spawnRipple}
            >
              {b.label}
            </button>
          ))}
        </div>
      </section>

      {/* ⑥ 磁性按钮 */}
      <section className="cl-card">
        <h3>⑥ 磁性按钮 <span className="cl-hint">跟随光标的吸附感</span></h3>
        <p className="cl-desc">按钮朝光标偏移几像素并带一圈跟随高光，离开即回弹。纯 transform，不触发重排。</p>
        <div className="cl-magnet-row">
          <button
            type="button"
            className="cl-btn cl-btn--magnet"
            onPointerMove={onMagnetMove}
            onPointerLeave={onMagnetLeave}
          >
            把光标放上来
          </button>
        </div>
      </section>
    </div>
  )
}
