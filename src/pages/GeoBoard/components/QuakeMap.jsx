import { useMemo } from 'react'
import { project, landPath, MAP_W, MAP_H } from '../../../components/AstroBoard/mapProjection.js'
import { depthClass, fmtBJT } from './ui.jsx'

export function QuakeMap({ quakes }) {
  const land = useMemo(() => landPath(), [])
  return (
    <div className="geo-quakemap">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-label="过去 24 小时全球地震分布图">
        {/* 海洋底色 */}
        <rect x="0" y="0" width={MAP_W} height={MAP_H} className="geo-quakemap__sea" />
        {/* 陆地 */}
        <path d={land} className="geo-quakemap__land" />
        {/* 经纬网：每 30° 一条 */}
        <g className="geo-quakemap__grid">
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
            const p = project(0, lon)
            return <line key={`v${lon}`} x1={p.x} y1="0" x2={p.x} y2={MAP_H} />
          })}
          {[-60, -30, 0, 30, 60].map((lat) => {
            const p = project(lat, 0)
            return <line key={`h${lat}`} x1="0" y1={p.y} x2={MAP_W} y2={p.y} />
          })}
        </g>
        {/* 震中：先画小震再画大震，保证大震点在上层可见 */}
        {[...quakes]
          .sort((a, b) => (a.mag || 0) - (b.mag || 0))
          .map((q) => {
            const p = project(q.lat, q.lon)
            const dc = depthClass(q.depth)
            return (
              <circle
                key={q.id}
                cx={p.x}
                cy={p.y}
                r={3 + (q.mag || 2.5) * 1.8}
                className="geo-quakemap__dot"
                style={{ '--dot-color': dc.color }}
              >
                <title>
                  {`M${q.mag?.toFixed(1) ?? '?'} · ${q.place}\n深度 ${q.depth?.toFixed(0) ?? '?'} km（${dc.label}）\n${fmtBJT(q.time)}（北京时间）`}
                </title>
              </circle>
            )
          })}
      </svg>
      {/* 深度图例 */}
      <div className="geo-quakemap__legend">
        {[
          { c: '#ef4444', t: '浅源 <70km（破坏性地震几乎都属此类）' },
          { c: '#f59e0b', t: '中源 70–300km' },
          { c: '#3b82f6', t: '深源 >300km（多见于俯冲带，地表震感弱）' },
        ].map((it) => (
          <span key={it.t}>
            <i style={{ background: it.c }} />
            {it.t}
          </span>
        ))}
        <span className="geo-quakemap__legend-note">点大小 ∝ 震级</span>
      </div>
    </div>
  )
}

export default QuakeMap
