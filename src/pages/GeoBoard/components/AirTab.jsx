/**
 * 地球看板「🌫 空气质量」页签：各城市的 PM2.5 / PM10 / AQI / 紫外线。
 *
 * 补的是本看板最大的一块缺口：此前只有温室气体这种「全球背景值」，
 * 没有贴近呼吸的污染物浓度。等级分档一律走 earth 词典（aqiLevel / uvLevel），
 * 服务端只吐数值——等级语义只有一处，这条规矩不能破。
 *
 * 口径必须写清，否则会被当成官方发布值：
 *   · 数据来自 Open-Meteo 的欧洲 CAMS 模式输出，是**模式的网格推算值**，
 *     不是国控站实测；量级可信、个位数不必较真；
 *   · AQI 采用欧标（european_aqi）——词典 AQI_LEVELS 的阈值就是按欧标写的，
 *     服务端同时取了 us_aqi 备用，但前端分档一律走欧标，两者不要混。
 */
import { ExperimentOutlined } from '@ant-design/icons'
import { Empty, Table, Tag, Tooltip } from 'antd'
import { Panel, aqiLevel } from './ui.jsx'
import { uvLevel } from '../../../lib/earth/glossary.js'

/** AQI 数值 → 带底色的胶囊（颜色与等级名都来自词典，不在组件里重复定义阈值） */
function AqiPill({ v }) {
  const b = aqiLevel(v)
  return (
    <Tooltip title={b.desc || b.zh}>
      <span className="geo-air-pill" style={{ background: b.color }}>
        {v == null ? '—' : Math.round(v)}
        <em>{b.zh}</em>
      </span>
    </Tooltip>
  )
}

/** 数值单元格：缺测显示 — */
function Cell({ v, digits = 1, unit }) {
  if (v == null) return <span className="geo-air-none">—</span>
  return (
    <span>
      {v.toFixed(digits)}
      {unit ? <span className="geo-air-unit">{unit}</span> : null}
    </span>
  )
}

export default function AirTab({ air, airData }) {
  const items = airData?.items || []
  const worst = items[0]
  const avgPm25 = (() => {
    const v = items.filter((c) => c.pm25 != null)
    return v.length ? v.reduce((a, c) => a + c.pm25, 0) / v.length : null
  })()

  const columns = [
    { title: '城市', dataIndex: 'name', width: 90, render: (v) => <b>{v}</b> },
    {
      title: (
        <Tooltip title="欧洲环境署（EAQI）标准。与国内 AQI 断点不同，但与词典分档同源">
          <span className="geo-air-th">AQI (欧标)</span>
        </Tooltip>
      ),
      dataIndex: 'aqi',
      width: 130,
      defaultSortOrder: 'descend',
      sorter: (a, b) => (a.aqi ?? -1) - (b.aqi ?? -1),
      render: (v) => <AqiPill v={v} />,
    },
    { title: 'PM2.5', dataIndex: 'pm25', width: 100, render: (v) => <Cell v={v} unit=" μg/m³" /> },
    { title: 'PM10', dataIndex: 'pm10', width: 100, render: (v) => <Cell v={v} unit=" μg/m³" /> },
    {
      title: '紫外线',
      dataIndex: 'uv',
      width: 110,
      render: (v) => {
        const b = uvLevel(v)
        return (
          <Tooltip title={b.advice || b.desc || b.zh}>
            <span style={{ color: b.color, fontWeight: 600 }}>
              {v == null ? '—' : v.toFixed(1)}
            </span>
          </Tooltip>
        )
      },
    },
    { title: '臭氧', dataIndex: 'ozone', width: 100, render: (v) => <Cell v={v} unit=" μg/m³" /> },
    { title: 'NO₂', dataIndex: 'no2', width: 100, render: (v) => <Cell v={v} unit=" μg/m³" /> },
  ]

  return (
    <div className="geo-tab-content">
      <Panel
        title="🌫 城市空气质量"
        source="Open-Meteo Air Quality（欧洲 CAMS 模式输出，欧标 AQI 口径）"
        icon={<ExperimentOutlined />}
        loading={air.loading}
        error={air.error}
        extra={worst ? <Tag bordered={false} color="volcano">最差：{worst.name} AQI {Math.round(worst.aqi)}</Tag> : null}
      >
        {!air.loading && !items.length ? (
          <Empty description="未取到空气质量数据" />
        ) : (
          <>
            <p className="geo-air-lead">
              PM2.5 是粒径 ≤2.5 微米的颗粒物，能深入肺泡并进入血液，是各国空气质量标准的首要指标；
              PM10 包含扬尘等较粗颗粒，主要影响上呼吸道。
              {avgPm25 != null ? ` 当前 ${items.length} 城平均 PM2.5 约 ${avgPm25.toFixed(0)} μg/m³。` : ''}
            </p>
            <Table size="small" rowKey="key" pagination={false} columns={columns} dataSource={items} scroll={{ x: 780 }} />
          </>
        )}
      </Panel>
    </div>
  )
}
