import { useMemo, useState } from 'react'
import { Empty, Segmented, Tag } from 'antd'
import { KpiHint, TermTip } from './ui.jsx'
import { azToCompass, observability } from '../../../components/AstroBoard/skyHelpers.js'
import { equatorialToHorizontal } from '../../../lib/astro/skyProjection.js'
import { zhDsoType } from '../../../lib/astro/glossary'

/* ---------- 星图侧栏辅助 ---------- */

/** 太阳系天体在观测地上空的方位/高度一行 */
export function SkyBodyRow({ name, h, color, extra }) {
  if (!h || typeof h.alt !== 'number') {
    return (
      <div className="astro-sky-body is-down">
        <span className="astro-sky-body__name">{name}</span>
        <span className="astro-sky-body__val">—</span>
      </div>
    )
  }
  const down = h.alt < 0
  const ob = observability(h.alt)
  return (
    <div className={`astro-sky-body${down ? ' is-down' : ''}`}>
      <span className="astro-sky-body__dot" style={{ background: color || ob.color }} />
      <span className="astro-sky-body__name">{name}</span>
      <span className="astro-sky-body__dir">
        {down ? '地平线下' : `${azToCompass(h.az)} ${h.alt.toFixed(0)}°`}
      </span>
      {extra && <span className="astro-sky-body__extra">{extra}</span>}
    </div>
  )
}

/**
 * 梅西耶天体目录：按当前高度角排序，只显示地平线以上的。
 *
 * 为什么要「今晚可见」排序：110 个天体里同一时刻通常只露出来三四十个，
 * 按编号排会让人以为其它天体消失了。按高度排则是观星者的真实需求
 * ——「现在最高的是哪个」。
 */
export function MessierTable({ catalog, lat, lon, now }) {
  const [sortBy, setSortBy] = useState('alt')

  const rows = useMemo(() => {
    return (catalog.dso || [])
      .map((d) => {
        const { alt, az } = equatorialToHorizontal(d[2], d[3], lat, lon, now)
        return {
          id: d[0], altName: d[1], ra: d[2], dec: d[3],
          mag: d[4], type: d[5], typeZh: d[6], desc: d[7],
          alt, az,
        }
      })
      .filter((r) => r.alt > 0)
      .sort((a, b) => (sortBy === 'alt' ? b.alt - a.alt : a.mag - b.mag))
  }, [catalog, lat, lon, now, sortBy])

  const visibleCount = rows.length
  const total = catalog.dso?.length || 0

  return (
    <div className="astro-messier">
      <div className="astro-messier__head">
        <span>
          当前地平线以上 <b>{visibleCount}</b> / {total} 个
        </span>
        <Segmented
          size="small"
          value={sortBy}
          onChange={setSortBy}
          options={[
            { label: '按高度角', value: 'alt' },
            { label: '按亮度', value: 'mag' },
          ]}
        />
      </div>
      <div className="astro-messier__grid">
        {rows.map((r) => {
          const t = zhDsoType(r.type)
          const ob = observability(r.alt)
          return (
            <div key={r.id} className="astro-messier__item">
              <div className="astro-messier__id">{r.id}</div>
              <div className="astro-messier__body">
                <div className="astro-messier__name">
                  {/* altName 常已含类型（「猫眼星系」），再挂一个「星系」Tag 就成了
                      「猫眼星系星系」。名称里已有类型词时就不重复挂 Tag。 */}
                  {r.altName || t.zh}
                  {!r.altName?.includes(t.zh) && (
                    <TermTip zh={t.zh} en={t.en} desc={t.desc}>
                      <Tag bordered={false} className="astro-messier__tag">
                        {t.zh}
                      </Tag>
                    </TermTip>
                  )}
                </div>
                <div className="astro-messier__meta">
                  {typeof r.mag === 'number' && (
                    <span>
                      {r.mag.toFixed(1)} 等
                      <KpiHint kpiKey="dsoMag" />
                    </span>
                  )}
                  <span style={{ color: ob.color }}>{azToCompass(r.az)} {r.alt.toFixed(0)}°</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {!visibleCount && (
        <Empty description="当前观测地与时刻，地平线以上没有梅西耶天体（试试换城市或等天黑）" />
      )}
    </div>
  )
}


export default MessierTable
