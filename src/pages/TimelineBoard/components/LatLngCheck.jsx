/**
 * LatLngCheck —— 时空档案（/timeline）的「经纬度检查」模块。
 *
 * 三块能力：
 *   1) 城市 → 经纬度：输入任意真实城市名（中文/英文/拼音，可带「, 国家」限定），
 *      从离线城市词典（scripts/build-city-gazetteer.mjs 产物，6.3 万城）里出坐标。
 *   2) 参考表：全球知名国家 / 地区的代表城市（首都 / 首府）经纬度速查，可搜索、可点行回填。
 *   3) 反查：输入经纬度 → 先用边界框判定归属国家，未命中则退化为最近代表城市并标注里程。
 *
 * 数据分层：国家表与反查是纯函数（@lib/geo/latLng.js），城市词典是静态产物
 * （@lib/geo/cityGazetteer.js + useCityGazetteer），本组件只做交互与渲染。
 *
 * 城市词典 3MB，**不在挂载时就拉**：CityResults 子组件在用户第一次聚焦/输入后才挂载，
 * hook 的惰性首帧则负责「切回来不重复请求」（同 useStarCatalog 的做法）。
 */
import { useDeferredValue, useMemo, useState } from 'react'
import { Alert, Button, Card, Empty, Input, Spin, Table, Tag, Tooltip, Typography } from 'antd'
import { CompassOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons'
import { useI18n, pickText } from '@i18n/index.js'
import { Animate } from '@/motion/index.jsx'
import { COUNTRIES, searchCountries, locate, validateCoord } from '@lib/geo/latLng.js'
import { searchCities, cityDisplayName, countryLabel, formatPopulation, flagEmoji } from '@lib/geo/cityGazetteer.js'
import { useCityGazetteer } from '@lib/geo/useCityGazetteer.js'
import './LatLngCheck.scss'

/** 纬度 → '39.9042°N' */
const fmtLat = (v) => `${Math.abs(v).toFixed(4)}°${v >= 0 ? 'N' : 'S'}`
/** 经度 → '116.4074°E' */
const fmtLng = (v) => `${Math.abs(v).toFixed(4)}°${v >= 0 ? 'E' : 'W'}`

/** 几个一键示例（从数据里取，名字随语种走） */
const SAMPLE_CODES = ['CN', 'JP', 'US']

/** 城市候选条数：再多也只是同名城市刷屏，8 条足够挑 */
const CITY_LIMIT = 8

/**
 * 城市检索结果区（按需挂载：只有用户真的用了城市查询才拉词典）。
 *
 * 输入用 useDeferredValue 让开：6.3 万条全表扫一次 ≈10ms，
 * 但不防抖的话每个按键都跑一遍，中文输入法连打时会有明显卡顿感。
 */
function CityResults({ query, onPick, onFill, lang, t }) {
  const { table, error, loading } = useCityGazetteer()
  const deferred = useDeferredValue(query)
  const hits = useMemo(
    () => (table ? searchCities(table.cities, deferred, { limit: CITY_LIMIT, countries: table.countries }) : []),
    [table, deferred],
  )
  const stale = deferred !== query

  if (loading) {
    return (
      <div className="ll-city__state">
        <Spin size="small" />
        <span>{t('timeline.llCityLoading')}</span>
      </div>
    )
  }
  if (error) {
    return <Alert type="error" showIcon message={t('timeline.llCityError', { msg: error })} />
  }
  if (!hits.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('timeline.llCityEmpty', { q: deferred })}
        style={{ margin: '18px 0' }}
      />
    )
  }

  return (
    <>
      {/* 重键时旧结果淡出而不是闪没，避免每敲一个字列表整个抖一下 */}
      <ul className={`m-stagger ll-city${stale ? ' is-stale' : ''}`}>
        {hits.map((h, i) => {
          const name = cityDisplayName(h.city, lang)
          const where = `${flagEmoji(h.city.cc)} ${countryLabel(table.countries, h.city.cc, lang)}`
          return (
            <li key={`${h.city.name}-${h.city.lat}-${h.city.lng}`} className="m-stagger-item ll-city__row" style={{ '--i': i }}>
              <button type="button" className="ll-city__main" onClick={() => onPick(h.city, where)}>
                <span className="ll-city__name">{name}</span>
                {name !== h.city.name ? <span className="ll-city__orig">{h.city.name}</span> : null}
                <span className="ll-city__where">{where}</span>
              </button>
              <span className="ll-city__coord">
                {fmtLat(h.city.lat)} {fmtLng(h.city.lng)}
              </span>
              <Button size="small" type="text" onClick={() => onFill(h.city)}>
                {t('timeline.llCityFill')}
              </Button>
            </li>
          )
        })}
      </ul>
      <p className="ll-hint">{t('timeline.llCityCount', { count: table.cities.length })}</p>
    </>
  )
}

