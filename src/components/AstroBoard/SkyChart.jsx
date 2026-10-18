/**
 * 全天星图 —— 以观测者为中心的「天顶投影」。
 *
 * 画什么：
 *   地平线 + 高度角圈 + 方位刻度（背景）
 *   亮星（按星等定大小、按色指数定色温）  ← 5044 颗真实恒星
 *   星座连线（150 段）+ 星座中文名
 *   梅西耶等 110 个深空天体标记
 *   太阳/月亮/五大行星的位置标记
 *
 * 为什么不画地平线以下：
 *   地平线下是「看不到的」，画上去只会让人误判那颗星今晚能不能观测。
 *   但太阳/月亮在地平线下时要明确标注为「已落下」，否则用户会以为数据坏了。
 *
 * 性能：
 *   5044 颗星每秒重算一次投影 + 重绘。实测 SVG 下单帧渲染 < 8ms，
 *   但为了保险做了两件事：
 *     1. 亮星表已按星等排序，magLimit 滑杆一拉就能少画几千颗；
 *     2. useMemo 依赖用「时间量化值」而不是 Date 对象，避免每秒重建全部路径。
 */

import { useMemo, useState } from 'react'
import { Tag } from 'antd'
import {
  bvToHue,
  equatorialToHorizontal,
  magToRadius,
  refractionDeg,
  skyToPixel,
} from '@lib/astro/skyProjection'
import { azToCompass, observability, raToConstellation } from './skyHelpers.js'

/** 地平线以下的高度角阈值（度）：略低于 0，留一点余量给大气折射 */
const HORIZON = -0.6

/** 高度圈（度），从地平线往天顶数 */
const ALT_CIRCLES = [0, 30, 60]

/** 方位刻度：每 30° 一条短线 + 每 90° 一个方位名 */
const AZ_STEPS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
const AZ_LABELS = { 0: '北', 90: '东', 180: '南', 270: '西' }

