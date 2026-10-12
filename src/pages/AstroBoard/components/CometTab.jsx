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

/** 周期(天) → 人类可读：超过 2 年用「年」，否则保留「天」更精确 */
function perText(per) {
  if (per == null) return '—'
  const y = per / 365.25
  return y >= 2 ? `${y.toFixed(1)} 年` : `${Math.round(per)} 天`
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
  const items = (cometData?.items || []).filter((i) => i.ok)
  const failed = (cometData?.items || []).filter((i) => !i.ok)

  const comets = items.filter((i) => i.kind === 'comet')
  const asteroids = items.filter((i) => i.kind === 'asteroid')

  const columns = [
    {
      title: '天体',
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
      title: '分类',
      dataIndex: 'cls',
      width: 150,
      render: (cls) => <span className="astro-comet-cls">{cls || '—'}</span>,
    },
    {
      // 表头挂气泡解释，避免「周期几万年」这种数字没人看得懂
      title: (
        <Tooltip title="绕太阳一周的时间。彗星常为数十年至数千年，小行星多为 3–6 年">
          <span className="astro-comet-th">公转周期</span>
        </Tooltip>
      ),
      dataIndex: 'per',
      width: 110,
      render: (per) => perText(per),
    },
    { title: '近日距 (AU)', dataIndex: 'q', width: 110, render: (v) => <Cell value={v} /> },
    { title: '远日距 (AU)', dataIndex: 'ad', width: 110, render: (v) => <Cell value={v} /> },
    { title: '偏心率', dataIndex: 'e', width: 90, render: (v) => <Cell value={v} digits={3} /> },
    { title: '倾角 (°)', dataIndex: 'i', width: 90, render: (v) => <Cell value={v} digits={1} /> },
    { title: '直径 (km)', dataIndex: 'diameter', width: 100, render: (v) => <Cell value={v} digits={1} /> },
    {
      title: '看点',
      dataIndex: 'note',
      render: (note) => <span className="astro-comet-note">{note || '—'}</span>,
    },
  ]

  if (!comet.loading && !items.length) {
    return (
      <div className="astro-tab-content">
        <Panel title="小天体档案" source="NASA JPL Small-Body Database" icon={<ExperimentOutlined />} error={comet.error || '暂无数据'}>
          <Empty description="未取到小天体数据" />
        </Panel>
      </div>
    )
  }

  return (
    <div className="astro-tab-content">
      <Panel
        title="☄️ 彗星（肉眼可见 / 周期彗星）"
        source="NASA JPL Small-Body Database（精选清单，轨道要素 24 小时更新一次）"
        icon={<ExperimentOutlined />}
        loading={comet.loading}
        error={comet.error}
      >
        <p className="astro-comet-lead">
          彗星的偏心率普遍接近 1（轨道极扁），近日距很小而远日距极大——
          这就是为什么它们只在靠近太阳的短短几个月里长出彗尾，其余时间只是一个暗淡的脏雪球。
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
        title="🪨 小行星（探测器到访过 / 著名目标）"
        source="NASA JPL Small-Body Database"
        icon={<ExperimentOutlined />}
        loading={comet.loading}
        error={comet.error}
      >
        <p className="astro-comet-lead">
          与彗星相反，小行星的偏心率普遍较小、轨道接近圆。表里这些是少量被人类探测器
          近距离探测甚至采样返回的目标——它们的直径与反照率是实测而非估算。
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
            {failed.length} 个天体本次未取到（上游瞬时不可用，下次刷新会自动补上）：
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
