/**
 * 深空看板「☄️ 小天体档案」页签：JPL SBDB 提供的彗星与小行星轨道要素。
 *
 * 为什么单独一页：「深空」页签讲的是星系与系外行星（远、大），
 * 这里讲的是太阳系内的小天体（近、小、且会被探测器造访）。
 *
 * 数据来源 JPL Small-Body Database，由精选清单逐条查询（服务端的 FAMOUS_BODIES），
 * 覆盖肉眼可见的大彗星 + 人类探测器到访过的天体。轨道要素几乎不变，24 小时刷新一次。
 *
 * 单位口径：a/q/ad 为天文单位(AU)，per 为公转周期(天)，i 为轨道倾角(度)，
 * diameter 为 JPL 给出的直径估计(km)——小天体的直径普遍只有量级意义，
 * 页面里不把它当精确值用。
 */
import { ExperimentOutlined } from '@ant-design/icons'
import { Empty, Table, Tag, Tooltip } from 'antd'
import { Panel } from './ui.jsx'
import { useI18n } from '@i18n/index.js'

/** 周期(天) → 人类可读：超过 2 年用「年」，否则保留「天」更精确 */
function perText(per, t) {
  if (per == null) return '—'
  const y = per / 365.25
  return y >= 2 ? `${y.toFixed(1)} ${t('astro.unitYr')}` : `${Math.round(per)} ${t('astro.unitDay')}`
}

/** 数值单元格：缺测显示 —（上游大量字段为空，不能画成 0） */
function Cell({ value, digits = 2, unit }) {
  if (value == null) return <span className="astro-comet-none">—</span>
  return (
    <span>
      {value.toFixed(digits)}
      {unit ? <span className="astro-comet-unit">{unit}</span> : null}
    </span>
  )
}

export default function CometTab({ comet, cometData }) {
  const { t } = useI18n()
  const items = (cometData?.items || []).filter((i) => i.ok)
  const failed = (cometData?.items || []).filter((i) => !i.ok)

  const comets = items.filter((i) => i.kind === 'comet')
  const asteroids = items.filter((i) => i.kind === 'asteroid')

  const columns = [
    {
      title: t('astro.cometBody'),
      dataIndex: 'zh',
      width: 190,
      render: (zh, r) => (
        <div className="astro-comet-name">
          <b>{zh}</b>
          <span className="astro-comet-full">{r.fullname}</span>
        </div>
      ),
    },
    {
      title: t('astro.cometClass'),
      dataIndex: 'cls',
      width: 150,
      render: (cls) => <span className="astro-comet-cls">{cls || '—'}</span>,
    },
    {
      // 表头挂气泡解释，避免「周期几万年」这种数字没人看得懂
      title: (
        <Tooltip title={t('astro.cometPerTip')}>
          <span className="astro-comet-th">{t('astro.cometPeriod')}</span>
        </Tooltip>
      ),
      dataIndex: 'per',
      width: 110,
      render: (per) => perText(per, t),
    },
    { title: t('astro.cometPeriDist'), dataIndex: 'q', width: 110, render: (v) => <Cell value={v} /> },
    { title: t('astro.cometApoDist'), dataIndex: 'ad', width: 110, render: (v) => <Cell value={v} /> },
    { title: t('astro.cometEcc'), dataIndex: 'e', width: 90, render: (v) => <Cell value={v} digits={3} /> },
    { title: t('astro.cometIncl'), dataIndex: 'i', width: 90, render: (v) => <Cell value={v} digits={1} /> },
    { title: t('astro.cometDiameter'), dataIndex: 'diameter', width: 100, render: (v) => <Cell value={v} digits={1} /> },
    {
      title: t('astro.cometHighlight'),
      dataIndex: 'note',
      render: (note) => <span className="astro-comet-note">{note || '—'}</span>,
    },
  ]

  if (!comet.loading && !items.length) {
    return (
      <div className="astro-tab-content">
        <Panel title={t('astro.cometArchiveTitle')} source={t('astro.cometAsteroidSource')} icon={<ExperimentOutlined />} error={comet.error || t('astro.cometNoData')}>
          <Empty description={t('astro.cometEmpty')} />
        </Panel>
      </div>
    )
  }

  return (
    <div className="astro-tab-content">
      <Panel
        title={t('astro.cometCometTitle')}
        source={t('astro.cometCometSource')}
        icon={<ExperimentOutlined />}
        loading={comet.loading}
        error={comet.error}
      >
        <p className="astro-comet-lead">
          {t('astro.cometCometLead')}
        </p>
        <Table
          size="small"
          rowKey="key"
          pagination={false}
          columns={columns}
          dataSource={comets}
          scroll={{ x: 1000 }}
        />
      </Panel>

      <Panel
        title={t('astro.cometAsteroidTitle')}
        source={t('astro.cometAsteroidSource')}
        icon={<ExperimentOutlined />}
        loading={comet.loading}
        error={comet.error}
      >
        <p className="astro-comet-lead">
          {t('astro.cometAsteroidLead')}
        </p>
        <Table
          size="small"
          rowKey="key"
          pagination={false}
          columns={columns}
          dataSource={asteroids}
          scroll={{ x: 1000 }}
        />
        {failed.length ? (
          <div className="astro-comet-failed">
            {t('astro.cometFailed', { n: failed.length })}
            {failed.map((f) => (
              <Tag key={f.key} bordered={false}>
                {f.zh}
              </Tag>
            ))}
          </div>
        ) : null}
      </Panel>
    </div>
  )
}
