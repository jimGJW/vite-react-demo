import { Card, Segmented } from 'antd'
import { memo, useCallback, useMemo, useState } from 'react'
import { useI18n, pickText } from '@i18n/index.js'
import { STREAM_TEXT } from '@/pages/AgentLab/agentData.js'
import { useSimulatedStream } from './useSimulatedStream.js'
import SkillPicker from './SkillPicker.jsx'

/**
 * 演示二：回答渲染形态对比 —— 整段渲染 / 逐字打字机 / 逐词打字机
 * 同一份回答、同一速度档位，并排看三种主流渲染策略的观感差异。
 */

const MODES = ['instant', 'char', 'word']
const SPEEDS = [30, 55, 90]

function RenderPane({ mode, text, speed }) {
  const { t } = useI18n()
  const { out, running, done, start, stop, reset } = useSimulatedStream({ text, mode, speed })

  return (
    <Card size="small" className="agent-lab__demo-panel" title={<span className="agent-lab__demo-title">{t(`agent.render-${mode}`)}</span>}>
      <pre className="agent-lab__demo-out">
        {mode === 'instant' ? text : out}
        {running ? <span className="agent-lab__cursor" /> : null}
      </pre>
      <div className="agent-lab__demo-bar"><span style={{ width: `${(mode === 'instant' ? (done ? 1 : running ? 1 : 0) : out.length / text.length) * 100}%` }} /></div>
      <div className="agent-lab__demo-meter agent-lab__demo-meter--center">
        {done ? <span className="agent-lab__demo-done">{t('agent.labDone')}</span> : <span>{Math.round((mode === 'instant' ? (running || done ? text.length : 0) : out.length) / text.length * 100)}%</span>}
      </div>
      <div className="agent-lab__demo-actions">
        {running ? (
          <button type="button" className="agent-lab__btn agent-lab__btn--stop" onClick={stop}>{t('agent.labStop')}</button>
        ) : (
          <button type="button" className="agent-lab__btn" onClick={start}>{t('agent.labStart')}</button>
        )}
        <button type="button" className="agent-lab__btn agent-lab__btn--ghost" onClick={reset}>{t('agent.labReset')}</button>
      </div>
    </Card>
  )
}

const MemoPane = memo(RenderPane)

function RenderModeDemo() {
  const { lang, t } = useI18n()
  const text = pickText(STREAM_TEXT, lang)
  const [speedIdx, setSpeedIdx] = useState(1)
  const [picked, setPicked] = useState(MODES)
  const speed = SPEEDS[speedIdx]

  const speedOptions = useMemo(() => [
    { label: t('agent.labSpeedSlow'), value: 0 },
    { label: t('agent.labSpeedMid'), value: 1 },
    { label: t('agent.labSpeedFast'), value: 2 },
  ], [t])
  const onSpeed = useCallback((v) => setSpeedIdx(v), [])

  /* 技能勾选：取消勾选的渲染形态整块移除（面板卸载即停内部定时器） */
  const pickOptions = useMemo(() => MODES.map((m) => ({ label: t(`agent.render-${m}`), value: m })), [t])
  const onPick = useCallback((vals) => setPicked(vals), [])
  const activeModes = useMemo(() => MODES.filter((m) => picked.includes(m)), [picked])

  return (
    <div className="agent-lab__demo">
      <p className="agent-lab__hint">{t('agent.labHintRender')}</p>
      <SkillPicker options={pickOptions} value={picked} onChange={onPick} />
      <Segmented options={speedOptions} value={speedIdx} onChange={onSpeed} size="small" />
      <div className="agent-lab__demo-row">
        {activeModes.map((m) => (
          <MemoPane key={m} mode={m} text={text} speed={speed} />
        ))}
      </div>
    </div>
  )
}

export default memo(RenderModeDemo)