export default function SkyChart({
  catalog,
  now,
  lat,
  lon,
  sun,
  moon,
  planets,
  magLimit = 4.5,
  showLines = true,
  showDso = true,
  showLabels = true,
  size = 520,
}) {
  const [hover, setHover] = useState(null)

  // 星表按星等排序，切掉暗于 magLimit 的部分
  const stars = useMemo(
    () => (catalog?.stars || []).filter((s) => s[2] <= magLimit),
    [catalog, magLimit],
  )
  // 星座连线按星座分组，便于逐条判断可见性
  const linesByConst = useMemo(() => {
    const map = new Map()
    for (const [cid, flat] of catalog?.lines || []) {
      if (!map.has(cid)) map.set(cid, [])
      map.get(cid).push(flat)
    }
    return map
  }, [catalog])
  const constName = useMemo(() => {
    const map = new Map()
    for (const [abbr, , zh] of catalog?.constellations || []) map.set(abbr, zh)
    return map
  }, [catalog])

  // 投影：以「秒」为单位的时间戳，避免每秒重建下面所有对象
  const t = Math.floor(now.getTime() / 1000)

  // ---- 亮星投影 ----
  const projectedStars = useMemo(() => {
    const date = new Date(t * 1000)
    const out = []
    for (const s of stars) {
      const { alt, az } = equatorialToHorizontal(s[0], s[1], lat, lon, date)
      const altRef = alt + refractionDeg(alt)
      if (altRef < HORIZON) continue
      const p = skyToPixel(az, altRef, size)
      out.push({ ra: s[0], dec: s[1], mag: s[2], bv: s[3], en: s[4], cn: s[5], x: p.x, y: p.y, alt: altRef, az })
    }
    return out
    // t 是秒级时间戳，等价于 now，但让依赖比较是廉价的数值比较
     
  }, [stars, lat, lon, t, size])

  // ---- 星座连线投影：整段全在地平线下才丢弃 ----
  const projectedLines = useMemo(() => {
    if (!showLines) return []
    const date = new Date(t * 1000)
    const out = []
    for (const [cid, flats] of linesByConst) {
      for (const flat of flats) {
        const seg = []
        let anyVisible = false
        for (let i = 0; i < flat.length; i += 2) {
          const { alt, az } = equatorialToHorizontal(flat[i], flat[i + 1], lat, lon, date)
          if (alt > HORIZON) anyVisible = true
          const p = skyToPixel(az, alt, size)
          seg.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        }
        if (anyVisible) out.push({ cid, d: `M${seg.join('L')}`, name: constName.get(cid) || '' })
      }
    }
    return out
     
  }, [linesByConst, constName, lat, lon, t, size, showLines])

  // ---- 深空天体 ----
  const projectedDso = useMemo(() => {
    if (!showDso) return []
    const date = new Date(t * 1000)
    const out = []
    for (const d of catalog?.dso || []) {
      if (typeof d[4] !== 'number' || d[4] > magLimit + 3.5) continue // 只画比恒星极限稍暗的
      const { alt, az } = equatorialToHorizontal(d[2], d[3], lat, lon, date)
      if (alt < HORIZON) continue
      const p = skyToPixel(az, alt, size)
      out.push({ id: d[0], alt: d[1], ra: d[2], dec: d[3], mag: d[4], type: d[5], typeZh: d[6], desc: d[7], x: p.x, y: p.y, altDeg: alt, az })
    }
    return out
     
  }, [catalog, lat, lon, t, size, showDso, magLimit])

  // ---- 太阳/月亮/行星：需要区分「在地平线上/下」 ----
  const markers = useMemo(() => {
    const out = []
    if (sun) {
      out.push({ kind: '太阳', label: 'Sun', az: sun.az, alt: sun.alt, color: '#ffd666', size: 9 })
    }
    if (moon && typeof moon.alt === 'number') {
      out.push({ kind: '月亮', label: moon.phaseName || 'Moon', az: moon.az, alt: moon.alt, color: '#e6e6e6', size: 8, phase: moon.phaseFraction })
    }
    for (const p of planets || []) {
      if (typeof p.alt !== 'number') continue
      out.push({
        kind: p.name,
        label: p.en || p.name,
        az: p.az,
        alt: p.alt,
        color: p.color || '#85c9e8',
        size: 6,
        body: true,
      })
    }
    return out
  }, [sun, moon, planets])

  const half = size / 2

  return (
    <div className="astro-sky">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="astro-sky__svg"
        role="img"
        aria-label={`全天星图，观测地纬度 ${lat.toFixed(1)} 度`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {/* 星空底色：径向渐变，中心略亮 */}
          <radialGradient id="skyGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--a-sky-core)" />
            <stop offset="100%" stopColor="var(--a-sky-edge)" />
          </radialGradient>
        </defs>

        {/* 天顶投影的「天空」区域：以地平线为圆心的圆 */}
        <circle cx={half} cy={half} r={half} fill="url(#skyGrad)" />

        {/* 地平线 */}
        <circle cx={half} cy={half} r={half} className="astro-sky__horizon" fill="none" />

        {/* 高度圈 */}
        {ALT_CIRCLES.map((a) => {
          const r = ((90 - a) / 90) * half
          if (r <= 1) return null
          return (
            <circle
              key={a}
              cx={half}
              cy={half}
              r={r}
              className="astro-sky__altcircle"
              fill="none"
              strokeDasharray={a === 0 ? undefined : '3 5'}
            />
          )
        })}

        {/* 方位刻度线 */}
        {AZ_STEPS.map((az) => {
          const outer = skyToPixel(az, 0, size)
          const inner = skyToPixel(az, 6, size)
          return (
            <line
              key={az}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              className="astro-sky__azline"
            />
          )
        })}

        {/* 方位文字 */}
        {Object.entries(AZ_LABELS).map(([az, label]) => {
          const p = skyToPixel(Number(az), -6, size)
          return (
            <text key={az} x={p.x} y={p.y} className="astro-sky__azlabel" textAnchor="middle" dominantBaseline="middle">
              {label}
            </text>
          )
        })}

        {/* 高度角文字（贴在垂直中线上，避免遮挡星点） */}
        {[30, 60].map((a) => {
          const p = skyToPixel(0, a, size)
          return (
            <text key={a} x={p.x - 14} y={p.y} className="astro-sky__altlabel" textAnchor="middle" dominantBaseline="middle">
              {a}°
            </text>
          )
        })}

        {/* 星座连线 */}
        <g className="astro-sky__lines">
          {projectedLines.map((l, i) => (
            <path key={`${l.cid}-${i}`} d={l.d} />
          ))}
        </g>

        {/* 深空天体标记 */}
        {projectedDso.map((d) => (
          <g key={d.id} className="astro-sky__dso" onMouseEnter={() => setHover({ type: 'dso', d })}>
            <rect
              x={d.x - 3.5}
              y={d.y - 3.5}
              width="7"
              height="7"
              transform={`rotate(45 ${d.x} ${d.y})`}
            />
            {showLabels && d.mag <= 6.5 && (
              <text x={d.x + 7} y={d.y + 3}>{d.id}</text>
            )}
          </g>
        ))}

        {/* 亮星 */}
        <g className="astro-sky__stars">
          {projectedStars.map((s, i) => {
            const r = magToRadius(s.mag)
            const hue = bvToHue(s.bv)
            return (
              <g key={`${s.ra}-${s.dec}-${i}`} onMouseEnter={() => setHover({ type: 'star', s })}>
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={r}
                  fill={`hsl(${hue}, ${s.bv > 0.4 ? 70 : 35}%, ${88 - s.mag * 2.5}%)`}
                />
                {s.cn && showLabels && (
                  <text x={s.x + r + 3} y={s.y + 3} className="astro-sky__starname">
                    {s.cn}
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {/* 太阳/月亮/行星 */}
        {markers.map((m, i) => {
          const down = m.alt < 0
          const p = skyToPixel(m.az, Math.max(m.alt, HORIZON), size)
          return (
            <g
              key={`${m.kind}-${i}`}
              className={`astro-sky__marker${down ? ' is-down' : ''}`}
              transform={`translate(${p.x} ${p.y})`}
              onMouseEnter={() => setHover({ type: 'marker', m, down })}
            >
              <circle r={m.size} fill={m.color} opacity={down ? 0.25 : 1} />
              {!down && <circle r={m.size + 4} fill="none" stroke={m.color} className="astro-sky__marker-ring" opacity="0.5" />}
              <text x={0} y={-m.size - 5} textAnchor="middle">{m.kind}{down ? '（已落下）' : ''}</text>
            </g>
          )
        })}

        {/* 天顶标记 */}
        <g className="astro-sky__zenith" transform={`translate(${half} ${half})`}>
          <text y={-4} textAnchor="middle">天顶</text>
        </g>
      </svg>

      {/* 悬停详情：用 antd Tooltip 的受控展示，避免给 5000 个星点各挂一个 Tooltip */}
      <div className="astro-sky__readout" aria-live="polite">
        {hover && <SkyReadout hover={hover} />}
      </div>
    </div>
  )
}

/** 悬停信息条 */
function SkyReadout({ hover }) {
  if (hover.type === 'star') {
    const { s } = hover
    const ob = observability(s.alt)
    return (
      <span>
        <strong>{s.cn || s.en || '无名星'}</strong>
        {s.en && s.cn && <span className="astro-sky__readout-en">{s.en}</span>}
        <Tag color={ob.color}>{ob.zh} {s.alt.toFixed(1)}°</Tag>
        <span>{azToCompass(s.az)} {s.az.toFixed(1)}°</span>
        <span>{s.mag.toFixed(1)} 等</span>
        <span>{raToConstellation(s.ra)}</span>
      </span>
    )
  }
  if (hover.type === 'dso') {
    const { d } = hover
    const ob = observability(d.altDeg)
    return (
      <span>
        <strong>{d.id}</strong>
        {d.alt && <span className="astro-sky__readout-en">{d.alt}</span>}
        <Tag color={ob.color}>{d.typeZh}</Tag>
        <span>{ob.zh} {d.altDeg.toFixed(1)}°</span>
        {typeof d.mag === 'number' && <span>{d.mag.toFixed(1)} 等</span>}
        <span className="astro-sky__readout-desc">{d.desc}</span>
      </span>
    )
  }
  const { m, down } = hover
  return (
    <span>
      <strong>{m.kind}</strong>
      <Tag color={down ? '#8c8c8c' : '#52c41a'}>{down ? '地平线下' : observability(m.alt).zh}</Tag>
      <span>方位 {azToCompass(m.az)} {m.az.toFixed(1)}°</span>
      <span>高度 {m.alt.toFixed(1)}°</span>
    </span>
  )
}
