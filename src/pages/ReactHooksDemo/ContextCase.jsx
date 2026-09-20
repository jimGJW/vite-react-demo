import { memo, useState } from 'react'
import { Button, Input, Segmented, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined, ClearOutlined, BulbOutlined } from '@ant-design/icons'
import TodoProvider from './TodoProvider.jsx'
import { useTodos } from './todoContext.js'
import RenderBadge from './RenderBadge.jsx'
import CodeBlock from './CodeBlock.jsx'

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
  const { stats, theme, toggleTheme } = useTodos()

  return (
    <section className={`rh-layer rh-layer--outer rh-theme-${theme}`}>
      <header className="rh-layer__head">
        <span className="rh-layer__title">第 1 层 · 应用外壳</span>
        <RenderBadge name="LayerOne" />
      </header>

      <div className="rh-metrics">
        <div className="rh-metric">
          <span>全部</span>
          <b>{stats.total}</b>
        </div>
        <div className="rh-metric">
          <span>进行中</span>
          <b>{stats.active}</b>
        </div>
        <div className="rh-metric">
          <span>已完成</span>
          <b>{stats.done}</b>
        </div>
        <div className="rh-metric">
          <span>完成度</span>
          <b>{stats.percent}%</b>
        </div>
      </div>

      <div className="rh-row rh-row--wrap">
        <Button size="small" icon={<BulbOutlined />} onClick={toggleTheme}>
          切换主题：当前 <code>{theme}</code>
        </Button>
        <span className="rh-hint">stats / theme 均取自 Context，本层未接收任何 props</span>
      </div>

      <LayerTwo />
    </section>
  )
}

/* ── 第 2 层：纯布局容器 —— 用 memo 包裹，且自己【不】消费 Context ── */
const LayerTwo = memo(function LayerTwo() {
  return (
    <section className="rh-layer rh-layer--mid">
      <header className="rh-layer__head">
        <span className="rh-layer__title">第 2 层 · 布局容器（memo 包裹，不消费 Context）</span>
        <RenderBadge name="LayerTwo" />
      </header>
      <p className="rh-hint">
        本层既不接收也不转发任何数据，还被 <code>memo</code> 包住，所以它自己不会因为 Context
        变化而重渲染；但它的子组件是真·消费者，依然会被直接唤醒 ——
        <strong>memo 挡得住 props，挡不住 Context</strong>。
      </p>
      <LayerThree />
    </section>
  )
})

/* ── 第 3 层：真正的数据消费方 ── */
function LayerThree() {
  const { todos, filter, stats, addTodo, toggleTodo, removeTodo, clearDone, changeFilter } = useTodos()
  const [text, setText] = useState('')

  const submit = () => {
    addTodo(text)
    setText('')
  }

  return (
    <section className="rh-layer rh-layer--inner">
      <header className="rh-layer__head">
        <span className="rh-layer__title">第 3 层 · 数据消费方</span>
        <RenderBadge name="LayerThree" />
      </header>

      <div className="rh-row">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={submit}
          placeholder="输入待办后回车或点「添加」"
          maxLength={40}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={submit}>
          添加
        </Button>
      </div>

      <div className="rh-row rh-row--between rh-row--wrap">
        <Segmented
          size="small"
          value={filter}
          onChange={changeFilter}
          options={[
            { label: '全部', value: 'all' },
            { label: '进行中', value: 'active' },
            { label: '已完成', value: 'done' },
          ]}
        />
        <Button
          size="small"
          icon={<ClearOutlined />}
          onClick={clearDone}
          disabled={stats.done === 0}
        >
          清除已完成
        </Button>
      </div>

      <div className="rh-list">
        {todos.map((t) => (
          <div key={t.id} className={`rh-list__item ${t.done ? 'is-done' : ''}`}>
            <label className="rh-list__label">
              <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
              <span>{t.text}</span>
            </label>
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeTodo(t.id)}
            />
          </div>
        ))}
        {todos.length === 0 && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的待办" />
        )}
      </div>

      <p className="rh-hint">
        本层只用 useState 保存输入框文字，业务数据全部来自 Context ——
        这就是跨层传值的意义：中间层不必为数据「修管道」。
      </p>
    </section>
  )
}

/** 四件套综合案例：一个 Provider 内部同时用上 useMemo / useCallback / useContext */
export default function ContextCase() {
  return (
    <div className="rh-case">
      <div className="rh-case__intro">
        <h2>四件套协作：主题色 + 待办清单</h2>
        <p>
          下面这套组件树共三层，中间层<b>不传递任何 props</b>。数据的下发全部依靠{' '}
          <code>createContext</code> + <code>useContext</code>；而保证「不该重渲染的组件别重渲染」，
          靠的是 <code>useMemo</code>（缓存注入对象与派生数据）和 <code>useCallback</code>
          （稳定回调引用）。每层右上角的渲染计数就是证据 —— 动手点一点，观察谁在重渲染。
        </p>
      </div>

      <CodeBlock title="四件套如何配合" lang="jsx" code={CASE_CODE} collapsible defaultOpen={false} />

      <TodoProvider>
        <LayerOne />
      </TodoProvider>

      <div className="rh-tips">
        <h3>观察实验</h3>
        <ul>
          <li>
            <b>勾选 / 新增待办</b>：LayerOne 与 LayerThree 都会重渲染（它们消费的 stats、todos
            变了），LayerTwo 纹丝不动。
          </li>
          <li>
            <b>切换主题</b>：所有消费 Context 的组件都会重渲染，包括并不使用 theme 的
            LayerThree —— 因为它们在读同一个 value 对象。这正是「Context 变化会穿透 memo」，
            所以高频字段应当拆到单独的 Context 里。
          </li>
          <li>
            <b>切换过滤器</b>：只有依赖 filter / visible 的消费方更新，说明{' '}
            <code>useMemo</code> 的依赖数组决定了「什么时候重算、什么时候复用」。
          </li>
        </ul>
      </div>
    </div>
  )
}
