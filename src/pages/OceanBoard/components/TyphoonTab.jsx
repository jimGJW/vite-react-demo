/**
 * 「西北太平洋台风」Tab：中国气象局中央气象台（nmc.cn）当前活跃台风。
 *
 * 与「热带气旋」Tab（NOAA NHC，大西洋 / 东太平洋飓风）是互补关系——
 * 影响我国的台风全在西北太平洋，NHC 责任区根本不包含这片海，所以单独做一页。
 *
 * 数据要点（与 NHC 口径不同，页面必须点明）：
 *   · CMA 强度等级按 **2 分钟平均**近中心最大风速划分（NHC 用 1 分钟），同一场风暴两家的等级可能差一档。
 *   · 路径点来自中央气象台的实时定位，给出时间 / 经纬度 / 等级 / 中心气压 / 风速 / 移向移速。
 */
import { CompassOutlined, WarningOutlined } from '@ant-design/icons'
import { Empty, Table, Tooltip } from 'antd'
import { Panel } from './ui.jsx'
import { zhTyphoonGrade } from '@lib/earth/glossary.js'
import { useI18n } from '@i18n/index.js'

/** 'YYYYMMDDHHmm' → 'YYYY-MM-DD HH:mm' */
function fmtTime(t) {
  if (typeof t !== 'string' || t.length < 12) return '—'
  return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)} ${t.slice(8, 10)}:${t.slice(10, 12)}`
}

/** 数值经纬度 → '12.3°N 130.5°E' */
function posText(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '—'
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`
}

export default function TyphoonTab({ typhoons, tyData }) {
  const { t, lang } = useI18n()
  const dirText = (d8) => (d8 ? t(`ocean.dir.${d8}`) : '—')

  const storms = tyData?.storms || []
  const activeCount = tyData?.activeCount ?? 0

  /** 单条台风的展开区：把最近路径点列成小表，看清它怎么走、怎么变强 */
  const renderTrack = (storm) => {
    const rows = (storm.track || []).slice().reverse() // 最新的在最上面
    return (
      <Table
        className="o-ty-track"
        size="small"
        rowKey={(r) => r.time}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 720 }}
        columns={[
          { title: t('ocean.typhoon.colTime'), dataIndex: 'time', width: 130, render: (v) => fmtTime(v) },
          {
            title: t('ocean.typhoon.colGrade'),
            dataIndex: 'grade',
            width: 110,
            render: (v) => {
              const g = zhTyphoonGrade(v, lang)
              return (
                <span style={{ color: g.color, fontWeight: 600 }}>{g.zh}</span>
              )
            },
          },
          {
            title: t('ocean.typhoon.colPressure'),
            dataIndex: 'pressure',
            width: 100,
            align: 'right',
            render: (v) => (v != null ? `${v} hPa` : '—'),
          },
          {
            title: t('ocean.typhoon.colWind'),
            dataIndex: 'windMs',
            width: 100,
            align: 'right',
            render: (v) => (v != null ? `${v} m/s` : '—'),
          },
          {
            title: t('ocean.typhoon.colPos'),
            dataIndex: 'lat',
            width: 180,
            align: 'right',
            render: (v, r) => posText(r.lat, r.lng),
          },
        ]}
      />
    )
  }

  return (
    <div className="o-tab-content">
      <Panel
        title={t('ocean.typhoon.panelActive')}
        source={t('ocean.typhoon.srcActive')}
        icon={<CompassOutlined />}
        loading={typhoons.loading}
        error={typhoons.error}
      >
        {tyData ? (
          activeCount ? (
            <>
              <div className="o-cyc-stats">
                <span>
                  {t('ocean.typhoon.statSeason', {
                    n: tyData.seasonCount,
                    m: activeCount,
                  })}
                </span>
              </div>
              <Table
                className="o-cyc-table"
                size="small"
                rowKey="id"
                dataSource={storms}
                pagination={false}
                scroll={{ x: 1000 }}
                expandable={{ expandedRowRender: renderTrack, rowExpandable: (r) => (r.track || []).length > 0 }}
                columns={[
                  {
                    title: t('ocean.typhoon.colName'),
                    dataIndex: 'name',
                    width: 130,
                    render: (v, r) => (
                      <span>
                        <b>{v}</b>
                        {r.enName && r.enName !== v && (
                          <span className="o-cyc-table__bin">{r.enName}</span>
                        )}
                      </span>
                    ),
                  },
                  {
                    title: t('ocean.typhoon.colGrade'),
                    dataIndex: 'current',
                    width: 120,
                    render: (c) => {
                      if (!c) return <span style={{ color: '#94a3b8' }}>{t('ocean.typhoon.noTrack')}</span>
                      const g = zhTyphoonGrade(c.grade, lang)
                      return (
                        <Tooltip title={g.desc}>
                          <span style={{ color: g.color, fontWeight: 600 }}>{g.zh}</span>
                        </Tooltip>
                      )
                    },
                  },
                  {
                    title: t('ocean.typhoon.colPressure'),
                    dataIndex: 'current',
                    width: 110,
                    align: 'right',
                    render: (c) => (c?.pressure != null ? `${c.pressure} hPa` : '—'),
                  },
                  {
                    title: t('ocean.typhoon.colWind'),
                    dataIndex: 'current',
                    width: 110,
                    align: 'right',
                    render: (c) => (c?.windMs != null ? `${c.windMs} m/s` : '—'),
                  },
                  {
                    title: t('ocean.typhoon.colPos'),
                    dataIndex: 'current',
                    width: 170,
                    align: 'right',
                    render: (c) => posText(c?.lat, c?.lng),
                  },
                  {
                    title: t('ocean.typhoon.colMove'),
                    dataIndex: 'current',
                    width: 140,
                    align: 'right',
                    render: (c, r) =>
                      c?.moveDir8
                        ? `${dirText(c.moveDir8)} ${c.moveSpeed ?? '—'} km/h`
                        : r.current?.moveDir || '—',
                  },
                  {
                    title: t('ocean.typhoon.colUpdated'),
                    dataIndex: 'current',
                    width: 140,
                    render: (c) => (c?.time ? <span className="o-cyc-table__sub">{fmtTime(c.time)}</span> : '—'),
                  },
                ]}
              />
              <div className="o-ty-hint">{t('ocean.typhoon.expandHint')}</div>
            </>
          ) : (
            <Empty description={t('ocean.typhoon.emptyNone')} />
          )
        ) : (
          <Empty description={t('ocean.typhoon.emptyData')} />
        )}
      </Panel>

      <Panel
        title={t('ocean.typhoon.panelTips')}
        source={t('ocean.typhoon.srcTips')}
        icon={<WarningOutlined />}
      >
        <div className="o-prose">
          <p>{t('ocean.typhoon.tip1')}</p>
          <p>{t('ocean.typhoon.tip2')}</p>
          <p>{t('ocean.typhoon.tip3')}</p>
        </div>
      </Panel>
    </div>
  )
}
