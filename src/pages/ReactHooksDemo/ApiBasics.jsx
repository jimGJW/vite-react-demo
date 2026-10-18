import { createContext, memo, useCallback, useContext, useMemo, useState } from 'react'
import { Button, Switch, Tag, message } from 'antd'
import RenderBadge from './RenderBadge.jsx'
import CodeBlock from './CodeBlock.jsx'
import { useI18n } from '@i18n/index.js'

// 每个 API 的 purpose / points 文案已在 i18n 中；用静态映射把 name 对应到字面量 key，
// 避免使用变量拼接 key（规则禁止动态构造 key）。
const API_KEYS = {
  createContext: { purpose: 'hooks.api.purpose.createContext', points: 'hooks.api.points.createContext' },
  useContext: { purpose: 'hooks.api.purpose.useContext', points: 'hooks.api.points.useContext' },
  useMemo: { purpose: 'hooks.api.purpose.useMemo', points: 'hooks.api.points.useMemo' },
  useCallback: { purpose: 'hooks.api.purpose.useCallback', points: 'hooks.api.points.useCallback' },
}

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
  const { t } = useI18n()
  const [unit, setUnit] = useState('rem（Provider 注入值）')
  const [withProvider, setWithProvider] = useState(true)

  return (
    <div className="rh-demo">
      <div className="rh-split">
        <div className="rh-split__item">
          <Tag>{t('hooks.api.noProvider')}</Tag>
          <UnitReader />
          <p className="rh-hint">{t('hooks.api.fallbackDefault')}</p>
        </div>
        <div className="rh-split__item">
          <Tag color="blue">{t('hooks.api.withProvider')}</Tag>
          {withProvider ? (
            <UnitContext value={unit}>
              <UnitReader />
            </UnitContext>
          ) : (
            <UnitReader />
          )}
          <p className="rh-hint">{t('hooks.api.readInjected')}</p>
        </div>
      </div>

      <div className="rh-row rh-row--wrap">
        <Switch
          checked={withProvider}
          onChange={setWithProvider}
          checkedChildren={t('hooks.api.mountProvider')}
          unCheckedChildren={t('hooks.api.removeProvider')}
        />
        <Button
          size="small"
          onClick={() => setUnit((v) => (v.startsWith('rem') ? 'em（Provider 注入值）' : 'rem（Provider 注入值）'))}
        >
          {t('hooks.api.rewriteProvider')}
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
  const { t } = useI18n()
  const [name, setName] = useState('Ada')
  const value = useMemo(() => ({ name }), [name])

  return (
    <div className="rh-demo">
      <div className="rh-row">
        <Button onClick={() => setName((n) => (n === 'Ada' ? 'Linus' : 'Ada'))}>
          {t('hooks.api.switchUser')}
        </Button>
        <span className="rh-hint">
          {t('hooks.api.injectingNow')}<code>{name}</code>
        </span>
      </div>

      <UserContext value={value}>
        <p className="rh-hint">{t('hooks.api.nestedNoProps')}</p>
        <div className="rh-nest">
          <DeepOne />
        </div>
      </UserContext>
    </div>
  )
}

/* ─────────────────────────── ③ useMemo ─────────────────────────── */

const MemoConfigChild = memo(function MemoConfigChild({ config, t }) {
  return (
    <div className="rh-child">
      <span>
        {t('hooks.api.memoChildReceived')} <code>{config.key}</code>
      </span>
      <RenderBadge name={t('hooks.api.memoChildName')} />
    </div>
  )
})

function UseMemoDemo() {
  const { t } = useI18n()
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
          checkedChildren={t('hooks.api.enableUseMemo')}
          unCheckedChildren={t('hooks.api.disableUseMemo')}
        />
        <Button size="small" onClick={() => setTick((n) => n + 1)}>
          {t('hooks.api.rerenderTick', { n: tick + 1 })}
        </Button>
      </div>

      <MemoConfigChild config={config} t={t} />

      <p className="rh-hint">
        子组件被 <code>memo</code> 包裹，只有 props 引用变化才会重渲染。
        关闭 useMemo 后，父组件每次渲染都会传下一个全新对象，子组件计数就会一路飙升。
      </p>
    </div>
  )
}

