import { useCallback, useEffect, useRef, useState } from 'react'
import { DEMOS, DEMO_GROUPS } from '../../creative/index.js'
import './index.scss'

/**
 * 创意 Playground（React 主应用版）
 *
 * 82 个 demo 的实现在 `src/creative/` —— 按分组成目录、一个 demo 一个文件，
 * 纯 canvas、零框架依赖。
 * 本页只负责四件事：选 demo、挂 canvas、跑 rAF、把控件事件转发进去。
 * Vue / Angular 两份薄壳（micro-apps 下的 Playground.vue / playground-view.ts）结构与本页一一对应，
 * 可直接横向对照三套框架在「宿主一个命令式对象」这件事上的写法差异。
 *
 * 三条约定：
 *  1. canvas 按 dpr 放大后用 setTransform 归一，demo 内部一律按 CSS px 画；
 *  2. dt 由这里 clamp 到 ≤ 0.05s —— 切标签页回来时 dt 会是几百毫秒，不 clamp 物理 demo 直接炸；
 *  3. HUD（FPS / 指针坐标）走 `data-live` 直写 DOM，不进 React 渲染循环。
 *
 * 左栏是**手风琴**：7 张分组卡片，同一时刻只展开一张（默认展开当前 demo 所在的那组）。
 * 82 条 demo 平铺会滚到天边，折叠后左栏高度基本恒定。注意收起用的是 `hidden` 而不是不渲染 ——
 * `[data-pg="demo"]` 必须始终是全集且顺序等于 `DEMOS` 下标，探针拿这个当结构断言。
 *
 * `data-pg="*"` 是**跨三端统一的探针选择器**（三份薄壳的 DOM 结构、类名、属性完全一致），
 * 让 `scripts/playground-probe.mjs` 一套选择器就能跑完三端：
 *   data-pg="demo" | "canvas" | "title" | "fps" | "ptr" | "pause" | "restart" | "param" | "act"
 *   data-pg="group"      分组卡片的**卡片头**（可点，展开/收起），带 `data-group-label` /
 *                        `data-group-index` / `data-group-open`
 */

/** 取某个 demo 声明的参数默认值 —— 纯函数，放在模块级避免进依赖 */
const defaultsFor = (index) => Object.fromEntries(
  (DEMOS[index]?.params ?? []).map((p) => [p.key, p.value]),
)

/** 下标 → 所属分组序号。分组是连续区间，所以线性扫一遍就够（模块级算一次） */
const GROUP_OF = DEMOS.map((_, i) => DEMO_GROUPS.findIndex((g) => i >= g.from && i <= g.to))

const pad2 = (n) => String(n + 1).padStart(2, '0')

