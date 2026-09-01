import { createContext } from 'react'

/** 可用通知类型 */
export const NOTIFY_TYPES = ['info', 'success', 'warning', 'error', 'primary']

/** 默认自动消失时长（毫秒）；0 表示常驻不自动关闭 */
export const DEFAULT_DURATION = 4000

/** NotificationContext：由 NotificationProvider 提供值，useNotification 消费 */
export const NotificationContext = createContext(null)
