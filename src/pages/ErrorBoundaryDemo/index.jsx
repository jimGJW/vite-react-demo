import { useState } from 'react'
import { Alert, Button, Card, Space, Tag, Typography } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import ErrorBoundary from '../../components/ErrorBoundary/index.jsx'
import { useAsyncError } from '../../components/ErrorBoundary/useAsyncError.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

/* —— 渲染期抛错：ErrorBoundary 天生能抓的类型 —— */
function Bomb({ armed, label }) {
  if (armed) throw new Error(`${label}：这是在渲染期抛出的错误`)
  return <Alert type="success" showIcon message="渲染正常，没有抛错" />
}

/* —— 事件 / 异步抛错：必须借助 useAsyncError 抛回渲染期 —— */
function AsyncThrower() {
  const throwError = useAsyncError()
  return (
    <Space wrap>
      <Button danger onClick={() => throwError(new Error('事件回调里抛的错 —— 已被边界接住'))}>
        事件回调里抛错
      </Button>
      <Button danger onClick={() => {
        setTimeout(() => throwError(new Error('定时器里抛的错 —— 已被边界接住')), 200)
      }}>
        定时器里抛错
      </Button>
      <Button danger onClick={() => {
        Promise.reject(new Error('Promise 里抛的错 —— 已被边界接住')).catch(throwError)
      }}>
        Promise 里抛错
      </Button>
    </Space>
  )
}

/* —— 对照组：不用 useAsyncError，直接在事件里 throw —— */
function NaiveThrower() {
  return (
    <Button onClick={() => {
      throw new Error('直接抛：边界看不见它（打开控制台能看到报错，但页面不会降级）')
    }}>
      直接抛（兜不住）
    </Button>
  )
}

/**
 * 错误边界与容错演示。
 * 核心结论：ErrorBoundary 只管渲染期，事件/异步的错误得自己抛回去。
 */
