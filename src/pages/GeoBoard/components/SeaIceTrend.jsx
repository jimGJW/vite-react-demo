export function SeaIceTrend({ history, latest, avg1980s, avg2010s, declinePct, zh = '北极', monthLabel = '9 月' }) {
  if (!history?.length) return null
  const W = 640
  const H = 210
  const PAD = { l: 44, r: 14, t: 14, b: 26 }
  const min = 0
  const max = Math.ceil(Math.max(...history.map((h) => h.extent)) + 0.5)
  const bw = (W - PAD.l - PAD.r) / history.length
  const y = (v) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b)
  // 颜色按年份插值：早年冷蓝 → 近年暖红，直观呈现缩减
  const frac = (year) => (year - history[0].year) / (history[history.length - 1].year - history[0].year)
  const colorAt = (f) => {
    const c1 = [96, 165, 250]
    const c2 = [239, 68, 68]
    const c = c1.map((a, i) => Math.round(a + (c2[i] - a) * f))
    return `rgb(${c.join(',')})`
  }
  const ticks = [2, 4, 6, 8].filter((t) => t <= max)
  return (
    <div className="geo-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${zh}${monthLabel}海冰范围年际变化`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} y1={y(t)} x2={W - PAD.r} y2={y(t)} className="geo-chart__grid" />
            <text x={PAD.l - 6} y={y(t) + 3.5} textAnchor="end" className="geo-chart__tick">{t}</text>
          </g>
        ))}
        {history.map((h, i) => (
          <rect
            key={h.year}
            x={PAD.l + i * bw + 0.8}
            y={y(h.extent)}
            width={Math.max(2, bw - 1.6)}
            height={H - PAD.b - y(h.extent)}
            fill={colorAt(frac(h.year))}
            rx="1.5"
          >
            <title>{`${h.year} 年 ${monthLabel}：${h.extent.toFixed(2)} 百万 km²`}</title>
          </rect>
        ))}
        {/* 两个年代的均值参考线 */}
        {avg1980s && <line x1={PAD.l} y1={y(avg1980s)} x2={W - PAD.r} y2={y(avg1980s)} className="geo-chart__ref" strokeDasharray="5 4" />}
        {avg2010s && <line x1={PAD.l} y1={y(avg2010s)} x2={W - PAD.r} y2={y(avg2010s)} className="geo-chart__ref geo-chart__ref--warm" strokeDasharray="5 4" />}
        {/* x 轴起止年份 */}
        <text x={PAD.l} y={H - 8} className="geo-chart__tick">{history[0].year}</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="geo-chart__tick">{latest.year}</text>
      </svg>
      <div className="geo-chart__caption">
        {zh} {monthLabel}海冰范围（极值月，NSIDC）· 1981–1990 均值 {avg1980s?.toFixed(2)}（冷线）
        vs 2011–2020 均值 {avg2010s?.toFixed(2)}（暖线）· 相比 {history[0].year} 年{' '}
        <b>{declinePct <= 0 ? '缩减' : '增长'} {Math.abs(declinePct ?? 0)}%</b>
      </div>
    </div>
  )
}

export default SeaIceTrend
