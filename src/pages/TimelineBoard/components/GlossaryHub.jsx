/**
 * GlossaryHub —— 时间版本（时空档案）页的「名词库」聚合模块。
 *
 * 把三块看板的名词解析集中到一处：
 *   - 深空：KPI_DEFS（空间天气 / 轨道 / 天体 / 太阳活动 / 观测条件）
 *   - 地球 + 海洋：EARTH_KPI_DEFS（两块看板共用同一份词典）
 *   - 全部数值分档 / 枚举速查表（震级 / 深度 / AQI / 海况 / 飓风 / 火山 / 海啸 / 潮位 / 振荡 …）
 *
 * 顶部一个模糊搜索框，跨所有名词卡与分档表过滤，方便用户核对口径。
 * 名词三段释义（是什么 / 怎么读 / 所以呢）复用通用 DictView，避免三份复制。
 */
import { useMemo, useState } from 'react'
import { Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import DictView from '@components/DictView/index.jsx'
import { useI18n, localize } from '@i18n/index.js'
import '@components/DictView/index.scss'
import {
  EARTH_KPI_DEFS,
  getEarthKpiGroups,
  MAGNITUDE_BANDS,
  DEPTH_ZONES,
  AQI_LEVELS,
  UV_LEVELS,
  WAVE_STATES,
  TIDE_DATUMS,
  OSCILLATIONS,
  SAFFIR_SIMPSON,
  VOLCANO_ALERTS,
  AVIATION_CODES,
  TSUNAMI_CATEGORIES,
} from '@lib/earth/glossary.js'
import { KPI_DEFS, getAstroKpiGroups } from '@lib/astro/glossary.js'

const norm = (s) => (s == null ? '' : String(s)).toLowerCase()

/**
 * 整本词典按语种解析一份：搜索命中判断与渲染都吃这一份。
 * 直接把原始表丢进 DOM 会渲染出 [object Object]（词条字段现在是 {lang:text}）。
 */
const localizeDict = (dict, lang) =>
  Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, localize(v, lang)]))

/** 速查表同理：转成 [key, 已解析条目] 数组 */
const localizeEntries = (dict, lang) => Object.entries(dict).map(([k, v]) => [k, localize(v, lang)])

function defHit(def, q, alias) {
  if (!q) return true
  return [def?.zh, alias, def?.unit, def?.what, def?.scale, def?.soWhat]
    .join(' ')
    .toLowerCase()
    .includes(q)
}

function entryHit(entry, q, extra) {
  if (!q) return true
  return [entry?.zh, entry?.desc, extra].join(' ').toLowerCase().includes(q)
}

/** 数值分档的区间文案：缺 min 退化成「≤ max」，末档（max=Infinity）退化成「> min」 */
function bandRange(b) {
  if (b.min == null || b.min === -Infinity) return `≤ ${b.max}`
  if (b.max === Infinity) return `> ${b.min}`
  return `${b.min} ~ ${b.max}`
}

/** 过滤某组词典：保留匹配搜索词的词条，空组直接丢弃 */
function filterGroups(groups, defs, q) {
  return groups
    .map((g) => ({ ...g, items: g.items.filter(([key, alias]) => defHit(defs[key], q, alias)) }))
    .filter((g) => g.items.length)
}