/* ─────────────────────────── ④ useCallback ─────────────────────────── */

const MemoActionChild = memo(function MemoActionChild({ onAction, note, t }) {
  return (
    <div className="rh-child">
      <Button size="small" onClick={onAction}>
        {t('hooks.api.clickFromParent')}
      </Button>
      <span className="rh-hint">{note}</span>
      <RenderBadge name={t('hooks.api.memoChildName')} />
    </div>
  )
})

function UseCallbackDemo() {
  const { t } = useI18n()
  const [tick, setTick] = useState(0)
  const [enabled, setEnabled] = useState(true)

  const stableAction = useCallback(() => {
    message.success(t('hooks.api.stableCallback'))
  }, [t])

  const inlineAction = () => {
    message.warning(t('hooks.api.inlineCallback'))
  }

  const onAction = enabled ? stableAction : inlineAction

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <Switch
          checked={enabled}
          onChange={setEnabled}
          checkedChildren={t('hooks.api.enableUseCallback')}
          unCheckedChildren={t('hooks.api.disableUseCallback')}
        />
        <Button size="small" onClick={() => setTick((n) => n + 1)}>
          {t('hooks.api.rerenderTick', { n: tick + 1 })}
        </Button>
      </div>

      <MemoActionChild
        onAction={onAction}
        note={enabled ? t('hooks.api.callbackStable') : t('hooks.api.callbackInline')}
        t={t}
      />

      <p className="rh-hint">
        {t('hooks.api.tickNote')}
      </p>
    </div>
  )
}

/* ─────────────────────────── 讲解骨架 ─────────────────────────── */

function ApiSection({ index, name, usage, children }) {
  const { t } = useI18n()
  const k = API_KEYS[name]
  const purpose = t(k.purpose)
  const points = t(k.points).split('；')
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

      <CodeBlock title={`${name} ${t('hooks.api.usageTitle')}`} lang="jsx" code={usage} collapsible />

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
  const { t } = useI18n()
  return (
    <div className="rh-basics">
      <div className="rh-case__intro">
        <h2>{t('hooks.api.introTitle')}</h2>
        <p>
          {t('hooks.api.introDesc')}
        </p>
      </div>

      <ApiSection
        index="01"
        name="createContext"
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
      >
        <CreateContextDemo />
      </ApiSection>

      <ApiSection
        index="02"
        name="useContext"
        usage={`const value = useContext(TodoContext)

// 惯用封装：把「必须在 Provider 内使用」的校验收敛到一处
export function useTodos() {
  const ctx = useContext(TodoContext)
  if (!ctx) throw new Error('useTodos 必须在 <TodoProvider> 内使用')
  return ctx
}`}
      >
        <UseContextDemo />
      </ApiSection>

      <ApiSection
        index="03"
        name="useMemo"
        usage={`// ① 缓存对象/数组引用（保引用，配合 memo 子组件）
const config = useMemo(() => ({ size: 12, color: 'blue' }), [])

// ② 缓存派生数据（跳过重复计算）
const stats = useMemo(() => ({
  total: list.length,
  done: list.filter((t) => t.done).length,
}), [list])

// 依赖数组写法与 useEffect 一致：空数组 = 只算一次
const sorted = useMemo(() => [...list].sort(), [list])`}
      >
        <UseMemoDemo />
      </ApiSection>

      <ApiSection
        index="04"
        name="useCallback"
        usage={`// 依赖为空 → 函数引用在整个生命周期内恒定
const handleAdd = useCallback((text) => {
  setTodos((prev) => [{ id: nextId(), text }, ...prev])
}, [])

// 依赖变化时才会产生新函数（注意别漏依赖）
const handleSearch = useCallback(() => {
  doSearch(keyword)
}, [keyword])

// 等价写法：useCallback(fn, deps) === useMemo(() => fn, deps)`}
      >
        <UseCallbackDemo />
      </ApiSection>
    </div>
  )
}
