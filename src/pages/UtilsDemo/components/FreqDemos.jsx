import { useMemo, useState } from 'react'
import { Input, Button, Space, Typography } from 'antd'
import { debounce, throttle, retry, sleep, useDebounce, useThrottle } from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'

const { Text } = Typography

/** 频率控制：防抖 / 节流 / 异步重试 */
export default function FreqDemos() {
  const [text, setText] = useState('')
  const debounced = useDebounce(text, 400)
  const [clicks, setClicks] = useState(0)
  const throttled = useThrottle(clicks, 600)
  const [log, setLog] = useState('（点击按钮观察）')

  const dLog = useMemo(() => debounce((v) => setLog(`debounce 触发：${v}`), 500), [])
  const tLog = useMemo(() => throttle(() => setLog(`throttle 触发 @ ${new Date().toLocaleTimeString('zh-CN')}`), 800), [])
  const [retryOut, setRetryOut] = useState('')

  return (
    <>
      <DemoCard
        title="useDebounce · 防抖值"
        desc="输入停止 400ms 后才更新，适合搜索联想、表单校验。"
        usage="<const debounced = useDebounce(text, 400)>"
      >
        <Input placeholder="输入一些文字" value={text} onChange={(e) => setText(e.target.value)} style={{ maxWidth: 260 }} />
        <div className="utils-demo__out">防抖后：{debounced || '（空）'}</div>
      </DemoCard>

      <DemoCard
        title="useThrottle · 节流值"
        desc="600ms 内最多更新一次，适合滚动 / 高频点击。"
        usage="<const throttled = useThrottle(clicks, 600)>"
      >
        <Space>
          <Button size="small" onClick={() => setClicks((c) => c + 1)}>快速点击 +1</Button>
          <Text type="secondary">原始 {clicks} / 节流后 {throttled}</Text>
        </Space>
      </DemoCard>

      <DemoCard
        title="debounce / throttle 函数"
        desc="直接包裹回调；均带 cancel()，卸载自动清理。"
        usage="const d = debounce(fn, 500)  // d.cancel() / d.flush()"
      >
        <Space wrap>
          <Button size="small" onClick={() => dLog(Date.now())}>debounce 调用</Button>
          <Button size="small" onClick={() => tLog()}>throttle 调用</Button>
        </Space>
        <div className="utils-demo__out">{log}</div>
      </DemoCard>

      <DemoCard
        title="retry / sleep · 异步重试"
        desc="失败自动重试 N 次；sleep 为 Promise 版定时器。"
        usage="await retry(fetchData, { times: 3, delay: 200 })"
      >
        <Button
          size="small"
          onClick={async () => {
            setRetryOut('重试中…')
            let n = 0
            try {
              const r = await retry(async () => {
                n += 1
                if (n < 3) throw new Error('boom')
                await sleep(80)
                return `第 ${n} 次成功`
              }, { times: 3, delay: 60 })
              setRetryOut(r)
            } catch (e) {
              setRetryOut(`失败：${e.message}`)
            }
          }}
        >
          模拟「前 2 次失败」
        </Button>
        <div className="utils-demo__out">{retryOut || '点击按钮'}</div>
      </DemoCard>
    </>
  )
}
