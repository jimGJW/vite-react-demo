/* ---------- 太阳活动周期图 ---------- */

/**
 * 太阳活动周期曲线：实测折线 + 预测带。
 *
 * 为什么要把「观测」和「预测」画在同一张图上：
 * 单独看预测毫无意义——必须看到实测线在哪、离预测带有多远，
 * 才能判断「这轮太阳到底会不会比预报活跃」。
 *
 * X 轴是「距今月数」而非真实日期：观测（近 60 个月）与预测（未来 57 个月）
 * 在时间轴上首尾相接，用相对月数才能让两段共用一个刻度。
 */
import { useI18n } from '@i18n/index.js'

export function SolarCycleChart({ data }) {
  const { t } = useI18n()
  const W = 720
  const H = 200
  const PAD = { l: 34, r: 12, t: 12, b: 26 }

  const obs = data.observed || []
  const pred = data.predicted || []

  // 观测用平滑值优先（更能代表周期走势），没有就退回原始月均值
  const obsPts = obs.map((r) => ({ m: r.m, v: r.smoothed ?? r.ss }))

  // 所有月份排成一条连续轴：观测在后、预测在前
  const allMonths = [...obsPts.map((p) => p.m), ...pred.map((p) => p.m)]
  if (!allMonths.length) return null
  const idx = new Map(allMonths.map((m, i) => [m, i]))
  const span = Math.max(1, allMonths.length - 1)

  const maxV = Math.max(
    10,
    ...obsPts.map((p) => p.v ?? 0),
    ...pred.map((p) => p.high ?? 0),
  ) * 1.1

  const x = (m) => PAD.l + (idx.get(m) / span) * (W - PAD.l - PAD.r)
  const y = (v) => H - PAD.b - (v / maxV) * (H - PAD.t - PAD.b)

  // 预测带：把 high/low 连成上下两条边 + 填充
  const highD = pred.filter((p) => p.high != null).map((p, i) => `${i ? 'L' : 'M'}${x(p.m).toFixed(1)},${y(p.high).toFixed(1)}`).join('')
  const lowD = [...pred.filter((p) => p.low != null)].reverse()
    .map((p, i) => `${i ? 'L' : 'L'}${x(p.m).toFixed(1)},${y(p.low).toFixed(1)}`).join('')
  const bandD = highD && lowD ? `${highD}${lowD}Z` : ''

  // 实测折线要断开成两段：观测与预测在时间上相接，但「现在」两侧不该连成一条实线
  const obsD = obsPts.filter((p) => p.v != null).map((p, i) => `${i ? 'L' : 'M'}${x(p.m).toFixed(1)},${y(p.v).toFixed(1)}`).join('')
  const predD = pred.map((p, i) => `${i ? 'L' : 'M'}${x(p.m).toFixed(1)},${y(p.ssn).toFixed(1)}`).join('')

  // 「现在」分界线：最后一个实测月的位置
  const nowIdx = obsPts.length - 1
  const nowX = nowIdx >= 0 ? x(obsPts[nowIdx].m) : PAD.l

  const ticks = [0, Math.round(span * 0.25), Math.round(span * 0.5), Math.round(span * 0.75), span]
    .map((i) => allMonths[Math.min(i, allMonths.length - 1)])
    .filter((m, i, arr) => arr.indexOf(m) === i)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="astro-cycle-chart">
      {/* 网格 */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={PAD.l} y1={y(maxV * f)} x2={W - PAD.r} y2={y(maxV * f)} className="astro-cycle-grid" />
      ))}
      {/* 预测带 */}
      {bandD && <path d={bandD} className="astro-cycle-band" />}
      {/* 实测线（实心）与预测线（虚线） */}
      {obsD && <path d={obsD} className="astro-cycle-obs" />}
      {predD && <path d={predD} className="astro-cycle-pred" />}
      {/* 现在 */}
      <line x1={nowX} y1={PAD.t} x2={nowX} y2={H - PAD.b} className="astro-cycle-now" />
      <text x={nowX + 4} y={PAD.t + 10} className="astro-cycle-now__label">{t('astro.cycleNow')}</text>
      {/* X 轴标签 */}
      {ticks.map((m) => (
        <text key={m} x={x(m)} y={H - 8} className="astro-cycle-tick" textAnchor="middle">
          {m}
        </text>
      ))}
      {/* 图例 */}
      <g className="astro-cycle-legend">
        <rect x={W - 168} y={PAD.t + 2} width="12" height="3" className="astro-cycle-obs" />
        <text x={W - 152} y={PAD.t + 7}>{t('astro.cycleObserved')}</text>
        <rect x={W - 168} y={PAD.t + 15} width="12" height="3" className="astro-cycle-pred" />
        <text x={W - 152} y={PAD.t + 20}>{t('astro.cyclePrediction')}</text>
        <rect x={W - 168} y={PAD.t + 28} width="12" height="8" className="astro-cycle-band" />
        <text x={W - 152} y={PAD.t + 36}>{t('astro.cycleBand')}</text>
      </g>
    </svg>
  )
}


export default SolarCycleChart
