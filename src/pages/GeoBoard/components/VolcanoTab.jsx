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
  const info = zhAviationCode(code)
  return (
    <Tooltip title={info?.desc || '未收录的色码'}>
      <Tag color={info?.color} bordered={false}>
        {info?.zh || code || '—'}
      </Tag>
    </Tooltip>
  )
}

/** 地面警报级 Tag */
function AlertTag({ level }) {
  const info = zhVolcanoAlert(level)
  return (
    <Tooltip title={info?.desc || '未收录的警报级'}>
      <Tag color={info?.color} bordered={false}>
        {info?.zh || level || '—'}
      </Tag>
    </Tooltip>
  )
}

/** 海啸公告等级 Tag：等级的中译与颜色一律来自词典，服务端只给 Category 原文 */
function TsunamiTag({ category }) {
  const info = zhTsunamiCategory(category)
  return (
    <Tooltip title={info?.desc || '未收录的类别'}>
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
        title="USGS 火山警报"
        source="USGS HANS（火山灾害警报系统）"
        icon={<WarningOutlined />}
        loading={volcanoes.loading}
        error={volcanoes.error}
      >
        {volcanoData ? (
          volList.length ? (
            <>
              <StatRow
                items={[
                  { label: '高于正常', value: `${volcanoData.count} 座` },
                  {
                    label: '橙色及以上',
                    value: `${volcanoData.elevated} 座`,
                    tone: '#f97316',
                    suffix: '（真正“在动”的）',
                  },
                  {
                    label: '最高级别',
                    value: volcanoData.highest
                      ? `${volcanoData.highest.cn || volcanoData.highest.name} · ${zhAviationCode(volcanoData.highest.colorCode).zh}`
                      : '—',
                    tone: volcanoData.highest ? zhAviationCode(volcanoData.highest.colorCode).color : undefined,
                  },
                  {
                    label: '最近通报',
                    value: volcanoData.latestUnix ? fmtBJT(volcanoData.latestUnix) : '—',
                    suffix: '（北京时）',
                  },
                ]}
              />
              <div className="geo-alert-stat">
                {volcanoData.byObs?.map((o) => (
                  <span key={o.abbr}>
                    {o.cn} <b>{o.count}</b> 座
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
                    title: '火山',
                    dataIndex: 'name',
                    width: 170,
                    render: (v, r) => (
                      <div>
                        <b>{r.cn || v}</b>
                        {r.cn && <div className="geo-alert-sub">{v}</div>}
                      </div>
                    ),
                  },
                  { title: '观测台', dataIndex: 'obsCn', width: 170 },
                  {
                    title: '航空色码',
                    dataIndex: 'colorCode',
                    width: 100,
                    render: (v) => <ColorTag code={v} />,
                  },
                  {
                    title: '地面警报',
                    dataIndex: 'alertLevel',
                    width: 100,
                    render: (v) => <AlertTag level={v} />,
                  },
                  {
                    title: '最近通报',
                    dataIndex: 'sentUnix',
                    width: 150,
                    render: (v) => (v ? fmtBJT(v) : '—'),
                  },
                  {
                    title: '通报原文',
                    dataIndex: 'url',
                    render: (v) =>
                      v ? (
                        <a href={v} target="_blank" rel="noreferrer">
                          查看
                        </a>
                      ) : (
                        '—'
                      ),
                  },
                ]}
              />
              <div className="geo-prose" style={{ marginTop: 12 }}>
                <p>
                  <b>色码与警报级不是一回事</b>：色码只关心火山灰会不会打到飞机，
                  警报级关心地面居民会不会遇到熔岩流与碎屑流。一次安静的溢流式喷发可以是「地面警告 + 绿色码」，
                  反过来灰柱不高但持续的爆发也可能是「橙色码 + 地面警戒」。
                </p>
              </div>
            </>
          ) : (
            <Empty description="USGS 三大观测台当前无火山处于「正常」以上——这是好事" />
          )
        ) : null}
      </Panel>

      <Panel
        title="NOAA 海啸预警公告"
        source="NOAA tsunami.gov（太平洋中心 PHEB + 国家中心 PAAQ）"
        icon={<GlobalOutlined />}
        loading={tsunami.loading}
        error={tsunami.error}
      >
        {tsunamiData ? (
          <>
            <StatRow
              items={[
                { label: '在册公告', value: `${tsunamiData.count} 条` },
                {
                  label: '构成威胁',
                  value: `${threatCount} 条`,
                  tone: threatCount > 0 ? '#dc2626' : '#0e9f6e',
                  suffix: '（注意及以上）',
                },
                {
                  label: '预警中心',
                  value: `${tsunamiData.centers.filter((c) => c.ok).length}/${tsunamiData.centers.length}`,
                  suffix: '在线',
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
                      {e.magnitude && <span>震级 {e.magnitude}</span>}
                      {e.depth && <span>深度 {e.depth}</span>}
                      {e.lat != null && e.lon != null && (
                        <span>
                          震中 {e.lat.toFixed(2)}°, {e.lon.toFixed(2)}°
                        </span>
                      )}
                      {e.updatedUnix && <span>发布 {fmtBJT(e.updatedUnix)}</span>}
                      {e.bulletinUrl && (
                        <a href={e.bulletinUrl} target="_blank" rel="noreferrer">
                          公报原文
                        </a>
                      )}
                    </div>
                    {e.note && <div className="geo-tsu-item__note">{e.note}</div>}
                    {e.definition && (
                      <div className="geo-tsu-item__def">等级含义：{e.definition}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="两个预警中心当前均无有效公告" />
            )}
          </>
        ) : null}
      </Panel>

      <Panel title="为什么绝大多数公告都是「信息声明」" source="科普：预警是怎么工作的" icon={<BookOutlined />}>
        <div className="geo-prose">
          <p>
            海啸由<b>海底垂直错动</b>引发——走滑型地震（断层水平错开）几乎不推水，
            因此一次 M7.5 的走滑地震可以是零海啸风险，而一次 M7.0 的逆冲型地震却能掀起数米水墙。
            预警中心必须在震后几分钟内判断断层类型、震源深度与海底位移量，这个结论就是公告等级。
          </p>
          <p>
            所以「信息声明」不是敷衍，而是<b>把虚惊提前消解掉</b>：它明确说「地震发生了，但不会推起海啸」。
            真正升级到「警报」的，一年全球只有个位数。
          </p>
          <p>
            另一个反直觉的点：深海海啸波长可达上百公里、波高却只有几十厘米，
            船上的人常常毫无察觉。它以 <b>√(g·h)</b> 的速度传播——4000 m 水深约 700–800 km/h，
            接近喷气客机巡航速度；进入浅水后骤降到几十 km/h，能量被迫向上挤压，
            才变成岸边的那道水墙。<b>看到海水异常退去，就是它到达前几分钟的信号。</b>
          </p>
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
              航空 {v.zh}
            </span>
          ))}
          <span className="geo-alert-legend__sep" />
          {Object.entries(VOLCANO_ALERTS).map(([k, v]) => (
            <span key={k}>
              <span className="geo-alert-legend__dot" style={{ background: v.color }} />
              地面 {v.zh}
            </span>
          ))}
        </div>
      </Panel>
    </div>
  )
}
