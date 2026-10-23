/* =====================================================================
   洪荒前二阵：周天星斗大阵（内盘 365 星）+ 十二都天神煞大阵（外盘十二宫）
   ---------------------------------------------------------------------
   一张盘两层阵：
   - 内盘 365 星，角度 = 《汉书·律历志》汉制宿度占比（井宿 33 度铺得开、
     觜宿 2 度只占一条），四象异色，阵眼为河图洛书，日月二星绕眼。
   - 外盘十二宫（子北起、每 30° 一宫），十一位排祖巫、戌位留天门虚位。
     点一位祖巫 → 它头顶那一扇的星整体亮起。
   - 十二宫全部点亮过 → 都天神煞齐聚，凝盘古真身（小说设定的演出）。
   诚实分层常驻盘面：原典 / 待核 / 后世与星官三档，并标明「星↔兽配位为演绎」。

   渲染预算：365 颗星每 2.2s 巡行一次，若把游标混进星点 className，
   整层每次都要重算重挂。故星层单独 memo，游标抽成盘上一枚独立光环 ——
   巡行时只有光环重渲染，365 个 button 完全不动。
   ===================================================================== */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ARRAY_EYE,
  BRANCH,
  MAIN_STARS,
  MANSIONS,
  QUAD_ARCS,
  RINGS,
  STARS,
  STARS_BY_BRANCH,
  STARS_BY_MANSION,
  TOTAL_DU,
} from './xingdou-data.js'
import { BRANCHES, SKY_GATE, ZUWU_BY_BRANCH, ZUWU_LIST } from './zuwu-data.js'
import { BEAST_ORIGIN_COUNT, PROVENANCE, RANK_LABEL } from './beasts-data.js'
import './HonghuangArray.scss'

const STAR_TOTAL = STARS.length
const TOUR_MS = 2200

function useLitSet(mansionIdx, branch) {
  return useMemo(() => {
    if (mansionIdx !== null) return new Set(STARS_BY_MANSION[mansionIdx].map((s) => s.id))
    if (branch) return new Set(STARS_BY_BRANCH[branch].map((s) => s.id))
    return null
  }, [mansionIdx, branch])
}

/* —— 星层：只在「选中星 / 亮扇区 / 已点亮的宫」变化时重渲染 —— */
const StarField = memo(function StarField({ litSet, starSel, litBranches, onOpen }) {
  return STARS.map((s) => {
    const cls = [
      'hh-star',
      s.isMansionHead ? 'is-head' : '',
      starSel === s.id ? 'is-sel' : '',
      litSet ? (litSet.has(s.id) ? 'is-lit' : 'is-dim') : '',
      litBranches.has(s.branch) ? 'is-glow' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <button
        key={s.id}
        type="button"
        className={cls}
        style={{
          '--angle': `${s.screenAngle.toFixed(2)}deg`,
          '--ring-frac': s.radius,
          '--c': s.color,
          '--i': s.id,
        }}
        aria-label={`${s.name}，配兽${s.beast.name}`}
        title={`${s.name} · ${s.beast.name}`}
        onClick={() => onOpen(s.id)}
      />
    )
  })
})

