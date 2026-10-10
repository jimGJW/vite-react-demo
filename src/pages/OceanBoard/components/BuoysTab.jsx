/**
 * OceanBoard 的「🛟 浮标实况」页签：NOAA NDBC 浮标与岸站的实时观测。
 *
 * 与「海况预报」页签的区别：那边是 Open-Meteo 的**模式预报**（平滑、全球覆盖），
 * 这边是**实测真值**（有毛刺、有缺测、只覆盖有浮标的水域）。
 * 两者并排看才有意义——浮标是预报的校准基准，偏差变大说明天气尺度系统在快速变化。
 *
 * 展示上刻意保留了缺测（显示 — 而不是 0）：
 * NDBC 用 MM 标记缺测，把它们当 0 会画出「海面如镜」的假象。
 */
import { CompassOutlined, ExperimentOutlined } from '@ant-design/icons'
import { Empty, Table, Tag, Tooltip } from 'antd'
import { Panel, waveLevel, fmtUTC } from './ui.jsx'

/** 数值单元格：缺测显示 —，有值时可选着色 */
function Cell({ value, unit, digits = 1, color }) {
  if (value == null) return <span className="o-buoy-none">—</span>
  return (
    <span style={color ? { color, fontWeight: 600 } : undefined}>
      {value.toFixed(digits)}
      {unit && <span className="o-buoy-unit">{unit}</span>}
    </span>
  )
}

/** 风向度数 → 八方位中文 */
function dirText(deg) {
  if (deg == null) return null
  const names = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return names[Math.round(deg / 45) % 8]
}

