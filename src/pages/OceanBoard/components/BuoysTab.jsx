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
import { useI18n } from '../../../i18n/index.js'
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

export default function BuoysTab({ buoys, buoyData }) {
  const { t, lang } = useI18n()
  /** 风向度数 → 八方位中文 */
  const dirText = (deg) => {
    if (deg == null) return null
    const i = Math.round(deg / 45) % 8
    return [t('ocean.dir.n'), t('ocean.dir.ne'), t('ocean.dir.e'), t('ocean.dir.se'), t('ocean.dir.s'), t('ocean.dir.sw'), t('ocean.dir.w'), t('ocean.dir.nw')][i]
  }
  const regions = buoyData?.regions || []
  // 平铺成表格行：每个区域标题行由 Table 的分组列承担，这里直接带区域字段
  const rows = regions.flatMap((r) => r.stations.map((s) => ({ ...s, regionName: r.name })))
  const sst = buoyData?.sstRange

  return (
    <div className="o-tab-content">
      <Panel
        title={t('ocean.buoy.panelList')}
        source={t('ocean.buoy.srcList')}
        icon={<ExperimentOutlined />}
        loading={buoys.loading}
        error={buoys.error}
      >
        {buoyData ? (
          rows.length ? (
            <>
              <div className="o-buoy-kpi">
                <span>
                  {t('ocean.buoy.kpiStations', { n: buoyData.totalStations })}
                </span>
                <span>
                  {t('ocean.buoy.kpiWave', {
                    n: buoyData.waveStations,
                    pct: Math.round((buoyData.waveStations / buoyData.totalStations) * 100),
                  })}
                </span>
                {buoyData.maxWave && (
                  <span>
                    {t('ocean.buoy.kpiMax', {
                      h: buoyData.maxWave.wvht.toFixed(1),
                      id: buoyData.maxWave.id,
                      lat: buoyData.maxWave.lat.toFixed(1),
                      lon: buoyData.maxWave.lon.toFixed(1),
                    })}
                  </span>
                )}
                {sst && (
                  <span>
                    {t('ocean.buoy.kpiSst', { min: sst.min.toFixed(1), max: sst.max.toFixed(1), n: sst.n })}
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
                            title={t('ocean.buoy.tooltip', { region: s.regionName, id: s.id, temp: s.wtmp.toFixed(1) })}
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
                    <span className="o-buoy-scale__title">{t('ocean.buoy.scaleTitle')}</span>
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
                  { title: t('ocean.buoy.colRegion'), dataIndex: 'regionName', width: 200 },
                  {
                    title: t('ocean.buoy.colId'),
                    dataIndex: 'id',
                    width: 84,
                    render: (v) => <b>{v}</b>,
                  },
                  {
                    title: t('ocean.buoy.colWave'),
                    dataIndex: 'wvht',
                    width: 130,
                    align: 'right',
                    render: (v) => {
                      const lv = waveLevel(v, lang)
                      return <Cell value={v} unit=" m" digits={2} color={lv.color} />
                    },
                  },
                  {
                    title: t('ocean.buoy.colPeriod'),
                    dataIndex: 'dpd',
                    width: 96,
                    align: 'right',
                    render: (v) => <Cell value={v && v > 0 ? v : null} unit=" s" digits={1} />,
                  },
                  {
                    title: t('ocean.buoy.colWind'),
                    dataIndex: 'wspd',
                    width: 120,
                    align: 'right',
                    render: (v, r) =>
                      v != null ? (
                        <span>
                          {v.toFixed(1)} m/s
                          {r.gst != null && <span className="o-buoy-unit">{t('ocean.buoy.gust')} {r.gst.toFixed(1)}</span>}
                          {dirText(r.wdir) && <span className="o-buoy-unit">{dirText(r.wdir)}</span>}
                        </span>
                      ) : (
                        <span className="o-buoy-none">—</span>
                      ),
                  },
                  {
                    title: t('ocean.buoy.colSst'),
                    dataIndex: 'wtmp',
                    width: 100,
                    align: 'right',
                    render: (v) => <Cell value={v} unit=" °C" />,
                  },
                  {
                    title: t('ocean.buoy.colPressure'),
                    dataIndex: 'pres',
                    width: 96,
                    align: 'right',
                    render: (v) => <Cell value={v} digits={1} />,
                  },
                  {
                    title: t('ocean.buoy.colTime'),
                    dataIndex: 'timeUnix',
                    align: 'right',
                    render: (v) => (v ? `${fmtUTC(new Date(v))} UTC` : '—'),
                  },
                ]}
              />
            </>
          ) : (
            <Empty description={t('ocean.buoy.empty')} />
          )
        ) : null}
      </Panel>

      <Panel
        title={t('ocean.buoy.panelWhy')}
        source={t('ocean.buoy.srcWhy')}
        icon={<CompassOutlined />}
      >
        <div className="o-prose">
          <p>
            {t('ocean.buoy.prose1')}
          </p>
          <p>
            {t('ocean.buoy.prose2')}
          </p>
          <p>
            {t('ocean.buoy.prose3')}
          </p>
        </div>
        <div className="o-buoy-legend">
          {[t('ocean.buoy.legend0'), t('ocean.buoy.legend1'), t('ocean.buoy.legend2'), t('ocean.buoy.legend3'), t('ocean.buoy.legend4')].map((label, i) => {
            const probe = [0.1, 0.5, 1.0, 2.0, 3.0][i]
            const lv = waveLevel(probe, lang)
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
