import { memo, useCallback, useMemo, useState } from 'react'
import { Button, Card, Space, Tag, Typography } from 'antd'
import { ExperimentOutlined } from '@ant-design/icons'
import { RenderTally } from '../../components/PerfLab/index.js'
import { useI18n, pickLang } from '../../i18n/index.js'
import './index.scss'

const { Text } = Typography

const VARIANTS = {
  plain: { title: { 'zh-CN': '① 普通组件', en: 'Plain component' }, note: { 'zh-CN': '父组件一渲染，它就跟着渲染', en: 'Rerenders whenever the parent renders' } },
  loose: { title: { 'zh-CN': '② memo + 内联 props', en: 'memo + inline props' }, note: { 'zh-CN': 'memo 形同虚设：每次都是新引用', en: 'memo is useless: fresh references every time' } },
  strict: { title: { 'zh-CN': '③ memo + 稳定引用', en: 'memo + stable refs' }, note: { 'zh-CN': 'props 真不变时才跳过渲染', en: 'Skips render only when props truly stay referentially equal' } },
}

const INITIAL_ITEMS = [
  { id: 'a', name: { 'zh-CN': '节点 A', en: 'Node A' } },
  { id: 'b', name: { 'zh-CN': '节点 B', en: 'Node B' } },
  { id: 'c', name: { 'zh-CN': '节点 C', en: 'Node C' } },
]

/* 三者共用同一个渲染体，唯一区别是外层有没有 memo、props 是不是稳定引用 */
function ChildBody({ variant, data, onPick }) {
  const { t, lang } = useI18n()
  const nameText = (name) => (typeof name === 'string' ? name : pickLang(name, lang))
  return (
    <div className="perf-lab__box">
      <div className="perf-lab__row" style={{ justifyContent: 'space-between' }}>
        <Text strong style={{ fontSize: '0.85rem' }}>{pickLang(variant.title, lang)}</Text>
        <RenderTally label={t('perf.rerender.renderLabel')} />
      </div>
      <Text type="secondary" className="perf-lab__hint">{pickLang(variant.note, lang)}</Text>
      <Text style={{ fontSize: '0.8rem' }}>{data.label}</Text>
      <Space size={4} wrap>
        {data.items.map((it) => (
          <Button key={it.id} size="small" onClick={() => onPick(it.id)}>{nameText(it.name)}</Button>
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
  const { t } = useI18n()
  const [tick, setTick] = useState(0)
  const [items, setItems] = useState(INITIAL_ITEMS)
  const [picked, setPicked] = useState('—')

  /* 稳定引用：依赖不变就不重建 */
  const stableData = useMemo(() => ({ label: t('perf.rerender.itemsLabel', { count: items.length }), items }), [items, t])
  const stablePick = useCallback((id) => setPicked(id), [])

  const addItem = () => {
    setItems((prev) => [...prev, { id: `n${prev.length + 1}`, name: t('perf.rerender.nodeName', { n: prev.length + 1 }) }])
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
      title={<span><ExperimentOutlined /> {t('perf.rerender.title')}</span>}
      extra={<Tag color="blue">{t('perf.rerender.parentRendered', { tick })}</Tag>}
    >
      <div className="perf-lab__stage">
        <Text type="secondary" className="perf-lab__hint">
          {t('perf.rerender.hint1')}<b>{t('perf.rerender.hintBold')}</b>{t('perf.rerender.hint2')}
        </Text>

        <Space wrap>
          <Button onClick={() => setTick((tick) => tick + 1)}>{t('perf.rerender.unrelated')}</Button>
          <Button type="primary" onClick={addItem}>{t('perf.rerender.addItem')}</Button>
          <Button onClick={reset}>{t('perf.rerender.reset')}</Button>
          <Text type="secondary" style={{ fontSize: '0.78rem' }}>{t('perf.rerender.recentPick')}{picked}</Text>
        </Space>

        <div className="perf-lab__cols">
          {/* ① 普通组件：没有任何防护 */}
          <PlainChild
            variant={VARIANTS.plain}
            data={{ label: t('perf.rerender.itemsLabel', { count: items.length }), items }}
            onPick={(id) => setPicked(id)}
          />

          {/* ② 有 memo，但 props 每次都是新对象 / 新函数 —— 挡不住 */}
          <MemoChildLoose
            variant={VARIANTS.loose}
            data={{ label: t('perf.rerender.itemsLabel', { count: items.length }), items }}
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
          {t('perf.rerender.ctxHint1')}<code>React.memo</code>{t('perf.rerender.ctxHint2')}
        </Text>
      </div>
    </Card>
  )
}
