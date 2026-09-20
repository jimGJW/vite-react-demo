import { Suspense, use, useActionState, useDeferredValue, useEffect, useEffectEvent, useId, useOptimistic, useRef, useState, useSyncExternalStore, useTransition } from 'react'
import { Button, Tag } from 'antd'
import CodeBlock from './CodeBlock.jsx'

/* ══════════════════════════════════════════════════════════════════
   React 19 新特性 · 可在浏览器里真实跑通的案例集合
   ══════════════════════════════════════════════════════════════════ */

/* ── ① useOptimistic：乐观更新 ── */
function OptimisticDemo() {
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
          点赞 {optimisticLikes}
        </Button>
        <span className="rh-hint">
          真实值 {likes}：点击后先 +1 显示，约 800ms 后被真实结果覆盖（期间按钮处于 pending）
        </span>
      </div>
    </div>
  )
}

/* ── ② useActionState：表单提交状态 ── */
async function submitName(_prev, formData) {
  const name = String(formData.get('name') || '').trim()
  await new Promise((resolve) => setTimeout(resolve, 600))
  if (!name) return { ok: false, message: '请填写名称' }
  if (name.length < 2) return { ok: false, message: '名称至少 2 个字符' }
  return { ok: true, message: `提交成功：${name}` }
}

function ActionStateDemo() {
  const [result, formAction, isPending] = useActionState(submitName, null)

  return (
    <div className="rh-demo">
      <form className="rh-row rh-row--wrap" action={formAction}>
        <input className="rh-input" name="name" placeholder="留空或只填 1 个字，看看校验" />
        <Button type="primary" htmlType="submit" loading={isPending}>
          {isPending ? '提交中…' : '提交'}
        </Button>
      </form>
      {result && (
        <p className={result.ok ? 'rh-msg rh-msg--ok' : 'rh-msg rh-msg--err'}>{result.message}</p>
      )}
      <p className="rh-hint">
        不用手写 onSubmit / useState / loading 三件套：action 直接接管提交、pending 与结果状态。
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
  return (
    <div className="rh-demo">
      <Suspense fallback={<span className="rh-pending">读取 Promise 中…（Suspense 兜底）</span>}>
        <ProfileView />
      </Suspense>
      <p className="rh-hint">
        <code>use(promise)</code> 会「挂起」当前组件，由最近的 <code>&lt;Suspense&gt;</code>{' '}
        兜底；Promise 必须来自组件外部（否则每次渲染都是新 Promise，会无限挂起）。
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
  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <IdField label="邮箱" />
        <IdField label="手机号" />
      </div>
      <p className="rh-hint">
        两个实例各自拿到互不冲突的稳定 id（形如 <code>:r1:</code>），
        label 与 input 正确关联 —— 服务端渲染与客户端 hydrate 结果一致。
      </p>
    </div>
  )
}

/* ── ⑤ useTransition：把「不紧急」的更新标记为可打断 ── */
const BIG_LIST = Array.from({ length: 6000 }, (_, i) => `数据条目 #${i + 1}`)

function TransitionDemo() {
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
        <input className="rh-input" value={keyword} onChange={onChange} placeholder="输入数字，筛选 6000 条数据" />
        {isPending ? <span className="rh-pending">列表更新中…</span> : <span className="rh-hint">命中 {list.length} 条</span>}
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
          placeholder="快速输入，观察两个值的差距"
        />
        {isStale && <span className="rh-pending">渲染落后于输入…</span>}
      </div>
      <div className="rh-deferred">
        <div>
          <span>输入值（紧急）</span>
          <b>{keyword || '（空）'}</b>
        </div>
        <div className={isStale ? 'is-stale' : undefined}>
          <span>延迟值（可让步）</span>
          <b>{deferredKeyword || '（空）'}</b>
        </div>
      </div>
      <p className="rh-hint">
        与 useTransition 的区别：那是在「改状态时」声明非紧急；这是在「读取时」主动降级，
        适合值来自外部、不方便包 transition 的场景。
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
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerSnapshot)

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <Tag color={isOnline ? 'green' : 'red'}>{isOnline ? '在线' : '离线'}</Tag>
        <span className="rh-hint">把系统网络开关拨一下，状态会立即跟随（浏览器 online / offline 事件驱动）</span>
      </div>
    </div>
  )
}

