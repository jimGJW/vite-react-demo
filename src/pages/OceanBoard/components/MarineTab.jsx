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
import { useI18n } from '../../../i18n/index.js'
import { Panel, waveLevel } from './ui.jsx'

/** 逐日浪高单元格：底色与文字都来自分档结果 */
function WaveCell({ v }) {
  const { lang } = useI18n()
  if (v == null) return <span className="o-marine-none">—</span>
  const b = waveLevel(v, lang)
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
  const { t } = useI18n()
  const items = marineData?.items || []
  const days = items[0]?.forecast?.map((f) => f.date) || []

  const columns = [
    { title: t('ocean.col.sea'), dataIndex: 'name', width: 110, fixed: 'left', render: (v) => <b>{v}</b> },
    {
      title: t('ocean.marine.colWave'),
      dataIndex: 'waveH',
      width: 120,
      sorter: (a, b) => (a.waveH ?? -1) - (b.waveH ?? -1),
      defaultSortOrder: 'descend',
      render: (v) => <WaveCell v={v} />,
    },
    { title: t('ocean.marine.colPeriod'), dataIndex: 'wavePeriod', width: 90, render: (v) => (v == null ? '—' : v.toFixed(1)) },
    { title: t('ocean.marine.colSst'), dataIndex: 'sst', width: 100, render: (v) => (v == null ? '—' : v.toFixed(1)) },
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
        title={`🌊 ${t('ocean.marine.panel')}`}
        source={t('ocean.marine.src')}
        icon={<ExperimentOutlined />}
        loading={marine.loading}
        error={marine.error}
      >
        {!marine.loading && !items.length ? (
          <Empty description={t('ocean.marine.empty')} />
        ) : (
          <>
            <p className="o-marine-lead">
              {t('ocean.marine.lead')}
            </p>
            <Table size="small" rowKey="key" pagination={false} columns={columns} dataSource={items} scroll={{ x: 900 }} />
          </>
        )}
      </Panel>
    </div>
  )
}