/** 一张速查表：数值分档或离散枚举，统一渲染 */
function NameList({ title, unit, entries, q, rangeFn }) {
  const items = entries.filter(([key, o]) => entryHit(o, q, key + ' ' + unit))
  if (!items.length) return null
  return (
    <div className="dv-band">
      <div className="dv-band__title">
        {title}
        {unit && <span className="dv-band__unit">{unit}</span>}
      </div>
      <ul>
        {items.map(([key, o]) => (
          <li key={key}>
            <span className="dv-band__dot" style={{ background: o.color || 'currentColor' }} />
            <span className="dv-band__zh" style={{ color: o.color || undefined }}>{o.zh}</span>
            <span className="dv-band__range">{rangeFn ? rangeFn(o) : key}</span>
            <span className="dv-band__desc">{o.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function GlossaryHub({ theme = 'dark' }) {
  const { t, lang } = useI18n()
  const [q, setQ] = useState('')
  const needle = norm(q)

  const astroDefs = useMemo(() => localizeDict(KPI_DEFS, lang), [lang])
  const earthDefs = useMemo(() => localizeDict(EARTH_KPI_DEFS, lang), [lang])

  const astroGroups = useMemo(
    () => filterGroups(getAstroKpiGroups(lang), astroDefs, needle),
    [lang, astroDefs, needle],
  )
  const earthGroups = useMemo(
    () => filterGroups(getEarthKpiGroups(lang), earthDefs, needle),
    [lang, earthDefs, needle],
  )

  const bandTables = useMemo(
    () => [
      { title: '震级分档', unit: 'M', entries: localizeEntries(MAGNITUDE_BANDS, lang), rangeFn: bandRange },
      { title: '震源深度分带', unit: 'km', entries: localizeEntries(DEPTH_ZONES, lang), rangeFn: bandRange },
      { title: '空气质量（欧标）', unit: 'AQI', entries: localizeEntries(AQI_LEVELS, lang), rangeFn: bandRange },
      { title: '紫外线指数', unit: 'UVI', entries: localizeEntries(UV_LEVELS, lang), rangeFn: bandRange },
      { title: '海况等级', unit: 'm（有效波高 Hs）', entries: localizeEntries(WAVE_STATES, lang), rangeFn: bandRange },
      {
        title: '萨菲尔–辛普森飓风等级',
        unit: 'kt / m/s',
        entries: localizeEntries(SAFFIR_SIMPSON, lang),
        rangeFn: (s) => `${s.kt} kt · ${s.ms} m/s`,
      },
      { title: '潮位基准面', unit: 'NOAA CO-OPS', entries: localizeEntries(TIDE_DATUMS, lang) },
      {
        title: '气候振荡模态',
        unit: '时间尺度',
        entries: localizeEntries(OSCILLATIONS, lang),
        rangeFn: (o) => o.period,
      },
      {
        title: '火山地面警报级',
        unit: 'rank',
        entries: localizeEntries(VOLCANO_ALERTS, lang),
        rangeFn: (v) => `rank ${v.rank}`,
      },
      { title: '火山航空色码', entries: localizeEntries(AVIATION_CODES, lang) },
      { title: '海啸公告等级', entries: localizeEntries(TSUNAMI_CATEGORIES, lang) },
    ],
    [lang],
  )

  const hitCount = useMemo(
    () =>
      astroGroups.reduce((n, g) => n + g.items.length, 0) +
      earthGroups.reduce((n, g) => n + g.items.length, 0) +
      bandTables.reduce(
        (n, t) => n + t.entries.filter(([k, o]) => entryHit(o, needle, k)).length,
        0,
      ),
    [astroGroups, earthGroups, bandTables, needle],
  )

  return (
    <section className="gh-root" data-gh-theme={theme}>
      <div className="gh-head">
        <h2 className="gh-title">
          📖 名词库
          <span className="gh-sub">深空 · 地球 · 海洋 全部释义统一检索</span>
        </h2>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder={t('timeline.glossarySearch')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="gh-search"
        />
        <p className="gh-intro">
          深空与地球 / 海洋两套词典、以及全部数值分档与枚举速查，集中在此。每条释义都回答三件事：
          <b>是什么</b>（量纲）、<b>怎么读</b>（阈值）、<b>所以呢</b>（意味着什么）。
          地球与海洋共用同一份词典，阈值与看板上的数字颜色<b>来自同一处定义</b>。
        </p>
        {q ? <div className="gh-count">命中 {hitCount} 条</div> : null}
      </div>

      <div className="gh-block">
        <h3 className="gh-block__h">🛰️ 深空</h3>
        <DictView theme={theme} groups={astroGroups} defs={astroDefs} />
      </div>

      <div className="gh-block">
        <h3 className="gh-block__h">🌍 地球 · 海洋（共用一套词典）</h3>
        <DictView theme={theme} groups={earthGroups} defs={earthDefs} />
      </div>

      <div className="gh-block">
        <h3 className="gh-block__h">📐 分档速查：数字的颜色是怎么定的</h3>
        <div className="dv-band-wrap">
          {bandTables.map((t) => (
            <NameList
              key={t.title}
              title={t.title}
              unit={t.unit}
              entries={t.entries}
              q={needle}
              rangeFn={t.rangeFn}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
