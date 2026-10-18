/* ---------- 银河系示意图 ---------- */
import { GALAXY } from "@lib/astro/orbital.js"
import { zhGalaxyType } from "@lib/astro/glossary"
import { useI18n } from '@i18n/index.js'

export function GalaxyDiagram() {
  const { t } = useI18n()
  // 旋臂用对数螺线近似，符合真实旋臂的「越外越松」形态。
  // 螺旋色取自主题变量，浅色主题下自动换成同色相的深色版。
  const arms = [
    { phase: 0, color: 'var(--a-accent)' },
    { phase: Math.PI, color: 'var(--a-track)' },
    { phase: Math.PI * 0.7, color: 'var(--a-accent-2)' },
    { phase: Math.PI * 1.7, color: 'var(--a-warn-strong)' },
  ]
  const CX = 340, CY = 210
  const R = 185
  const spiral = (phase, color) => {
    const pts = []
    for (let t = 0; t <= 1; t += 0.01) {
      const ang = phase + t * Math.PI * 2.4
      const r = 16 + t * (R - 16)
      pts.push(`${(CX + r * Math.cos(ang) * 1.55).toFixed(1)},${(CY + r * Math.sin(ang) * 0.78).toFixed(1)}`)
    }
    return (
      <g key={phase}>
        <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="7" opacity="0.2" />
        <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" opacity="0.72" />
      </g>
    )
  }
  const gType = zhGalaxyType(GALAXY.type)
  return (
    <svg className="astro-galaxy" viewBox="0 0 680 420" role="img" aria-label={t('astro.galaxyAria')}>
      <defs>
        <radialGradient id="astro-core">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="30%" stopColor="#ffc14d" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ff8c1a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 盘 */}
      <ellipse
        cx={CX} cy={CY} rx={R * 1.62} ry={R * 0.82}
        fill="var(--a-galaxy-disk)" opacity="0.55"
      />
      <ellipse
        cx={CX} cy={CY} rx={R * 1.62} ry={R * 0.82}
        fill="none" stroke="var(--a-galaxy-disk-line)" strokeWidth="1" opacity="0.5"
      />

      {arms.map((a) => spiral(a.phase, a.color))}

      {/* 银核 */}
      <circle cx={CX} cy={CY} r="46" fill="url(#astro-core)" />
      <circle cx={CX} cy={CY} r="12" fill="#fff8dc" />
      <text x={CX} y={CY + 70} className="astro-galaxy__label" textAnchor="middle">
        {t('astro.galaxyCenter', { center: GALAXY.center })}
      </text>

      {/* 太阳位置 */}
      <g className="astro-galaxy__sun">
        <circle cx={CX + 148} cy={CY - 52} r="7" fill="var(--a-track)" />
        <circle cx={CX + 148} cy={CY - 52} r="14" fill="none" stroke="var(--a-track)" opacity="0.5" />
        <text x={CX + 162} y={CY - 48} className="astro-galaxy__label">{t('astro.galaxySun')}</text>
        <text x={CX + 162} y={CY - 32} className="astro-galaxy__sub">
          {t('astro.galaxyDistance', { n: GALAXY.sunDistance.toLocaleString() })}
        </text>
      </g>

      <text x={CX} y={22} className="astro-galaxy__title" textAnchor="middle">
        {GALAXY.name} · {gType.zh}（{gType.en}） · {t('astro.galaxyDiameter', { n: GALAXY.diameter.toLocaleString() })}
      </text>
      <text x={CX} y={400} className="astro-galaxy__sub" textAnchor="middle">
        {gType.desc}
      </text>
      <text x={CX} y={416} className="astro-galaxy__sub" textAnchor="middle">
        {t('astro.galaxyNote', { n: GALAXY.sunOrbitalPeriod.toLocaleString() })}
      </text>
    </svg>
  )
}


export default GalaxyDiagram
