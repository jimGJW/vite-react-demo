/**
 * 海洋看板「🌊 海况预报」页签：沿海城市未来 7 天的逐日最大浪高。
 *
 * 与「海浪与海温」页签的分工：那边是少数近海点的**未来 24 小时**浪高曲线（短期变化），
 * 这边是 10 个沿海城市的**未来 7 天**逐日最大浪高（中期安排）。
 * 用途不同：前者判断「现在能不能下水」，后者判断「这周哪天适合出海」。
 *
 * 浪高分档走 ocean ui 转发的 waveLevel（阈值唯一真源在 earth 词典），
 * 组件只负责把档位渲染成颜色，不重新定义阈值。
 */
import { ExperimentOutlined } from '@ant-design/icons'
import { Empty, Table, Tooltip } from 'antd'
import { Panel, waveLevel } from './ui.jsx'

/** 逐日浪高单元格：底色与文字都来自分档结果 */
function WaveCell({ v }) {
  if (v == null) return <span className="o-marine-none">—</span>
  const b = waveLevel(v)
  return (
    <Tooltip title={`${b.zh}：${b.desc || ''}`}>
      <span className="o-marine-wave" style={{ color: b.color }}>
        {v.toFixed(2)}
      </span>
    </Tooltip>
  )
}

/** "2026-10-13" → "10-13" */
function md(t) {
  return t ? String(t).slice(5) : '—'
}

export default function MarineTab({ marine, marineData }) {
  const items = marineData?.items || []
  const days = items[0]?.forecast?.map((f) => f.date) || []

  const columns = [
    { title: '海域', dataIndex: 'name', width: 110, fixed: 'left', render: (v) => <b>{v}</b> },
    {
      title: '当前浪高 (m)',
      dataIndex: 'waveH',
      width: 120,
      sorter: (a, b) => (a.waveH ?? -1) - (b.waveH ?? -1),
      defaultSortOrder: 'descend',
      render: (v) => <WaveCell v={v} />,
    },
    { title: '周期 (s)', dataIndex: 'wavePeriod', width: 90, render: (v) => (v == null ? '—' : v.toFixed(1)) },
    { title: '海温 (°C)', dataIndex: 'sst', width: 100, render: (v) => (v == null ? '—' : v.toFixed(1)) },
    ...days.map((d, i) => ({
      title: md(d),
      key: `d${i}`,
      width: 76,
      render: (_, r) => <WaveCell v={r.forecast?.[i]?.waveMax ?? null} />,
    })),
  ]

  return (
    <div className="o-tab-content">
      <Panel
        title="🌊 未来 7 天海况预报"
        source="Open-Meteo Marine（逐日最大浪高，本地时区）"
        icon={<ExperimentOutlined />}
        loading={marine.loading}
        error={marine.error}
      >
        {!marine.loading && !items.length ? (
          <Empty description="未取到海况预报数据" />
        ) : (
          <>
            <p className="o-marine-lead">
              表头为日期，单元格是该海域当天的<b>最大浪高</b>（米），颜色对应海况等级。
              浪高由风浪与涌浪叠加而成：风浪随本地风生消，涌浪则是别处风暴传来的长波——
              这也是为什么有时本地风和日丽，海上却涌浪很大。
            </p>
            <Table size="small" rowKey="key" pagination={false} columns={columns} dataSource={items} scroll={{ x: 900 }} />
          </>
        )}
      </Panel>
    </div>
  )
}