export default function LatLngCheck({ theme = 'dark' }) {
  const { t, lang } = useI18n()
  const [query, setQuery] = useState('')
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  const [result, setResult] = useState(null)
  /** 结构化错误：field 决定哪个输入框标红（null=整体提示），msg 给用户看 */
  const [err, setErr] = useState(null)
  /** 城市输入框文本 */
  const [cityQuery, setCityQuery] = useState('')
  /** 词典按需挂载开关 */
  const [cityActive, setCityActive] = useState(false)
  /** 选中的城市（坐标输出主体） */
  const [picked, setPicked] = useState(null)
  /** 选中城市所属国家（含国旗）—— 国名表只在词典子组件里，所以点选时一起接上来 */
  const [pickedWhere, setPickedWhere] = useState('')

  const rows = useMemo(() => searchCountries(query), [query])

  const samples = useMemo(
    () => SAMPLE_CODES.map((code) => COUNTRIES.find((c) => c.code === code)).filter(Boolean),
    [],
  )

  /**
   * 填入坐标。autoLookup=true（点参考行 / 点样例 / 点城市）时顺手把反查结果出了：
   * 少一次点击，反馈即点即得；手动输入场景仍走「反查」按钮，不打断编辑。
   */
  const fill = (lat, lng, autoLookup = false) => {
    setLatInput(String(lat))
    setLngInput(String(lng))
    setErr(null)
    setResult(autoLookup ? locate(lat, lng) : null)
  }

  const doLookup = () => {
    const v = validateCoord(latInput, lngInput)
    if (!v.ok) {
      setResult(null)
      const msg =
        v.error === 'latRange'
          ? t('timeline.llLatErr')
          : v.error === 'lngRange'
            ? t('timeline.llLngErr')
            : t('timeline.llResultInvalid')
      setErr({ field: v.error === 'latRange' ? 'lat' : v.error === 'lngRange' ? 'lng' : null, msg })
      return
    }
    setErr(null)
    setResult(locate(v.lat, v.lng))
  }

  const clearAll = () => {
    setLatInput('')
    setLngInput('')
    setResult(null)
    setErr(null)
  }

  const activateCity = () => setCityActive(true)

  const pickCity = (city, where) => {
    setPicked(city)
    setPickedWhere(where || '')
    fill(city.lat, city.lng, true)
  }

  const columns = [
    {
      title: t('timeline.llColCountry'),
      dataIndex: 'code',
      width: 150,
      render: (_, r) => <b>{pickText(r.name, lang)}</b>,
    },
    {
      title: t('timeline.llColCapital'),
      dataIndex: 'code',
      width: 150,
      render: (_, r) => pickText(r.capital, lang),
    },
    {
      title: t('timeline.llColLat'),
      dataIndex: 'lat',
      width: 120,
      align: 'right',
      render: (v) => fmtLat(v),
    },
    {
      title: t('timeline.llColLng'),
      dataIndex: 'lng',
      width: 120,
      align: 'right',
      render: (v) => fmtLng(v),
    },
  ]

  const resultText = (r) => {
    if (!r || !r.found) return ''
    const country = pickText(r.country.name, lang)
    const capital = pickText(r.country.capital, lang)
    const dist = Math.round(r.distKm)
    return r.mode === 'inside'
      ? t('timeline.llResultInside', { country, capital, dist })
      : t('timeline.llResultNearest', { country, capital, dist })
  }

  const pickedName = picked ? cityDisplayName(picked, lang) : ''

  return (
    <section className="ll-root" data-ll-theme={theme}>
      <div className="ll-hero">
        <Animate name="fadeInLeft" speed="fast" as="div" className="ll-hero__mark">
          📍
        </Animate>
        <div className="ll-hero__text">
          <h2 className="ll-title m-shine-text">{t('timeline.llTitle')}</h2>
          <p className="ll-sub">{t('timeline.llSubtitle')}</p>
        </div>
      </div>

      <div className="ll-grid">
        <div className="ll-col">
          {/* 城市 → 经纬度 */}
          <Animate name="fadeInUp" speed="fast" as={Card} size="small" className="ll-card">
            <div className="ll-card__h">
              🏙️ {t('timeline.llCityTitle')}
              {cityActive ? null : <Tag bordered={false} className="ll-badge">{t('timeline.llCityOnDemand')}</Tag>}
            </div>
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              placeholder={t('timeline.llCitySearch')}
              value={cityQuery}
              onFocus={activateCity}
              onChange={(e) => {
                setCityQuery(e.target.value)
                activateCity()
              }}
              className="ll-search"
            />
            <p className="ll-hint">{t('timeline.llCityHint')}</p>

            {cityActive ? (
              <CityResults query={cityQuery} onPick={pickCity} onFill={(c) => fill(c.lat, c.lng, true)} lang={lang} t={t} />
            ) : null}

            {picked ? (
              <Animate name="zoomIn" speed="fast" as="div" className="ll-city__out" key={`${picked.name}-${picked.lat}`}>
                <div className="ll-city__out-name">
                  <EnvironmentOutlined /> {pickedName}
                  <span className="ll-city__out-where">{pickedWhere}</span>
                </div>
                <Typography.Text className="ll-city__out-coord" copyable={{ text: `${picked.lat}, ${picked.lng}` }}>
                  {fmtLat(picked.lat)} · {fmtLng(picked.lng)}
                </Typography.Text>
                <div className="ll-city__out-meta">
                  <span>{t('timeline.llColLat')} {picked.lat.toFixed(4)}</span>
                  <span>{t('timeline.llColLng')} {picked.lng.toFixed(4)}</span>
                  {picked.pop ? <span>{t('timeline.llCityPop')} {formatPopulation(picked.pop, lang)}</span> : null}
                </div>
                <p className="ll-hint">{t('timeline.llCityFilled')}</p>
              </Animate>
            ) : null}
          </Animate>

          {/* 参考表 */}
          <Animate name="fadeInUp" speed="fast" delay={0.08} as={Card} size="small" className="ll-card">
            <div className="ll-card__h">
              🌐 {t('timeline.llRefTitle')}
              <Tag bordered={false} style={{ marginLeft: 8 }}>{rows.length}</Tag>
            </div>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t('timeline.llSearch')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ll-search"
            />
            <p className="ll-hint">{t('timeline.llRefHint')}</p>
            <Table
              size="small"
              rowKey="code"
              columns={columns}
              dataSource={rows}
              pagination={rows.length > 12 ? { pageSize: 12, size: 'small' } : false}
              scroll={{ y: 360 }}
              onRow={(r) => ({
                onClick: () => fill(r.lat, r.lng, true),
                tabIndex: 0,
                onKeyDown: (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    fill(r.lat, r.lng, true)
                  }
                },
                className: 'll-row',
                style: { cursor: 'pointer' },
              })}
            />
          </Animate>
        </div>

        <div className="ll-col">
          {/* 反查 */}
          <Animate name="fadeInUp" speed="fast" delay={0.04} as={Card} size="small" className="ll-card">
            <div className="ll-card__h">🧭 {t('timeline.llLookupTitle')}</div>
            <div className="ll-inputs">
              <Input
                addonBefore={t('timeline.llLatLabel')}
                placeholder={t('timeline.llLatPlaceholder')}
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                onPressEnter={doLookup}
                status={err && err.field !== 'lng' ? 'error' : undefined}
              />
              <Input
                addonBefore={t('timeline.llLngLabel')}
                placeholder={t('timeline.llLngPlaceholder')}
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                onPressEnter={doLookup}
                status={err && err.field === 'lng' ? 'error' : undefined}
              />
            </div>
            <div className="ll-actions">
              <Button type="primary" icon={<CompassOutlined />} onClick={doLookup}>
                {t('timeline.llBtnLookup')}
              </Button>
              <Button onClick={clearAll}>{t('timeline.llBtnClear')}</Button>
            </div>

            <div className="ll-samples">
              {samples.map((c, i) => (
                <Tooltip key={c.code} title={`${c.lat}, ${c.lng}`}>
                  <Tag className="ll-sample m-fade-up" style={{ animationDelay: `${0.12 + i * 0.06}s` }} onClick={() => fill(c.lat, c.lng, true)}>
                    {pickText(c.name, lang)}
                  </Tag>
                </Tooltip>
              ))}
            </div>

            {err ? <Alert type="error" showIcon style={{ marginTop: 12 }} message={err.msg} /> : null}

            {result && result.found ? (
              <Animate name="fadeInUp" speed="fast" as="div" key={`${result.lat}-${result.lng}`}>
                <Alert
                  type={result.mode === 'inside' ? 'success' : 'warning'}
                  showIcon
                  style={{ marginTop: 12 }}
                  message={
                    <span>
                      <EnvironmentOutlined /> {resultText(result)}
                    </span>
                  }
                  description={
                    <Typography.Text className="ll-result__coord" copyable={{ text: `${result.lat}, ${result.lng}` }}>
                      {fmtLat(result.lat)} · {fmtLng(result.lng)}
                    </Typography.Text>
                  }
                />
              </Animate>
            ) : null}
          </Animate>

          <Animate name="fadeInUp" speed="fast" delay={0.12} as={Card} size="small" className="ll-card ll-tip">
            <div className="ll-card__h">💡 {t('timeline.llTipTitle')}</div>
            <p className="ll-tip__text">{t('timeline.llTip')}</p>
          </Animate>
        </div>
      </div>
    </section>
  )
}
