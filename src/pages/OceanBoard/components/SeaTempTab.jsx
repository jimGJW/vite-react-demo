/**
 * 海洋看板「🌡 海温趋势」页签：各沿海城市当前海温 + 未来 7 天的海温区间。
 *
 * 为什么单列一页：海温是海洋里最「慢性」也最关键的量。
 * 它不像浪高那样分钟级变化，却决定了台风能否增强（需 ≥26.5°C）、
 * 珊瑚是否白化、渔汛何时到来。放在这里和浪高分开看，是因为两者的时间尺度完全不同。
 *
 * 展示口径：横向条以「当前海温」为锚，浅色条是当日海温的**最高—最低区间**
 * （昼夜与潮汐混合造成的日内波动，通常不到 1°C，所以区间条很窄——这是正常的，
 * 不是渲染问题）。颜色按冷暖分档。
 */
import { ExperimentOutlined } from '@ant-design/icons'
import { Empty, Tooltip } from 'antd'
import { Panel } from './ui.jsx'

/** 海温 → 冷暖色：26.5°C 是台风生成阈值，单独标出来 */
function sstColor(t) {
  if (t == null) return '#94a3b8'
  if (t >= 28) return '#ff4d4f'
  if (t >= 26.5) return '#fa8c16'
  if (t >= 20) return '#52c41a'
  if (t >= 10) return '#1677ff'
  return '#722ed1'
}

/** "2026-10-13" → "10-13" */
function md(t) {
  return t ? String(t).slice(5) : '—'
}

export default function SeaTempTab({ marine, marineData }) {
  const items = marineData?.items || []
  // 按当前海温从高到低：一眼看出南北海水温差
  const sorted = [...items].sort((a, b) => (b.sst ?? -99) - (a.sst ?? -99))
  const warm = sorted[0]
  const cool = sorted[sorted.length - 1]
  const days = items[0]?.forecast?.map((f) => f.date) || []

  return (
    <div className="o-tab-content">
      <Panel
        title="🌡 海表温度趋势"
        source="Open-Meteo Marine（当前值 + 未来 7 天逐日区间）"
        icon={<ExperimentOutlined />}
        loading={marine.loading}
        error={marine.error}
      >
        {!marine.loading && !items.length ? (
          <Empty description="未取到海温数据" />
        ) : (
          <>
            <p className="o-sst-lead">
              按当前海温从高到低排列。
              {warm && cool ? ` 南北海水温差约 ${(warm.sst - cool.sst).toFixed(1)}°C（${warm.name} ${warm.sst?.toFixed(1)}°C vs ${cool.name} ${cool.sst?.toFixed(1)}°C）。` : ''}
              <b>26.5°C</b> 是台风生成与维持的经验阈值——水温高于它的海域，才具备给台风供能的条件。
            </p>

            <div className="o-sst-list">
              {sorted.map((c) => {
                const fs = c.forecast || []
                const ssts = fs.map((f) => f.sstMax).filter((v) => v != null)
                const lo = ssts.length ? Math.min(...ssts) : null
                const hi = ssts.length ? Math.max(...ssts) : null
                // 条形以 0–32°C 为标尺：覆盖我国海域全年可能的范围
                const left = lo == null ? 0 : Math.max(0, (lo / 32) * 100)
                const width = lo == null || hi == null ? 0 : Math.max(1.5, ((hi - lo) / 32) * 100)
                return (
                  <div key={c.key} className="o-sst-row">
                    <span className="o-sst-name">{c.name}</span>
                    <span className="o-sst-now" style={{ color: sstColor(c.sst) }}>
                      {c.sst == null ? '—' : c.sst.toFixed(1)}
                      <em>°C</em>
                    </span>
                    <Tooltip title={lo == null ? '无区间数据' : `未来 7 天区间 ${lo.toFixed(1)}–${hi.toFixed(1)}°C`}>
                      <div className="o-sst-track">
                        <div
                          className="o-sst-range"
                          style={{ left: `${left}%`, width: `${width}%`, background: sstColor(c.sst) }}
                        />
                        <div className="o-sst-threshold" title="26.5°C 台风阈值" />
                      </div>
                    </Tooltip>
                  </div>
                )
              })}
            </div>
            <div className="o-sst-legend">
              <span>0°C</span>
              <span className="o-sst-mark">26.5°C（台风阈值）</span>
              <span>32°C</span>
            </div>

            {days.length ? (
              <div className="o-sst-week">
                <div className="o-sst-weekHead">未来 7 天各海域海温（最高值，°C）</div>
                <table className="o-sst-table">
                  <thead>
                    <tr>
                      <th>海域</th>
                      {days.map((d) => (
                        <th key={d}>{md(d)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((c) => (
                      <tr key={c.key}>
                        <td className="o-sst-tdName">{c.name}</td>
                        {days.map((d, i) => {
                          const v = c.forecast?.[i]?.sstMax
                          return (
                            <td key={d} style={{ color: sstColor(v) }}>
                              {v == null ? '—' : v.toFixed(1)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        )}
      </Panel>
    </div>
  )
}
