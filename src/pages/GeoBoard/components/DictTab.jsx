/**
 * GeoBoard 的「📖 名词解释」页签：复用通用 DictView + 地球/海洋共用词典。
 * 额外挂一张「分类速查」表（震级 / 震源深度 / 海况 / AQI），
 * 因为这些分档的阈值直接决定页面上数字的颜色，值得单独列出来对照。
 */
import { BookOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import DictView from '../../../components/DictView/index.jsx'
import '../../../components/DictView/index.scss'
import {
  EARTH_KPI_DEFS,
  EARTH_KPI_GROUPS,
  MAGNITUDE_BANDS,
  DEPTH_ZONES,
  AQI_LEVELS,
  VOLCANO_ALERTS,
  AVIATION_CODES,
  TSUNAMI_CATEGORIES,
} from '../../../lib/earth/glossary.js'
import { Panel } from './ui.jsx'

/**
 * 一张「枚举 → 等级」速查表。
 * 与 BandTable 的区别：这些等级不是数值分档（没有 min/max 区间），
 * 而是官方业务判定的离散类别，因此第三列显示英文 key 而非区间。
 */
function EnumTable({ title, dict }) {
  return (
    <div className="dv-band">
      <div className="dv-band__title">{title}</div>
      <ul>
        {Object.entries(dict).map(([key, b]) => (
          <li key={key}>
            <span className="dv-band__dot" style={{ background: b.color }} />
            <span className="dv-band__zh" style={{ color: b.color }}>
              {b.zh}
            </span>
            <span className="dv-band__range">{key}</span>
            <span className="dv-band__desc">{b.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 一张「数值 → 分档」速查表 */
function BandTable({ title, bands, unit, extraKey, extraLabel }) {
  return (
    <div className="dv-band">
      <div className="dv-band__title">
        {title}
        {unit && <span className="dv-band__unit">{unit}</span>}
      </div>
      <ul>
        {Object.entries(bands).map(([key, b]) => (
          <li key={key}>
            <span className="dv-band__dot" style={{ background: b.color }} />
            <span className="dv-band__zh" style={{ color: b.color }}>{b.zh}</span>
            {/* 只有 min/max 都有意义时才显示区间：缺 min 就退化成「≤ max」，
                否则末档（max=Infinity）会渲染出「> undefined」 */}
            <span className="dv-band__range">
              {b.min == null || b.min === -Infinity
                ? `≤ ${b.max}`
                : b.max === Infinity
                  ? `> ${b.min}`
                  : `${b.min} ~ ${b.max}`}
            </span>
            {extraKey && <span className="dv-band__extra">{b[extraKey]}</span>}
            <span className="dv-band__desc">{b.desc}</span>
          </li>
        ))}
      </ul>
      {extraLabel && <div className="dv-band__foot">{extraLabel}</div>}
    </div>
  )
}

export default function DictTab({ theme }) {
  return (
    <div className="geo-tab-content">
      <Panel
        title="指标与术语词典"
        source="NOAA / NASA / NSIDC / USGS / WMO 公开定义整理"
        icon={<BookOutlined />}
      >
        <DictView
          theme={theme}
          groups={EARTH_KPI_GROUPS}
          defs={EARTH_KPI_DEFS}
          intro={
            <>
              本页所有数字都对应一个标准定义。下列释义说明三件事：<b>它是什么</b>（量纲与测量方式）、
              <b>怎么读</b>（阈值分级）、<b>所以呢</b>（它变化意味着什么风险或机会）。
              地球与海洋共用一套词典，阈值与页面上数字的颜色<b>来自同一份定义</b>。
            </>
          }
        />
      </Panel>

      <Panel
        title="分档速查：数字的颜色是怎么定的"
        source="与页面渲染共用 src/lib/earth/glossary.js"
        icon={<ThunderboltOutlined />}
      >
        <div className="dv-band-wrap">
          <BandTable title="震级分档" unit="M" bands={MAGNITUDE_BANDS} />
          <BandTable title="震源深度分带" unit="km" bands={DEPTH_ZONES} />
          <BandTable title="空气质量（欧标）" unit="AQI" bands={AQI_LEVELS} />
          <EnumTable title="火山地面警报级" dict={VOLCANO_ALERTS} />
          <EnumTable title="火山航空色码" dict={AVIATION_CODES} />
          <EnumTable title="海啸公告等级" dict={TSUNAMI_CATEGORIES} />
        </div>
        <div className="geo-prose" style={{ marginTop: 12 }}>
          <p>
            这些分档不是硬性法规，而是<b>约定俗成的业务口径</b>：震级分档沿用中国地震台网习惯用语，
            AQI 用欧洲标准（与我国国标阈值不同），深度分带是 USGS 惯例。
            跨口径比对数值会失真——看分级前先确认它是哪一家的定义。
          </p>
          <p>
            火山那三栏里，<b>地面警报级与航空色码是两套并行体系</b>：前者面向居民，后者只关心火山灰对飞机的威胁。
            它们日常经常不同步，查看火山状态时两套都要看。
          </p>
        </div>
      </Panel>

      <Panel title="数据口径的几条免责说明" source="科普与展示用途" icon={<Tag />}>
        <div className="geo-prose">
          <p>
            温室气体与温度距平是<b>月更数据</b>，页面 12 小时轮询一次只是为了及时拿到新月份；
            海冰为年度极值月序列；地震是自动测定初值，以中国地震台网或 USGS 人工修订为准；
            城市环境为模式插值结果，不代表监测站实测。
          </p>
        </div>
      </Panel>
    </div>
  )
}
