/**
 * GeoBoard 的「🌋 火山与海啸」页签。
 *
 * 两个源同属「地壳事件 → 需要对外发警报」这一类，放一起便于对照：
 *   · USGS HANS  火山警报（慢变量：岩浆上移到喷发以天/周计）
 *   · NOAA tsunami.gov 海啸公告（快变量：强震后几分钟内就要给出结论）
 *
 * 关键设计：USGS 的两套分级（地面警报级 + 航空色码）必须**并列展示**，
 * 不能只显示一套。它们的对象不同（居民 vs 航线），日常也经常不同步，
 * 只显示一套会让读者把「熔岩流威胁」误读成「火山灰威胁」。
 */
import { BookOutlined, GlobalOutlined, WarningOutlined } from '@ant-design/icons'
import { Empty, Table, Tag, Tooltip } from 'antd'
import { Panel, fmtBJT } from './ui.jsx'
import { useI18n } from '../../../i18n/index.js'
import {
  AVIATION_CODES,
  TSUNAMI_CATEGORIES,
  VOLCANO_ALERTS,
  zhAviationCode,
  zhTsunamiCategory,
  zhVolcanoAlert,
} from '../../../lib/earth/glossary.js'

/** 航空色码 Tag：色即等级（绿/黄/橙/红），悬停给完整定义 */
function ColorTag({ code }) {
  const { t } = useI18n()
  const info = zhAviationCode(code)
  return (
    <Tooltip title={info?.desc || t('geo.volcano.unknownAviation')}>
      <Tag color={info?.color} bordered={false}>
        {info?.zh || code || '—'}
      </Tag>
    </Tooltip>
  )
}

/** 地面警报级 Tag */
function AlertTag({ level }) {
  const { t } = useI18n()
  const info = zhVolcanoAlert(level)
  return (
    <Tooltip title={info?.desc || t('geo.volcano.unknownGround')}>
      <Tag color={info?.color} bordered={false}>
        {info?.zh || level || '—'}
      </Tag>
    </Tooltip>
  )
}

/** 海啸公告等级 Tag：等级的中译与颜色一律来自词典，服务端只给 Category 原文 */
function TsunamiTag({ category }) {
  const { t } = useI18n()
  const info = zhTsunamiCategory(category)
  return (
    <Tooltip title={info?.desc || t('geo.volcano.unknownTsu')}>
      <Tag color={info?.color} bordered={false}>
        {info?.zh || category || '—'}
      </Tag>
    </Tooltip>
  )
}

/** 概览统计行：数字 + 说明，与 ClimateTab 的 KPI 行同款排版 */
function StatRow({ items }) {
  return (
    <div className="geo-alert-stat">
      {items.map((it) => (
        <span key={it.label}>
          {it.label} <b style={it.tone ? { color: it.tone } : undefined}>{it.value}</b>
          {it.suffix && <span className="geo-alert-stat__sub">{it.suffix}</span>}
        </span>
      ))}
    </div>
  )
}

