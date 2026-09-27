import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, Segmented, Tag, Typography } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { VirtualList } from '../../components/PerfLab/index.js'
import './index.scss'

const { Text } = Typography

const ROW_H = 36
const VIEW_H = 320
/** 全量渲染的安全上限：再往上浏览器会明显卡死，没必要硬撑 */
const FULL_CAP = 5000

const SIZE_OPTIONS = [
  { label: '1 千行', value: 1000 },
  { label: '1 万行', value: 10000 },
  { label: '10 万行', value: 100000 },
]

const GROUPS = ['计算集群', '存储集群', '网络集群', '边缘节点', '安全域']

/* 造数据：10 万行也能在百毫秒内生成完 */
function buildRows(n) {
  const rows = new Array(n)
  for (let i = 0; i < n; i += 1) {
    rows[i] = {
      id: `r-${i}`,
      name: `${GROUPS[i % GROUPS.length]} · ${i + 1}`,
      value: (i * 7919) % 1000,
    }
  }
  return rows
}

/* 提到模块级：不随父组件重建，避免无谓的 props 变化 */
function renderRow(row, i) {
  return (
    <div key={row.id} className="perf-lab__vrow">
      <i>#{i}</i>
      <em>{row.name}</em>
      <span>{row.value}</span>
    </div>
  )
}

/**
 * 虚拟滚动 vs 全量渲染 对照实验。
 * 左右两个列表喂同一份数据，用「实测 DOM 行数」说话，而不是靠体感。
 */
export default function VirtualScrollCase() {
  const [size, setSize] = useState(1000)
  const [live, setLive] = useState({ rendered: 0, total: 0 })

  const rows = useMemo(() => buildRows(size), [size])
  const plainRows = useMemo(() => rows.slice(0, Math.min(size, FULL_CAP)), [rows, size])

  const vWrapRef = useRef(null)
  const fWrapRef = useRef(null)
  const vNodeRef = useRef(null)
  const fNodeRef = useRef(null)

  /* 实测 DOM 里的行数：只在数据量变化时统计，滚动时不必反复扫节点 */
  useEffect(() => {
    const v = vWrapRef.current ? vWrapRef.current.querySelectorAll('.perf-lab__vrow').length : 0
    const f = fWrapRef.current ? fWrapRef.current.querySelectorAll('.perf-lab__vrow').length : 0
    if (vNodeRef.current) vNodeRef.current.textContent = String(v)
    if (fNodeRef.current) fNodeRef.current.textContent = String(f)
  }, [size])

  const onStatsChange = useCallback((s) => setLive(s), [])

  return (
    <Card
      size="small"
      className="perf-lab__card"
      title={(
        <span><ThunderboltOutlined /> 虚拟滚动：只渲染看得见的行</span>
      )}
      extra={<Segmented size="small" value={size} onChange={setSize} options={SIZE_OPTIONS} />}
    >
      <div className="perf-lab__stage">
        <Text type="secondary" className="perf-lab__hint">
          左右两个列表用的是同一份数据。滚动条高度完全一致（都是 {rows.length.toLocaleString()} 行 × {ROW_H}px），
          区别只在于 DOM 里真正存在多少行节点。
        </Text>

        <div className="perf-lab__cols">
          <section ref={vWrapRef}>
            <div className="perf-lab__row" style={{ marginBottom: 6 }}>
              <Tag color="blue">虚拟滚动</Tag>
              <Text type="secondary" style={{ fontSize: '0.78rem' }}>
                实时渲染 <b ref={vNodeRef}>0</b> / {rows.length.toLocaleString()} 行
              </Text>
            </div>
            <VirtualList
              items={rows}
              itemHeight={ROW_H}
              height={VIEW_H}
              renderItem={renderRow}
              onStatsChange={onStatsChange}
              empty={<div style={{ padding: 16 }}>暂无数据</div>}
            />
          </section>

          <section ref={fWrapRef}>
            <div className="perf-lab__row" style={{ marginBottom: 6 }}>
              <Tag color="red">全量渲染</Tag>
              <Text type="secondary" style={{ fontSize: '0.78rem' }}>
                实渲染 <b ref={fNodeRef}>0</b> 行
                {size > FULL_CAP ? `（已截断到 ${FULL_CAP.toLocaleString()} 行上限）` : ''}
              </Text>
            </div>
            <div className="perf-plain-list">
              {plainRows.map((row, i) => renderRow(row, i))}
            </div>
          </section>
        </div>

        <dl className="perf-lab__stats">
          <div className="perf-lab__stat">
            <dt>数据总量</dt>
            <dd>{rows.length.toLocaleString()}</dd>
          </div>
          <div className="perf-lab__stat">
            <dt>虚拟滚动渲染</dt>
            <dd>{live.rendered || '—'}</dd>
          </div>
          <div className="perf-lab__stat">
            <dt>全量渲染</dt>
            <dd>{plainRows.length.toLocaleString()}</dd>
          </div>
          <div className="perf-lab__stat">
            <dt>节点压缩比</dt>
            <dd>
              {plainRows.length > 0 && live.rendered > 0
                ? `${Math.round(plainRows.length / live.rendered)}×`
                : '—'}
            </dd>
          </div>
        </dl>

        <pre className="perf-lab__code">{`import { VirtualList } from '@/components/PerfLab'

<VirtualList
  items={rows}          // 10 万行也照喂
  itemHeight={36}       // 定高是前提
  height={320}
  overscan={4}          // 上下各多渲染 4 行，防快速滚动露白
  renderItem={(row, i) => (
    <div key={row.id} className="row">{row.name}</div>  // key 用业务 id
  )}
/>`}</pre>

        <Text type="secondary" className="perf-lab__hint">
          坑位提醒：<code>renderItem</code> 返回的元素必须自带 <code>key</code>，且要用业务 id 而不是数组下标 ——
          用下标作 key 时插入/删除行会让 React 复用错节点，出现「内容对不上」的诡异 bug。
        </Text>
      </div>
    </Card>
  )
}
