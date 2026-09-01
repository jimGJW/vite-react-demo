import { createApp, h } from 'vue'
import Toast from './Toast.vue'

/**
 * 轻提示：在页面顶部显示一条 2.2s 后自动消失的 Toast。
 * @param {('info'|'warn'|'error')} type
 * @param {string} message
 */
export function showToast(type, message) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(Toast, { type, message }) })
  app.mount(host)
  setTimeout(() => {
    try {
      app.unmount()
    } catch {
      /* ignore */
    }
    host.remove()
  }, 2200)
}

export default showToast
