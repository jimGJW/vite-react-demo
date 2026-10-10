/**
 * 全球 10 大海域浪况速览（Open-Meteo Marine 多点一次请求，1 小时刷新）。
 * 与「近海 5 站」互补：近海看门面，远海看大势（好望角/白令海/比斯开湾…）。
 * 注意：该源请求带 timezone=UTC，时刻列为 UTC。
 */
import { Empty, Table } from 'antd'
import { waveLevel } from './ui.jsx'

export default function GlobalWavesTable({ spots }) {
  if (!spots?.length) return <Empty description="暂无全球海域数据" />
  return (
    <Table
      className="o-wave-table"
      size="small"
      rowKey="name"
      dataSource={spots}
      pagination={false}
      columns={[
        { title: '海域', dataIndex: 'name', width: 110, render: (v) => <b>{v}</b> },
        {
          title: '浪高',
          dataIndex: 'waveHeight',
          width: 130,
          align: 'right',
          render: (v) => {
            const lv = waveLevel(v)
            return v != null ? (
              <span style={{ color: lv.color, fontWeight: 600 }}>
                {v.toFixed(2)} m · {lv.label}
              </span>
            ) : '—'
          },
        },
        {
          title: '浪向',
          dataIndex: 'waveDirText',
          width: 110,
          align: 'right',
          render: (v, r) => (v !== '—' ? `${v}（${r.waveDir?.toFixed(0)}°）` : '—'),
        },
        {
          title: '平均周期',
          dataIndex: 'wavePeriod',
          width: 100,
          align: 'right',
          render: (v) => (v != null ? `${v.toFixed(1)} s` : '—'),
        },
        {
          title: '时刻',
          dataIndex: 'time',
          align: 'right',
          render: (v) => (v ? `${v.slice(11, 16)}（UTC）` : '—'),
        },
      ]}
    />
  )
}
