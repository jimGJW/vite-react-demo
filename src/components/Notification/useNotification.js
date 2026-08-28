import { useContext } from 'react'
import { NotificationContext } from './NotificationProvider.jsx'

/**
 * 读取通知上下文。必须在 `<NotificationProvider>` 内部调用。
 *
 * @returns {import('./NotificationProvider.jsx').NotificationContextValue}
 *   `{ notify, success, error, warning, info, remove, removeAll,
 *      toasts, history, unreadCount, markAllRead, markRead, clearHistory }`
 * @throws {Error} 当未包裹在 `<NotificationProvider>` 内时抛出
 */
export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotification 必须在 <NotificationProvider> 内部使用')
  }
  return ctx
}
