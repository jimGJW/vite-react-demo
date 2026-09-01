import { createRoot } from 'react-dom/client'
import { Toast } from './QrScannerOverlay.jsx'

/**
 * 轻提示：在页面顶部显示一条 2.2s 后自动消失的 Toast。
 * @param {('info'|'warn'|'error')} type
 * @param {string} message
 */
export function showToast(type, message) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  root.render(<Toast type={type} message={message} />)
  setTimeout(() => {
    root.unmount()
    host.remove()
  }, 2200)
}
