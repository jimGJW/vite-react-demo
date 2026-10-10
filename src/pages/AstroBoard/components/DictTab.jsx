/**
 * DictTab —— 「📖 名词解释」标签页（自 AstroBoard 主壳拆出，原 index.jsx L1809-1852）。
 * KPI 词典 / 航天术语速查。纯静态内容组件。
 */
import { Tag } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { Panel } from './ui.jsx'
import { KPI_DEFS, KPI_GROUPS } from '../../../lib/astro/glossary'

export default function DictTab() {
  return (
    <>
              <div className="astro-tab-content">
                <Panel
                  title="指标与术语词典"
                  source="NOAA SWPC / NASA / ESA Gaia / IAU 公开定义整理"
                  icon={<BookOutlined />}
                >
                  <div className="astro-dict-intro">
                    本页所有数字都对应一个标准定义。下列释义说明三件事：
                    <b>它是什么</b>（量纲与测量方式）、<b>怎么读</b>（阈值分级）、
                    <b>所以呢</b>（它变化意味着什么风险或机会）。
                    带 <b>G0</b>–<b>G5</b> 标签的条目是 NOAA 面向公众的空间天气告警分级。
                  </div>
                  {KPI_GROUPS.map((g) => (
                    <div key={g.title} className="astro-dict-group">
                      <div className="astro-dict-group__head">
                        <span className="astro-dict-group__icon">{g.icon}</span>
                        <h4>{g.title}</h4>
                      </div>
                      <div className="astro-dict-list">
                        {g.items.map(([key, alias]) => {
                          const d = KPI_DEFS[key]
                          if (!d) return null
                          return (
                            <div key={key} className="astro-dict-card">
                              <div className="astro-dict-card__head">
                                <span className="astro-dict-card__name">{d.zh}</span>
                                <span className="astro-dict-card__alias">{alias}</span>
                                <Tag bordered={false} className="astro-dict-card__unit">{d.unit}</Tag>
                              </div>
                              <dl>
                                <dt>是什么</dt><dd>{d.what}</dd>
                                <dt>怎么读</dt><dd>{d.scale}</dd>
                                <dt>所以呢</dt><dd>{d.soWhat}</dd>
                              </dl>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </Panel>
              </div>
    </>
  )
}
