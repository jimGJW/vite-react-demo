import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * 样式模式上下文：antd | vue
 * - antd 模式：使用 Ant Design 组件 + #1677ff 主色
 * - vue 模式：使用 VueUI 组件（Element Plus 风格）+ #409eff 主色
 * 选择在登录页确定，localStorage 持久化
 */
const StyleModeContext = createContext({ mode: 'antd', toggle: () => {} })
const LS_KEY = 'app.styleMode'

export function StyleModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem(LS_KEY) || 'antd' } catch { return 'antd' }
  })

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, mode) } catch { /* ignore */ }
    // 动态切换根 CSS 变量
    const root = document.documentElement
    if (mode === 'vue') {
      root.setAttribute('data-ui-mode', 'vue')
    } else {
      root.removeAttribute('data-ui-mode')
    }
  }, [mode])

  const value = useMemo(() => ({
    mode,
    isAntd: mode === 'antd',
    isVue: mode === 'vue',
    setMode,
    toggle: () => setMode((m) => (m === 'antd' ? 'vue' : 'antd')),
  }), [mode])

  return (
    <StyleModeContext.Provider value={value}>
      {children}
    </StyleModeContext.Provider>
  )
}

export function useStyleMode() {
  return useContext(StyleModeContext)
}
