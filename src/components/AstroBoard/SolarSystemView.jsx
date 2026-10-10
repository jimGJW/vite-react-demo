/**
 * 太阳系视图（纯 SVG）。
 *
 * 一个刻意的取舍：行星位置用对数半径映射而非线性。
 * 线性映射下，海王星(30 AU) 会把内行星全部压成一个点；
 * 对数映射能让水星到海王星同屏可辨，同时仍保持「越外越远」的单调关系。
 * 轨道画成圆形近似——真实偏心率都很小（最大的是水星 0.206），
 * 视觉上与真轨几乎无差别。
 */

import { useMemo } from 'react'

const SIZE = 620
const CX = SIZE / 2
const CY = SIZE / 2

/** 对数半径映射：把 AU 映射到像素半径 */
function makeScale(maxAU) {
  const rMin = 26
  const rMax = SIZE / 2 - 34
  // 让 0.39 AU（水星）落在 rMin 附近，maxAU 落在 rMax
  const lo = Math.log(0.3)
  const hi = Math.log(maxAU * 1.12)
  const k = (rMax - rMin) / (hi - lo)
  return (au) => rMin + k * (Math.log(Math.max(au, 0.05)) - lo)
}

/** 圆轨道：给定半径，画出完整一圈 */
function orbitPath(r) {
  return `M ${CX - r},${CY} a ${r},${r} 0 1,0 ${2 * r},0 a ${r},${r} 0 1,0 ${-2 * r},0`
}

export default function SolarSystemView({ planets, onSelect, selected }) {
  // 地球在中心，排除掉（它是视角原点）
  const others = useMemo(() => planets.filter((p) => p.key !== 'earth'), [planets])
  const earth = useMemo(() => planets.find((p) => p.key === 'earth'), [planets])
  const scale = useMemo(
    () => makeScale(Math.max(...others.map((p) => p.a), 5)),
    [others],
  )

  return (
    <svg className="astro-solar" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="太阳系行星位置">
      <defs>
        <radialGradient id="astro-sun-core">
          <stop offset="0%" stopColor="#fff6d5" />
          <stop offset="45%" stopColor="#ffcf4d" />
          <stop offset="100%" stopColor="#ff8c1a" />
        </radialGradient>
        <filter id="astro-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 星空底 */}
      <circle cx={CX} cy={CY} r={SIZE / 2 - 2} className="astro-orbit-bg" />

      {/* 轨道 */}
      {others.map((p) => (
        <path key={p.key} d={orbitPath(scale(p.a))} className="astro-orbit" />
      ))}

      {/* 太阳 */}
      <g className="astro-sun">
        <circle cx={CX} cy={CY} r="24" fill="url(#astro-sun-core)" filter="url(#astro-glow)" />
        <circle cx={CX} cy={CY} r="24" className="astro-sun-ring" />
      </g>

      {/* 地球（视角中心） */}
      <g className="astro-planet is-earth">
        <circle cx={CX} cy={CY} r="7" fill="#4a90d9" />
        <circle cx={CX} cy={CY} r="7" className="astro-planet-ring" />
      </g>

      {/* 行星：位置 = 日心黄经反投影到俯视图 */}
      {others.map((p) => {
        const r = scale(p.a)
        // 黄经 → 屏幕角度（逆时针为正，取 y 轴向下故用 -sin）
        const ang = (p.heliocentricLon * Math.PI) / 180
        const x = CX + r * Math.cos(ang)
        const y = CY - r * Math.sin(ang)
        const isSel = selected === p.key
        // 视直径：真实半径用对数压缩，避免海王星把水星压没
        const dotR = Math.max(3.2, Math.min(11, 2.4 + Math.log10(p.radius / 1000 + 1) * 3.6))
        return (
          <g
            key={p.key}
            className={`astro-planet${isSel ? ' is-active' : ''}`}
            onClick={() => onSelect && onSelect(p.key)}
            style={{ cursor: 'pointer' }}
          >
            {isSel && <circle cx={x} cy={y} r={dotR + 9} className="astro-planet-halo" fill={p.color} />}
            <circle cx={x} cy={y} r={dotR} fill={p.color} />
            <text x={x + dotR + 6} y={y + 4} className="astro-planet-label">{p.name}</text>
          </g>
        )
      })}

      {/* 地球日距提示 */}
      {earth && (
        <text x={CX} y={SIZE - 8} className="astro-solar-foot">
          地球距太阳 {earth.geoDist < 0.01 ? '—' : `${(earth.a * 63241).toFixed(0)} 万光年·AU`}
          {' · '}轨道半径采用对数刻度
        </text>
      )}
    </svg>
  )
}
