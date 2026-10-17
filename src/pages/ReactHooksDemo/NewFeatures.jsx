import { Suspense, use, useActionState, useDeferredValue, useEffect, useEffectEvent, useId, useOptimistic, useRef, useState, useSyncExternalStore, useTransition } from 'react'
import { Button, Tag } from 'antd'
import CodeBlock from './CodeBlock.jsx'
import { useI18n } from '../../i18n/index.js'

/* ══════════════════════════════════════════════════════════════════
   React 19 新特性 · 可在浏览器里真实跑通的案例集合
   ══════════════════════════════════════════════════════════════════ */

// tag → i18n key 的静态映射（避免用变量拼接 key）
const FEATURE_KEYS = {
  useOptimistic: { title: 'hooks.features.card.optTitle', desc: 'hooks.features.card.optDesc' },
  useActionState: { title: 'hooks.features.card.actionTitle', desc: 'hooks.features.card.actionDesc' },
  use: { title: 'hooks.features.card.useTitle', desc: 'hooks.features.card.useDesc' },
  useId: { title: 'hooks.features.card.idTitle', desc: 'hooks.features.card.idDesc' },
  useTransition: { title: 'hooks.features.card.transitionTitle', desc: 'hooks.features.card.transitionDesc' },
  useDeferredValue: { title: 'hooks.features.card.deferredTitle', desc: 'hooks.features.card.deferredDesc' },
  useSyncExternalStore: { title: 'hooks.features.card.syncTitle', desc: 'hooks.features.card.syncDesc' },
  useEffectEvent: { title: 'hooks.features.card.effectTitle', desc: 'hooks.features.card.effectDesc' },
  'ref as prop': { title: 'hooks.features.card.refTitle', desc: 'hooks.features.card.refDesc' },
}

/* ── ① useOptimistic：乐观更新 ── */
function OptimisticDemo() {
  const { t } = useI18n()
  const [likes, setLikes] = useState(128)
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,
    (current, delta) => current + delta,
  )
  const [isPending, startTransition] = useTransition()

  const like = () => {
    startTransition(async () => {
      addOptimisticLike(1) // 立刻上屏
      await new Promise((resolve) => setTimeout(resolve, 800)) // 模拟请求
      setLikes((v) => v + 1) // 用真实结果覆盖
    })
  }

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <Button type="primary" onClick={like} loading={isPending}>
          {t('hooks.features.like', { n: optimisticLikes })}
        </Button>
        <span className="rh-hint">
          {t('hooks.features.realValue', { n: likes })}
        </span>
      </div>
    </div>
  )
}

/* ── ② useActionState：表单提交状态 ── */
function ActionStateDemo() {
  const { t } = useI18n()
  const submitName = async (_prev, formData) => {
    const name = String(formData.get('name') || '').trim()
    await new Promise((resolve) => setTimeout(resolve, 600))
    if (!name) return { ok: false, message: t('hooks.features.errEmpty') }
    if (name.length < 2) return { ok: false, message: t('hooks.features.errShort') }
    return { ok: true, message: t('hooks.features.success', { name }) }
  }
  const [result, formAction, isPending] = useActionState(submitName, null)

  return (
    <div className="rh-demo">
      <form className="rh-row rh-row--wrap" action={formAction}>
        <input className="rh-input" name="name" placeholder={t('hooks.features.namePlaceholder')} />
        <Button type="primary" htmlType="submit" loading={isPending}>
          {isPending ? t('hooks.features.submitting') : t('hooks.features.submit')}
        </Button>
      </form>
      {result && (
        <p className={result.ok ? 'rh-msg rh-msg--ok' : 'rh-msg rh-msg--err'}>{result.message}</p>
      )}
      <p className="rh-hint">
        {t('hooks.features.actionHint')}
      </p>
    </div>
  )
}

/* ── ③ use：读取 Promise（配合 Suspense） ── */
const profilePromise = new Promise((resolve) => {
  setTimeout(() => resolve({ name: 'Ada Lovelace', role: '首位程序员' }), 900)
})

function ProfileView() {
  const profile = use(profilePromise)
  return (
    <span className="rh-row">
      <Tag color="purple">{profile.name}</Tag>
      <span className="rh-hint">{profile.role}</span>
    </span>
  )
}

function UseApiDemo() {
  const { t } = useI18n()
  return (
    <div className="rh-demo">
      <Suspense fallback={<span className="rh-pending">{t('hooks.features.usePending')}</span>}>
        <ProfileView />
      </Suspense>
      <p className="rh-hint">
        {t('hooks.features.useHint')}
      </p>
    </div>
  )
}

/* ── ④ useId：稳定唯一 id ── */
function IdField({ label }) {
  const id = useId()
  return (
    <div className="rh-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="rh-input" placeholder={id} />
    </div>
  )
}