export default function VolcanoTab({ volcanoes, volcanoData, tsunami, tsunamiData }) {
  const { t } = useI18n()
  const volList = volcanoData?.volcanoes || []
  // 服务端只给 Category 原文与发布时间，等级的中译/rank/颜色全部由词典补齐后再排序。
  // 这样「哪个更危险」只有一处定义（glossary.js），不会前后端各说一套。
  const tsuEvents = (tsunamiData?.events || [])
    .map((e) => ({ ...e, level: zhTsunamiCategory(e.category) }))
    .sort((a, b) => (b.level?.rank ?? 0) - (a.level?.rank ?? 0) || (b.updatedUnix || 0) - (a.updatedUnix || 0))
  // 只有「注意」及以上才算真威胁；信息声明是「已排除」，不该计入
  const threatCount = tsuEvents.filter((e) => (e.level?.rank ?? 0) >= 2).length

  return (
    <div className="geo-tab-content">
      <Panel
        title={t('geo.volcano.usgsTitle')}
        source={t('geo.volcano.usgsSource')}
        icon={<WarningOutlined />}
        loading={volcanoes.loading}
        error={volcanoes.error}
      >
        {volcanoData ? (
          volList.length ? (
            <>
              <StatRow
                items={[
                  { label: t('geo.volcano.statAbove'), value: t('geo.volcano.unitSeat', { n: volcanoData.count }) },
                  {
                    label: t('geo.volcano.statOrange'),
                    value: t('geo.volcano.unitSeat', { n: volcanoData.elevated }),
                    tone: '#f97316',
                    suffix: t('geo.volcano.suffixActive'),
                  },
                  {
                    label: t('geo.volcano.statHighest'),
                    value: volcanoData.highest
                      ? `${volcanoData.highest.cn || volcanoData.highest.name} · ${zhAviationCode(volcanoData.highest.colorCode).zh}`
                      : '—',
                    tone: volcanoData.highest ? zhAviationCode(volcanoData.highest.colorCode).color : undefined,
                  },
                  {
                    label: t('geo.volcano.statUpdated'),
                    value: volcanoData.latestUnix ? fmtBJT(volcanoData.latestUnix) : '—',
                    suffix: t('geo.volcano.suffixBJT'),
                  },
                ]}
              />
              <div className="geo-alert-stat">
                {volcanoData.byObs?.map((o) => (
                  <span key={o.abbr}>
                    {o.cn} <b>{o.count}</b> {t('geo.volcano.obsUnit')}
                  </span>
                ))}
              </div>
              <Table
                className="geo-env-table"
                size="small"
                rowKey={(r) => r.vnum || r.name}
                dataSource={volList}
                pagination={false}
                columns={[
                  {
                    title: t('geo.volcano.colName'),
                    dataIndex: 'name',
                    width: 170,
                    render: (v, r) => (
                      <div>
                        <b>{r.cn || v}</b>
                        {r.cn && <div className="geo-alert-sub">{v}</div>}
                      </div>
                    ),
                  },
                  { title: t('geo.volcano.colObs'), dataIndex: 'obsCn', width: 170 },
                  {
                    title: t('geo.volcano.colAviation'),
                    dataIndex: 'colorCode',
                    width: 100,
                    render: (v) => <ColorTag code={v} />,
                  },
                  {
                    title: t('geo.volcano.colGround'),
                    dataIndex: 'alertLevel',
                    width: 100,
                    render: (v) => <AlertTag level={v} />,
                  },
                  {
                    title: t('geo.volcano.colUpdated'),
                    dataIndex: 'sentUnix',
                    width: 150,
                    render: (v) => (v ? fmtBJT(v) : '—'),
                  },
                  {
                    title: t('geo.volcano.colBulletin'),
                    dataIndex: 'url',
                    render: (v) =>
                      v ? (
                        <a href={v} target="_blank" rel="noreferrer">
                          {t('geo.volcano.view')}
                        </a>
                      ) : (
                        '—'
                      ),
                  },
                ]}
              />
              <div className="geo-prose" style={{ marginTop: 12 }}>
                <p>{t('geo.volcano.prose')}</p>
              </div>
            </>
          ) : (
            <Empty description={t('geo.volcano.emptyVol')} />
          )
        ) : null}
      </Panel>

      <Panel
        title={t('geo.volcano.noaaTitle')}
        source={t('geo.volcano.noaaSource')}
        icon={<GlobalOutlined />}
        loading={tsunami.loading}
        error={tsunami.error}
      >
        {tsunamiData ? (
          <>
            <StatRow
              items={[
                { label: t('geo.volcano.statOnFile'), value: t('geo.volcano.unitNotice', { n: tsunamiData.count }) },
                {
                  label: t('geo.volcano.statThreat'),
                  value: t('geo.volcano.unitThreat', { n: threatCount }),
                  tone: threatCount > 0 ? '#dc2626' : '#0e9f6e',
                  suffix: t('geo.volcano.suffixAbove'),
                },
                {
                  label: t('geo.volcano.statCenter'),
                  value: `${tsunamiData.centers.filter((c) => c.ok).length}/${tsunamiData.centers.length}`,
                  suffix: t('geo.volcano.suffixOnline'),
                },
              ]}
            />
            {tsuEvents.length ? (
              <div className="geo-tsu-list">
                {tsuEvents.map((e) => (
                  <div className="geo-tsu-item" key={`${e.center}-${e.updated}-${e.region}`}>
                    <div className="geo-tsu-item__head">
                      <TsunamiTag category={e.category} />
                      <b className="geo-tsu-item__region">{e.region}</b>
                      <span className="geo-tsu-item__center">{e.centerCn}</span>
                    </div>
                    <div className="geo-tsu-item__meta">
                      {e.magnitude && <span>{t('geo.volcano.magLabel', { mag: e.magnitude })}</span>}
                      {e.depth && <span>{t('geo.volcano.depthLabel', { depth: e.depth })}</span>}
                      {e.lat != null && e.lon != null && (
                        <span>
                          {t('geo.volcano.epicenter', { lat: e.lat.toFixed(2), lon: e.lon.toFixed(2) })}
                        </span>
                      )}
                      {e.updatedUnix && <span>{t('geo.volcano.published', { time: fmtBJT(e.updatedUnix) })}</span>}
                      {e.bulletinUrl && (
                        <a href={e.bulletinUrl} target="_blank" rel="noreferrer">
                          {t('geo.volcano.bulletin')}
                        </a>
                      )}
                    </div>
                    {e.note && <div className="geo-tsu-item__note">{e.note}</div>}
                    {e.definition && (
                      <div className="geo-tsu-item__def">{t('geo.volcano.levelMeaning', { def: e.definition })}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty description={t('geo.volcano.emptyTsu')} />
            )}
          </>
        ) : null}
      </Panel>

      <Panel title={t('geo.volcano.whyTitle')} source={t('geo.volcano.whySource')} icon={<BookOutlined />}>
        <div className="geo-prose">
          <p>{t('geo.volcano.whyP1')}</p>
          <p>{t('geo.volcano.whyP2')}</p>
          <p>{t('geo.volcano.whyP3')}</p>
        </div>
        <div className="geo-alert-legend">
          {Object.entries(TSUNAMI_CATEGORIES).map(([k, v]) => (
            <span key={k}>
              <span className="geo-alert-legend__dot" style={{ background: v.color }} />
              {v.zh}
              <span className="geo-alert-legend__en">{k}</span>
            </span>
          ))}
          <span className="geo-alert-legend__sep" />
          {Object.entries(AVIATION_CODES).map(([k, v]) => (
            <span key={k}>
              <span className="geo-alert-legend__dot" style={{ background: v.color }} />
              {t('geo.volcano.legendAviation')} {v.zh}
            </span>
          ))}
          <span className="geo-alert-legend__sep" />
          {Object.entries(VOLCANO_ALERTS).map(([k, v]) => (
            <span key={k}>
              <span className="geo-alert-legend__dot" style={{ background: v.color }} />
              {t('geo.volcano.legendGround')} {v.zh}
            </span>
          ))}
        </div>
      </Panel>
    </div>
  )
}
