import { useI18n } from '../../i18n/index.js'
import './index.scss'

/**
 * 路由懒加载回退（Suspense fallback）：跃迁主题加载态。
 * 脉冲主星 + 三条错相轨道 + 闪烁星点，纯 CSS 动画，无 JS 定时器。
 * prefers-reduced-motion 时退化为静态星球 + 文字。
 */
export default function PageLoader() {
  const { t } = useI18n()
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader__scene" aria-hidden="true">
        <span className="pl-star pl-star--a" />
        <span className="pl-star pl-star--b" />
        <span className="pl-star pl-star--c" />
        <span className="pl-star pl-star--d" />
        <span className="pl-star pl-star--e" />
        <div className="pl-orbit pl-orbit--1"><span className="pl-dot" /></div>
        <div className="pl-orbit pl-orbit--2"><span className="pl-dot" /></div>
        <div className="pl-orbit pl-orbit--3"><span className="pl-dot" /></div>
        <div className="pl-planet">
          <span className="pl-planet__glow" />
          <span className="pl-planet__core" />
        </div>
      </div>
      <p className="page-loader__title">{t('loading.title')}</p>
      <p className="page-loader__desc">{t('loading.desc')}</p>
    </div>
  )
}
