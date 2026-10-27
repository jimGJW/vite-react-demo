import { Card, Timeline } from 'antd'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import ThinkingStrip from '@components/ChatBot/ThinkingStrip.jsx'
import { useI18n } from '@i18n/index.js'
import SkillPicker from './SkillPicker.jsx'

/**
 * 演示三：思考链展示形态对比
 * ① 步骤条 ThinkingStrip（本项目 ChatBot 实装形态，可展开回看）
 * ② 脉冲思考点（推理进行时的「活着」反馈，循环点亮当前步骤）
 * ③ 时间线（antd Timeline，回顾向、信息密度最高）
 * 三种形态对应回答生命周期的不同阶段：进行中 → 收口回看 → 全程审计。
 */

const STEPS = [
  { label: '解析意图 · 匹配知识域', ms: 120 },
  { label: '检索 Agent 知识库', ms: 260 },
  { label: '组织结构化回答', ms: 90 },
]

/* —— 形态②：脉冲思考点 —— */
function PulseThinking() {
  const { t } = useI18n()
  const [active, setActive] = useState(0)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return undefined
    const timer = setInterval(() => setActive((i) => (i + 1) % STEPS.length), 900)
    return () => clearInterval(timer)
  }, [running])

  return (
    <div className="agent-lab__pulse">
      <span className="agent-lab__pulse-avatar">
        <span className={`agent-lab__pulse-dot${running ? '' : ' is-idle'}`} />
      </span>
      <ul className="agent-lab__pulse-steps">
        {STEPS.map((s, i) => (
          <li key={s.label} className={i === active ? 'is-active' : i < active ? 'is-done' : ''}>{s.label}</li>
        ))}
      </ul>
      <div className="agent-lab__demo-actions">
        {running ? (
          <button type="button" className="agent-lab__btn agent-lab__btn--stop" onClick={() => setRunning(false)}>{t('agent.labStop')}</button>
        ) : (
          <button type="button" className="agent-lab__btn" onClick={() => setRunning(true)}>{t('agent.labStart')}</button>
        )}
        <button type="button" className="agent-lab__btn agent-lab__btn--ghost" onClick={() => { setRunning(false); setActive(0) }}>{t('agent.labReset')}</button>
      </div>
    </div>
  )
}

const FORMS = ['static', 'pulse', 'timeline']

function ThinkingDemo() {
  const { t } = useI18n()
  const elapsedMs = useMemo(() => STEPS.reduce((n, s) => n + s.ms, 0), [])
  const [picked, setPicked] = useState(FORMS)

  /* 技能勾选：取消勾选的思考链形态整块移除 */
  const pickOptions = useMemo(() => FORMS.map((f) => ({ label: t(`agent.think-${f}`), value: f })), [t])
  const onPick = useCallback((vals) => setPicked(vals), [])

  const show = useMemo(() => ({
    static: picked.includes('static'),
    pulse: picked.includes('pulse'),
    timeline: picked.includes('timeline'),
  }), [picked])

  return (
    <div className="agent-lab__demo">
      <p className="agent-lab__hint">{t('agent.labHintThink')}</p>
      <SkillPicker options={pickOptions} value={picked} onChange={onPick} />
      <div className="agent-lab__demo-row">
        {show['static'] && (
          <Card size="small" className="agent-lab__demo-panel" title={t('agent.think-static')}>
            <ThinkingStrip
              elapsedMs={elapsedMs}
              steps={STEPS}
              prefixDone={t('chatbot.thinking.donePrefix')}
              prefixPlain={t('chatbot.thinking.plainPrefix')}
              unit={t('chatbot.thinking.unit')}
            />
          </Card>
        )}
        {show.pulse && (
          <Card size="small" className="agent-lab__demo-panel" title={t('agent.think-pulse')}>
            <PulseThinking />
          </Card>
        )}
        {show.timeline && (
          <Card size="small" className="agent-lab__demo-panel" title={t('agent.think-timeline')}>
            <Timeline
              size="small"
              items={STEPS.map((s) => ({ color: 'blue', children: <span className="agent-lab__tl">{`${s.label} · ${s.ms}ms`}</span> }))}
            />
          </Card>
        )}
      </div>
    </div>
  )
}

export default memo(ThinkingDemo)
