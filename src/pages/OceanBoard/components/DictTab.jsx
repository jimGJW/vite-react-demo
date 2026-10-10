/**
 * OceanBoard 的「📖 名词解释」页签。
 *
 * 与 /geo 共用同一份词典（src/lib/earth/glossary.js），但只挑海洋相关的分组展示，
 * 另外挂三张海洋专属速查表：飓风等级、海况等级、潮位基准面 / 气候振荡。
 */
import { BookOutlined, TagOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import DictView from '../../../components/DictView/index.jsx'
import '../../../components/DictView/index.scss'
import {
  EARTH_KPI_DEFS,
  EARTH_KPI_GROUPS,
  SAFFIR_SIMPSON,
  WAVE_STATES,
  TIDE_DATUMS,
  OSCILLATIONS,
} from '../../../lib/earth/glossary.js'
import { Panel } from './ui.jsx'

/** 只保留海洋相关的分组（与 /geo 共用词典，那里展示全部） */
const OCEAN_TITLES = ['海浪', '潮汐', '海温与气候振荡', '热带气旋', '冰冻圈']
const OCEAN_GROUPS = EARTH_KPI_GROUPS.filter((g) => OCEAN_TITLES.includes(g.title))

/** 飓风等级速查（无数值区间，按 level 码展示） */
function SaffirTable() {
  return (
    <div className="dv-band">
      <div className="dv-band__title">
        萨菲尔–辛普森飓风等级
        <span className="dv-band__unit">kt / m/s（1 分钟持续风速）</span>
      </div>
      <ul>
        {Object.entries(SAFFIR_SIMPSON).map(([key, s]) => (
          <li key={key}>
            <span className="dv-band__dot" style={{ background: s.color }} />
            <span className="dv-band__zh" style={{ color: s.color }}>{s.zh}</span>
            <span className="dv-band__range">{s.kt} kt · {s.ms} m/s</span>
            <span className="dv-band__desc">{s.desc}</span>
          </li>
        ))}
      </ul>
      <div className="dv-band__foot">
        达到热带风暴（34 kt）才正式命名；三级以上称「强飓风」。等级只看风速，不看风暴潮与降雨。
      </div>
    </div>
  )
}

function WaveTable() {
  return (
    <div className="dv-band">
      <div className="dv-band__title">
        海况等级
        <span className="dv-band__unit">m（有效波高 Hs）</span>
      </div>
      <ul>
        {Object.entries(WAVE_STATES).map(([key, s]) => (
          <li key={key}>
            <span className="dv-band__dot" style={{ background: s.color }} />
            <span className="dv-band__zh" style={{ color: s.color }}>{s.zh}</span>
            <span className="dv-band__range">
              {s.min === -Infinity ? `≤ ${s.max}` : s.max === Infinity ? `> ${s.min}` : `${s.min} ~ ${s.max}`}
            </span>
            <span className="dv-band__desc">{s.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DatumTable() {
  return (
    <div className="dv-band">
      <div className="dv-band__title">
        潮位基准面
        <span className="dv-band__unit">NOAA CO-OPS datum</span>
      </div>
      <ul>
        {Object.entries(TIDE_DATUMS).map(([key, d]) => (
          <li key={key}>
            <span className="dv-band__zh">{key}</span>
            <span className="dv-band__range">{d.zh}</span>
            <span className="dv-band__desc">{d.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function OscTable() {
  return (
    <div className="dv-band">
      <div className="dv-band__title">
        气候振荡模态
        <span className="dv-band__unit">时间尺度与影响区域</span>
      </div>
      <ul>
        {Object.entries(OSCILLATIONS).map(([key, o]) => (
          <li key={key}>
            <span className="dv-band__zh">{key.toUpperCase()}</span>
            <span className="dv-band__range">{o.period}</span>
            <span className="dv-band__desc">{o.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function DictTab({ theme }) {
  return (
    <div className="o-tab-content">
      <Panel
        title="海洋指标与术语词典"
        source="NOAA / NASA / NHC / WMO 公开定义整理"
        icon={<BookOutlined />}
      >
        <DictView
          theme={theme}
          groups={OCEAN_GROUPS}
          defs={EARTH_KPI_DEFS}
          intro={
            <>
              本页所有数字都对应一个标准定义。下列释义说明三件事：<b>它是什么</b>（量纲与测量方式）、
              <b>怎么读</b>（阈值分级）、<b>所以呢</b>（它变化意味着什么风险或机会）。
              海洋与地球看板共用一份词典，阈值与页面上数字的颜色<b>来自同一份定义</b>。
            </>
          }
        />
      </Panel>

      <Panel
        title="分档速查：等级是怎么划出来的"
        source="与页面渲染共用 src/lib/earth/glossary.js"
        icon={<TagOutlined />}
      >
        <div className="dv-band-wrap">
          <SaffirTable />
          <WaveTable />
          <DatumTable />
          <OscTable />
        </div>
      </Panel>

      <Panel title="数据口径的几条免责说明" source="科普与展示用途" icon={<Tag />}>
        <div className="o-prose">
          <p>
            海况是<b>网格模式预报</b>而非站点实测，近海点已足够代表该海域，但单点误差可达数十厘米；
            潮汐时间为<b>站点当地时间</b>；ONI / PDO / AMO 分级依据 NOAA 官方阈值与官方序列；
            活跃气旋仅覆盖 NHC 责任区（北大西洋与东北太平洋）。
          </p>
        </div>
      </Panel>
    </div>
  )
}
