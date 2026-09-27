import { useMemo, useReducer } from 'react'
import { Button, Card, Slider, Space, Tag, Timeline, Tooltip, Typography } from 'antd'
import { NodeIndexOutlined } from '@ant-design/icons'
import {
  createMachine, createHistory, commit, undo, redo,
  current, canUndo, canRedo, jumpTo,
} from '../../components/StateMachine/machine.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

/* —— 工单流转规则：集中声明，非法流转由机器拦截 —— */
const TICKET = createMachine({
  initial: 'draft',
  states: {
    draft: { label: '草稿', desc: '刚创建，可反复编辑', on: { SUBMIT: 'reviewing' } },
    reviewing: { label: '审核中', desc: '等待审批人处理', on: { APPROVE: 'approved', REJECT: 'rejected' } },
    approved: { label: '已通过', desc: '审批通过，可归档', on: { ARCHIVE: 'archived', REVOKE: 'reviewing' } },
    rejected: { label: '已驳回', desc: '需修改后重新提交', on: { REEDIT: 'draft' } },
    archived: { label: '已归档', desc: '流程终点', on: {} },
  },
})

const EVENT_LABEL = {
  SUBMIT: '提交审核',
  APPROVE: '审批通过',
  REJECT: '驳回',
  ARCHIVE: '归档',
  REVOKE: '撤回归档',
  REEDIT: '重新编辑',
}
const ALL_EVENTS = Object.keys(EVENT_LABEL)

/* 状态图坐标：viewBox 560×190，节点 96×34 */
const NODES = {
  draft: { x: 8, y: 78 },
  reviewing: { x: 152, y: 78 },
  approved: { x: 300, y: 24 },
  rejected: { x: 300, y: 132 },
  archived: { x: 452, y: 24 },
}
const NW = 96
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
  const [history, dispatch] = useReducer(
    reducer,
    undefined,
    () => createHistory(TICKET.initial),
  )

  const now = current(history)
  const meta = TICKET.metaOf(now)
  const available = useMemo(() => TICKET.eventsOf(now), [now])

  return (
    <div className="smd">
      <header className="smd__header">
        <Title level={4} className="smd__title">
          <NodeIndexOutlined /> 状态机与时间旅行
        </Title>
        <Paragraph type="secondary" className="smd__lead">
          把「谁能流转到哪」从组件里抽成一张状态表，非法流转在
          <code> transition()</code> 里就被拦掉，不用在业务代码里到处写 if。
          再配一个撤销栈，就免费得到时间旅行（撤销 / 重做 / 任意跳转）。
        </Paragraph>
      </header>

      <div className="smd__grid">
        {/* ===== 状态图 ===== */}
        <Card size="small" className="smd__card" title="工单流转图（当前状态高亮）">
          <div className="smd__stage">
            <svg className="smd__flow" viewBox="0 0 560 190" role="img" aria-label="工单状态流转图">
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
                      {TICKET.metaOf(id).label}
                    </text>
                  </g>
                )
              })}
            </svg>

            <div className="smd__now">
              <b>{meta.label}</b>
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>{meta.desc}</Text>
              <Tag color="blue" style={{ marginLeft: 'auto' }}>第 {history.cursor + 1} / {history.entries.length} 步</Tag>
            </div>

            <Text type="secondary" className="smd__hint">
              灰色按钮表示当前状态下不允许该操作 —— 状态机直接返回 ok:false，
              业务代码不需要再写一遍判断。
            </Text>
            <Space wrap>
              {ALL_EVENTS.map((ev) => {
                const enabled = available.includes(ev)
                const reason = TICKET.transition(now, ev).reason
                return (
                  <Tooltip key={ev} title={enabled ? `触发 ${ev}` : reason}>
                    <Button
                      type={enabled ? 'primary' : 'default'}
                      disabled={!enabled}
                      onClick={() => dispatch({ type: ev })}
                    >
                      {EVENT_LABEL[ev]}
                    </Button>
                  </Tooltip>
                )
              })}
            </Space>
          </div>
        </Card>

        {/* ===== 时间旅行 ===== */}
        <Card size="small" className="smd__card" title="时间旅行：撤销 / 重做 / 任意跳转">
          <div className="smd__stage">
            <Text type="secondary" className="smd__hint">
              历史栈存的是「状态快照序列」。提交新状态时若不在末尾，
              后面的 redo 分支会被丢弃 —— 这是所有撤销栈的标准行为。
            </Text>

            <Space wrap>
              <Button disabled={!canUndo(history)} onClick={() => dispatch({ type: 'UNDO' })}>撤销</Button>
              <Button disabled={!canRedo(history)} onClick={() => dispatch({ type: 'REDO' })}>重做</Button>
              <Button onClick={() => dispatch({ type: 'JUMP', index: 0 })}>回到最初</Button>
            </Space>

            <div className="smd__row">
              <Text style={{ fontSize: '0.78rem', minWidth: 76 }}>时间轴</Text>
              <Slider
                style={{ flex: '1 1 200px', minWidth: 180 }}
                min={0}
                max={Math.max(0, history.entries.length - 1)}
                value={history.cursor}
                onChange={(v) => dispatch({ type: 'JUMP', index: v })}
                tooltip={{ formatter: (v) => `第 ${v + 1} 步：${TICKET.metaOf(history.entries[v]).label}` }}
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
                      第 {i + 1} 步 · {TICKET.metaOf(s).label}
                      {i === history.cursor ? '（当前）' : ''}
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
