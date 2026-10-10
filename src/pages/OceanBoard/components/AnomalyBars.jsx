/**
 * 通用「距平柱状图」：正负分色，零线加重。
 *
 * 海洋看板里三条长期曲线（海洋温度距平、PDO、AMO）都是「围绕零上下波动」的量，
 * 视觉诉求完全一致：一眼看出**符号**和**持续性**。所以抽成一个组件复用，
 * 而不是复制三份几乎相同的 SVG。
 *
 * series 元素形如 { key, value }，key 可以是年份数字也可以是 'YYYY-MM' 串。
 */
export default function AnomalyBars({
  series,
  unit = '°C',
  posColor = '#ef4444',
  negColor = '#3b82f6',
  ariaLabel = '距平序列',
  digits = 2,
  height = 180,
  zeroLabel = '0',
}) {
  if (!series?.length) return null
  const W = 640
  const H = height
  const PAD = { l: 46, r: 14, t: 12, b: 24 }
  const vals = series.map((s) => s.value)
  const raw = Math.max(...vals.map((v) => Math.abs(v)))
  const span = Math.max(raw, 0.2) * 1.15
  const min = -span
  const max = span
  const bw = (W - PAD.l - PAD.r) / series.length
  const y = (v) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b)
  const zero = y(0)
  const ticks = [min, 0, max]

  return (
    <div className="o-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} y1={y(t)} x2={W - PAD.r} y2={y(t)} className="o-chart__grid" />
            <text x={PAD.l - 6} y={y(t) + 3.5} textAnchor="end" className="o-chart__tick">
              {t === 0 ? zeroLabel : `${t > 0 ? '+' : ''}${t.toFixed(1)}`}
            </text>
          </g>
        ))}
        <line x1={PAD.l} y1={zero} x2={W - PAD.r} y2={zero} className="o-chart__ref" />
        {series.map((s, i) => {
          const v = s.value
          return (
            <rect
              key={s.key}
              x={PAD.l + i * bw + 0.5}
              y={Math.min(y(v), zero)}
              width={Math.max(1.6, bw - 1)}
              height={Math.max(1, Math.abs(zero - y(v)))}
              fill={v >= 0 ? posColor : negColor}
              opacity={0.55 + Math.min(0.45, Math.abs(v) / span)}
              rx="1"
            >
              <title>{`${s.key}：${v >= 0 ? '+' : ''}${v.toFixed(digits)} ${unit}`}</title>
            </rect>
          )
        })}
        <text x={PAD.l} y={H - 7} className="o-chart__tick">{series[0].key}</text>
        <text x={W - PAD.r} y={H - 7} textAnchor="end" className="o-chart__tick">
          {series[series.length - 1].key}
        </text>
      </svg>
    </div>
  )
}
