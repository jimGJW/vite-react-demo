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
import { uvLevel } from '@lib/earth/glossary.js'
import { useI18n } from '@i18n/index.js'

/** AQI 数值 → 带底色的胶囊（颜色与等级名都来自词典，不在组件里重复定义阈值） */
function AqiPill({ v }) {
  const { lang } = useI18n()
  const b = aqiLevel(v, lang)
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
  const { t, lang } = useI18n()
  const items = airData?.items || []
  const worst = items[0]
  const avgPm25 = (() => {
    const v = items.filter((c) => c.pm25 != null)
    return v.length ? v.reduce((a, c) => a + c.pm25, 0) / v.length : null
  })()

  const columns = [
    { title: t('geo.air.colCity'), dataIndex: 'name', width: 90, render: (v) => <b>{v}</b> },
    {
      title: (
        <Tooltip title={t('geo.air.aqiHeaderTip')}>
          <span className="geo-air-th">{t('geo.air.aqiHeader')}</span>
        </Tooltip>
      ),
      dataIndex: 'aqi',
      width: 130,
      defaultSortOrder: 'descend',
      sorter: (a, b) => (a.aqi ?? -1) - (b.aqi ?? -1),
      render: (v) => <AqiPill v={v} />,
    },
    { title: t('geo.air.colPm25'), dataIndex: 'pm25', width: 100, render: (v) => <Cell v={v} unit=" μg/m³" /> },
    { title: t('geo.air.colPm10'), dataIndex: 'pm10', width: 100, render: (v) => <Cell v={v} unit=" μg/m³" /> },
    {
      title: t('geo.air.colUv'),
      dataIndex: 'uv',
      width: 110,
      render: (v) => {
        const b = uvLevel(v, lang)
        return (
          <Tooltip title={b.advice || b.desc || b.zh}>
            <span style={{ color: b.color, fontWeight: 600 }}>
              {v == null ? '—' : v.toFixed(1)}
            </span>
          </Tooltip>
        )
      },
    },
    { title: t('geo.air.colOzone'), dataIndex: 'ozone', width: 100, render: (v) => <Cell v={v} unit=" μg/m³" /> },
    { title: t('geo.air.colNo2'), dataIndex: 'no2', width: 100, render: (v) => <Cell v={v} unit=" μg/m³" /> },
  ]

  return (
    <div className="geo-tab-content">
      <Panel
        title={'🌫 ' + t('geo.air.title')}
        source={t('geo.air.source')}
        icon={<ExperimentOutlined />}
        loading={air.loading}
        error={air.error}
        extra={worst ? <Tag bordered={false} color="volcano">{t('geo.air.worst', { name: worst.name, aqi: Math.round(worst.aqi) })}</Tag> : null}
      >
        {!air.loading && !items.length ? (
          <Empty description={t('geo.air.empty')} />
        ) : (
          <>
            <p className="geo-air-lead">
              {t('geo.air.lead')}
              {avgPm25 != null ? t('geo.air.leadAvg', { count: items.length, val: avgPm25.toFixed(0) }) : ''}
            </p>
            <Table size="small" rowKey="key" pagination={false} columns={columns} dataSource={items} scroll={{ x: 780 }} />
          </>
        )}
      </Panel>
    </div>
  )
}
