export function OniChart({ history, latest, state }) {
  if (!history?.length) return null
  const W = 640
  const H = 220
  const PAD = { l: 44, r: 14, t: 14, b: 26 }
  const y = (v) => PAD.t + (1 - (v + 2.5) / 5) * (H - PAD.t - PAD.b) // 值域 -2.5 ~ +2.5
  const zero = y(0)
  const bw = (W - PAD.l - PAD.r) / history.length
  const colorAt = (v) => {
    if (v >= 2) return '#dc2626'
    if (v >= 1.5) return '#ef4444'
    if (v >= 0.5) return '#f87171'
    if (v <= -2) return '#1d4ed8'
    if (v <= -1.5) return '#2563eb'
    if (v <= -0.5) return '#60a5fa'
    return '#94a3b8'
  }
  return (
    <div className="o-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="厄尔尼诺指数 ONI 历史">
        {[2, 1, 0, -1, -2].map((t) => (
          <g key={t}>
            <line x1={PAD.l} y1={y(t)} x2={W - PAD.r} y2={y(t)}
              className={t === 0 ? 'o-chart__zero' : 'o-chart__grid'} />
            <text x={PAD.l - 6} y={y(t) + 3.5} textAnchor="end" className="o-chart__tick">
              {t > 0 ? `+${t}` : t}
            </text>
          </g>
        ))}
        {history.map((h, i) => {
          const top = h.anom >= 0 ? y(h.anom) : zero
          const height = Math.abs(y(h.anom) - zero)
          return (
            <rect
              key={`${h.year}-${h.season}`}
              x={PAD.l + i * bw + 0.8}
              y={top}
              width={Math.max(2, bw - 1.6)}
              height={Math.max(1, height)}
              fill={colorAt(h.anom)}
              rx="1.5"
            >
              <title>{`${h.year} 年 ${h.season}：ONI ${h.anom >= 0 ? '+' : ''}${h.anom.toFixed(2)}（海温 ${h.sst.toFixed(2)} °C）`}</title>
            </rect>
          )
        })}
        <text x={PAD.l} y={H - 8} className="o-chart__tick">{`${history[0].year} ${history[0].season}`}</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="o-chart__tick">
          {`${latest.year} ${latest.season}`}
        </text>
      </svg>
      <div className="o-chart__caption">
        ONI = Niño 3.4 区（5°N–5°S, 170°W–120°W）海温距平的 3 个月滑动均值（NOAA CPC）。
        连续 5 季 ≥ +0.5 为厄尔尼诺、≤ −0.5 为拉尼娜；当前最新 {latest.year} 年 {latest.season}：
        <b style={{ color: colorAt(latest.anom) }}> {latest.anom >= 0 ? '+' : ''}{latest.anom.toFixed(2)}（{state}）</b>
      </div>
    </div>
  )
}

export default OniChart
