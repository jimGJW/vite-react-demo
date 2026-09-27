import { useState } from 'react'
import { Button, Card, Empty, Segmented, Slider, Space, Tag, Typography } from 'antd'
import { ApartmentOutlined } from '@ant-design/icons'
import { createWorker, crunch } from '../../components/PerfLab/index.js'
import './index.scss'

const { Text } = Typography

const SIZE_OPTIONS = [
  { label: '10 万', value: 100000 },
  { label: '30 万', value: 300000 },
  { label: '60 万', value: 600000 },
]

const MODE_TAG = { main: { color: 'red', text: '主线程' }, worker: { color: 'green', text: 'Worker' } }

/**
 * 主线程 vs Web Worker 对照实验。
 * 判断标准不是「耗时谁短」（单次看 Worker 还要多付创建开销），
 * 而是「计算期间界面还动不动」—— 右上角那个方块是纯 CSS 动画，
 * 主线程被占满时它会当场停住，Worker 模式下照转不误。
 */
export default function WorkerCase() {
  const [n, setN] = useState(30)
  const [size, setSize] = useState(300000)
  const [busy, setBusy] = useState(null)   // 'main' | 'worker' | null
  const [log, setLog] = useState([])       // [{ mode, ms, error? }]

  const pushLog = (entry) => setLog((l) => [entry, ...l].slice(0, 6))

  /* 主线程：先让浏览器画出一帧「计算中」，再同步阻塞，
     否则 setState 和计算挤在同一次任务里，动画根本来不及卡给人看 */
  const runMain = () => {
    setBusy('main')
    requestAnimationFrame(() => {
      setTimeout(() => {
        const t0 = performance.now()
        try {
          crunch({ n, size })
          pushLog({ mode: 'main', ms: performance.now() - t0 })
        } catch (err) {
          pushLog({ mode: 'main', ms: 0, error: String(err?.message || err) })
        }
        setBusy(null)
      }, 0)
    })
  }

  const runWorker = async () => {
    setBusy('worker')
    const w = createWorker(crunch)
    const t0 = performance.now()
    try {
      await w.run({ n, size })
      pushLog({ mode: 'worker', ms: performance.now() - t0 })
    } catch (err) {
      pushLog({ mode: 'worker', ms: 0, error: String(err?.message || err) })
    } finally {
      w.terminate()
      setBusy(null)
    }
  }

  return (
    <Card
      size="small"
      className="perf-lab__card"
      title={<span><ApartmentOutlined /> Web Worker：把重计算搬出主线程</span>}
      extra={<div className="perf-lab__spinner" title="主线程被占满时它会停住" />}
    >
      <div className="perf-lab__stage">
        <Text type="secondary" className="perf-lab__hint">
          右上角方块是纯 CSS 动画，不依赖 JS。点「主线程计算」时它会当场停住 —— 这就是用户感受到的「卡死」；
          点「Worker 计算」时它照转，界面全程可交互。
        </Text>

        <div className="perf-lab__row">
          <Text style={{ fontSize: '0.78rem', minWidth: 92 }}>斐波那契 n = {n}</Text>
          <Slider
            style={{ flex: '1 1 200px', minWidth: 160 }}
            min={20}
            max={34}
            value={n}
            onChange={setN}
            disabled={busy !== null}
          />
        </div>

        <div className="perf-lab__row">
          <Text style={{ fontSize: '0.78rem' }}>排序数组长度</Text>
          <Segmented
            size="small"
            value={size}
            onChange={setSize}
            options={SIZE_OPTIONS}
            disabled={busy !== null}
          />
        </div>

        <Space>
          <Button danger loading={busy === 'main'} onClick={runMain} disabled={busy === 'worker'}>
            主线程计算
          </Button>
          <Button type="primary" loading={busy === 'worker'} onClick={runWorker} disabled={busy === 'main'}>
            Worker 计算
          </Button>
          {busy && <Tag color="processing">计算中…注意看右上角方块</Tag>}
        </Space>

        {log.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有测量记录，点上面两个按钮各跑一次" />
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
            {log.map((entry, i) => {
              const meta = MODE_TAG[entry.mode] || { color: 'default', text: entry.mode }
              return (
                <li key={`${entry.mode}-${entry.ms}-${i}`} className="perf-lab__row" style={{ justifyContent: 'space-between' }}>
                  <Tag color={meta.color}>{meta.text}</Tag>
                  {entry.error
                    ? <Text type="danger" style={{ fontSize: '0.78rem' }}>{entry.error}</Text>
                    : <Text style={{ fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                        {entry.ms.toFixed(1)} ms
                      </Text>}
                </li>
              )
            })}
          </ul>
        )}

        <pre className="perf-lab__code">{`import { createWorker, crunch } from '@/components/PerfLab'

const worker = createWorker(crunch)          // 纯函数直接变 Worker
const result = await worker.run({ n: 30, size: 300000 })
worker.terminate()                           // 用完务必销毁`}</pre>

        <Text type="secondary" className="perf-lab__hint">
          坑位提醒：传给 <code>createWorker</code> 的函数会被字符串化搬进 Worker，
          因此必须自包含，不能引用外部闭包变量（这是 Worker 的固有限制，不是封装的问题）。
          另外 Worker 有创建开销，细碎计算不值得搬 —— 只有「能感觉到卡」的任务才该搬。
        </Text>
      </div>
    </Card>
  )
}
