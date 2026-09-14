import { useRef, useState } from 'react'
import { Tooltip } from 'antd'
import { useOverflow } from '../hooks.js'

/**
 * Ellipsis · 文本省略
 * =====================================================================
 * 移植自 旧平板端项目 `components/Ellipsis`。原实现做了两套逻辑：
 *   - 浏览器支持 `-webkit-line-clamp` 时注入动态 <style>
 *   - 不支持时用隐藏 shadowNode + **二分法**逐字测量，找最大可显示字数
 * 现代浏览器已全面支持 line-clamp（含 Firefox），所以这里直接删掉二分法分支，
 * 由浏览器测量，代码量降到原来的三分之一。
 *
 * 两个容易踩的坑，本实现已处理：
 *   1. 展开后 `scrollHeight` 不再溢出，若用「是否溢出」单独控制按钮显隐，
 *      「收起」按钮会消失 → 显隐条件写成 `overflowing || expanded`
 *   2. 单行省略必须配 `white-space: nowrap`，否则测的是换行后的高度
 *
 * 用法：
 *   <Ellipsis lines={2}>很长的文本……</Ellipsis>
 *   <Ellipsis lines={2} expandable>很长的文本……</Ellipsis>
 */

export default function Ellipsis({
  children,
  lines = 1,
  tooltip = true,
  expandable = false,
  expandText = '展开',
  collapseText = '收起',
  className = '',
  style,
}) {
  const textRef = useRef(null)
  const [expanded, setExpanded] = useState(false)

  const plain = typeof children === 'string' ? children : ''
  // 文本或行数变化时重新测量
  const watchKey = `${lines}|${plain.length}`
  const overflowing = useOverflow(textRef, watchKey)

  const clamped = lines > 1 && !expanded
  const showToggle = expandable && (overflowing || expanded)
  const showTooltip = tooltip && overflowing && !expanded

  const body = (
    <span
      ref={textRef}
      className={`kit-ellipsis__text ${clamped ? 'is-clamp' : ''}`}
      style={clamped ? { WebkitLineClamp: lines } : { whiteSpace: 'nowrap' }}
    >
      {children}
    </span>
  )

  return (
    <div className={`kit-ellipsis ${className}`} style={style}>
      {showTooltip ? <Tooltip title={plain}>{body}</Tooltip> : body}
      {showToggle && (
        <button
          type="button"
          className="kit-ellipsis__more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? collapseText : expandText}
        </button>
      )}
    </div>
  )
}
