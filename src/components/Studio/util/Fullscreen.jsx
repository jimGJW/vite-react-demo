import { useRef } from 'react'
import { useFullscreen } from './useFullscreen.js'

/**
 * 全屏容器：把 children 包进可全屏的区域，并提供触发按钮（或用 renderTrigger 自定义）。
 */
export default function Fullscreen({ children, className, renderTrigger }) {
  const ref = useRef(null)
  const { isFull, toggle } = useFullscreen(ref)
  return (
    <div ref={ref} className={className}>
      <div className="st-fullscreen__bar">
        {renderTrigger ? (
          renderTrigger({ isFull, toggle })
        ) : (
          <button type="button" className="st-fullscreen__btn" onClick={toggle}>
            {isFull ? '退出全屏' : '全屏'}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
