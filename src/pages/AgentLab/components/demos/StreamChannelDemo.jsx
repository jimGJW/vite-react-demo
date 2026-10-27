import { Card, Segmented, Table } from 'antd'
import { memo, useCallback, useMemo, useState } from 'react'
import { useI18n, pickText } from '@i18n/index.js'
import { STREAM_CHANNELS, STREAM_MATRIX, STREAM_TEXT } from '@/pages/AgentLab/agentData.js'
import { useSimulatedStream } from './useSimulatedStream.js'

/**
 * 演示一：流式通道对比 —— SSE / fetch ReadableStream / WebSocket（本地模拟）
 * 三条通道跑同一份文案，并排观察输出节奏；下方为特性矩阵表。
 * 面板各自持有 useSimulatedStream 实例（状态内聚，父组件不感知）。
 */

const SPEEDS = [40, 70, 110]

function ChannelPanel({ channel, text, speed }) {
  const { lang, t } = useI18n()
  const { out, running, done, elapsed, progress, cps, start, stop, reset } = useSimulatedStream({
    text,
    mode: 'char',
    speed,
  })

  return (
    <Card
      size="small"
      className="agent-lab__demo-panel"
      title={(
        <span className="agent-lab__demo-title">
          <span className="agent-lab__demo-dot" style={{ background: channel.color }} />
          {pickText(channel.name, lang)}
          <span className="agent-lab__demo-sub">{pickText(channel.sub, lang)}</span>
        </span>
      )}
      extra={(
        <span className="agent-lab__demo-meter">
          {done ? <span className="agent-lab__demo-done">{t('agent.labDone')}</span> : null}
          <span>{t('agent.labChars')} {out.length} · {cps}/s · {Math.round(elapsed / 100) / 10}s</span>
        </span>
      )}
    >
      <pre className="agent-lab__demo-out">
        {out}
        {running ? <span className="agent-lab__cursor" /> : null}
      </pre>
      <div className="agent-lab__demo-bar"><span style={{ width: `${progress * 100}%`, background: channel.color }} /></div>
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

const MemoPanel = memo(ChannelPanel)

function StreamChannelDemo() {
  const { lang, t } = useI18n()
  const text = pickText(STREAM_TEXT, lang)
  const [speedIdx, setSpeedIdx] = useState(1)
  const speed = SPEEDS[speedIdx]

  const speedOptions = useMemo(() => [
    { label: t('agent.labSpeedSlow'), value: 0 },
    { label: t('agent.labSpeedMid'), value: 1 },
    { label: t('agent.labSpeedFast'), value: 2 },
  ], [t])
  const onSpeed = useCallback((v) => setSpeedIdx(v), [])

  const columns = useMemo(() => [
    { title: t('agent.labMatrixFeature'), dataIndex: 'feature', key: 'f', width: 130, render: (v) => <b>{pickText(v, lang)}</b> },
    ...STREAM_CHANNELS.map((c) => ({
      title: pickText(c.name, lang),
      dataIndex: c.id,
      key: c.id,
      render: (v) => pickText(v, lang),
    })),
  ], [t, lang])

  return (
    <div className="agent-lab__demo">
      <p className="agent-lab__hint">{t('agent.labHintStream')}</p>
      <Segmented options={speedOptions} value={speedIdx} onChange={onSpeed} size="small" />
      <div className="agent-lab__demo-row">
        {STREAM_CHANNELS.map((c) => (
          <MemoPanel key={c.id} channel={c} text={text} speed={speed} />
        ))}
      </div>
      <Table
        size="small"
        pagination={false}
        rowKey={(r) => pickText(r.feature, 'zh-CN')}
        dataSource={STREAM_MATRIX}
        columns={columns}
        className="agent-lab__matrix"
      />
    </div>
  )
}

export default memo(StreamChannelDemo)
