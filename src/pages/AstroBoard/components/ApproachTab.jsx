/**
 * 深空看板「🛰 近地交会」页签：未来近距离掠过地球的小行星清单（JPL CAD）。
 *
 * 与「太阳系」页签里 NASA NeoWs 的区别：NeoWs 只覆盖未来 7 天且字段粗，
 * CAD 能按距离排序给出未来全部近距离事件，并带相对速度与轨道不确定度。
 *
 * 两个口径必须写清楚，否则数字会被误读：
 *   · 距离用「月距 LD」为主单位——0.5 月距比 0.0013 AU 直观得多；
 *   · 直径是**由绝对星等 H 反推的估算值**，取典型反照率 0.14。
 *     H 差 1 等约等于直径差 2.5 倍，所以它只能用来判断量级（十几米 vs 上百米），
 *     不能当精确尺寸读。
 */
import { ExperimentOutlined } from '@ant-design/icons'
import { Empty, Table, Tooltip } from 'antd'
import { Panel } from './ui.jsx'

/** CAD 的日期形如 "2026-Oct-15 00:01"，转成中文短格式 */
function dateText(cd) {
  if (!cd) return '—'
  const m = String(cd).match(/^(\d{4})-([A-Za-z]{3})-(\d{2})\s*(\d{2}:\d{2})?/)
  if (!m) return cd
  const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 }
  const mm = String(MON[m[2]] || '').padStart(2, '0')
  return `${m[1]}-${mm}-${m[3]}${m[4] ? ` ${m[4]}` : ''}`
}

/** 直径估算值 → 人类可读（米 / 公里） */
function sizeText(dKm) {
  if (dKm == null) return '—'
  if (dKm < 1) return `${Math.round(dKm * 1000)} m`
  return `${dKm.toFixed(2)} km`
}

/** 距离越近颜色越暖：0.5 月距以内标红，2 月距内标橙，其余常规 */
function distColor(lunarDist) {
  if (lunarDist == null) return undefined
  if (lunarDist < 1) return '#ff4d4f'
  if (lunarDist < 3) return '#fa8c16'
  return undefined
}

export default function ApproachTab({ approach, approachData }) {
  const items = approachData?.items || []
  const total = approachData?.count || 0

  const columns = [
    { title: '编号', dataIndex: 'des', width: 110, render: (v) => <b>{v || '—'}</b> },
    { title: '最近时刻', dataIndex: 'date', width: 140, render: (v) => dateText(v) },
    {
      title: '距离 (月距)',
      dataIndex: 'lunarDist',
      width: 120,
      sorter: (a, b) => (a.lunarDist ?? 9e9) - (b.lunarDist ?? 9e9),
      defaultSortOrder: 'ascend',
      render: (v, r) => (
        <Tooltip title={r.distAu == null ? '无数据' : `${r.distAu.toFixed(6)} AU · ${Math.round(r.distKm).toLocaleString()} km`}>
          <span style={{ color: distColor(v), fontWeight: 600 }}>
            {v == null ? '—' : v.toFixed(2)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '相对速度 (km/s)',
      dataIndex: 'vRel',
      width: 130,
      render: (v) => (v == null ? '—' : v.toFixed(2)),
    },
    {
      title: '绝对星等 H',
      dataIndex: 'h',
      width: 110,
      render: (v) => (v == null ? '—' : v.toFixed(1)),
    },
    {
      title: (
        <Tooltip title="由绝对星等 H 按反照率 0.14 反推的量级估算，非实测直径">
          <span className="astro-approach-th">估算直径</span>
        </Tooltip>
      ),
      dataIndex: 'dKm',
      width: 110,
      render: (v) => sizeText(v),
    },
    {
      title: '时刻不确定度',
      dataIndex: 'uncertainty',
      width: 130,
      render: (v) => <span className="astro-approach-dim">{v || '—'}</span>,
    },
  ]

  return (
    <div className="astro-tab-content">
      <Panel
        title="🛰 未来近地交会"
        source="NASA JPL Close Approach Data（0.05 AU 内，按距离升序）"
        icon={<ExperimentOutlined />}
        loading={approach.loading}
        error={approach.error}
        extra={total ? <span className="astro-approach-count">共 {total} 次</span> : null}
      >
        {!approach.loading && !items.length ? (
          <Empty description="当前没有近地交会事件" />
        ) : (
          <>
            <p className="astro-approach-lead">
              这张表里的天体都在<b>月球轨道以内或附近</b>掠过地球。绝大多数直径只有十几米——
              即便真进入大气，也会在高层烧蚀殆尽，不构成地面威胁；
              真正需要警惕的是百米级以上、且轨道不确定度收敛到很小的那类。
            </p>
            <Table size="small" rowKey={(r) => `${r.des}-${r.date}`} pagination={{ pageSize: 12, size: 'small' }} columns={columns} dataSource={items} scroll={{ x: 860 }} />
          </>
        )}
      </Panel>
    </div>
  )
}
