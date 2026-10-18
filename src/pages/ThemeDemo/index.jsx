import { ThemeProvider, ThemeToggle, useTheme } from '@components/ThemeProvider'
import { useI18n } from '@i18n/index.js'
import './index.scss'

/** 读取并展示当前主题上下文值 */
function ThemeState() {
  const { t } = useI18n()
  const { theme, resolvedTheme, themes } = useTheme()
  return (
    <div className="theme-state">
      <div className="theme-state-row">
        <span>{t('theme.stateCurrent')}</span>
        <code>{theme}</code>
      </div>
      <div className="theme-state-row">
        <span>{t('theme.stateResolved')}</span>
        <code>{resolvedTheme}</code>
      </div>
      <div className="theme-state-row">
        <span>{t('theme.stateOptions')}</span>
        <code>{themes.join(' / ')}</code>
      </div>
    </div>
  )
}

function ThemeDemo() {
  const { t } = useI18n()
  return (
    <ThemeProvider defaultTheme="auto">
      <div className="page-card theme-demo">
        <h1>{t('theme.title')}</h1>
        <p>
          {t('theme.intro1')}<strong>{t('theme.modes')}</strong>{t('theme.intro2')}<code>&lt;html&gt;</code>{t('theme.intro3')}<code>data-theme</code>{t('theme.intro4')}<code>auto</code>{t('theme.intro5')}<code>prefers-color-scheme</code>{t('theme.intro6')}
        </p>

        <h2>{t('theme.tryTitle')}</h2>
        <div className="theme-demo-actions">
          <ThemeToggle />
        </div>
        <ThemeState />

        <h2>{t('theme.usageTitle')}</h2>
        <pre className="theme-code">{`// 1. 在应用根部包裹 Provider
import { ThemeProvider } from './components/ThemeProvider'

<ThemeProvider defaultTheme="auto">
  <App />
</ThemeProvider>

// 2. 任意子组件读取 / 切换
import { useTheme, ThemeToggle } from './components/ThemeProvider'

const { theme, resolvedTheme, setTheme, themes } = useTheme()`}</pre>

        <h2>{t('theme.threeTitle')}</h2>
        <ul>
          <li>
            <strong>{t('theme.lightName')}</strong>{t('theme.lightDesc')}
          </li>
          <li>
            <strong>{t('theme.darkName')}</strong>{t('theme.darkDesc')}
          </li>
          <li>
            <strong>{t('theme.autoName')}</strong>{t('theme.autoDesc')}
          </li>
        </ul>

        <h2>{t('theme.previewTitle')}</h2>
        <div className="theme-samples">
          <div className="theme-sample theme-sample--primary">{t('theme.primary')}</div>
          <div className="theme-sample theme-sample--success">{t('theme.success')}</div>
          <div className="theme-sample theme-sample--warning">{t('theme.warning')}</div>
          <div className="theme-sample theme-sample--danger">{t('theme.danger')}</div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default ThemeDemo
