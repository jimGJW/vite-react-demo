/**
 * LaunchTab —— 「🚀 航天发射」标签页（自 AstroBoard 主壳拆出，原 index.jsx L1857-1913）。
 * 近期全球航天发射任务表。纯展示组件：数据经 props 传入。
 */
import { Tag } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import { Panel, TermTip } from './ui.jsx'
import { zhLaunchStatus, zhMissionType } from '@lib/astro/glossary'
import { useI18n } from '@i18n/index.js'

export default function LaunchTab({ launches, launchData }) {
  const { t, lang } = useI18n()
  return (
    <>
              <div className="astro-tab-content">
                {/* 近期航天发射 */}
      <Panel
        title={t('astro.launchTitle')}
        source={t('astro.launchSource')}
        icon={<CalendarOutlined />}
        loading={launches.loading}
        error={launches.error}
      >
        <div className="astro-launch-list">
          {launchData?.items?.map((l, i) => {
            const st = zhLaunchStatus(l.status, l.statusAbbr, lang)
            const mtype = zhMissionType(l.missionType, lang)
            return (
              <div key={i} className="astro-launch-item">
                <div className="astro-launch-item__time">
                  <span className="astro-launch-date">
                    {l.net ? new Date(l.net).toLocaleDateString(lang, { month: 'short', day: 'numeric' }) : '—'}
                  </span>
                  <span className="astro-launch-clock">
                    {l.net ? new Date(l.net).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                  </span>
                  <TermTip zh={st.zh} en={st.en} desc={st.desc}>
                    <Tag
                      bordered={false}
                      className={`astro-launch-status astro-launch-status--${(l.statusAbbr || 'unknown').toLowerCase()}`}
                      style={{ color: st.tone, borderColor: st.tone }}
                    >
                      {st.zh}
                    </Tag>
                  </TermTip>
                </div>
                <div className="astro-launch-item__body">
                  <div className="astro-launch-item__name">{l.name}</div>
                  <div className="astro-launch-item__meta">
                    {l.provider && <span>{l.provider}</span>}
                    {l.rocket && <span>{l.rocket}</span>}
                    {l.pad && <span>{l.pad}</span>}
                    {l.location && <span>{l.location}</span>}
                  </div>
                  {l.mission && (
                    <div className="astro-launch-item__mission">
                      <TermTip zh={mtype.zh} en={mtype.en} desc={mtype.desc}>
                        <Tag bordered={false} className="astro-mission-tag">{mtype.zh}</Tag>
                      </TermTip>
                      {l.mission}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
              </div>
    </>
  )
}
