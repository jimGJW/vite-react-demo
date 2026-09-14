import { Tooltip } from 'antd'

/**
 * MiniProgress · 细进度条（带目标值刻度）
 * =====================================================================
 * 移植自 旧平板端项目 `components/Charts/MiniProgress`。原实现本来就是纯 DOM/CSS、
 * 不依赖任何图表库，所以这份是**几乎原样保留**的少数几个之一：
 *   - 目标刻度用 Tooltip 包裹，鼠标悬停才显示「目标值: xx%」
 *   - 「目标值」文案已抽成 props（原实现硬编码中文）
 *
 * 用法：
 *   <MiniProgress percent={72} target={85} label="本月完成度" />
 */

export default function MiniProgress({
  percent = 0,
  target,
  color = 'var(--c-primary, #4f46e5)',
  height = 8,
  showTarget = true,
  label,
  targetText = '目标值',
  className = '',
}) {
  const safe = Math.max(0, Math.min(Number(percent) || 0, 100))
  const targetSafe = target == null ? null : Math.max(0, Math.min(Number(target) || 0, 100))

  return (
    <div className={`kit-mini-progress ${className}`}>
      <div className="kit-mini-progress__track" style={{ height }}>
        <div
          className="kit-mini-progress__fill"
          style={{ width: `${safe}%`, background: color }}
        />
        {showTarget && targetSafe != null && (
          <Tooltip title={`${targetText}: ${targetSafe}%`}>
            <div className="kit-mini-progress__target" style={{ left: `${targetSafe}%` }} />
          </Tooltip>
        )}
      </div>
      <div className="kit-mini-progress__meta">
        <span>{label}</span>
        <span>{safe}%</span>
      </div>
    </div>
  )
}
