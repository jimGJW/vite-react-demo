import { useState } from 'react'
import { Button, Space } from 'antd'
import { formatDate, weekdayOf, useNow, useCountdown, useSet, useUpdate, useEventListener } from '@components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { PICK_OPTIONS, COUNTDOWN_SECONDS } from './sampleData.js'
import { useI18n } from '@i18n/index.js'

/** 新增 Hook：时钟 / 倒计时 / 多选集合 / 强制刷新 / 声明式监听 */
export default function NewHookDemos() {
  const { t } = useI18n()
  const now = useNow(1000)
  const { left, running, start, stop, reset } = useCountdown(COUNTDOWN_SECONDS)
  const picked = useSet(['A'])
  const update = useUpdate()
  const [lastKey, setLastKey] = useState(t('utilsdemo.newKeyDefault'))

  /* 声明式监听：组件卸载自动解绑，不必手写 add/removeEventListener */
  useEventListener(typeof window === 'undefined' ? null : window, 'keydown', (e) => setLastKey(e.key))

  return (
    <>
      <DemoCard
        title={t('utilsdemo.newNowTitle')}
        desc={t('utilsdemo.newNowDesc')}
        usage="const now = useNow(1000)"
      >
        <div className="utils-demo__out">{formatDate(now, 'YYYY-MM-DD HH:mm:ss')} · {weekdayOf(now)}</div>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.newCountdownTitle')}
        desc={t('utilsdemo.newCountdownDesc')}
        usage="const { left, running, start, stop, reset } = useCountdown(10)"
      >
        <Space wrap>
          <Button size="small" type="primary" onClick={() => start(COUNTDOWN_SECONDS)}>{t('utilsdemo.newStart')}</Button>
          <Button size="small" onClick={stop}>{t('utilsdemo.newStop')}</Button>
          <Button size="small" onClick={reset}>{t('utilsdemo.newReset')}</Button>
        </Space>
        <div className="utils-demo__out">{t('utilsdemo.newCountdownOut', { left, state: running ? t('utilsdemo.newRunning') : t('utilsdemo.newIdle') })}</div>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.newSetTitle')}
        desc={t('utilsdemo.newSetDesc')}
        usage="const picked = useSet([]); picked.toggle(v) · picked.has(v) · picked.toArray"
      >
        <Space wrap>
          {PICK_OPTIONS.map((v) => (
            <Button
              key={v}
              size="small"
              type={picked.has(v) ? 'primary' : 'default'}
              onClick={() => picked.toggle(v)}
            >
              {v}
            </Button>
          ))}
          <Button size="small" onClick={picked.clear}>{t('utilsdemo.newClear')}</Button>
        </Space>
        <div className="utils-demo__out">{t('utilsdemo.newSetOut', { items: picked.toArray.join(', '), count: picked.size })}</div>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.newUpdateTitle')}
        desc={t('utilsdemo.newUpdateDesc')}
        usage="const update = useUpdate() · useEventListener(window, 'keydown', handler)"
      >
        <Space wrap>
          <Button size="small" onClick={update}>{t('utilsdemo.newForceRefresh')}</Button>
        </Space>
        <div className="utils-demo__out">{t('utilsdemo.newLastKey', { key: lastKey })}</div>
      </DemoCard>
    </>
  )
}
