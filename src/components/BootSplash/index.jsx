import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '@i18n/index.js'
import './index.scss'

/**
 * 首屏跃迁 Splash：应用挂载后全屏覆盖的星野动画。
 * - 自动节奏：约 1.15s 后淡出离场（prefers-reduced-motion 时 250ms 直接退场）
 * - 点击任意处立即跳过（不等自动节奏）
 * - 离场后从 DOM 移除，不挡交互；children（整个 App）在覆盖层之下同步挂载
 */
export default function BootSplash({ children }) {
  const { t } = useI18n()
  const [phase, setPhase] = useState('in') // in → leaving → gone

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hold = reduce ? 250 : 1150
    const t1 = setTimeout(() => setPhase('leaving'), hold)
    const t2 = setTimeout(() => setPhase('gone'), hold + (reduce ? 60 : 520))
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const skip = useCallback(() => {
    setPhase((prev) => {
      if (prev !== 'in') return prev
      setTimeout(() => setPhase('gone'), 320)
      return 'leaving'
    })
  }, [])

  if (phase === 'gone') return children

  return (
    <>
      {children}
      <div
        className={`boot-splash${phase === 'leaving' ? ' is-leaving' : ''}`}
        role="presentation"
        onClick={skip}
      >
        <div className="bs-sky" aria-hidden="true">
          <div className="bs-nebula bs-nebula--1" />
          <div className="bs-nebula bs-nebula--2" />
          <div className="bs-stars bs-stars--far" />
          <div className="bs-stars bs-stars--mid" />
          <div className="bs-stars bs-stars--near" />
          <div className="bs-streaks">
            <span className="bs-streak bs-streak--1" />
            <span className="bs-streak bs-streak--2" />
            <span className="bs-streak bs-streak--3" />
          </div>
        </div>

        <div className="bs-core">
          <div className="bs-ring" aria-hidden="true">
            <span className="bs-ring__arc" />
            <span className="bs-ring__dot" />
          </div>
          <div className="bs-logo" aria-hidden="true">🚀</div>
          <h1 className="bs-brand">{t('loading.brand')}</h1>
          <p className="bs-tagline">{t('loading.tagline')}</p>
          <div className="bs-progress" aria-hidden="true">
            <span className="bs-progress__bar" />
            <span className="bs-progress__comet" />
          </div>
          <p className="bs-boot">{t('loading.boot')}</p>
        </div>

        <p className="bs-skip" aria-hidden="true">{t('loading.skip')}</p>
      </div>
    </>
  )
}