function UseIdDemo() {
  const { t } = useI18n()
  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <IdField label={t('hooks.features.emailLabel')} />
        <IdField label={t('hooks.features.phoneLabel')} />
      </div>
      <p className="rh-hint">
        {t('hooks.features.idHint')}
      </p>
    </div>
  )
}

/* ── ⑤ useTransition：把「不紧急」的更新标记为可打断 ── */
const BIG_LIST = Array.from({ length: 6000 }, (_, i) => `数据条目 #${i + 1}`)

function TransitionDemo() {
  const { t } = useI18n()
  const [keyword, setKeyword] = useState('')
  const [list, setList] = useState(BIG_LIST)
  const [isPending, startTransition] = useTransition()

  const onChange = (e) => {
    const value = e.target.value
    setKeyword(value) // 紧急更新：输入框必须立刻回显
    startTransition(() => {
      // 非紧急：6000 条筛选可以被打断，不阻塞输入
      setList(value ? BIG_LIST.filter((item) => item.includes(value)) : BIG_LIST)
    })
  }

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <input className="rh-input" value={keyword} onChange={onChange} placeholder={t('hooks.features.filterPlaceholder')} />
        {isPending ? <span className="rh-pending">{t('hooks.features.listUpdating')}</span> : <span className="rh-hint">{t('hooks.features.hitCount', { n: list.length })}</span>}
      </div>
      <div className="rh-scroll">
        {list.slice(0, 60).map((item) => (
          <div key={item} className="rh-scroll__row">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── ⑥ useDeferredValue：让慢渲染滞后于输入 ── */
function DeferredDemo() {
  const { t } = useI18n()
  const [keyword, setKeyword] = useState('')
  const deferredKeyword = useDeferredValue(keyword)
  const isStale = keyword !== deferredKeyword

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <input
          className="rh-input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t('hooks.features.deferredPlaceholder')}
        />
        {isStale && <span className="rh-pending">{t('hooks.features.deferredStale')}</span>}
      </div>
      <div className="rh-deferred">
        <div>
          <span>{t('hooks.features.inputValLabel')}</span>
          <b>{keyword || t('hooks.features.empty')}</b>
        </div>
        <div className={isStale ? 'is-stale' : undefined}>
          <span>{t('hooks.features.deferredValLabel')}</span>
          <b>{deferredKeyword || t('hooks.features.empty')}</b>
        </div>
      </div>
      <p className="rh-hint">
        {t('hooks.features.deferredHint')}
      </p>
    </div>
  )
}

/* ── ⑦ useSyncExternalStore：订阅 React 之外的数据源 ── */
function subscribeOnline(callback) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}
const getOnlineSnapshot = () => navigator.onLine
const getServerSnapshot = () => true

function SyncStoreDemo() {
  const { t } = useI18n()
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerSnapshot)

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <Tag color={isOnline ? 'green' : 'red'}>{isOnline ? t('hooks.features.online') : t('hooks.features.offline')}</Tag>
        <span className="rh-hint">{t('hooks.features.syncHint')}</span>
      </div>
    </div>
  )
}

/* ── ⑧ useEffectEvent：在 effect 里读最新值，却不重新订阅 ── */
function EffectEventDemo() {
  const { t } = useI18n()
  const [room, setRoom] = useState('room-A')
  const [logs, setLogs] = useState([t('hooks.features.ready')])

  const pushLog = useEffectEvent((line) => {
    setLogs((prev) => [...prev.slice(-3), line])
  })

  useEffect(() => {
    // 日志统一走异步回调：真实连接本来就是异步的，
    // 也顺便避开「effect 同步阶段 setState 会触发级联渲染」这条规则。
    const connecting = setTimeout(() => pushLog(t('hooks.features.connectLog', { room })), 0)
    const subscribed = setTimeout(() => pushLog(t('hooks.features.subscribeLog', { room })), 500)
    return () => {
      clearTimeout(connecting)
      clearTimeout(subscribed)
    }
  }, [room, t])

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <Button size="small" onClick={() => setRoom((r) => (r === 'room-A' ? 'room-B' : 'room-A'))}>
          {t('hooks.features.switchRoom')}
        </Button>
        <code className="rh-chip">{room}</code>
      </div>
      <ul className="rh-logs">
        {logs.map((line, index) => (
          <li key={`${line}-${index}`}>{line}</li>
        ))}
      </ul>
      <p className="rh-hint">
        {t('hooks.features.effectHint')}
      </p>
    </div>
  )
}

/* ── ⑨ 语法糖：ref 变成普通 prop（不用再 forwardRef） ── */
function FancyInput({ ref, ...rest }) {
  return <input className="rh-input" ref={ref} {...rest} />
}

