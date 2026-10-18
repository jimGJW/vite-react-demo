import { useMemo, useState } from 'react'
import { Input, Button, Space, Typography } from 'antd'
import { debounce, throttle, retry, sleep, useDebounce, useThrottle } from '@components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { useI18n } from '@i18n/index.js'

const { Text } = Typography

/** 频率控制：防抖 / 节流 / 异步重试 */
export default function FreqDemos() {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const debounced = useDebounce(text, 400)
  const [clicks, setClicks] = useState(0)
  const throttled = useThrottle(clicks, 600)
  const [log, setLog] = useState(t('utilsdemo.freqClickObserve'))

  const dLog = useMemo(() => debounce((v) => setLog(`debounce 触发：${v}`), 500), [])
  const tLog = useMemo(() => throttle(() => setLog(`throttle 触发 @ ${new Date().toLocaleTimeString('zh-CN')}`), 800), [])
  const [retryOut, setRetryOut] = useState(t('utilsdemo.freqClickButton'))

  return (
    <>
      <DemoCard
        title={t('utilsdemo.freqDebounceTitle')}
        desc={t('utilsdemo.freqDebounceDesc')}
        usage="<const debounced = useDebounce(text, 400)>"
      >
        <Input placeholder={t('utilsdemo.freqInputPlaceholder')} value={text} onChange={(e) => setText(e.target.value)} style={{ maxWidth: 260 }} />
        <div className="utils-demo__out">{t('utilsdemo.freqDebouncedOut')}{debounced || t('utilsdemo.freqEmpty')}</div>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.freqThrottleTitle')}
        desc={t('utilsdemo.freqThrottleDesc')}
        usage="<const throttled = useThrottle(clicks, 600)>"
      >
        <Space>
          <Button size="small" onClick={() => setClicks((c) => c + 1)}>{t('utilsdemo.freqQuickClick')} +1</Button>
          <Text type="secondary">{t('utilsdemo.freqThrottleRaw', { clicks, throttled })}</Text>
        </Space>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.freqFnTitle')}
        desc={t('utilsdemo.freqFnDesc')}
        usage="const d = debounce(fn, 500)  // d.cancel() / d.flush()"
      >
        <Space wrap>
          <Button size="small" onClick={() => dLog(Date.now())}>{t('utilsdemo.freqDebounceCall')}</Button>
          <Button size="small" onClick={() => tLog()}>{t('utilsdemo.freqThrottleCall')}</Button>
        </Space>
        <div className="utils-demo__out">{log}</div>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.freqRetryTitle')}
        desc={t('utilsdemo.freqRetryDesc')}
        usage="await retry(fetchData, { times: 3, delay: 200 })"
      >
        <Button
          size="small"
          onClick={async () => {
            setRetryOut(t('utilsdemo.freqRetrying'))
            let n = 0
            try {
              const r = await retry(async () => {
                n += 1
                if (n < 3) throw new Error('boom')
                await sleep(80)
                return t('utilsdemo.freqRetrySuccess', { n })
              }, { times: 3, delay: 60 })
              setRetryOut(r)
            } catch (e) {
              setRetryOut(t('utilsdemo.freqFailed') + e.message)
            }
          }}
        >
          {t('utilsdemo.freqSimFail')}
        </Button>
        <div className="utils-demo__out">{retryOut}</div>
      </DemoCard>
    </>
  )
}