function HonghuangArray() {
  const [layer, setLayer] = useState('both') // both | xingdou | shensha
  const [cursor, setCursor] = useState(0)
  const [paused, setPaused] = useState(false)
  const [starSel, setStarSel] = useState(null)
  const [zuwuSel, setZuwuSel] = useState(null) // branch key
  const [eyeSel, setEyeSel] = useState(null) // 'eye' | 'sun' | 'moon'
  const [mansionSel, setMansionSel] = useState(null)
  const [lit, setLit] = useState(() => new Set()) // 已点亮过的宫（齐聚进度）
  const [gathering, setGathering] = useState(false)
  const timer = useRef(null)
  const gatherTimer = useRef(null)

  const assembled = lit.size === 12
  const cardOpen = starSel !== null || zuwuSel !== null || eyeSel !== null

  useEffect(() => {
    if (paused || gathering) return
    timer.current = setTimeout(() => setCursor((c) => (c + 1) % STAR_TOTAL), TOUR_MS)
    return () => clearTimeout(timer.current)
  }, [cursor, paused, gathering])

  /* 齐聚演出由「点齐第十二宫」这个动作触发，而不是由 assembled 派生的 effect ——
     在 effect 里同步 setState 会级联重渲染（eslint react-hooks/set-state-in-effect）。
     演出放完自己收势，避免无限循环动画一直挂在盘上。 */
  const triggerGathering = () => {
    setGathering(true)
    clearTimeout(gatherTimer.current)
    gatherTimer.current = setTimeout(() => setGathering(false), 4200)
  }

  useEffect(() => () => clearTimeout(gatherTimer.current), [])

  const closeCard = useCallback(() => {
    setStarSel(null)
    setZuwuSel(null)
    setEyeSel(null)
    setMansionSel(null)
  }, [])

  /* 弹窗打开后接管键盘：Esc 收，←→ 按「度」前后换星。
     放在监听回调里而不是 effect 体内，避免同步 setState。 */
  useEffect(() => {
    if (!cardOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeCard()
        return
      }
      if (starSel === null || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
      e.preventDefault()
      const delta = e.key === 'ArrowLeft' ? -1 : 1
      setStarSel((i) => (i + delta + STAR_TOTAL) % STAR_TOTAL)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cardOpen, starSel, closeCard])

  const litSet = useLitSet(mansionSel, zuwuSel)
  const activeIdx = starSel ?? cursor
  const star = STARS[activeIdx]
  const beast = star.beast

  const tint = useMemo(
    () =>
      `conic-gradient(from 0deg, ${MANSIONS.map(
        (m) =>
          `${m.color} ${((m.start / TOTAL_DU) * 360).toFixed(2)}deg ${(
            ((m.start + m.du) / TOTAL_DU) *
            360
          ).toFixed(2)}deg`,
      ).join(',')})`,
    [],
  )

  const openStar = useCallback((i) => {
    setStarSel(i)
    setZuwuSel(null)
    setEyeSel(null)
    setMansionSel(STARS[i].mansionIdx)
  }, [])

  const openZuwu = (branch) => {
    setZuwuSel(branch)
    setStarSel(null)
    setEyeSel(null)
    setMansionSel(null)
    if (lit.has(branch)) return
    const next = new Set(lit)
    next.add(branch)
    setLit(next)
    if (next.size === 12) triggerGathering()
  }

  const openEye = (which) => {
    setEyeSel(which)
    setStarSel(null)
    setZuwuSel(null)
    setMansionSel(null)
  }

  const shownZuwu = zuwuSel === SKY_GATE.branch ? SKY_GATE : ZUWU_BY_BRANCH[zuwuSel]
  const shownMain = MAIN_STARS.find((m) => m.id === eyeSel)
  const cursorStar = STARS[activeIdx]

  return (
    <section className="hh">
      <div className="hh-head">
        <h2>周天星斗大阵 · 十二都天神煞大阵</h2>
        <p>
          内盘 {STAR_TOTAL} 星按汉制二十八宿宿度布算，四象异色、日月绕眼；外盘十二宫按地支排
          十一位祖巫、戌位虚置天门。点星看所配妖兽，点祖巫看本宫星区，点日月与阵眼看它们的来历。
        </p>
      </div>

      {/* 诚实分层：来源与档位一目了然 */}
      <div className="hh-truth">
        <span className="hh-truth__label">史料档位</span>
        {['shanhaijing', 'later', 'star'].map((k) => (
          <span key={k} className={`hh-chip hh-chip-${k}`} title={PROVENANCE[k].hint}>
            {PROVENANCE[k].label}
            <b>{BEAST_ORIGIN_COUNT[k]}</b>
          </span>
        ))}
        <span className="hh-truth__note">
          星↔兽配位为<b>本项目演绎</b>：《山海经》无星辰体系；「365 星为基、日月为主星、河图洛书镇眼」为洪荒流小说设定。
        </span>
      </div>

      <div className="hh-toolbar">
        <div className="hh-seg" role="group" aria-label="视图">
          {[
            ['both', '双阵合璧'],
            ['xingdou', '只看星斗'],
            ['shensha', '只看神煞'],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={layer === k ? 'on' : ''}
              aria-pressed={layer === k}
              onClick={() => setLayer(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="hh-seg" role="group" aria-label="齐聚">
          <span className="hh-progress">
            神煞 {lit.size}/12 宫
            <i>
              {BRANCH.map((b) => (
                <em key={b} className={lit.has(b) ? 'on' : ''} />
              ))}
            </i>
          </span>
          <button
            type="button"
            onClick={() => {
              setLit(new Set(BRANCH))
              triggerGathering()
            }}
            disabled={assembled}
          >
            十二齐聚
          </button>
          <button type="button" onClick={() => setLit(new Set())} disabled={!lit.size}>
            复位
          </button>
          <button
            type="button"
            className="hh-play"
            onClick={() => setPaused((p) => !p)}
            title={paused ? '继续巡行' : '暂停巡行'}
          >
            {paused ? '▶' : '⏸'}
          </button>
        </div>
      </div>

      <div className={`hh-stage hh-layer-${layer} ${gathering ? 'is-gathering' : ''}`}>
        <div className="hh-nebula hh-nebula-1" />
        <div className="hh-nebula hh-nebula-2" />

        <div className="hh-disc">
          <span className="hh-tint" style={{ background: tint }} />
          <span className="hh-sweep" />
          {RINGS.map((r) => (
            <span key={r.ring} className="hh-track" style={{ '--ring-frac': r.radius }} />
          ))}

          <StarField litSet={litSet} starSel={starSel} litBranches={lit} onOpen={openStar} />

          {/* 巡行游标：独立一枚光环，故 365 星不随每次巡行重渲染 */}
          <span
            className="hh-cursor"
            aria-hidden
            style={{
              '--angle': `${cursorStar.screenAngle.toFixed(2)}deg`,
              '--ring-frac': cursorStar.radius,
              '--c': cursorStar.color,
            }}
          />

          {/* 二十八宿宿名（宿首角度即该宿起始度） */}
          {MANSIONS.map((m) => (
            <button
              key={m.name}
              type="button"
              className={`hh-mlabel ${mansionSel === m.idx ? 'on' : ''}`}
              style={{
                '--angle': `${(((90 - (m.start / TOTAL_DU) * 360) % 360) + 360) % 360}deg`,
                '--c': m.color,
              }}
              title={`${m.name}宿 · ${m.du} 度 · ${m.bird}`}
              onClick={() => {
                setMansionSel(mansionSel === m.idx ? null : m.idx)
                setZuwuSel(null)
                setStarSel(null)
                setEyeSel(null)
              }}
            >
              {m.name}
            </button>
          ))}

          {/* 四象盘缘标注：四段弧长不等，正是宿度的直接可见 */}
          {QUAD_ARCS.map((q) => (
            <span
              key={q.quadrant}
              className="hh-qlabel"
              aria-hidden
              style={{ '--angle': `${q.screenAngle.toFixed(2)}deg`, '--c': q.color }}
              title={`${q.name} · ${q.du} 度`}
            >
              {q.name}
            </span>
          ))}

          <button type="button" className="hh-eye" onClick={() => openEye('eye')} aria-label={`${ARRAY_EYE.name}，阵眼`} />
          <span className="hh-eye-label">{ARRAY_EYE.name}</span>
          <span className={`hh-orbit ${eyeSel ? 'is-still' : ''}`} aria-hidden>
            {MAIN_STARS.map((ms, i) => (
              <button
                key={ms.id}
                type="button"
                className="hh-orbit__star"
                style={{ '--c': ms.color, '--half': i === 0 ? '0deg' : '180deg' }}
                aria-label={ms.name}
                title={`${ms.name} · 点击查看来历`}
                onClick={() => openEye(ms.id)}
              />
            ))}
          </span>

          {/* 十二道神煞光柱：齐聚时向阵眼收束 */}
          <span className="hh-beams" aria-hidden>
            {BRANCHES.map((b, i) => (
              <i
                key={b}
                className={lit.has(b) ? 'on' : ''}
                style={{ '--angle': `${i * 30}deg`, '--c': b === SKY_GATE.branch ? '#94a3b8' : ZUWU_BY_BRANCH[b].color }}
              />
            ))}
          </span>

          {gathering && (
            <span className="hh-pangu">
              <b>盘古</b>
              <em>十二都天神煞齐聚 · 真身凝现</em>
            </span>
          )}
        </div>

        {/* 外盘十二宫 */}
        <div className="hh-plate">
          {BRANCHES.map((b, i) => {
            const z = b === SKY_GATE.branch ? SKY_GATE : ZUWU_BY_BRANCH[b]
            const isGate = b === SKY_GATE.branch
            return (
              <button
                key={b}
                type="button"
                className={`hh-node ${isGate ? 'is-gate' : ''} ${lit.has(b) ? 'is-lit' : ''} ${zuwuSel === b ? 'is-sel' : ''}`}
                style={{ '--angle': `${i * 30}deg`, '--c': isGate ? '#94a3b8' : z.color }}
                aria-label={`${z.name}，${b}位`}
                onClick={() => openZuwu(b)}
              >
                <span className="hh-node__branch">{b}</span>
                <span className="hh-node__name">{z.name}</span>
                <span className="hh-node__office">{isGate ? '虚位' : z.office}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="hh-hud">
        <div className="hh-hud__star">
          <span className="hh-hud__dot" style={{ background: star.color }} />
          <b>{star.name}</b>
          <span className="hh-hud__sub">
            {star.quadrantName} · {star.mansion}宿（{star.bird}）· 周天第 {star.absoluteDu} 度 · {star.branch}宫
          </span>
          <span className="hh-hud__beast">
            配兽 <b>{beast.name}</b>
            <em className={`hh-rank hh-rank-${beast.rank}`}>{RANK_LABEL[beast.rank]}</em>
            <em className="hh-rank hh-rank-from">{PROVENANCE[beast.from].label}</em>
            {beast.effect ? ` · ${beast.effect}` : ''}
          </span>
        </div>
        <div className="hh-hud__meta">
          <span>
            {mansionSel !== null
              ? `${MANSIONS[mansionSel].name}宿 ${MANSIONS[mansionSel].du} 度 · ${
                  STARS_BY_MANSION[mansionSel].length
                } 星`
              : zuwuSel
                ? `${zuwuSel} 宫 · ${STARS_BY_BRANCH[zuwuSel].length} 星`
                : `巡行 ${activeIdx + 1}/${STAR_TOTAL} 度`}
          </span>
          <button type="button" onClick={closeCard} disabled={mansionSel === null && !zuwuSel && starSel === null && eyeSel === null}>
            清亮
          </button>
        </div>
      </div>

      {cardOpen && (
        <div className="hh-modal" role="dialog" aria-modal="true" onClick={closeCard}>
          <div className="hh-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="hh-close" onClick={closeCard} aria-label="关闭">×</button>

            {starSel !== null && (
              <>
                <div className="hh-card__head">
                  <span className="hh-card__dot" style={{ background: star.color }} />
                  <div>
                    <h3>{star.name}</h3>
                    <span className="hh-card__sub">
                      {star.quadrantName} · {star.mansion}宿 {star.bird} · 本宿第 {star.du} 度 · {star.branch}宫
                    </span>
                  </div>
                </div>
                <p className="hh-card__note">{MANSIONS[star.mansionIdx].note}。</p>

                <h4 className="hh-card__title">
                  配位妖兽 · {beast.name}
                  <em className={`hh-rank hh-rank-${beast.rank}`}>{RANK_LABEL[beast.rank]}</em>
                  <em className="hh-rank hh-rank-from">{PROVENANCE[beast.from].label}</em>
                </h4>
                <dl className="hh-grid">
                  <div>
                    <dt>出处</dt>
                    <dd>{beast.src}</dd>
                  </div>
                  <div>
                    <dt>类别</dt>
                    <dd>
                      {beast.kind}
                      {beast.effect ? ` · ${beast.effect}` : ''}
                    </dd>
                  </div>
                </dl>
                <blockquote className="hh-quote">{beast.quote}</blockquote>
                <p className="hh-lore">{beast.lore}</p>
                <p className="hh-warn">此条与「{star.name}」的对位是本项目按宿序编排，古籍无星↔兽配位记载。</p>

                <div className="hh-nav">
                  <button type="button" onClick={() => openStar((starSel - 1 + STAR_TOTAL) % STAR_TOTAL)}>
                    ‹ 上一度
                  </button>
                  <span>
                    {starSel + 1} / {STAR_TOTAL}
                  </span>
                  <button type="button" onClick={() => openStar((starSel + 1) % STAR_TOTAL)}>下一度 ›</button>
                </div>
              </>
            )}

            {zuwuSel !== null && shownZuwu && (
              <>
                <div className="hh-card__head">
                  <span className="hh-card__dot" style={{ background: shownZuwu.color }} />
                  <div>
                    <h3>{shownZuwu.name}</h3>
                    <span className="hh-card__sub">
                      {shownZuwu.branch}位 · {shownZuwu.title}
                    </span>
                  </div>
                </div>
                <dl className="hh-grid">
                  <div>
                    <dt>{shownZuwu.office ? '司职（小说设定）' : '性质'}</dt>
                    <dd>{shownZuwu.office || shownZuwu.title}</dd>
                  </div>
                  <div>
                    <dt>本宫星区</dt>
                    <dd>{STARS_BY_BRANCH[shownZuwu.branch].length} 星</dd>
                  </div>
                </dl>
                <p className="hh-card__note">形象：{shownZuwu.image}</p>
                <h4 className="hh-card__title">原典</h4>
                <blockquote className="hh-quote">{shownZuwu.quote}</blockquote>
                <p className="hh-lore">{shownZuwu.blurb}</p>
                {shownZuwu.reality && (
                  <>
                    <h4 className="hh-card__title">与原典的差别</h4>
                    <p className="hh-reality">{shownZuwu.reality}</p>
                  </>
                )}
                {shownZuwu.lore && <p className="hh-warn">大阵内的取用：{shownZuwu.lore}</p>}
              </>
            )}

            {(eyeSel === 'eye' || shownMain) && (
              <>
                <div className="hh-card__head">
                  <span
                    className="hh-card__dot"
                    style={{ background: shownMain ? shownMain.color : '#fbbf24' }}
                  />
                  <div>
                    <h3>{shownMain ? shownMain.name : ARRAY_EYE.name}</h3>
                    <span className="hh-card__sub">
                      {shownMain ? shownMain.en : `${ARRAY_EYE.kind} · ${ARRAY_EYE.origin}`}
                    </span>
                  </div>
                </div>
                {shownMain && (
                  <>
                    <h4 className="hh-card__title">原典</h4>
                    <p className="hh-card__note">{shownMain.origin}</p>
                    <blockquote className="hh-quote">{shownMain.quote}</blockquote>
                  </>
                )}
                <p className="hh-lore">{shownMain ? shownMain.note : ARRAY_EYE.note}</p>
                <p className="hh-warn">
                  {shownMain
                    ? '古籍记的是浴日浴月的神话与时岁之数，「星斗大阵主星」是洪荒流的取用。'
                    : '河图洛书在古籍里是占卜与历法的神物，「阵眼」是小说的派设。'}
                  </p>
              </>
            )}

            <p className="hh-keys">Esc 关闭{starSel !== null ? ' · ← → 换一度' : ''}</p>
          </div>
        </div>
      )}

      <div className="hh-foot">
        <span>祖巫 {ZUWU_LIST.length} 位 · 天门虚位 1 · 地支十二宫 · 周天 {TOTAL_DU} 度</span>
        <span>二十八宿宿度：《汉书·律历志》汉制古度</span>
      </div>
    </section>
  )
}

export default HonghuangArray
