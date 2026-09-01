import { useCallback, useState } from 'react'
import { AuthContext, STORAGE_KEY } from './AuthContext.js'

/**
 * 轻量登录态 Provider（演示用）：
 * - 会话持久化到 localStorage，刷新不掉线
 * - login(name) 写入会话；logout() 清除会话
 * - 会话在首次渲染前同步恢复（惰性初始化），ready 恒为 true
 */

/** 启动时恢复会话（惰性初始化，仅执行一次） */
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    /* 忽略损坏的会话 */
    return null
  }
}

export function AuthProvider({ children }) {
  // 惰性初始化：会话在首次渲染前同步恢复，无需额外的 ready 状态
  const [user, setUser] = useState(loadSession)

  const login = useCallback((name) => {
    const u = { name: name?.trim() || '舰长', loginAt: Date.now() }
    setUser(u)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    } catch {
      /* 忽略隐私模式等写入失败 */
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 忽略 */
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, ready: true }}>
      {children}
    </AuthContext.Provider>
  )
}
