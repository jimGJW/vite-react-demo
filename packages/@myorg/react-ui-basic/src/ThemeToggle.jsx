import { useTheme } from './useTheme.js'

/** 三态切换顺序：亮 → 暗 → 跟随系统 → 亮 */
const ORDER = ['light', 'dark', 'auto']

const LABELS = {
  light: '亮色',
  dark: '暗色',
  auto: '跟随系统',
}

/** 内联 SVG 图标，零外部依赖 */
const ICONS = {
  light: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  dark: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  auto: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none" />
    </svg>
  ),
}

/**
 * 三态主题切换按钮：点击在 light → dark → auto 间循环，
 * 显示当前主题图标与文案。内部通过 `useTheme` 读写上下文，
 * 必须置于 `<ThemeProvider>` 之内。
 *
 * @returns {import('react').ReactElement}
 */
function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycle = () => {
    const idx = ORDER.indexOf(theme)
    setTheme(ORDER[(idx + 1) % ORDER.length])
  }

  const nextLabel = LABELS[ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]]

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      title={`当前：${LABELS[theme]}（点击切换为${nextLabel}）`}
      aria-label={`当前主题：${LABELS[theme]}，点击切换为${nextLabel}`}
    >
      <span className="theme-toggle-icon">{ICONS[theme]}</span>
      <span className="theme-toggle-label">{LABELS[theme]}</span>
    </button>
  )
}

export default ThemeToggle
