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
import { useI18n } from '../../../i18n/index.js'

export default function CycloneTab({ cyclones, cycData }) {
  const { t, lang } = useI18n()
  const dirText = (deg) => {
    if (!Number.isFinite(deg)) return '—'
    const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8
    return [
      t('ocean.dir.n'), t('ocean.dir.ne'), t('ocean.dir.e'), t('ocean.dir.se'),
      t('ocean.dir.s'), t('ocean.dir.sw'), t('ocean.dir.w'), t('ocean.dir.nw'),
    ][i]
  }
  return (
    <div className="o-tab-content">
      <Panel
        title={t('ocean.cyc.panelActive')}
        source={t('ocean.cyc.srcActive')}
        icon={<CompassOutlined />}
        loading={cyclones.loading}
        error={cyclones.error}
      >
        {cycData ? (
          cycData.count ? (
            <>
              <div className="o-cyc-stats">
                <span>
                  {t('ocean.cyc.statActive', { n: cycData.count })}
                </span>
                <span>
                  {t('ocean.cyc.statHurricane', { n: cycData.hurricaneCount })}
                </span>
                <span>
                  {t('ocean.cyc.statBasins', { at: cycData.basins?.AT ?? 0, ep: cycData.basins?.EP ?? 0 })}
                </span>
                {cycData.strongest && (
                  <span>
                    {t('ocean.cyc.statStrongest', {
                      name: cycData.strongest.name,
                      scale: cycData.strongest.scale ? cycData.strongest.scale.zh : cycData.strongest.classZh,
                    })}
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
                    title: t('ocean.cyc.colName'),
                    dataIndex: 'name',
                    width: 110,
                    render: (v, r) => (
                      <span>
                        <b>{v}</b>
                        <span className="o-cyc-table__bin">{r.bin}</span>
                      </span>
                    ),
                  },
                  { title: t('ocean.cyc.colBasin'), dataIndex: 'basinZh', width: 110 },
                  {
                    title: t('ocean.cyc.colClass'),
                    dataIndex: 'class',
                    width: 120,
                    render: (v, r) => {
                      const c = zhCycloneClass(v, lang)
                      return (
                        <Tooltip title={c?.desc}>
                          <Tag bordered={false} className="is-info">{r.classZh}</Tag>
                        </Tooltip>
                      )
                    },
                  },
                  {
                    title: t('ocean.cyc.colIntensity'),
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
                    title: t('ocean.cyc.colScale'),
                    dataIndex: 'scale',
                    width: 110,
                    render: (s) =>
                      s ? (
                        <Tooltip title={zhCycloneScale(s.level, lang)?.desc}>
                          <span className="is-info" style={{ color: s.color, fontWeight: 600 }}>
                            {s.zh}
                          </span>
                        </Tooltip>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>{t('ocean.cyc.noScale')}</span>
                      ),
                  },
                  {
                    title: t('ocean.cyc.colPressure'),
                    dataIndex: 'pressure',
                    width: 100,
                    align: 'right',
                    render: (v) => (v ? `${v} hPa` : '—'),
                  },
                  {
                    title: t('ocean.cyc.colPos'),
                    dataIndex: 'lat',
                    width: 150,
                    align: 'right',
                    render: (v, r) =>
                      v != null
                        ? `${Math.abs(v).toFixed(1)}°${v >= 0 ? 'N' : 'S'} ${Math.abs(r.lon).toFixed(1)}°${r.lon >= 0 ? 'E' : 'W'}`
                        : '—',
                  },
                  {
                    title: t('ocean.cyc.colMove'),
                    dataIndex: 'moveDir',
                    width: 130,
                    align: 'right',
                    render: (v, r) =>
                      v != null
                        ? `${dirText(v)} ${r.moveSpeedKt ?? '—'} kt`
                        : '—',
                  },
                  {
                    title: t('ocean.cyc.colUpdated'),
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
            <Empty description={t('ocean.cyc.emptyNone')} />
          )
        ) : (
          <Empty description={t('ocean.cyc.emptyData')} />
        )}
      </Panel>

      <Panel
        title={t('ocean.cyc.panelTips')}
        source={t('ocean.srcIntro')}
        icon={<WarningOutlined />}
      >
        <div className="o-prose">
          <p>
            {t('ocean.cyc.tip1')}
          </p>
          <p>
            {t('ocean.cyc.tip2')}
          </p>
          <p>
            {t('ocean.cyc.tip3')}
          </p>
        </div>
      </Panel>
    </div>
  )
}
