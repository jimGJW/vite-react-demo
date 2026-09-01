import { createContext } from 'react'

/** 可用主题：亮色 / 暗色 / 跟随系统 */
export const THEMES = ['light', 'dark', 'auto']

/** ThemeContext：由 ThemeProvider 提供值，useTheme 消费 */
export const ThemeContext = createContext(null)
