import { memo, useState } from 'react'
import { Button, Input, Segmented, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined, ClearOutlined, BulbOutlined } from '@ant-design/icons'
import TodoProvider from './TodoProvider.jsx'
import { useTodos } from './todoContext.js'
import RenderBadge from './RenderBadge.jsx'
import CodeBlock from './CodeBlock.jsx'
import { useI18n } from '../../i18n/index.js'

const CASE_CODE = `// ① 创建通道（模块顶层，只建一次）
export const TodoContext = createContext(null)

// ② 提供方：状态 + 稳定回调 + 记忆化的注入值
function TodoProvider({ children }) {
  const [todos, setTodos] = useState([])

  const addTodo = useCallback((text) => {
    setTodos((prev) => [{ id: nextId(), text, done: false }, ...prev])
  }, [])                                        // ← 引用恒定

  const stats = useMemo(() => ({                // ← 依赖不变则复用上次结果
    total: todos.length,
    done: todos.filter((t) => t.done).length,
  }), [todos])

  const value = useMemo(                        // ← 三组依赖任一变化才重建对象
    () => ({ todos, stats, addTodo }),
    [todos, stats, addTodo],
  )

  return <TodoContext value={value}>{children}</TodoContext>
}

// ③ 消费方：跨过任意中间层直接读取，不需要 props 逐层传递
function LayerThree() {
  const { todos, addTodo } = useContext(TodoContext)
  return todos.map((t) => <li key={t.id}>{t.text}</li>)
}
`

/* ── 第 1 层：应用外壳，消费 stats / theme ── */
function LayerOne() {
  const { t } = useI18n()
  const { stats, theme, toggleTheme } = useTodos()

  return (
    <section className={`rh-layer rh-layer--outer rh-theme-${theme}`}>
      <header className="rh-layer__head">
        <span className="rh-layer__title">{t('hooks.context.layer1Title')}</span>
        <RenderBadge name="LayerOne" />
      </header>

      <div className="rh-metrics">
        <div className="rh-metric">
          <span>{t('hooks.context.metricAll')}</span>
          <b>{stats.total}</b>
        </div>
        <div className="rh-metric">
          <span>{t('hooks.context.metricActive')}</span>
          <b>{stats.active}</b>
        </div>
        <div className="rh-metric">
          <span>{t('hooks.context.metricDone')}</span>
          <b>{stats.done}</b>
        </div>
        <div className="rh-metric">
          <span>{t('hooks.context.metricPercent')}</span>
          <b>{stats.percent}%</b>
        </div>
      </div>

      <div className="rh-row rh-row--wrap">
        <Button size="small" icon={<BulbOutlined />} onClick={toggleTheme}>
          {t('hooks.context.toggleTheme')} <code>{theme}</code>
        </Button>
        <span className="rh-hint">{t('hooks.context.statsFromContext')}</span>
      </div>

      <LayerTwo />
    </section>
  )
}

/* ── 第 2 层：纯布局容器 —— 用 memo 包裹，且自己【不】消费 Context ── */
const LayerTwo = memo(function LayerTwo() {
  const { t } = useI18n()
  return (
    <section className="rh-layer rh-layer--mid">
      <header className="rh-layer__head">
        <span className="rh-layer__title">{t('hooks.context.layer2Title')}</span>
        <RenderBadge name="LayerTwo" />
      </header>
      <p className="rh-hint">
        {t('hooks.context.layer2Hint')}
      </p>
      <LayerThree />
    </section>
  )
})

/* ── 第 3 层：真正的数据消费方 ── */
function LayerThree() {
  const { t } = useI18n()
  const { todos, filter, stats, addTodo, toggleTodo, removeTodo, clearDone, changeFilter } = useTodos()
  const [text, setText] = useState('')

  const submit = () => {
    addTodo(text)
    setText('')
  }

  return (
    <section className="rh-layer rh-layer--inner">
      <header className="rh-layer__head">
        <span className="rh-layer__title">{t('hooks.context.layer3Title')}</span>
        <RenderBadge name="LayerThree" />
      </header>

      <div className="rh-row">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={submit}
          placeholder={t('hooks.context.todoPlaceholder')}
          maxLength={40}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={submit}>
          {t('hooks.context.add')}
        </Button>
      </div>

      <div className="rh-row rh-row--between rh-row--wrap">
        <Segmented
          size="small"
          value={filter}
          onChange={changeFilter}
          options={[
            { label: t('hooks.context.filterAll'), value: 'all' },
            { label: t('hooks.context.filterActive'), value: 'active' },
            { label: t('hooks.context.filterDone'), value: 'done' },
          ]}
        />
        <Button
          size="small"
          icon={<ClearOutlined />}
          onClick={clearDone}
          disabled={stats.done === 0}
        >
          {t('hooks.context.clearDone')}
        </Button>
      </div>

      <div className="rh-list">
        {todos.map((td) => (
          <div key={td.id} className={`rh-list__item ${td.done ? 'is-done' : ''}`}>
            <label className="rh-list__label">
              <input type="checkbox" checked={td.done} onChange={() => toggleTodo(td.id)} />
              <span>{td.text}</span>
            </label>
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeTodo(td.id)}
            />
          </div>
        ))}
        {todos.length === 0 && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('hooks.context.emptyDesc')} />
        )}
      </div>

      <p className="rh-hint">
        {t('hooks.context.layer3Hint')}
      </p>
    </section>
  )
}

/** 四件套综合案例：一个 Provider 内部同时用上 useMemo / useCallback / useContext */
export default function ContextCase() {
  const { t } = useI18n()
  return (
    <div className="rh-case">
      <div className="rh-case__intro">
        <h2>{t('hooks.context.introTitle')}</h2>
        <p>
          {t('hooks.context.introDesc')}
        </p>
      </div>

      <CodeBlock title={t('hooks.context.codeTitle')} lang="jsx" code={CASE_CODE} collapsible defaultOpen={false} />

      <TodoProvider>
        <LayerOne />
      </TodoProvider>

      <div className="rh-tips">
        <h3>{t('hooks.context.observeTitle')}</h3>
        <ul>
          <li>{t('hooks.context.observe1')}</li>
          <li>{t('hooks.context.observe2')}</li>
          <li>{t('hooks.context.observe3')}</li>
        </ul>
      </div>
    </div>
  )
}
