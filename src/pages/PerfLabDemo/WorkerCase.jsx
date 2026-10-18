import { useState } from 'react'
import { Button, Card, Empty, Segmented, Slider, Space, Tag, Typography } from 'antd'
import { ApartmentOutlined } from '@ant-design/icons'
import { createWorker, crunch } from '@components/PerfLab/index.js'
import { useI18n } from '@i18n/index.js'
import './index.scss'

const { Text } = Typography

/**
 * 主线程 vs Web Worker 对照实验。
 * 判断标准不是「耗时谁短」（单次看 Worker 还要多付创建开销），
 * 而是「计算期间界面还动不动」—— 右上角那个方块是纯 CSS 动画，
 * 主线程被占满时它会当场停住，Worker 模式下照转不误。
 */
export default function WorkerCase() {
  const { t } = useI18n()
  const SIZE_OPTIONS = [
    { label: t('perf.worker.k10'), value: 100000 },
    { label: t('perf.worker.k30'), value: 300000 },
    { label: t('perf.worker.k60'), value: 600000 },
  ]
  const MODE_TAG = { main: { color: 'red', text: t('perf.worker.mainThread') }, worker: { color: 'green', text: 'Worker' } }

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
      title={<span><ApartmentOutlined /> {t('perf.worker.title')}</span>}
      extra={<div className="perf-lab__spinner" title={t('perf.worker.spinnerTitle')} />}
    >
      <div className="perf-lab__stage">
        <Text type="secondary" className="perf-lab__hint">
          {t('perf.worker.hint')}
        </Text>

        <div className="perf-lab__row">
          <Text style={{ fontSize: '0.78rem', minWidth: 92 }}>{t('perf.worker.fibLabel')}{n}</Text>
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
          <Text style={{ fontSize: '0.78rem' }}>{t('perf.worker.sortLen')}</Text>
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
            {t('perf.worker.runMain')}
          </Button>
          <Button type="primary" loading={busy === 'worker'} onClick={runWorker} disabled={busy === 'main'}>
            {t('perf.worker.runWorker')}
          </Button>
          {busy && <Tag color="processing">{t('perf.worker.computing')}</Tag>}
        </Space>

        {log.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('perf.worker.noRecord')} />
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
          {t('perf.worker.pitfall1')}<code>createWorker</code>{t('perf.worker.pitfall2')}
        </Text>
      </div>
    </Card>
  )
}
