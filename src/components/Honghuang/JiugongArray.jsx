/* =====================================================================
   九宫八卦阵
   ---------------------------------------------------------------------
   3×3 九宫盘（洛书数）+ 外环八卦 + 八门八风八节五层透镜。
   - 一格只显一个主读法（切透镜不换数据），点一格看它的完整档案。
   - 九宫全部点亮 → 八条线依次亮起并现「十五」：这是幻方的自我证明，
     不是装饰 —— 阵盘的说服力就落在这八个 15 上。
   - 与周天盘同向北在上（古图南上，故本盘是古图旋转 180°），卦位与
     相对关系不变。原典 / 通行 / 演绎三档在页面上分列，见 jiugong-data.js。
   ===================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CLASSICS, LENSES, LINES, LUCK_LABEL, MAGIC_SUM, PALACES, TOUR } from './jiugong-data.js'
import './JiugongArray.scss'

const TOUR_MS = 1500
/** 北在上、东在右 —— 与星斗盘同一朝向，方位角自正北顺时针 */
const DIR_ANGLE = { 北: 0, 东北: 45, 东: 90, 东南: 135, 南: 180, 西南: 225, 西: 270, 西北: 315 }
const BY_NUM = PALACES.reduce((acc, p) => { acc[p.num] = p; return acc }, {})
const GUA_RING = PALACES.filter((p) => !p.isCenter)
/** 门之分次（三吉 / 一平 / 四凶 / 中宫），由数据现算，避免页面上写死「五凶」这类对不上的数 */
const LUCK_ORDER = ['吉', '平', '凶', '—']
const GATE_BY_LUCK = LUCK_ORDER.map((k) => ({
  key: k,
  label: LUCK_LABEL[k],
  gates: PALACES.filter((p) => p.luck === k).map((p) => (p.isCenter ? '中五' : p.gate)).join('、'),
}))

/** 中宫没有地支、八节、八风 —— 缺就整段不显，别让「—」在标题下串成一长条 */
const metaLine = (p) => [
  p.direction,
  p.branches !== '—' ? `地支${p.branches}` : '',
  p.jieqi !== '—' ? p.jieqi : '',
  p.gate,
].filter(Boolean).join(' · ')

