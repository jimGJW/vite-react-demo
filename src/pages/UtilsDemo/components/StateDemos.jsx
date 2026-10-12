import { useState } from 'react'
import { Button, Space, Switch, Tag, Typography } from 'antd'
import { useToggle, useCounter, useInterval } from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'

const { Text } = Typography

/** 状态小工具：开关 / 计数器 / 定时器 */
export default function StateDemos() {
  const { value, toggle } = useToggle(false)
  const { count, inc, dec, reset } = useCounter(0, { min: 0, max: 10 })
  const [ticks, setTicks] = useState(0)
  const [running, setRunning] = useState(true)
  useInterval(() => setTicks((t) => t + 1), running ? 1000 : null)

  return (
    <>
      <DemoCard
        title="useToggle · 布尔开关"
        desc="比手写 useState + 取反更省事，附带 setOn / setOff。"
        usage="const { value, toggle } = useToggle()"
      >
        <Space>
          <Switch checked={value} onChange={toggle} />
          <Text type="secondary">{String(value)}</Text>
        </Space>
      </DemoCard>

      <DemoCard
        title="useCounter · 计数器"
        desc="带上下限夹取，适合数量选择 / 分页步进。"
        usage="const { count, inc, dec, reset } = useCounter(0, { min: 0, max: 10 })"
      >
        <Space>
          <Button size="small" onClick={() => dec()}>-</Button>
          <Text strong>{count}</Text>
          <Button size="small" onClick={() => inc()}>+</Button>
          <Button size="small" type="text" onClick={reset}>重置</Button>
        </Space>
      </DemoCard>

      <DemoCard
        title="useInterval · 定时器"
        desc="delay 传 null 即暂停；卸载自动清理。"
        usage="useInterval(fn, running ? 1000 : null)"
      >
        <Space>
          <Tag color="blue">ticks: {ticks}</Tag>
          <Switch checked={running} onChange={setRunning} checkedChildren="跑" unCheckedChildren="停" />
        </Space>
      </DemoCard>
    </>
  )
}
