/**
 * 近 30 天全球强震（M5.5+）：按天计数柱状 + 强震列表。
 *
 * 与首页「24h M2.5+」互补：那条看此刻的脉动，这条看月尺度的活动水平。
 * 柱状图刻意**不补零**——只有发生过的日子才画柱子，
 * 空白本身就在传达「全球平均每天约 1 次 M5.5+，多数日子是 0–2 次」这个事实。
 */
import { Empty, Table, Tag, Tooltip } from 'antd'
import { depthClass, fmtBJT } from './ui.jsx'
import { magBand } from '../../../lib/earth/glossary.js'
import { useI18n } from '../../../i18n/index.js'

export default function StrongQuakes({ byDay, quakes, count, perDay, strongest, windowDays = 30 }) {
  const { t } = useI18n()
  if (!byDay?.length) return <Empty description={t('geo.strong.empty')} />
  // 补齐 30 天日期轴（缺失日为 0），否则柱子会挤在一起看不出节奏
  const start = new Date(`${byDay[0].day}T00:00:00Z`).getTime()
  const days = Array.from({ length: windowDays }, (_, i) => {
    const day = new Date(start + i * 86400_000).toISOString().slice(0, 10)
    const hit = byDay.find((d) => d.day === day)
    return { day, count: hit ? hit.count : 0 }
  })
  const max = Math.max(...days.map((d) => d.count), 1)
  const W = 640
  const H = 130
  const PAD = { l: 30, r: 12, t: 12, b: 22 }
  const bw = (W - PAD.l - PAD.r) / days.length
  const y = (v) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)

  return (
    <div className="geo-strong">
      <div className="geo-strong__stats">
        <Tooltip title={t('geo.strong.countTip')}>
          <span className="geo-strong__stat is-info">
            {t('geo.strong.count', { n: count, days: windowDays })}
          </span>
        </Tooltip>
        <Tooltip title={t('geo.strong.perDayTip')}>
          <span className="geo-strong__stat is-info">
            {t('geo.strong.perDay', { n: perDay })}
          </span>
        </Tooltip>
        {strongest && (
          <span className="geo-strong__stat">
            {t('geo.strong.strongest')} <b style={{ color: magBand(strongest.mag).color }}>M{strongest.mag.toFixed(1)}</b>{' '}
            {strongest.place}
          </span>
        )}
      </div>

      <div className="geo-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="近 30 天强震按日计数">
          {days.map((d, i) => (
            <rect
              key={d.day}
              x={PAD.l + i * bw + 0.8}
              y={y(d.count)}
              width={Math.max(2, bw - 1.6)}
              height={H - PAD.b - y(d.count)}
              fill={d.count >= 3 ? '#ef4444' : d.count >= 2 ? '#f97316' : '#0ea5e9'}
              rx="1.5"
            >
              <title>{t('geo.strong.barTitle', { day: d.day, n: d.count })}</title>
            </rect>
          ))}
          <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} className="geo-chart__grid" />
          <text x={PAD.l} y={H - 6} className="geo-chart__tick">{days[0].day.slice(5)}</text>
          <text x={W - PAD.r} y={H - 6} textAnchor="end" className="geo-chart__tick">
            {days[days.length - 1].day.slice(5)}
          </text>
        </svg>
        <div className="geo-chart__caption">
          {t('geo.strong.caption', { days: windowDays })}
        </div>
      </div>

      <Table
        className="geo-quake-table"
        size="small"
        rowKey="id"
        dataSource={quakes}
        pagination={{ pageSize: 8, size: 'small', showTotal: (total) => t('geo.strong.showTotal', { n: total }) }}
        columns={[
          { title: t('geo.strong.colBJT'), dataIndex: 'time', width: 100, render: (v) => fmtBJT(v) },
          {
            title: t('geo.strong.colMag'),
            dataIndex: 'mag',
            width: 96,
            sorter: (a, b) => a.mag - b.mag,
            defaultSortOrder: 'descend',
            render: (m) => {
              const b = magBand(m)
              return (
                <Tag style={{ color: b.color, borderColor: b.color }}>
                  M{m?.toFixed(1)} · {b.label}
                </Tag>
              )
            },
          },
          { title: t('geo.strong.colPlace'), dataIndex: 'place', ellipsis: true },
          {
            title: t('geo.strong.colDepth'),
            dataIndex: 'depth',
            width: 120,
            align: 'right',
            render: (d) => (
              <span style={{ color: depthClass(d).color }}>
                {d != null ? `${d.toFixed(0)} km · ${depthClass(d).label}` : '—'}
              </span>
            ),
          },
        ]}
      />
    </div>
  )
}
