import { useContext } from 'react'
import { ThemeContext } from './ThemeProvider.jsx'

/**
 * 读取主题上下文。必须在 `<ThemeProvider>` 内部调用。
 *
 * @returns {import('./ThemeProvider.jsx').ThemeContextValue}
 *   `{ theme, resolvedTheme, setTheme, themes }`
 */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme 必须在 <ThemeProvider> 内部使用')
  }
  return ctx
}
