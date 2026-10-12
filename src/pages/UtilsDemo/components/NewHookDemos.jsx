import { useState } from 'react'
import { Button, Space } from 'antd'
import { formatDate, weekdayOf, useNow, useCountdown, useSet, useUpdate, useEventListener } from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { PICK_OPTIONS, COUNTDOWN_SECONDS } from './sampleData.js'

/** 新增 Hook：时钟 / 倒计时 / 多选集合 / 强制刷新 / 声明式监听 */
export default function NewHookDemos() {
  const now = useNow(1000)
  const { left, running, start, stop, reset } = useCountdown(COUNTDOWN_SECONDS)
  const picked = useSet(['A'])
  const update = useUpdate()
  const [lastKey, setLastKey] = useState('（在本页按任意键）')

  /* 声明式监听：组件卸载自动解绑，不必手写 add/removeEventListener */
  useEventListener(typeof window === 'undefined' ? null : window, 'keydown', (e) => setLastKey(e.key))

  return (
    <>
      <DemoCard
        title="useNow · 自动刷新的当前时间"
        desc="按间隔返回新的 Date，做时钟或「刚刚 / 3 分钟前」这类相对时间自动刷新。传 null 停止刷新。"
        usage="const now = useNow(1000)"
      >
        <div className="utils-demo__out">{formatDate(now, 'YYYY-MM-DD HH:mm:ss')} · {weekdayOf(now)}</div>
      </DemoCard>

      <DemoCard
        title="useCountdown · 基于时间戳的倒计时"
        desc="按「目标时间戳」而不是每轮减一 —— 标签页被浏览器降频时 setInterval 会漂，按时间戳算才不会越走越慢。"
        usage="const { left, running, start, stop, reset } = useCountdown(10)"
      >
        <Space wrap>
          <Button size="small" type="primary" onClick={() => start(COUNTDOWN_SECONDS)}>开始 10s</Button>
          <Button size="small" onClick={stop}>停止</Button>
          <Button size="small" onClick={reset}>重置</Button>
        </Space>
        <div className="utils-demo__out">剩余 {left}s · {running ? '进行中' : '未开始 / 已结束'}</div>
      </DemoCard>

      <DemoCard
        title="useSet · 多选集合"
        desc="批量选择、标签勾选场景少写一堆展开语法。每次操作返回新 Set，引用变化能被 React 感知。"
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
          <Button size="small" onClick={picked.clear}>清空</Button>
        </Space>
        <div className="utils-demo__out">已选 [{picked.toArray.join(', ')}] · 共 {picked.size} 项</div>
      </DemoCard>

      <DemoCard
        title="useUpdate · 强制重渲染 / useEventListener · 声明式监听"
        desc="useUpdate 用于依赖 React 之外可变数据源的强制刷新；useEventListener 在卸载时自动解绑。下面这行会显示你在页面里按下的键。"
        usage="const update = useUpdate() · useEventListener(window, 'keydown', handler)"
      >
        <Space wrap>
          <Button size="small" onClick={update}>强制刷新</Button>
        </Space>
        <div className="utils-demo__out">最近按键：{lastKey}</div>
      </DemoCard>
    </>
  )
}
