import { useReducer } from 'react'
import { Button, Card, Slider, Space, Tag, Timeline, Tooltip, Typography } from 'antd'
import { NodeIndexOutlined } from '@ant-design/icons'
import {
   createHistory, commit, undo, redo,
  current, canUndo, canRedo, jumpTo,
} from '@components/StateMachine/machine.js'
import { useI18n, pickLang } from '@i18n/index.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

/* —— 工单流转规则：集中声明，非法流转由机器拦截 —— */

import { TICKET, EVENT_LABEL, ALL_EVENTS, NODES, NW } from './components/smConfig.js'

const NH = 34

/* 连线：从节点右/左边缘出发，回退分支走曲线 */
const EDGES = [
  { d: 'M 104 95 L 152 95', key: 'draft→reviewing' },
  { d: 'M 248 95 L 300 41', key: 'reviewing→approved' },
  { d: 'M 248 95 L 300 149', key: 'reviewing→rejected' },
  { d: 'M 396 41 L 452 41', key: 'approved→archived' },
  { d: 'M 348 58 C 348 132 262 132 200 112', key: 'approved→reviewing' },
  { d: 'M 348 166 C 280 185 120 180 56 112', key: 'rejected→draft' },
]

const STATE_COLOR = {
  draft: '#8c8c8c',
  reviewing: '#1677ff',
  approved: '#52c41a',
  rejected: '#ff4d4f',
  archived: '#722ed1',
}

/* reducer 提到模块级：纯函数，不依赖组件 */
function reducer(history, action) {
  if (action.type === 'UNDO') return undo(history)
  if (action.type === 'REDO') return redo(history)
  if (action.type === 'JUMP') return jumpTo(history, action.index)

  const now = current(history)
  const { ok, to } = TICKET.transition(now, action.type)
  if (!ok) return history           // 非法流转：状态保持不变
  return commit(history, to)
}