function RefPropDemo() {
  const { t } = useI18n()
  const inputRef = useRef(null)

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <FancyInput ref={inputRef} placeholder={t('hooks.features.refPlaceholder')} />
        <Button size="small" onClick={() => inputRef.current?.focus()}>
          {t('hooks.features.focusInput')}
        </Button>
      </div>
      <p className="rh-hint">
        {t('hooks.features.refHint')}
      </p>
    </div>
  )
}

/* ── 卡片骨架 ── */
function FeatureCard({ tag, usage, children }) {
  const { t } = useI18n()
  const k = FEATURE_KEYS[tag]
  return (
    <section className="rh-feature">
      <header className="rh-feature__head">
        <Tag color="blue">{tag}</Tag>
        <h3>{t(k.title)}</h3>
      </header>
      <p className="rh-feature__desc">{t(k.desc)}</p>
      {children ? <div className="rh-feature__demo">{children}</div> : null}
      <CodeBlock title={t('hooks.features.usageTitle')} lang="jsx" code={usage} collapsible />
    </section>
  )
}

export default function NewFeatures() {
  const { t } = useI18n()
  return (
    <div className="rh-features">
      <div className="rh-case__intro">
        <h2>{t('hooks.features.title')}</h2>
        <p>
          {t('hooks.features.intro')}
        </p>
      </div>

      <FeatureCard
        tag="useOptimistic"
        usage={`const [optimisticLikes, addOptimisticLike] = useOptimistic(
  likes,
  (current, delta) => current + delta,
)

startTransition(async () => {
  addOptimisticLike(1)        // 立刻上屏
  const res = await api.like() // 真实请求
  setLikes(res.total)          // 用真实值覆盖
})`}
      >
        <OptimisticDemo />
      </FeatureCard>

      <FeatureCard
        tag="useActionState"
        usage={`const [result, formAction, isPending] = useActionState(
  async (_prev, formData) => {
    const name = formData.get('name')
    if (!name) return { ok: false, message: '必填' }
    return { ok: true, message: '提交成功' }
  },
  null, // 初始值
)

<form action={formAction}>
  <input name="name" />
  <button disabled={isPending}>提交</button>
</form>`}
      >
        <ActionStateDemo />
      </FeatureCard>

      <FeatureCard
        tag="use"
        usage={`// Promise 必须在组件外部创建，否则每次渲染都是新实例
const profilePromise = fetchProfile()

function ProfileView() {
  const profile = use(profilePromise)  // 会挂起，交给 <Suspense>
  return <h3>{profile.name}</h3>
}

<Suspense fallback={<Spinner />}>
  <ProfileView />
</Suspense>`}
      >
        <UseApiDemo />
      </FeatureCard>

      <FeatureCard
        tag="useId"
        usage={`function Field({ label }) {
  const id = useId()      // 形如 :r1:，同一次渲染内稳定
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  )
}`}
      >
        <UseIdDemo />
      </FeatureCard>

      <FeatureCard
        tag="useTransition"
        usage={`const [isPending, startTransition] = useTransition()

const onChange = (e) => {
  setKeyword(e.target.value)   // 紧急：立即回显
  startTransition(() => {      // 非紧急：可被打断
    setList(filterBigList(e.target.value))
  })
}`}
      >
        <TransitionDemo />
      </FeatureCard>

      <FeatureCard
        tag="useDeferredValue"
        usage={`const [keyword, setKeyword] = useState('')
const deferredKeyword = useDeferredValue(keyword)

// 输入框绑定 keyword（即时），重列表绑定 deferredKeyword（可落后）
<input value={keyword} onChange={(e) => setKeyword(e.target.value)} />
<BigList keyword={deferredKeyword} />`}
      >
        <DeferredDemo />
      </FeatureCard>

      <FeatureCard
        tag="useSyncExternalStore"
        usage={`function subscribe(callback) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

const isOnline = useSyncExternalStore(
  subscribe,
  () => navigator.onLine,   // 客户端快照
  () => true,               // 服务端快照（可选）
)`}
      >
        <SyncStoreDemo />
      </FeatureCard>

      <FeatureCard
        tag="useEffectEvent"
        usage={`const pushLog = useEffectEvent((line) => {
  setLogs((prev) => [...prev, line])   // 读最新 logs
})

useEffect(() => {
  connect(room)
  pushLog('已连接')
  return () => disconnect(room)
}, [room])   // ← 依赖里不需要出现 pushLog`}
      >
        <EffectEventDemo />
      </FeatureCard>

      <FeatureCard
        tag="ref as prop"
        usage={`// ✅ React 19
function FancyInput({ ref, ...rest }) {
  return <input ref={ref} {...rest} />
}

// ❌ React 18 及以前：必须包一层
const FancyInput = forwardRef(function FancyInput(props, ref) {
  return <input ref={ref} {...props} />
})`}
      >
        <RefPropDemo />
      </FeatureCard>
    </div>
  )
}
