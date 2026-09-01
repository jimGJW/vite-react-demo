import { useContext } from 'react'
import { AuthContext } from './AuthContext.js'

/** 读取登录态。必须在 `<AuthProvider>` 内部调用。 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
