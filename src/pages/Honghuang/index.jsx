import { Link } from 'react-router-dom'
import HonghuangArray from '@components/Honghuang/HonghuangArray.jsx'
import JiugongArray from '@components/Honghuang/JiugongArray.jsx'
import { MANSIONS, QUADRANTS, TOTAL_DU } from '@components/Honghuang/xingdou-data.js'
import { SKY_GATE, ZUWU_LIST } from '@components/Honghuang/zuwu-data.js'
import { BEASTS, BEAST_ORIGIN_COUNT, PROVENANCE, RANK_LABEL } from '@components/Honghuang/beasts-data.js'
import { Page, Section } from '@components/PageShell/index.jsx'
import BackButton from '@components/BackButton/index.jsx'
import { NewMark } from '@components/Changelog/NewMark.jsx'
import { useI18n } from '@i18n/index.js'
import './index.scss'

const QUAD_KEYS = ['东', '北', '西', '南']
const RANK_COUNT = BEASTS.reduce((acc, b) => {
  acc[b.rank] = (acc[b.rank] || 0) + 1
  return acc
}, {})

/* 洪荒三阵：星名 / 宿度 / 祖巫 / 妖兽 / 九宫卦位全部是古籍引文与考据文本，属数据不属文案，
   整页保持中文（与 StarArray 同一处理）；页面标题复用侧边栏 nav.honghuang。 */
function Honghuang() {
  const { t } = useI18n()

  return (
    <Page
      className="honghuang"
      eyebrow="洪荒 · 汉制宿度"
      title={t('nav.honghuang')}
      subtitle="周天星斗阵内盘三百六十五星按《汉书·律历志》二十八宿宿度布算，盘古阵外盘十二宫按地支排十一位祖巫、戌位虚置天门；第三阵九宫八卦另立一盘 —— 洛书数为骨、横竖斜八线各十五。点星看配兽，点祖巫看本宫星区，点九宫格看它的卦门风节。"
      accent="accent"
      shine
      gap="xl"
      actions={<><NewMark route="/honghuang" /><BackButton /></>}
    >
      <div className="page-card hh-board">
        <HonghuangArray />
      </div>

      <Section
        className="page-card hh-mansions"
        title="骨架：二十八宿宿度"
        desc={`四方宿度相加恰为 ${TOTAL_DU} 度（东方另有一又四分之一度奇零，故周天 365.25）。盘上每宿占的弧长与宿度成正比 —— 井宿三十三度铺得开，觜宿两度只占窄窄一条。`}
      >
        <div className="hh-quad-grid">
          {QUAD_KEYS.map((q) => (
            <div key={q} className="hh-quad" style={{ '--q-c': QUADRANTS[q].color }}>
              <div className="hh-quad__head">
                <b>{QUADRANTS[q].name}</b>
                <span>{QUADRANTS[q].sum} 度</span>
              </div>
              <ul className="hh-quad__list">
                {MANSIONS.filter((m) => m.quadrant === q).map((m) => (
                  <li key={m.name} className="hh-quad__item" title={m.note}>
                    <span className="hh-quad__name">{m.name}</span>
                    <span className="hh-quad__bird">{m.bird}</span>
                    <span className="hh-quad__du">{m.du}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section
        className="page-card hh-zuwu"
        title="外盘：十二祖巫盘位"
        desc="司职、形象、阵法功用皆出自洪荒流小说（《佛本是道》以来的约定俗成）；「原文」与「原典实际」两栏是先秦两汉可核的内容 —— 多数与小说设定并不一致。"
      >
        <div className="hh-zuwu-grid">
          {ZUWU_LIST.map((z) => (
            <article key={z.id} className="hh-zuwu" style={{ '--z-c': z.color }}>
              <header>
                <span className="hh-zuwu__branch">{z.branch}</span>
                <h3>{z.name}</h3>
                <span className="hh-zuwu__office">{z.office}</span>
              </header>
              <blockquote>{z.quote}</blockquote>
              <p className="hh-zuwu__src">{z.origin}</p>
              {z.reality && <p className="hh-zuwu__real">{z.reality}</p>}
            </article>
          ))}
          <article className="hh-zuwu hh-zuwu--gate">
            <header>
              <span className="hh-zuwu__branch">{SKY_GATE.branch}</span>
              <h3>{SKY_GATE.name}</h3>
              <span className="hh-zuwu__office">{SKY_GATE.title}</span>
            </header>
            <blockquote>{SKY_GATE.quote}</blockquote>
            <p className="hh-zuwu__src">{SKY_GATE.origin}</p>
            <p className="hh-zuwu__real">{SKY_GATE.blurb}</p>
          </article>
        </div>
      </Section>

      <Section
        className="page-card hh-sources"
        title="三百六十五条从哪里来"
        desc="《山海经》本文可核的异兽、山川神与海内海外科目共 323 条；余下 42 条不用编造填补，而用后世典籍名号与星官实名补齐，并永久标注来源档位。"
      >
        <ul className="hh-sources__list">
          {Object.entries(PROVENANCE).map(([key, p]) => (
            <li key={key} className={`hh-sources__row hh-sources__row-${key}`}>
              <b>{p.label}</b>
              <span className="hh-sources__num">{BEAST_ORIGIN_COUNT[key]}</span>
              <span className="hh-sources__hint">{p.hint}</span>
            </li>
          ))}
        </ul>
        <div className="hh-sources__ranks">
          {Object.entries(RANK_LABEL).map(([k, label]) => (
            <span key={k} className="hh-sources__rank">
              {label} <b>{RANK_COUNT[k] || 0}</b>
            </span>
          ))}
        </div>
        <p className="hh-sources__caveat">
          两条必须说清的演绎：<b>其一</b>，「三百六十五周天星为阵基、太阳太阴为二主星、河图洛书镇眼」是小说设定，
          古籍里的「周天」是历法度数而非阵法；<b>其二</b>，星与兽的一对一配位由本项目按宿序编排 ——
          《山海经》全书没有 365 这个数字（「三百六十五」0 见），也没有星辰体系（「星辰」仅 2 见）。
        </p>
        <p className="hh-sources__cta">
          想看现代天文学意义上的真实恒星？
          <Link to="/stars">周天星辰（真实星表）</Link>
        </p>
      </Section>

      <Section className="page-card jg-board">
        <JiugongArray />
      </Section>
    </Page>
  )
}

export default Honghuang