export default function Playground() {
  const [active, setActive] = useState(0)
  /* nonce 只用来强制重建实例（「重开」按钮），值本身没有含义 */
  const [nonce, setNonce] = useState(0)
  const [paused, setPaused] = useState(false)
  /* 展开的组序号；-1 = 全部收起（手风琴允许「只看目录」） */
  const [openGroup, setOpenGroup] = useState(0)
  /* values 仅驱动控件显示；demo 内部状态由 setParam 命令式维护，不回流 React */
  const [values, setValues] = useState(() => defaultsFor(0))

  const canvasRef = useRef(null)
  const hudRef = useRef(null)
  const ptrRef = useRef(null)
  const instRef = useRef(null)
  const pausedRef = useRef(false)

  const demo = DEMOS[active]

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return undefined
    const ctx = el.getContext('2d')
    const inst = demo.create(ctx)
    instRef.current = inst

    /* HUD 节点在 mount 时就在 DOM 里了，这里一次性抓出来，之后逐帧只写 textContent */
    const fpsNode = hudRef.current?.querySelector('[data-live="fps"]')
    ptrRef.current = hudRef.current?.querySelector('[data-live="ptr"]') ?? null

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = el.clientWidth
      const h = el.clientHeight
      el.width = Math.max(1, Math.round(w * dpr))
      el.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      inst.resize(w, h)
    }
    fit()

    /* 实例建好后再灌一遍声明里的默认值，保证「切 demo → 立刻可用」 */
    for (const p of demo.params) inst.setParam(p.key, p.value)

    const ro = new ResizeObserver(fit)
    ro.observe(el)

    let raf = 0
    let last = 0
    let frames = 0
    let hudAt = 0

    const tick = (ts) => {
      raf = requestAnimationFrame(tick)
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0
      last = ts
      if (!pausedRef.current) inst.frame(ts, dt)

      /* FPS 每 500ms 汇总一次，比瞬时间隔稳得多 */
      frames += 1
      if (!hudAt) hudAt = ts
      else if (ts - hudAt >= 500) {
        if (fpsNode) fpsNode.textContent = String(Math.round((frames * 1000) / (ts - hudAt)))
        frames = 0
        hudAt = ts
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      inst.destroy()
      instRef.current = null
      ptrRef.current = null
    }
  }, [demo, nonce])

  /* —— 指针事件：坐标换算成画布内 CSS px 再交给 demo —— */
  const send = useCallback((kind, e) => {
    const el = canvasRef.current
    const inst = instRef.current
    if (!el || !inst) return
    const r = el.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    inst.pointer(kind, x, y)
    if (kind === 'move' && ptrRef.current) {
      ptrRef.current.textContent = `${Math.round(x)}, ${Math.round(y)}`
    }
  }, [])

  const onParam = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    instRef.current?.setParam(key, value)
  }, [])

  const onAction = useCallback((key) => {
    instRef.current?.action(key)
  }, [])

  const pick = useCallback((index) => {
    setActive(index)
    /* 选中的 demo 可能不在当前展开的那组里（比如探针直接按 index 点），顺手把它的组打开 */
    setOpenGroup(GROUP_OF[index])
    setValues(defaultsFor(index))
    setPaused(false)
    pausedRef.current = false
  }, [])

  /* 点已展开的组 → 收起（只留目录）；点别的组 → 换展开 */
  const toggleGroup = useCallback((gi) => {
    setOpenGroup((cur) => (cur === gi ? -1 : gi))
  }, [])

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
  }, [])

  return (
    <div className="playground">
      <header className="pg-head">
        <h1>创意 Playground</h1>
        <p>
          {DEMOS.length} 个算法型 demo —— 流场、元胞自动机、密度波、混沌、数值解、脉冲耦合、图灵斑图、
          黏菌网络、分形地形…… 按主题分成 {DEMO_GROUPS.length} 组，左栏是手风琴，一次只展开一组。
          实现全部写在 <code>src/creative/</code>（纯 canvas、不含任何框架 API），
          每个 demo 都是同一份骨架：<code>create(ctx) → resize / frame / pointer / setParam / action / destroy</code>。
        </p>
      </header>

      <div className="pg-body">
        {/* 左：手风琴分组卡片（收起用 hidden，DOM 里始终保留全部 demo 项） */}
        <aside className="pg-list">
          <div className="pg-list__head">
            <span>全部 demo</span>
            <em>{DEMOS.length} 个 · {DEMO_GROUPS.length} 组</em>
          </div>
          {DEMO_GROUPS.map((g, gi) => {
            const open = gi === openGroup
            const count = g.to - g.from + 1
            return (
              <section className={`pg-acc${open ? ' is-open' : ''}`} key={g.label}>
                <button
                  type="button"
                  className="pg-acc__head"
                  data-pg="group"
                  data-group-label={g.label}
                  data-group-index={gi}
                  data-group-open={open ? '1' : '0'}
                  aria-expanded={open}
                  onClick={() => toggleGroup(gi)}
                >
                  <span className="pg-acc__chev" aria-hidden="true">▶</span>
                  <span className="pg-acc__label">{g.label}</span>
                  <em className="pg-acc__count">{count}</em>
                  <i className="pg-acc__hint">{g.hint}</i>
                </button>
                <div className="pg-acc__items" hidden={!open}>
                  {DEMOS.slice(g.from, g.to + 1).map((d, k) => {
                    const i = g.from + k
                    return (
                      <button
                        type="button"
                        key={d.id}
                        className={`pg-item${i === active ? ' is-active' : ''}`}
                        data-pg="demo"
                        data-demo-id={d.id}
                        onClick={() => pick(i)}
                      >
                        <span className="pg-item__no">{pad2(i)}</span>
                        <span className="pg-item__body">
                          <b>{d.title}</b>
                          <em>{d.tag}</em>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </aside>

        {/* 右：舞台 + 控件 + 说明 */}
        <section className="pg-stage" ref={hudRef}>
          <div className="pg-toolbar">
            <b className="pg-toolbar__title" data-pg="title">{demo.title}</b>
            <span className="pg-tag">{demo.tag}</span>
            <span className="pg-spacer" />
            <button type="button" className="pg-btn" data-pg="pause" onClick={togglePause}>
              {paused ? '继续' : '暂停'}
            </button>
            <button
              type="button"
              className="pg-btn"
              data-pg="restart"
              onClick={() => setNonce((n) => n + 1)}
            >
              重开
            </button>
          </div>

          <div className="pg-canvas-wrap" style={{ background: demo.bg }}>
            <canvas
              ref={canvasRef}
              className="pg-canvas"
              data-pg="canvas"
              onPointerDown={(e) => send('down', e)}
              onPointerMove={(e) => send('move', e)}
              onPointerUp={(e) => send('up', e)}
              onPointerLeave={(e) => send('leave', e)}
            />
            <div className="pg-hud">
              <span><i>FPS</i><b data-live="fps" data-pg="fps">—</b></span>
              <span><i>指针</i><b data-live="ptr" data-pg="ptr">—</b></span>
            </div>
            {paused && <span className="pg-paused">已暂停</span>}
          </div>

          <div className="pg-controls">
            {demo.params.length === 0 && <span className="pg-controls__empty">此 demo 无可调参数，直接在画布上交互</span>}
            {demo.params.map((p) => (
              <label className="pg-param" key={p.key} data-pg="param" data-param-key={p.key}>
                <span className="pg-param__label">{p.label}</span>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={values[p.key] ?? p.value}
                  onChange={(e) => onParam(p.key, Number(e.target.value))}
                />
                <b className="pg-param__val">{values[p.key] ?? p.value}</b>
              </label>
            ))}
            {demo.actions.length > 0 && <span className="pg-sep" />}
            {demo.actions.map((a) => (
              <button
                type="button"
                className="pg-btn pg-btn--act"
                key={a.key}
                data-pg="act"
                data-act-key={a.key}
                onClick={() => onAction(a.key)}
              >
                {a.label}
              </button>
            ))}
          </div>

          <p className="pg-desc">{demo.desc}</p>
        </section>
      </div>
    </div>
  )
}
