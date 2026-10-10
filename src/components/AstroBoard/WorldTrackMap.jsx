/**
 * 卫星地面轨迹地图（纯 SVG，无第三方地图库）。
 *
 * 投影、底图、晨昏线都在 mapProjection.js 里算好，本组件只负责渲染，
 * 这样既能按缓存粒度算一次（大圆采样点不随 props 频繁变），也满足 react-refresh 约束。
 */

import { useMemo } from 'react'
import { MAP_W, MAP_H, project, landPath, terminatorPaths } from './mapProjection.js'

export default function WorldTrackMap({
  track,
  markers = [],
  subsolar,
  observers = [],
  selected,
  onSelect,
}) {
  const land = useMemo(() => landPath(), [])
  const term = useMemo(() => terminatorPaths(subsolar), [subsolar])

  // 轨迹按「是否在日照面」分段着色：日照段实线金，阴影段虚线蓝
  const segments = useMemo(() => {
    if (!track || track.length < 2) return []
    const out = []
    let cur = [track[0]]
    for (let i = 1; i < track.length; i++) {
      cur.push(track[i])
      if (track[i].sunlit !== track[i - 1].sunlit) {
        out.push({ pts: cur, sunlit: track[i - 1].sunlit })
        cur = [track[i]]
      }
    }
    if (cur.length > 1) out.push({ pts: cur, sunlit: cur[cur.length - 1].sunlit })
    return out
  }, [track])

  return (
    <svg className="astro-map" viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label="卫星地面轨迹图">
      <defs>
        {/* 夜半球用半透明压暗，两套主题各给一组不同深浅的色（见 index.scss 的 --a-map-night-*） */}
        <linearGradient id="astro-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--a-map-night-a)" />
          <stop offset="100%" stopColor="var(--a-map-night-b)" />
        </linearGradient>
        <radialGradient id="astro-sun">
          <stop offset="0%" stopColor="#ffe08a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffb020" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 海洋 */}
      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="var(--a-map-ocean)" />

      {/* 经纬网 */}
      {[-60, -30, 0, 30, 60].map((lat) => {
        const y = ((90 - lat) / 180) * MAP_H
        return (
          <line
            key={`lat${lat}`}
            x1="0" y1={y} x2={MAP_W} y2={y}
            className="astro-grid"
            strokeDasharray={lat === 0 ? '0' : '3 5'}
          />
        )
      })}
      {[-120, -60, 0, 60, 120].map((lon) => {
        const x = ((lon + 180) / 360) * MAP_W
        return (
          <line
            key={`lon${lon}`}
            x1={x} y1="0" x2={x} y2={MAP_H}
            className="astro-grid"
            strokeDasharray={lon === 0 ? '0' : '3 5'}
          />
        )
      })}

      {/* 夜半球 */}
      {term.shade && <path d={term.shade} fill="url(#astro-night)" />}

      {/* 陆地 */}
      <path d={land} className="astro-land" />

      {/* 晨昏线 */}
      {term.line && <path d={term.line} className="astro-terminator" />}

      {/* 太阳直射点 */}
      {subsolar && (() => {
        const p = project(subsolar.lat, subsolar.lon)
        return (
          <g className="astro-sun-mark">
            <circle cx={p.x} cy={p.y} r="26" fill="url(#astro-sun)" />
            <circle cx={p.x} cy={p.y} r="4" fill="var(--a-track)" />
          </g>
        )
      })()}

      {/* 轨迹 */}
      {segments.map((s, i) => (
        <path
          key={i}
          d={s.pts
            .map((p, j) => {
              const q = project(p.lat, p.lon)
              return `${j === 0 ? 'M' : 'L'}${q.x.toFixed(1)},${q.y.toFixed(1)}`
            })
            .join(' ')}
          className={s.sunlit ? 'astro-track astro-track--sun' : 'astro-track astro-track--dark'}
        />
      ))}

      {/* 观测地标 */}
      {observers.map((o) => {
        const p = project(o.lat, o.lon)
        return <circle key={o.name} cx={p.x} cy={p.y} r="2" className="astro-observer" />
      })}

      {/* 当前目标 */}
      {markers.map((m) => {
        const p = project(m.lat, m.lon)
        const isSel = selected === m.key
        return (
          <g
            key={m.key}
            className={`astro-marker${isSel ? ' is-active' : ''}`}
            onClick={() => onSelect && onSelect(m.key)}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
          >
            <circle cx={p.x} cy={p.y} r={isSel ? 13 : 10} className="astro-marker-halo" fill={m.color} />
            <circle cx={p.x} cy={p.y} r="4.5" fill={m.color} />
            <text x={p.x + 9} y={p.y - 7} className="astro-marker-label">{m.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