export default function JiugongArray() {
  const [lens, setLens] = useState('num')
  const [cursor, setCursor] = useState(0) // 索引进 TOUR
  const [paused, setPaused] = useState(false)
  const [sel, setSel] = useState(null)
  const [lit, setLit] = useState(() => new Set())
  const [showLuck, setShowLuck] = useState(false)
  const [square, setSquare] = useState(false) // 九宫齐后的演出
  const timer = useRef(null)
  const squareTimer = useRef(null)

  const completed = lit.size === PALACES.length

  /* 开着档案时停巡 —— 与星斗盘「读卡即停日月」同一规矩，收档后从本宫接着走 */
  useEffect(() => {
    if (paused || square || sel !== null) return
    timer.current = setTimeout(() => setCursor((c) => (c + 1) % TOUR.length), TOUR_MS)
    return () => clearTimeout(timer.current)
  }, [cursor, paused, square, sel])

  const triggerSquare = () => {
    setSquare(true)
    clearTimeout(squareTimer.current)
    squareTimer.current = setTimeout(() => setSquare(false), 5200)
  }

  useEffect(() => () => clearTimeout(squareTimer.current), [])

  const openPalace = useCallback((num) => setSel(num), [])
  const closeCard = useCallback(() => setSel(null), [])

  /* 演出同样由「点亮第九宫」这个动作触发，不放 effect 里同步 setState */
  const light = (num) => {
    openPalace(num)
    if (lit.has(num)) return
    const next = new Set(lit)
    next.add(num)
    setLit(next)
    if (next.size === PALACES.length) triggerSquare()
  }

  useEffect(() => {
    if (sel === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeCard()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel, closeCard])

  const lensOf = useMemo(() => LENSES.find((l) => l.key === lens), [lens])
  const shown = BY_NUM[sel ?? TOUR[cursor]]
  const ring = (p) => DIR_ANGLE[p.direction]

  return (
    <section className="jg">
      <div className="jg-head">
        <h2>九宫八卦阵</h2>
        <p>
          盘是三阶幻方：横三、竖三、斜二共八条线，每条相加都是 <b>{MAGIC_SUM}</b>。
          九宫数与卦位属可核骨架，八门八风是后世术数，「布阵」本身则来自演义。
          切透镜换读法，点一格看它的档案。
        </p>
      </div>

      <div className="jg-truth">
        <span className="jg-truth__tier jg-tier-1">可核 · 幻方与《说卦》卦位</span>
        <span className="jg-truth__tier jg-tier-2">通行 · 八门（奇门）与八风（《淮南子》一系）</span>
        <span className="jg-truth__tier jg-tier-3">演绎 · 以九宫八卦为军阵（演义／小说）</span>
      </div>

      <div className="jg-toolbar">
        <div className="jg-seg" role="group" aria-label="标注层">
          {LENSES.map((l) => (
            <button
              key={l.key}
              type="button"
              className={lens === l.key ? 'on' : ''}
              aria-pressed={lens === l.key}
              title={l.hint}
              onClick={() => setLens(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="jg-seg" role="group" aria-label="巡宫">
          <span className="jg-progress">
            点亮 {lit.size}/{PALACES.length} 宫
            <i>
              {TOUR.map((n) => (
                <em key={n} className={lit.has(n) ? 'on' : ''} />
              ))}
            </i>
          </span>
          <button type="button" onClick={() => { setLit(new Set(TOUR)); triggerSquare() }} disabled={completed}>
            九宫齐
          </button>
          <button type="button" onClick={() => setLit(new Set())} disabled={!lit.size}>
            复位
          </button>
          <button
            type="button"
            className={showLuck ? 'jg-play on' : 'jg-play'}
            onClick={() => setShowLuck((v) => !v)}
            title="按奇门之说标出三吉门与四凶门（景门古说或列为凶，本盘标平）"
          >
            吉凶
          </button>
          <button
            type="button"
            className="jg-play"
            onClick={() => setPaused((p) => !p)}
            title={paused ? '继续巡宫' : '暂停巡宫'}
          >
            {paused ? '▶' : '⏸'}
          </button>
        </div>
      </div>

      <div className={`jg-stage ${square ? 'is-square' : ''} ${showLuck ? 'show-luck' : ''}`}>
        {/* 外环八卦 */}
        <div className="jg-ring" aria-hidden>
          {GUA_RING.map((p) => (
            <span
              key={p.num}
              className={`jg-ring__gua ${sel === p.num ? 'on' : ''}`}
              style={{ '--angle': `${ring(p)}deg`, '--c': p.luck === '吉' ? '#22d3ee' : '#a5b4fc' }}
              title={`${p.gua} · ${p.direction} · 洛书${p.num}`}
            >
              <b>{p.symbol}</b>
              <em>{p.gua}</em>
            </span>
          ))}
          <span className="jg-ring__compass">北</span>
        </div>

        <div className="jg-grid">
          {PALACES.map((p) => (
            <button
              key={p.num}
              type="button"
              className={[
                'jg-cell',
                p.isCenter ? 'is-center' : '',
                p.num === shown.num ? 'is-now' : '',
                sel === p.num ? 'is-sel' : '',
                lit.has(p.num) ? 'is-lit' : '',
                p.luck === '吉' ? 'is-lucky' : '',
                p.luck === '凶' ? 'is-hazard' : '',
                p.luck === '平' ? 'is-neutral' : '',
              ].filter(Boolean).join(' ')}
              style={{ gridRow: p.r + 1, gridColumn: p.c + 1 }}
              aria-label={`洛书${p.num}，${p.gua ? p.gua + '卦' : '中宫'}，${p.gate}`}
              onClick={() => light(p.num)}
            >
              <span className="jg-cell__main">{lensOf.pick(p)}</span>
              <span className="jg-cell__foot">
                {lens === 'num' ? (p.gua || '中央') : String(p.num)}
                <em>{p.isCenter ? '中军' : p.gate}</em>
              </span>
            </button>
          ))}

          {/* 八条幻方线：九宫齐后依次亮起 */}
          <svg className="jg-lines" viewBox="0 0 300 300" aria-hidden>
            {LINES.map((l, i) => (
              <line
                key={i}
                className="jg-line"
                style={{ '--i': i }}
                x1={l.cells[0].c * 100 + 50}
                y1={l.cells[0].r * 100 + 50}
                x2={l.cells[2].c * 100 + 50}
                y2={l.cells[2].r * 100 + 50}
              />
            ))}
          </svg>

          {square && <span className="jg-sum">{MAGIC_SUM}</span>}
        </div>
      </div>

      <div className="jg-hud">
        <div className="jg-hud__main">
          <b>{shown.gua ? `${shown.gua}卦 · ${shown.symbol}` : '中宫 · 五'}</b>
          <span className="jg-hud__sub">
            洛书{shown.num} · {metaLine(shown)}
          </span>
          <span className="jg-hud__gate">
            {shown.gate}
            <em className={`jg-luck jg-luck-${shown.luck === '—' ? 'mid' : shown.luck}`}>{shown.luck === '—' ? '中宫无门' : shown.luck}</em>
            {shown.wind !== '—' ? ` · ${shown.wind}` : ''}
            {shown.virtue ? ` · 卦德${shown.virtue} · 象${shown.image}` : ''}
          </span>
        </div>
        <div className="jg-hud__meta">
          <span>{lensOf.hint}</span>
          <button type="button" onClick={() => setSel(null)} disabled={sel === null}>
            收档
          </button>
        </div>
      </div>

      {sel !== null && (
        <div className="jg-modal" role="dialog" aria-modal="true" onClick={closeCard}>
          <div className="jg-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="jg-close" onClick={closeCard} aria-label="关闭">×</button>
            <div className="jg-card__head">
              <span className="jg-card__big">{shown.symbol}</span>
              <div>
                <h3>{shown.gua ? `${shown.gua}宫 · 洛书${shown.num}` : `中宫 · 洛书${shown.num}`}</h3>
                <span className="jg-card__sub">
                  {metaLine(shown)}
                </span>
              </div>
            </div>

            <dl className="jg-grid-2">
              {shown.gua && (
                <>
                  <div>
                    <dt>卦德</dt>
                    <dd>{shown.virtue}</dd>
                  </div>
                  <div>
                    <dt>卦象</dt>
                    <dd>
                      {shown.image} · {shown.family}
                    </dd>
                  </div>
                  <div>
                    <dt>三爻（自下而上）</dt>
                    <dd className="jg-yyao">{shown.lines}</dd>
                  </div>
                </>
              )}
              <div>
                <dt>八门（奇门）</dt>
                <dd>{shown.gate}</dd>
              </div>
              <div>
                <dt>八风（《淮南子》一系）</dt>
                <dd>{shown.wind}</dd>
              </div>
              <div>
                <dt>八节</dt>
                <dd>{shown.jieqi}</dd>
              </div>
            </dl>

            {shown.saying && (
              <>
                <h4 className="jg-card__title">原典 · 《周易·说卦》</h4>
                <blockquote className="jg-quote">{shown.saying}</blockquote>
              </>
            )}

            <h4 className="jg-card__title">阵法里的取用</h4>
            <p className="jg-lore">{shown.lore}</p>

            <h4 className="jg-card__title">与原典的差别</h4>
            <p className="jg-reality">{shown.reality}</p>
            <p className="jg-keys">Esc 关闭</p>
          </div>
        </div>
      )}

      <div className="jg-classics">
        {CLASSICS.map((c) => (
          <article key={c.src + c.text} className={`jg-classic jg-classic-rank${c.rank}`}>
            <header>
              <span className="jg-classic__src">{c.src}</span>
              <em className="jg-classic__rank">{c.rank === 1 ? '原文可核' : '字句待核'}</em>
            </header>
            <blockquote>{c.text}</blockquote>
            <p>{c.note}</p>
          </article>
        ))}
      </div>

      <div className="jg-foot">
        <span>九宫 · 八条幻方线 · 每线 {MAGIC_SUM} · 八门配八宫，中五无卦无门</span>
        <span className="jg-foot__luck">
          {GATE_BY_LUCK.map((g) => (
            <em key={g.key} className={`jg-luck jg-luck-${g.key === '—' ? 'mid' : g.key}`}>
              {g.label} {g.gates}
            </em>
          ))}
        </span>
        <span>本盘北在上（与星斗盘同向）；传统洛书图南上，故为古图旋转 180°</span>
      </div>
    </section>
  )
}
