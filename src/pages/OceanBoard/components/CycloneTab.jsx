/**
 * 「热带气旋」Tab：NOAA NHC 当前活跃风暴。
 *
 * 覆盖范围的提醒必须写在页面上：NHC 只管北大西洋与东北太平洋，
 * 影响我国的西北太平洋台风由 JTWC / 日本气象厅 / 中央气象台发布，本源不包含。
 * 否则用户看到「活跃气旋 0 个」会误以为全球无台风。
 */
import { CompassOutlined, WarningOutlined } from '@ant-design/icons'
import { Empty, Table, Tag, Tooltip } from 'antd'
import { Panel } from './ui.jsx'
import { zhCycloneClass, zhCycloneScale } from '../../../lib/earth/glossary.js'

/** 8 方位中文（移向） */
const DIRS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
function dirText(deg) {
  if (!Number.isFinite(deg)) return '—'
  return DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]
}

export default function CycloneTab({ cyclones, cycData }) {
  return (
    <div className="o-tab-content">
      <Panel
        title="当前活跃热带气旋"
        source="NOAA NHC（www.nhc.noaa.gov，免密钥），10 分钟刷新；仅含北大西洋与东北太平洋"
        icon={<CompassOutlined />}
        loading={cyclones.loading}
        error={cyclones.error}
      >
        {cycData ? (
          cycData.count ? (
            <>
              <div className="o-cyc-stats">
                <span>
                  活跃 <b>{cycData.count}</b> 个
                </span>
                <span>
                  达到飓风强度 <b style={{ color: '#ef4444' }}>{cycData.hurricaneCount}</b> 个
                </span>
                <span>
                  北大西洋 <b>{cycData.basins?.AT ?? 0}</b> · 东北太平洋{' '}
                  <b>{cycData.basins?.EP ?? 0}</b>
                </span>
                {cycData.strongest && (
                  <span>
                    最强 <b>{cycData.strongest.name}</b> ·{' '}
                    {cycData.strongest.scale ? cycData.strongest.scale.zh : cycData.strongest.classZh}
                  </span>
                )}
              </div>
              <Table
                className="o-cyc-table"
                size="small"
                rowKey="id"
                dataSource={cycData.storms}
                pagination={false}
                scroll={{ x: 900 }}
                columns={[
                  {
                    title: '名称',
                    dataIndex: 'name',
                    width: 110,
                    render: (v, r) => (
                      <span>
                        <b>{v}</b>
                        <span className="o-cyc-table__bin">{r.bin}</span>
                      </span>
                    ),
                  },
                  { title: '洋盆', dataIndex: 'basinZh', width: 110 },
                  {
                    title: '分类',
                    dataIndex: 'class',
                    width: 120,
                    render: (v, r) => {
                      const c = zhCycloneClass(v)
                      return (
                        <Tooltip title={c?.desc}>
                          <Tag bordered={false} className="is-info">{r.classZh}</Tag>
                        </Tooltip>
                      )
                    },
                  },
                  {
                    title: '强度',
                    dataIndex: 'intensityKt',
                    width: 140,
                    align: 'right',
                    sorter: (a, b) => (a.intensityKt || 0) - (b.intensityKt || 0),
                    defaultSortOrder: 'descend',
                    render: (v, r) => (
                      <span>
                        {v ?? '—'} kt
                        <span className="o-cyc-table__sub">
                          {r.intensityMs != null ? ` / ${r.intensityMs} m/s` : ''}
                        </span>
                      </span>
                    ),
                  },
                  {
                    title: '等级',
                    dataIndex: 'scale',
                    width: 110,
                    render: (s) =>
                      s ? (
                        <Tooltip title={zhCycloneScale(s.level)?.desc}>
                          <span className="is-info" style={{ color: s.color, fontWeight: 600 }}>
                            {s.zh}
                          </span>
                        </Tooltip>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>未达飓风</span>
                      ),
                  },
                  {
                    title: '中心气压',
                    dataIndex: 'pressure',
                    width: 100,
                    align: 'right',
                    render: (v) => (v ? `${v} hPa` : '—'),
                  },
                  {
                    title: '位置',
                    dataIndex: 'lat',
                    width: 150,
                    align: 'right',
                    render: (v, r) =>
                      v != null
                        ? `${Math.abs(v).toFixed(1)}°${v >= 0 ? 'N' : 'S'} ${Math.abs(r.lon).toFixed(1)}°${r.lon >= 0 ? 'E' : 'W'}`
                        : '—',
                  },
                  {
                    title: '移动',
                    dataIndex: 'moveDir',
                    width: 130,
                    align: 'right',
                    render: (v, r) =>
                      v != null
                        ? `${dirText(v)} ${r.moveSpeedKt ?? '—'} kt`
                        : '—',
                  },
                  {
                    title: '最新发布',
                    dataIndex: 'lastUpdate',
                    width: 150,
                    render: (v) =>
                      v ? (
                        <span className="o-cyc-table__sub">{v.replace('T', ' ').slice(0, 16)} UTC</span>
                      ) : '—',
                  },
                ]}
              />
            </>
          ) : (
            <Empty description="当前北大西洋与东北太平洋无活跃热带气旋" />
          )
        ) : (
          <Empty description="暂无气旋数据" />
        )}
      </Panel>

      <Panel
        title="读这张表前要知道的三件事"
        source="科普说明（静态）"
        icon={<WarningOutlined />}
      >
        <div className="o-prose">
          <p>
            <b>① 覆盖范围有限。</b>本源是 NOAA 国家飓风中心（NHC），只负责北大西洋与东北太平洋。
            西北太平洋的台风由 JTWC、日本气象厅与中央气象台发布，<strong>不在这个列表里</strong>。
            显示「无活跃气旋」不代表全球无台风。
          </p>
          <p>
            <b>② 风速单位与我国不同。</b>NHC 用<b>节（kt）</b>和 1 分钟持续风速；
            我国与日本用<b>米/秒</b>和 2 分钟持续风速，WMO 建议用 10 分钟。
            同一场风暴，1 分钟平均会明显大于 10 分钟平均——跨机构比强度必须先看口径。
          </p>
          <p>
            <b>③ 等级只看风，不看水和雨。</b>萨菲尔–辛普森等级完全由风速决定，
            但历史上热带气旋致死最多的原因是<b>风暴增水与内陆洪水</b>。
            一个缓慢移动的「一级」风暴可以造成比快速过境的「四级」更严重的灾害。
          </p>
        </div>
      </Panel>
    </div>
  )
}