/* ── ⑧ useEffectEvent：在 effect 里读最新值，却不重新订阅 ── */
function EffectEventDemo() {
  const [room, setRoom] = useState('room-A')
  const [logs, setLogs] = useState(['已就绪'])

  const pushLog = useEffectEvent((line) => {
    setLogs((prev) => [...prev.slice(-3), line])
  })

  useEffect(() => {
    // 日志统一走异步回调：真实连接本来就是异步的，
    // 也顺便避开「effect 同步阶段 setState 会触发级联渲染」这条规则。
    const connecting = setTimeout(() => pushLog(`建立连接 → ${room}`), 0)
    const subscribed = setTimeout(() => pushLog(`订阅成功：${room}`), 500)
    return () => {
      clearTimeout(connecting)
      clearTimeout(subscribed)
    }
  }, [room])

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <Button size="small" onClick={() => setRoom((r) => (r === 'room-A' ? 'room-B' : 'room-A'))}>
          切换房间
        </Button>
        <code className="rh-chip">{room}</code>
      </div>
      <ul className="rh-logs">
        {logs.map((line, index) => (
          <li key={`${line}-${index}`}>{line}</li>
        ))}
      </ul>
      <p className="rh-hint">
        pushLog 由 useEffectEvent 定义：effect 内部能读到最新的 logs，但不需要把它写进依赖数组
        ——依赖里只有 room，所以「连接」只在换房间时重建。
      </p>
    </div>
  )
}

/* ── ⑨ 语法糖：ref 变成普通 prop（不用再 forwardRef） ── */
function FancyInput({ ref, ...rest }) {
  return <input className="rh-input" ref={ref} {...rest} />
}

function RefPropDemo() {
  const inputRef = useRef(null)

  return (
    <div className="rh-demo">
      <div className="rh-row rh-row--wrap">
        <FancyInput ref={inputRef} placeholder="ref 现在就是一个普通 prop" />
        <Button size="small" onClick={() => inputRef.current?.focus()}>
          聚焦输入框
        </Button>
      </div>
      <p className="rh-hint">
        函数组件可直接把 <code>ref</code> 当普通 prop 声明接收，React 19 不再需要{' '}
        <code>forwardRef</code> 包装。
      </p>
    </div>
  )
}

/* ── 卡片骨架 ── */
function FeatureCard({ tag, title, desc, usage, children }) {
  return (
    <section className="rh-feature">
      <header className="rh-feature__head">
        <Tag color="blue">{tag}</Tag>
        <h3>{title}</h3>
      </header>
      <p className="rh-feature__desc">{desc}</p>
      {children ? <div className="rh-feature__demo">{children}</div> : null}
      <CodeBlock title="使用方法" lang="jsx" code={usage} collapsible />
    </section>
  )
}

export default function NewFeatures() {
  return (
    <div className="rh-features">
      <div className="rh-case__intro">
        <h2>React 19 新特性</h2>
        <p>
          下面这些能力都来自当前项目实际依赖的 React 19.2，每个卡片都能在浏览器里直接动手验证。
        </p>
      </div>

      <FeatureCard
        tag="useOptimistic"
        title="乐观更新"
        desc="先按「预期结果」更新 UI，等请求返回再用真实数据覆盖；失败则自动回滚。"
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
        title="表单 action 状态"
        desc="一个 Hook 同时拿到「提交结果 / 派发给 form 的 action / pending 状态」，省掉手写的三件套。"
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
        title="在组件里读取 Promise"
        desc="用 use() 直接消费一个 Promise，配合 Suspense 完成加载态 —— 也是唯一允许条件调用的 Hook。"
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
        title="稳定唯一 id"
        desc="生成一个跨服务端/客户端一致的 id，专治 label↔input 关联、aria 属性等场景。"
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
        title="并发过渡"
        desc="把「不紧急」的状态更新标记为可打断：输入框永远跟手，重型列表渲染让路。"
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
        title="延迟值"
        desc="声明「这个值可以先旧着用」，让昂贵的下游渲染滞后一步，输入始终顺滑。"
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
        title="订阅外部数据源"
        desc="把浏览器 API、第三方 store 等 React 之外的数据，安全地接进渲染 —— 避免撕裂（tearing）。"
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
        title="effect 里读最新值"
        desc="把「事件逻辑」从 effect 依赖里摘出来：既能读到最新 props/state，又不会因此重新订阅。"
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
        title="ref 不再是特殊 prop"
        desc="React 19 起，函数组件可以直接把 ref 当普通 prop 接收，forwardRef 可以退休了。"
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
