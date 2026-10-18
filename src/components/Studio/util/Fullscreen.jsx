import { useRef } from 'react'
import { useFullscreen } from './useFullscreen.js'
import { useI18n } from '@i18n/index.js'

/**
 * 全屏容器：把 children 包进可全屏的区域，并提供触发按钮（或用 renderTrigger 自定义）。
 */
export default function Fullscreen({ children, className, renderTrigger }) {
  const { t } = useI18n()
  const ref = useRef(null)
  const { isFull, toggle } = useFullscreen(ref)
  return (
    <div ref={ref} className={className}>
      <div className="st-fullscreen__bar">
        {renderTrigger ? (
          renderTrigger({ isFull, toggle })
        ) : (
          <button type="button" className="st-fullscreen__btn" onClick={toggle}>
            {isFull ? t('studio.comp.fsExit') : t('studio.comp.fsEnter')}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