export default function BuoysTab({ buoys, buoyData }) {
  const regions = buoyData?.regions || []
  // 平铺成表格行：每个区域标题行由 Table 的分组列承担，这里直接带区域字段
  const rows = regions.flatMap((r) => r.stations.map((s) => ({ ...s, regionName: r.name })))
  const sst = buoyData?.sstRange

  return (
    <div className="o-tab-content">
      <Panel
        title="浮标实测一览"
        source="NOAA NDBC latest_obs（全站最新一次观测，UTC）"
        icon={<ExperimentOutlined />}
        loading={buoys.loading}
        error={buoys.error}
      >
        {buoyData ? (
          rows.length ? (
            <>
              <div className="o-buoy-kpi">
                <span>
                  在岗站点 <b>{buoyData.totalStations}</b>
                </span>
                <span>
                  带波浪传感器 <b>{buoyData.waveStations}</b>
                  <span className="o-buoy-kpi__sub">
                    （仅约 {Math.round((buoyData.waveStations / buoyData.totalStations) * 100)}%）
                  </span>
                </span>
                {buoyData.maxWave && (
                  <span>
                    当前最狂 <b>{buoyData.maxWave.wvht.toFixed(1)} m</b>
                    <span className="o-buoy-kpi__sub">
                      站 {buoyData.maxWave.id} · {buoyData.maxWave.lat.toFixed(1)}° /{' '}
                      {buoyData.maxWave.lon.toFixed(1)}°
                    </span>
                  </span>
                )}
                {sst && (
                  <span>
                    水温跨度 <b>{sst.min.toFixed(1)} – {sst.max.toFixed(1)} °C</b>
                    <span className="o-buoy-kpi__sub">{sst.n} 个站</span>
                  </span>
                )}
              </div>

              {sst && (
                <div className="o-buoy-scale">
                  <div className="o-buoy-scale__bar">
                    {rows
                      .filter((s) => s.wtmp != null)
                      .map((s) => {
                        const pct = ((s.wtmp - sst.min) / Math.max(sst.max - sst.min, 0.1)) * 100
                        return (
                          <Tooltip
                            key={s.id}
                            title={`${s.regionName} · ${s.id}：${s.wtmp.toFixed(1)} °C`}
                          >
                            <span
                              className="o-buoy-scale__dot"
                              style={{ left: `${pct}%`, background: sstColor(s.wtmp) }}
                            />
                          </Tooltip>
                        )
                      })}
                  </div>
                  <div className="o-buoy-scale__axis">
                    <span>{sst.min.toFixed(1)} °C</span>
                    <span className="o-buoy-scale__title">各代表站海表温度在跨度上的位置</span>
                    <span>{sst.max.toFixed(1)} °C</span>
                  </div>
                </div>
              )}

              <Table
                className="o-buoy-table"
                size="small"
                rowKey={(r) => r.id}
                dataSource={rows}
                pagination={false}
                columns={[
                  { title: '海域', dataIndex: 'regionName', width: 200 },
                  {
                    title: '站号',
                    dataIndex: 'id',
                    width: 84,
                    render: (v) => <b>{v}</b>,
                  },
                  {
                    title: '浪高',
                    dataIndex: 'wvht',
                    width: 130,
                    align: 'right',
                    render: (v) => {
                      const lv = waveLevel(v)
                      return <Cell value={v} unit=" m" digits={2} color={lv.color} />
                    },
                  },
                  {
                    title: '主波周期',
                    dataIndex: 'dpd',
                    width: 96,
                    align: 'right',
                    render: (v) => <Cell value={v && v > 0 ? v : null} unit=" s" digits={1} />,
                  },
                  {
                    title: '风',
                    dataIndex: 'wspd',
                    width: 120,
                    align: 'right',
                    render: (v, r) =>
                      v != null ? (
                        <span>
                          {v.toFixed(1)} m/s
                          {r.gst != null && <span className="o-buoy-unit">阵 {r.gst.toFixed(1)}</span>}
                          {dirText(r.wdir) && <span className="o-buoy-unit">{dirText(r.wdir)}</span>}
                        </span>
                      ) : (
                        <span className="o-buoy-none">—</span>
                      ),
                  },
                  {
                    title: '海表温度',
                    dataIndex: 'wtmp',
                    width: 100,
                    align: 'right',
                    render: (v) => <Cell value={v} unit=" °C" />,
                  },
                  {
                    title: '气压',
                    dataIndex: 'pres',
                    width: 96,
                    align: 'right',
                    render: (v) => <Cell value={v} digits={1} />,
                  },
                  {
                    title: '观测时刻',
                    dataIndex: 'timeUnix',
                    align: 'right',
                    render: (v) => (v ? `${fmtUTC(new Date(v))} UTC` : '—'),
                  },
                ]}
              />
            </>
          ) : (
            <Empty description="暂未取到浮标观测" />
          )
        ) : null}
      </Panel>

      <Panel
        title="为什么这张表和「海况预报」不一样"
        source="科普：实测与模式预报的关系"
        icon={<CompassOutlined />}
      >
        <div className="o-prose">
          <p>
            预报页的浪高来自数值模式（把风场、水深、地形代进波动方程算出来），平滑且全球覆盖；
            这张表是<b>浮标真的在海上测到的值</b>，一小时回传一次，带毛刺和缺口。
          </p>
          <p>
            缺测显示为「—」而不是 0 是有意的：NDBC 用 <code>MM</code> 标记缺测，
            而不少站点（尤其岸站与他国气象浮标）根本没有波浪传感器，
            会把波高一栏填成 0。把这类 0 当真值，会得出「全世界海面如镜」的错误印象。
          </p>
          <p>
            全球约 870 个在岗站里只有约四分之一测波浪——<b>海洋观测的稀疏程度远超陆地气象站</b>。
            南半球与印度洋的覆盖尤其稀薄，这也是为什么那些海域的预报误差更大。
          </p>
        </div>
        <div className="o-buoy-legend">
          {['平静', '轻浪', '中浪', '大浪', '巨浪'].map((label, i) => {
            const probe = [0.1, 0.5, 1.0, 2.0, 3.0][i]
            const lv = waveLevel(probe)
            return (
              <Tag key={label} color={lv.color} bordered={false}>
                {label}
              </Tag>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

/** 水温 → 冷暖色（0 °C 冷蓝 → 30 °C 暖红） */
function sstColor(t) {
  const p = Math.min(Math.max((t + 2) / 34, 0), 1)
  const hue = (1 - p) * 240
  return `hsl(${hue}, 72%, 52%)`
}
