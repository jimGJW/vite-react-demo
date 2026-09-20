import { createContext, memo, useCallback, useContext, useMemo, useState } from 'react'
import { Button, Switch, Tag, message } from 'antd'
import RenderBadge from './RenderBadge.jsx'
import CodeBlock from './CodeBlock.jsx'

/* ══════════════════════════════════════════════════════════════════
   以下 Context 均在本文件模块顶层创建且不做 export：
   · 不在组件内创建 —— 否则每次渲染都生成新 Context，消费组件被强制重挂载；
   · 不做 export   —— 保持「一个文件只导出组件」，符合 react-refresh 约束。
   ══════════════════════════════════════════════════════════════════ */
const UnitContext = createContext('px（createContext 的默认值）')
const UserContext = createContext({ name: '未登录' })

/* ─────────────────────────── ① createContext ─────────────────────────── */

function UnitReader() {
  const unit = useContext(UnitContext)
  return <code className="rh-chip">{unit}</code>
}

function CreateContextDemo() {
  const [unit, setUnit] = useState('rem（Provider 注入值）')
  const [withProvider, setWithProvider] = useState(true)

  return (
    <div className="rh-demo">
      <div className="rh-split">
        <div className="rh-split__item">
          <Tag>无 Provider</Tag>
          <UnitReader />
          <p className="rh-hint">回落到 createContext 的默认值</p>
        </div>
        <div className="rh-split__item">
          <Tag color="blue">有 Provider</Tag>
          {withProvider ? (
            <UnitContext value={unit}>
              <UnitReader />
            </UnitContext>
          ) : (
            <UnitReader />
          )}
          <p className="rh-hint">读取 Provider 注入的值</p>
        </div>
      </div>

      <div className="rh-row rh-row--wrap">
        <Switch
          checked={withProvider}
          onChange={setWithProvider}
          checkedChildren="挂载 Provider"
          unCheckedChildren="移除 Provider"
        />
        <Button
          size="small"
          onClick={() => setUnit((v) => (v.startsWith('rem') ? 'em（Provider 注入值）' : 'rem（Provider 注入值）'))}
        >
          改写 Provider 的值
        </Button>
      </div>
    </div>
  )
}

/* ─────────────────────────── ② useContext ─────────────────────────── */

function UserBadge() {
  const user = useContext(UserContext)
  return <Tag color="geekblue">{user.name}</Tag>
}

function DeepThree() {
  return <UserBadge />
}
function DeepTwo() {
  return <DeepThree />
}
function DeepOne() {
  return <DeepTwo />
}

function UseContextDemo() {
  const [name, setName] = useState('Ada')
  const value = useMemo(() => ({ name }), [name])

  return (
    <div className="rh-demo">
      <div className="rh-row">
        <Button onClick={() => setName((n) => (n === 'Ada' ? 'Linus' : 'Ada'))}>
          切换用户名
        </Button>
        <span className="rh-hint">
          当前注入：<code>{name}</code>
        </span>
      </div>

      <UserContext value={value}>
        <p className="rh-hint">下面三层嵌套，中间两层没有出现任何 props：</p>
        <div className="rh-nest">
          <DeepOne />
        </div>
      </UserContext>
    </div>
  )
}

/* ─────────────────────────── ③ useMemo ─────────────────────────── */

const MemoConfigChild = memo(function MemoConfigChild({ config }) {
  return (
    <div className="rh-child">
      <span>
        子组件收到 config.key = <code>{config.key}</code>
      </span>
      <RenderBadge name="memo 子组件" />
    </div>
  )
})

function UseMemoDemo() {
  const [tick, setTick] = useState(0)
  const [enabled, setEnabled] = useState(true)

  // 依赖为空 → 引用在整个生命周期内恒定
  const stableConfig = useMemo(() => ({ key: 'stable', note: '引用恒定' }), [])
  // 每次渲染都重新创建 → 引用每次都变
  const inlineConfig = { key: 'inline', note: '每次渲染都是新对象' }
  const config = enabled ? stableConfig : inlineConfig

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <Switch
          checked={enabled}
          onChange={setEnabled}
          checkedChildren="启用 useMemo"
          unCheckedChildren="关闭 useMemo"
        />
        <Button size="small" onClick={() => setTick((t) => t + 1)}>
          触发父组件重渲染（第 {tick + 1} 次）
        </Button>
      </div>

      <MemoConfigChild config={config} />

      <p className="rh-hint">
        子组件被 <code>memo</code> 包裹，只有 props 引用变化才会重渲染。
        关闭 useMemo 后，父组件每次渲染都会传下一个全新对象，子组件计数就会一路飙升。
      </p>
    </div>
  )
}

/* ─────────────────────────── ④ useCallback ─────────────────────────── */

const MemoActionChild = memo(function MemoActionChild({ onAction, note }) {
  return (
    <div className="rh-child">
      <Button size="small" onClick={onAction}>
        点我（回调来自父组件）
      </Button>
      <span className="rh-hint">{note}</span>
      <RenderBadge name="memo 子组件" />
    </div>
  )
})

