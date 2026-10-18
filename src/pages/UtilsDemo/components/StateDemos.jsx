import { useState } from 'react'
import { Button, Space, Switch, Tag, Typography } from 'antd'
import { useToggle, useCounter, useInterval } from '@components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { useI18n } from '@i18n/index.js'

const { Text } = Typography

/** 状态小工具：开关 / 计数器 / 定时器 */
export default function StateDemos() {
  const { t } = useI18n()
  const { value, toggle } = useToggle(false)
  const { count, inc, dec, reset } = useCounter(0, { min: 0, max: 10 })
  const [ticks, setTicks] = useState(0)
  const [running, setRunning] = useState(true)
  useInterval(() => setTicks((tick) => tick + 1), running ? 1000 : null)

  return (
    <>
      <DemoCard
        title={t('utilsdemo.stateToggleTitle')}
        desc={t('utilsdemo.stateToggleDesc')}
        usage="const { value, toggle } = useToggle()"
      >
        <Space>
          <Switch checked={value} onChange={toggle} />
          <Text type="secondary">{String(value)}</Text>
        </Space>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.stateCounterTitle')}
        desc={t('utilsdemo.stateCounterDesc')}
        usage="const { count, inc, dec, reset } = useCounter(0, { min: 0, max: 10 })"
      >
        <Space>
          <Button size="small" onClick={() => dec()}>-</Button>
          <Text strong>{count}</Text>
          <Button size="small" onClick={() => inc()}>+</Button>
          <Button size="small" type="text" onClick={reset}>{t('utilsdemo.stateReset')}</Button>
        </Space>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.stateIntervalTitle')}
        desc={t('utilsdemo.stateIntervalDesc')}
        usage="useInterval(fn, running ? 1000 : null)"
      >
        <Space>
          <Tag color="blue">ticks: {ticks}</Tag>
          <Switch checked={running} onChange={setRunning} checkedChildren={t('utilsdemo.stateRun')} unCheckedChildren={t('utilsdemo.stateStop')} />
        </Space>
      </DemoCard>
    </>
  )
}
