/* ---------- 迷你折线图 ---------- */

export function Sparkline({ data, max, color, format }) {
  const W = 300, H = 48
  if (!data?.length) return null
  const step = W / Math.max(1, data.length - 1)
  const pts = data.map((v, i) => [i * step, H - (v / max) * H])
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${d} L${W},${H} L0,${H} Z`
  const last = data[data.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="astro-spark" preserveAspectRatio="none">
      <path d={area} fill={color} opacity="0.14" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" />
      <text x={W} y={-4} className="astro-spark__val" textAnchor="end">
        {format ? format(last) : last}
      </text>
    </svg>
  )
}


export default Sparkline