export default function ErrorBoundaryDemo() {
  const [armed, setArmed] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [armedKeyed, setArmedKeyed] = useState(false)
  const [caught, setCaught] = useState([])

  const record = (err) => {
    setCaught((list) => [{ msg: err.message, at: new Date().toLocaleTimeString() }, ...list].slice(0, 5))
  }

  return (
    <div className="ebd">
      <header className="ebd__header">
        <Title level={4} className="ebd__title">
          <SafetyCertificateOutlined /> 错误边界与容错
        </Title>
        <Paragraph type="secondary" className="ebd__lead">
          子树崩溃不等于整页白屏。<code>ErrorBoundary</code> 能把渲染错误圈在局部，
          换上降级 UI 并提供重试；而事件、定时器、Promise 里的错误它天生看不见 —— 那部分要靠
          <code> useAsyncError()</code> 抛回渲染期。下面四个案例都可以当场点。
        </Paragraph>
      </header>

      <div className="ebd__grid">
        {/* ===== 案例 1：渲染期错误 ===== */}
        <Card size="small" className="ebd__card" title="① 渲染期错误：边界天生能抓">
          <div className="ebd__stage">
            <Text type="secondary" className="ebd__hint">
              组件在 render 里 throw，会被最近的 ErrorBoundary 拦下，改渲染 fallback。
            </Text>
            <ErrorBoundary
              onError={(err) => record(err)}
              onReset={() => setArmed(false)}
              fallback={({ error, reset }) => (
                <div className="ebd__fallback">
                  <Text strong type="danger">子树已崩溃，页面其余部分不受影响</Text>
                  <Paragraph style={{ margin: '6px 0 8px', fontSize: '0.78rem' }}>
                    {error.message}
                  </Paragraph>
                  <Button size="small" onClick={reset}>重试（复位子树）</Button>
                </div>
              )}
            >
              <Bomb armed={armed} label="案例①" />
            </ErrorBoundary>
            <Space>
              <Button danger onClick={() => setArmed(true)}>触发渲染期错误</Button>
              <Button onClick={() => setArmed(false)}>复位</Button>
            </Space>
          </div>
        </Card>

        {/* ===== 案例 2：事件 / 异步错误 ===== */}
        <Card size="small" className="ebd__card" title="② 事件与异步错误：靠 useAsyncError 抛回渲染期">
          <div className="ebd__stage">
            <Text type="secondary" className="ebd__hint">
              点击下面任意按钮，错误会被 <code>useAsyncError</code> 在下一次渲染时抛出，
              于是同样被边界接住 —— 三个入口（事件 / 定时器 / Promise）效果一致。
            </Text>
            <ErrorBoundary
              onError={(err) => record(err)}
              fallback={({ error, reset }) => (
                <div className="ebd__fallback">
                  <Text strong type="danger">异步错误已被兜住</Text>
                  <Paragraph style={{ margin: '6px 0 8px', fontSize: '0.78rem' }}>
                    {error.message}
                  </Paragraph>
                  <Button size="small" onClick={reset}>重试</Button>
                </div>
              )}
            >
              <AsyncThrower />
            </ErrorBoundary>
            <pre className="ebd__code">{`const throwError = useAsyncError()

fetchData().catch(throwError)     // Promise
setTimeout(() => throwError(e), 0) // 定时器
onClick={() => throwError(e)}      // 事件`}</pre>
          </div>
        </Card>

        {/* ===== 案例 3：对照组 ===== */}
        <Card size="small" className="ebd__card" title="③ 对照组：直接 throw 边界看不见">
          <div className="ebd__stage">
            <Text type="secondary" className="ebd__hint">
              这个按钮也在 ErrorBoundary 里，但它在事件回调里直接 throw。
              点一下：控制台会报错，但<b>不会</b>出现降级 UI —— 因为事件处理发生在 React 渲染之外。
            </Text>
            <ErrorBoundary
              fallback={() => (
                <div className="ebd__fallback">你不会看到这行字 —— 边界抓不到事件里的错误</div>
              )}
            >
              <NaiveThrower />
            </ErrorBoundary>
            <Text type="secondary" className="ebd__hint">
              这正是案例 ② 存在的理由。
            </Text>
          </div>
        </Card>

        {/* ===== 案例 4：resetKeys ===== */}
        <Card size="small" className="ebd__card" title="④ resetKeys：依赖变了自动复位">
          <div className="ebd__stage">
            <Text type="secondary" className="ebd__hint">
              常见场景：切换用户 / 切换数据源后，旧的报错状态应当自动清空，
              而不是让用户手动点重试。把依赖传进 <code>resetKeys</code> 即可。
            </Text>
            <ErrorBoundary
              resetKeys={[resetKey]}
              onError={(err) => record(err)}
              fallback={({ error }) => (
                <div className="ebd__fallback">
                  <Text strong type="danger">已崩溃（resetKey = {resetKey}）</Text>
                  <Paragraph style={{ margin: '6px 0', fontSize: '0.78rem' }}>{error.message}</Paragraph>
                  <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                    改一下右边的 resetKey，边界会自动复位
                  </Text>
                </div>
              )}
            >
              <Bomb armed={armedKeyed} label="案例④" />
            </ErrorBoundary>
            <Space wrap>
              <Button danger onClick={() => setArmedKeyed(true)}>触发错误</Button>
              <Button type="primary" onClick={() => setResetKey((k) => k + 1)}>
                改 resetKey（当前 {resetKey}）
              </Button>
            </Space>
          </div>
        </Card>

        {/* ===== 捕获记录 ===== */}
        <Card size="small" className="ebd__card" title="onError 捕获记录（模拟上报）">
          <div className="ebd__stage">
            <Text type="secondary" className="ebd__hint">
              真实项目里 <code>onError</code> 通常接日志上报。这里只留最近 5 条。
            </Text>
            <div className="ebd__zone">
              {caught.length === 0 ? (
                <Text type="secondary" style={{ fontSize: '0.8rem' }}>还没有捕获到错误，去上面点几个按钮</Text>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                  {caught.map((c, i) => (
                    <li key={`${c.at}-${i}`} style={{ fontSize: '0.78rem' }}>
                      <Tag color="red">{c.at}</Tag>{c.msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <pre className="ebd__code">{`<ErrorBoundary
  fallback={({ error, reset }) => (
    <Result status="error" subTitle={error.message}
            extra={<Button onClick={reset}>重试</Button>} />
  )}
  onError={(err, info) => report(err, info.componentStack)}
  resetKeys={[userId]}
>
  <RiskyWidget />
</ErrorBoundary>`}</pre>
          </div>
        </Card>
      </div>
    </div>
  )
}