function UseCallbackDemo() {
  const [tick, setTick] = useState(0)
  const [enabled, setEnabled] = useState(true)

  const stableAction = useCallback(() => {
    message.success('稳定回调：引用不变，子组件不会跟着白渲染')
  }, [])

  const inlineAction = () => {
    message.warning('内联回调：每次渲染都是新函数，memo 子组件必然重渲染')
  }

  const onAction = enabled ? stableAction : inlineAction

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <Switch
          checked={enabled}
          onChange={setEnabled}
          checkedChildren="启用 useCallback"
          unCheckedChildren="关闭 useCallback"
        />
        <Button size="small" onClick={() => setTick((t) => t + 1)}>
          触发父组件重渲染（第 {tick + 1} 次）
        </Button>
      </div>

      <MemoActionChild
        onAction={onAction}
        note={enabled ? 'useCallback 保证引用稳定' : '每次都是新函数'}
      />

      <p className="rh-hint">
        注意 <code>tick</code> 本身没有参与任何 props —— 它只是用来「逼父组件重渲染」的。
        这正是 useCallback 的价值：父组件因为别的原因重渲染时，不要连累 memo 子组件。
      </p>
    </div>
  )
}

/* ─────────────────────────── 讲解骨架 ─────────────────────────── */

function ApiSection({ index, name, purpose, usage, points, children }) {
  return (
    <section className="rh-api">
      <header className="rh-api__head">
        <span className="rh-api__index">{index}</span>
        <div>
          <h3 className="rh-api__name">
            <code>{name}</code>
          </h3>
          <p className="rh-api__purpose">{purpose}</p>
        </div>
      </header>

      <CodeBlock title={`${name} 使用方法`} lang="jsx" code={usage} collapsible />

      <div className="rh-api__demo">{children}</div>

      {points.length > 0 && (
        <ul className="rh-api__points">
          {points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function ApiBasics() {
  return (
    <div className="rh-basics">
      <div className="rh-case__intro">
        <h2>四个 API 逐个拆解</h2>
        <p>
          先看各自的「使用方法」，再动手验证结论。每个演示里的渲染计数都来自{' '}
          <code>RenderBadge</code>（用 ref + effect 写入 DOM，不污染渲染结果）。
        </p>
      </div>

      <ApiSection
        index="01"
        name="createContext"
        purpose="创建一个「数据通道」，让任意深度的子组件都能读同一份数据，而不必逐层传 props。"
        usage={`// 1. 模块顶层创建（❗不要在组件内部创建）
export const TodoContext = createContext(null)

// 2. 提供方注入值
<TodoContext value={{ todos, addTodo }}>
  <App />
</TodoContext>

// 3. 读取方
const { todos } = useContext(TodoContext)

// 参数 defaultValue 只在「完全找不到 Provider」时生效
const UnitContext = createContext('px')`}
        points={[
          'defaultValue 容易被误当成「初始值」——它只在没有 Provider 时兜底，不会被子组件 setState 修改。',
          '必须在模块顶层创建；写在组件内部会每次渲染生成新 Context，消费组件被强制重挂载。',
          'React 19 起可直接用 <Context value={...}>，不再强制写 <Context.Provider>。',
        ]}
      >
        <CreateContextDemo />
      </ApiSection>

      <ApiSection
        index="02"
        name="useContext"
        purpose="订阅某个 Context 的当前值。值一变，所有读取它的组件都会重渲染 —— 与组件嵌套多深无关。"
        usage={`const value = useContext(TodoContext)

// 惯用封装：把「必须在 Provider 内使用」的校验收敛到一处
export function useTodos() {
  const ctx = useContext(TodoContext)
  if (!ctx) throw new Error('useTodos 必须在 <TodoProvider> 内使用')
  return ctx
}`}
        points={[
          'Context 值变化会穿透 memo：被 memo 包裹的消费组件照样重渲染。',
          '因此高频变动的字段建议拆到单独的 Context，避免「改一个字段，全树重渲染」。',
          'useContext 读取的组件也必须在 Provider 的子树内，否则只会拿到默认值。',
        ]}
      >
        <UseContextDemo />
      </ApiSection>

      <ApiSection
        index="03"
        name="useMemo"
        purpose="缓存计算结果，依赖不变时复用上一次的值 —— 用来保住「引用」或跳过昂贵计算。"
        usage={`// ① 缓存对象/数组引用（保引用，配合 memo 子组件）
const config = useMemo(() => ({ size: 12, color: 'blue' }), [])

// ② 缓存派生数据（跳过重复计算）
const stats = useMemo(() => ({
  total: list.length,
  done: list.filter((t) => t.done).length,
}), [list])

// 依赖数组写法与 useEffect 一致：空数组 = 只算一次
const sorted = useMemo(() => [...list].sort(), [list])`}
        points={[
          'useMemo 不是「数据缓存」而是「引用兜底」：依赖变了，它照样重新计算。',
          '只有配合 memo / 依赖比较，缓存的引用才有意义；否则计算结果一样会被丢弃。',
          '不要什么都包 useMemo —— 计算本身很便宜时，包装成本可能更高。',
        ]}
      >
        <UseMemoDemo />
      </ApiSection>

      <ApiSection
        index="04"
        name="useCallback"
        purpose="缓存函数本身，让多次渲染之间拿到同一个函数引用，避免 memo 子组件被无谓刷新。"
        usage={`// 依赖为空 → 函数引用在整个生命周期内恒定
const handleAdd = useCallback((text) => {
  setTodos((prev) => [{ id: nextId(), text }, ...prev])
}, [])

// 依赖变化时才会产生新函数（注意别漏依赖）
const handleSearch = useCallback(() => {
  doSearch(keyword)
}, [keyword])

// 等价写法：useCallback(fn, deps) === useMemo(() => fn, deps)`}
        points={[
          'useCallback(fn, deps) 等价于 useMemo(() => fn, deps)，前者更语义化。',
          '回调里用到的外部变量必须放进依赖数组，否则会拿到陈旧闭包值。',
          'setState 的函数式写法 setX(prev => …) 可以让你把依赖写成空数组，是最常用的组合。',
        ]}
      >
        <UseCallbackDemo />
      </ApiSection>
    </div>
  )
}