export default function StateMachineDemo() {
  const { t, lang } = useI18n()
  const [history, dispatch] = useReducer(
    reducer,
    undefined,
    () => createHistory(TICKET.initial),
  )

  const now = current(history)
  const meta = TICKET.metaOf(now)
  const available = TICKET.eventsOf(now)

  return (
    <div className="smd">
      <header className="smd__header">
        <Title level={4} className="smd__title">
          <NodeIndexOutlined /> {t('stateMachine.title')}
        </Title>
        <Paragraph type="secondary" className="smd__lead">
          {t('stateMachine.lead1')}<code> transition()</code>{t('stateMachine.lead2')}
        </Paragraph>
      </header>

      <div className="smd__grid">
        {/* ===== 状态图 ===== */}
        <Card size="small" className="smd__card" title={t('stateMachine.flowTitle')}>
          <div className="smd__stage">
            <svg className="smd__flow" viewBox="0 0 560 190" role="img" aria-label={t('stateMachine.flowAria')}>
              <defs>
                <marker id="smd-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#bfbfbf" />
                </marker>
              </defs>

              {EDGES.map((e) => (
                <path
                  key={e.key}
                  d={e.d}
                  fill="none"
                  stroke="var(--c-border, #d9d9d9)"
                  strokeWidth="1.5"
                  markerEnd="url(#smd-arrow)"
                />
              ))}

              {Object.keys(NODES).map((id) => {
                const n = NODES[id]
                const active = id === now
                const color = STATE_COLOR[id] || '#1677ff'
                return (
                  <g key={id}>
                    <rect
                      x={n.x}
                      y={n.y}
                      width={NW}
                      height={NH}
                      rx="8"
                      fill={active ? color : 'var(--c-card, #fff)'}
                      stroke={color}
                      strokeWidth={active ? 2 : 1}
                    />
                    <text
                      x={n.x + NW / 2}
                      y={n.y + NH / 2 + 5}
                      textAnchor="middle"
                      fontSize="13"
                      fill={active ? '#fff' : 'var(--c-text-1, #000000e0)'}
                      fontWeight={active ? 700 : 400}
                    >
                      {pickLang(TICKET.metaOf(id).label, lang)}
                    </text>
                  </g>
                )
              })}
            </svg>

            <div className="smd__now">
              <b>{pickLang(meta.label, lang)}</b>
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>{pickLang(meta.desc, lang)}</Text>
              <Tag color="blue" style={{ marginLeft: 'auto' }}>{t('stateMachine.step', { current: history.cursor + 1, total: history.entries.length })}</Tag>
            </div>

            <Text type="secondary" className="smd__hint">
              {t('stateMachine.grayHint')}
            </Text>
            <Space wrap>
              {ALL_EVENTS.map((ev) => {
                const enabled = available.includes(ev)
                return (
                  <Tooltip
                    key={ev}
                    title={enabled ? t('stateMachine.triggerTip', { event: ev }) : t('stateMachine.disableReason', { label: pickLang(meta.label, lang), event: ev })}
                  >
                    <Button
                      type={enabled ? 'primary' : 'default'}
                      disabled={!enabled}
                      onClick={() => dispatch({ type: ev })}
                    >
                      {pickLang(EVENT_LABEL[ev], lang)}
                    </Button>
                  </Tooltip>
                )
              })}
            </Space>
          </div>
        </Card>

        {/* ===== 时间旅行 ===== */}
        <Card size="small" className="smd__card" title={t('stateMachine.travelTitle')}>
          <div className="smd__stage">
            <Text type="secondary" className="smd__hint">
              {t('stateMachine.travelHint')}
            </Text>

            <Space wrap>
              <Button disabled={!canUndo(history)} onClick={() => dispatch({ type: 'UNDO' })}>{t('stateMachine.undo')}</Button>
              <Button disabled={!canRedo(history)} onClick={() => dispatch({ type: 'REDO' })}>{t('stateMachine.redo')}</Button>
              <Button onClick={() => dispatch({ type: 'JUMP', index: 0 })}>{t('stateMachine.jumpStart')}</Button>
            </Space>

            <div className="smd__row">
              <Text style={{ fontSize: '0.78rem', minWidth: 76 }}>{t('stateMachine.timelineLabel')}</Text>
              <Slider
                style={{ flex: '1 1 200px', minWidth: 180 }}
                min={0}
                max={Math.max(0, history.entries.length - 1)}
                value={history.cursor}
                onChange={(v) => dispatch({ type: 'JUMP', index: v })}
                tooltip={{ formatter: (v) => t('stateMachine.sliderTip', { step: v + 1, label: pickLang(TICKET.metaOf(history.entries[v]).label, lang) }) }}
              />
            </div>

            <div className="smd__zone">
              <Timeline
                items={history.entries.map((s, i) => ({
                  color: i === history.cursor ? 'blue' : 'gray',
                  children: (
                    <span
                      style={{ fontSize: '0.8rem', cursor: 'pointer', fontWeight: i === history.cursor ? 700 : 400 }}
                      onClick={() => dispatch({ type: 'JUMP', index: i })}
                    >
                      {t('stateMachine.stepItem', { step: i + 1, label: pickLang(TICKET.metaOf(s).label, lang) })}
                      {i === history.cursor ? t('stateMachine.currentMark') : ''}
                    </span>
                  ),
                }))}
              />
            </div>

            <pre className="smd__code">{`const m = createMachine({
  initial: 'draft',
  states: {
    draft:     { label: '草稿',   on: { SUBMIT: 'reviewing' } },
    reviewing: { label: '审核中', on: { APPROVE: 'approved', REJECT: 'rejected' } },
    approved:  { label: '已通过', on: { ARCHIVE: 'archived' } },
    rejected:  { label: '已驳回', on: { REEDIT: 'draft' } },
    archived:  { label: '已归档', on: {} },
  },
})

m.transition('draft', 'APPROVE')
// → { ok: false, to: 'draft', reason: '「草稿」状态下不能触发「APPROVE」' }`}</pre>
          </div>
        </Card>
      </div>
    </div>
  )
}
