import { memo, useCallback, useMemo, useState } from 'react'
import { Button, Card, Space, Tag, Typography } from 'antd'
import { ExperimentOutlined } from '@ant-design/icons'
import { RenderTally } from '../../components/PerfLab/index.js'
import './index.scss'

const { Text } = Typography

const VARIANTS = {
  plain: { title: '① 普通组件', note: '父组件一渲染，它就跟着渲染' },
  loose: { title: '② memo + 内联 props', note: 'memo 形同虚设：每次都是新引用' },
  strict: { title: '③ memo + 稳定引用', note: 'props 真不变时才跳过渲染' },
}

const INITIAL_ITEMS = [
  { id: 'a', name: '节点 A' },
  { id: 'b', name: '节点 B' },
  { id: 'c', name: '节点 C' },
]

/* 三者共用同一个渲染体，唯一区别是外层有没有 memo、props 是不是稳定引用 */
function ChildBody({ variant, data, onPick }) {
  return (
    <div className="perf-lab__box">
      <div className="perf-lab__row" style={{ justifyContent: 'space-between' }}>
        <Text strong style={{ fontSize: '0.85rem' }}>{variant.title}</Text>
        <RenderTally label="渲染" />
      </div>
      <Text type="secondary" className="perf-lab__hint">{variant.note}</Text>
      <Text style={{ fontSize: '0.8rem' }}>{data.label}</Text>
      <Space size={4} wrap>
        {data.items.map((it) => (
          <Button key={it.id} size="small" onClick={() => onPick(it.id)}>{it.name}</Button>
        ))}
      </Space>
    </div>
  )
}

const PlainChild = ChildBody
const MemoChildLoose = memo(function MemoChildLoose(props) {
  return <ChildBody {...props} />
})
const MemoChildStrict = memo(function MemoChildStrict(props) {
  return <ChildBody {...props} />
})

/**
 * 重渲染优化对照实验。
 * 三层递进说明一件事：光加 memo 没用，props 引用稳定才有用。
 */
export default function RerenderCase() {
  const [tick, setTick] = useState(0)
  const [items, setItems] = useState(INITIAL_ITEMS)
  const [picked, setPicked] = useState('—')

  /* 稳定引用：依赖不变就不重建 */
  const stableData = useMemo(() => ({ label: `共 ${items.length} 项资源`, items }), [items])
  const stablePick = useCallback((id) => setPicked(id), [])

  const addItem = () => {
    setItems((prev) => [...prev, { id: `n${prev.length + 1}`, name: `节点 ${prev.length + 1}` }])
  }
  const reset = () => {
    setItems(INITIAL_ITEMS)
    setTick(0)
    setPicked('—')
  }

  return (
    <Card
      size="small"
      className="perf-lab__card"
      title={<span><ExperimentOutlined /> 重渲染优化：memo 不是万能药</span>}
      extra={<Tag color="blue">父组件已渲染 {tick} 次</Tag>}
    >
      <div className="perf-lab__stage">
        <Text type="secondary" className="perf-lab__hint">
          点下面几个按钮，盯住三个计数器。<b>③ 只有在「资源列表」真的变化时才会动</b> ——
          其余情况它一律跳过渲染。
        </Text>

        <Space wrap>
          <Button onClick={() => setTick((t) => t + 1)}>无关 state +1</Button>
          <Button type="primary" onClick={addItem}>添加一项资源</Button>
          <Button onClick={reset}>重置</Button>
          <Text type="secondary" style={{ fontSize: '0.78rem' }}>最近选中：{picked}</Text>
        </Space>

        <div className="perf-lab__cols">
          {/* ① 普通组件：没有任何防护 */}
          <PlainChild
            variant={VARIANTS.plain}
            data={{ label: `共 ${items.length} 项资源`, items }}
            onPick={(id) => setPicked(id)}
          />

          {/* ② 有 memo，但 props 每次都是新对象 / 新函数 —— 挡不住 */}
          <MemoChildLoose
            variant={VARIANTS.loose}
            data={{ label: `共 ${items.length} 项资源`, items }}
            onPick={(id) => setPicked(id)}
          />

          {/* ③ memo + useMemo/useCallback，引用稳定才真的生效 */}
          <MemoChildStrict
            variant={VARIANTS.strict}
            data={stableData}
            onPick={stablePick}
          />
        </div>

        <pre className="perf-lab__code">{`// ✗ 光加 memo 没用：每次渲染都造新对象 / 新函数
<Child memo data={{ list }} onPick={(id) => pick(id)} />

// ✓ 引用稳定后，memo 才真的能挡住重渲染
const data = useMemo(() => ({ list }), [list])
const onPick = useCallback((id) => pick(id), [])
<Child memo data={data} onPick={onPick} />`}</pre>

        <Text type="secondary" className="perf-lab__hint">
          另一个高频坑：Context 的变化会穿透 <code>React.memo</code> ——
          也就是说即使 props 全稳定，只要订阅的 Context 变了，组件照样重渲染。
          所以高频变化的字段（loading、进度、状态行）要单独拆一个 Context，
          别和低频配置挤在一起。
        </Text>
      </div>
    </Card>
  )
}
