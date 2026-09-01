import { useContext } from 'react'
import { ThemeContext } from './ThemeContext.js'

/**
 * 读取主题上下文。必须在 `<ThemeProvider>` 内部调用。
 *
 * @returns {import('./ThemeContext.js').ThemeContextValue}
 *   `{ theme, resolvedTheme, setTheme, themes }`
 */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme 必须在 <ThemeProvider> 内部使用')
  }
  return ctx
}
