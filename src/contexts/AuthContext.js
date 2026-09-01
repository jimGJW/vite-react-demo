import { createContext } from 'react'

/** localStorage 存储键 */
export const STORAGE_KEY = 'starfleet.session'

/** AuthContext：由 AuthProvider 提供值，useAuth 消费 */
export const AuthContext = createContext(null)
