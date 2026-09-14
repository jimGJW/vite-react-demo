import { useCountdown } from '../hooks.js'
import { formatDuration } from '../utils.js'

/**
 * Countdown · 倒计时
 * =====================================================================
 * 移植自 旧平板端项目 `components/CountDown`。原实现用 setTimeout 每秒自减
 * （`lastTime -= interval`），问题很明显：
 *   - 浏览器对后台标签页的定时器有节流（通常 1s → 1min），
 *     回到前台时数值已经严重落后，且**不会自动校正**
 *   - 页面卡顿丢帧时也会累积误差
 * 这里改为记录目标时间戳，每次 tick 用 `Date.now()` 重算剩余，天然免疫。
 *
 * 用法：
 *   <Countdown target="2026-12-31 23:59:59" onEnd={() => message.info('结束')} />
 *   <Countdown target={Date.now() + 5 * 60 * 1000} variant="plain" />
 */

function Cells({ days, hours, minutes, seconds }) {
  const showDays = days > 0
  const items = showDays
    ? [
        { value: days, unit: '天' },
        { value: hours, unit: '时' },
        { value: minutes, unit: '分' },
        { value: seconds, unit: '秒' },
      ]
    : [
        { value: hours * 1, unit: '时' },
        { value: minutes, unit: '分' },
        { value: seconds, unit: '秒' },
      ]

  return (
    <span className="kit-countdown">
      {items.map((item, index) => (
        <span key={item.unit} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span className="kit-countdown__cell">{String(item.value).padStart(2, '0')}</span>
          <span className="kit-countdown__unit">{item.unit}</span>
          {index < items.length - 1 && <span className="kit-countdown__sep">:</span>}
        </span>
      ))}
    </span>
  )
}

export default function Countdown({
  target,
  interval = 1000,
  onEnd,
  pattern = 'HH:mm:ss',
  variant = 'cell',
  className = '',
}) {
  const { remaining, days, hours, minutes, seconds } = useCountdown(target, { interval, onEnd })

  if (variant === 'plain') {
    return (
      <span className={`kit-countdown is-plain ${className}`}>
        {formatDuration(remaining, pattern)}
      </span>
    )
  }

  return (
    <span className={className}>
      <Cells days={days} hours={hours} minutes={minutes} seconds={seconds} />
    </span>
  )
}
