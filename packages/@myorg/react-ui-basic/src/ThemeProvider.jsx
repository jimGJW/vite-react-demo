import './ThemeProvider.scss'
import { useEffect, useState } from 'react'
import { THEMES, ThemeContext } from './ThemeContext.js'

/** localStorage 存储键 */
const STORAGE_KEY = 'app-theme'

/** 系统暗色媒体查询 */
const DARK_MEDIA = '(prefers-color-scheme: dark)'

/**
 * 主题上下文值
 * @typedef {Object} ThemeContextValue
 * @property {('light'|'dark'|'auto')} theme       当前选择的主题
 * @property {('light'|'dark')} resolvedTheme      解析后实际生效的主题
 * @property {(t: ('light'|'dark'|'auto')) => void} setTheme 切换主题
 * @property {('light'|'dark'|'auto')[]} themes    可用主题列表
 */

/** 读取系统当前主题偏好 */
function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia(DARK_MEDIA).matches ? 'dark' : 'light'
}

/** 从 localStorage 读取已持久化的主题；无记录或非法值返回 null */
function readStoredTheme() {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return THEMES.includes(v) ? v : null
  } catch {
    return null
  }
}

/**
 * 主题 Provider：在 `document.documentElement` 上设置 `data-theme` 属性，
 * 由 CSS 变量覆盖驱动暗色样式。支持 light / dark / auto（跟随系统）三态，
 * 选择持久化到 localStorage，auto 模式下实时监听系统偏好变化。
 *
 * 零外部依赖，仅依赖 React，可整目录拷贝至任意 React 19 项目复用。
 *
 * @param {{ children: import('react').ReactNode, defaultTheme?: ('light'|'dark'|'auto') }} props
 * @returns {import('react').ReactElement}
 */
function ThemeProvider({ children, defaultTheme = 'light' }) {
  const [theme, setThemeState] = useState(() => readStoredTheme() ?? defaultTheme)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)

  // auto 模式下取系统偏好，否则取用户显式选择
  const resolvedTheme = theme === 'auto' ? systemTheme : theme

  // 将解析后的主题写入 <html data-theme="...">，触发 CSS 变量覆盖
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  // 监听系统主题变化（仅在 auto 模式下影响 resolvedTheme）
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mql = window.matchMedia(DARK_MEDIA)
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light')
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  /** 切换主题并持久化 */
  const setTheme = (next) => {
    if (!THEMES.includes(next)) return
    setThemeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* localStorage 不可用时静默降级，仅会话内生效 */
    }
  }

  const value = { theme, resolvedTheme, setTheme, themes: THEMES }
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
