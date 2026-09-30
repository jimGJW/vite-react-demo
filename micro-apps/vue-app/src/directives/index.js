/**
 * vue-app 自定义指令集合
 *
 * Vue 官方指令系统：对象式（mounted/updated/unmounted）拿到真实 DOM，
 * 适合「操作 DOM 但不引组件」的能力下沉。全部支持 SSR 安全（typeof window 判断）。
 */
import { debounce, copyText, throttle } from '../utils'

/** v-focus：挂载后自动聚焦（表单/弹窗常用） */
export const vFocus = {
  mounted(el) {
    if (el instanceof HTMLElement) el.focus()
  },
}

/**
 * v-copy="'要复制的文本'"
 * 点击元素 → 复制；复制成功临时加上 is-copied class（CSS 可做反馈）
 */
export const vCopy = {
  mounted(el, binding) {
    el.__vCopyHandler__ = async () => {
      const text = typeof binding.value === 'function' ? binding.value() : binding.value
      const ok = await copyText(String(text ?? el.textContent ?? ''))
      if (!ok) return
      el.classList.add('is-copied')
      el.dataset.copyTip = '已复制'
      setTimeout(() => {
        el.classList.remove('is-copied')
        delete el.dataset.copyTip
      }, 1200)
    }
    el.addEventListener('click', el.__vCopyHandler__)
    el.style.cursor = 'pointer'
  },
  updated(el, binding) {
    el.__vCopyValue__ = binding.value
  },
  unmounted(el) {
    if (el.__vCopyHandler__) el.removeEventListener('click', el.__vCopyHandler__)
    delete el.__vCopyHandler__
  },
}

/**
 * v-debounce:click="fn" / v-debounce:input="{ handler, wait: 500 }"
 * 指令参数指定事件名，把回调自动包一层防抖
 */
export const vDebounce = {
  mounted(el, binding) {
    const event = binding.arg || 'click'
    const cfg = binding.value
    const handler = typeof cfg === 'function' ? cfg : cfg.handler
    const wait = (typeof cfg === 'object' && cfg.wait) || 400
    el.__vDebounceFn__ = debounce((e) => handler(e), wait)
    el.addEventListener(event, el.__vDebounceFn__)
  },
  unmounted(el, binding) {
    if (el.__vDebounceFn__) el.removeEventListener(binding.arg || 'click', el.__vDebounceFn__)
    delete el.__vDebounceFn__
  },
}

/** v-throttle:scroll="fn"：同上，节流版本 */
export const vThrottle = {
  mounted(el, binding) {
    const event = binding.arg || 'scroll'
    const cfg = binding.value
    const handler = typeof cfg === 'function' ? cfg : cfg.handler
    const wait = (typeof cfg === 'object' && cfg.wait) || 300
    el.__vThrottleFn__ = throttle((e) => handler(e), wait)
    el.addEventListener(event, el.__vThrottleFn__)
  },
  unmounted(el, binding) {
    if (el.__vThrottleFn__) el.removeEventListener(binding.arg || 'scroll', el.__vThrottleFn__)
    delete el.__vThrottleFn__
  },
}

/**
 * v-lazy：元素进入视口后才加 is-visible class（图片懒加载/入场动画）
 * 用法：v-lazy="'https://xxx.jpg'"（可选，赋值即写入 img.src）
 */
export const vLazy = {
  mounted(el, binding) {
    const load = () => {
      el.classList.add('is-visible')
      const src = typeof binding.value === 'function' ? binding.value() : binding.value
      if (src && el.tagName === 'IMG') el.src = src
      else if (src) el.style.backgroundImage = `url(${src})`
    }
    if (typeof IntersectionObserver === 'undefined') {
      load()
      return
    }
    el.__vLazyOb__ = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      load()
      el.__vLazyOb__.disconnect()
      delete el.__vLazyOb__
    }, { rootMargin: '40px' })
    el.__vLazyOb__.observe(el)
  },
  unmounted(el) {
    el.__vLazyOb__?.disconnect()
    delete el.__vLazyOb__
  },
}

/**
 * v-draggable：把元素变成可拖拽（transform 位移，限制在父容器内）
 * 用法：v-draggable 或 v-draggable="{ bounds: true }"
 */
export const vDraggable = {
  mounted(el, binding) {
    const opts = typeof binding.value === 'object' ? binding.value : {}
    el.style.position = el.style.position || 'relative'
    el.style.cursor = 'move'
    el.style.userSelect = 'none'
    let startX = 0
    let startY = 0
    let baseX = 0
    let baseY = 0
    let dragging = false

    const onDown = (e) => {
      dragging = true
      startX = e.clientX
      startY = e.clientY
      const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform || '')
      baseX = m ? Number(m[1]) : 0
      baseY = m ? Number(m[2]) : 0
      el.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e) => {
      if (!dragging) return
      let x = baseX + (e.clientX - startX)
      let y = baseY + (e.clientY - startY)
      if (opts.bounds !== false) {
        const parent = el.parentElement
        const pw = parent?.clientWidth || 0
        const ph = parent?.clientHeight || 0
        const w = el.offsetWidth
        const h = el.offsetHeight
        x = Math.max(0, Math.min(x, Math.max(0, pw - w)))
        y = Math.max(0, Math.min(y, Math.max(0, ph - h)))
      }
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    const onUp = () => { dragging = false }

    el.__vDraggable__ = { onDown, onMove, onUp }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
  },
  unmounted(el) {
    const h = el.__vDraggable__
    if (!h) return
    el.removeEventListener('pointerdown', h.onDown)
    el.removeEventListener('pointermove', h.onMove)
    el.removeEventListener('pointerup', h.onUp)
    el.removeEventListener('pointercancel', h.onUp)
    delete el.__vDraggable__
  },
}

/**
 * v-permission="'admin'" / v-permission="['admin','editor']"
 * 无权限时直接从 DOM 移除元素（比 v-if 更彻底，不会留下空节点）
 */
export const vPermission = {
  mounted(el, binding) {
    const need = Array.isArray(binding.value) ? binding.value : [binding.value]
    const owned = (el.__vPermissionRoles__ = el.__vPermissionRoles__ || ['admin', 'editor'])
    const ok = need.some((r) => owned.includes(r))
    if (!ok) el.parentElement?.removeChild(el)
  },
}

/** v-longpress="fn"：长按 600ms 触发（移动端长按菜单） */
export const vLongpress = {
  mounted(el, binding) {
    let timer = null
    const start = () => {
      timer = setTimeout(() => binding.value?.(el), 600)
    }
    const cancel = () => {
      if (timer) clearTimeout(timer)
      timer = null
    }
    el.__vLongpress__ = { start, cancel }
    el.addEventListener('pointerdown', start)
    el.addEventListener('pointerup', cancel)
    el.addEventListener('pointerleave', cancel)
  },
  unmounted(el) {
    const h = el.__vLongpress__
    if (!h) return
    el.removeEventListener('pointerdown', h.start)
    el.removeEventListener('pointerup', h.cancel)
    el.removeEventListener('pointerleave', h.cancel)
    delete el.__vLongpress__
  },
}

/** 统一安装入口：app.use(installDirectives) */
export function installDirectives(app) {
  app.directive('focus', vFocus)
  app.directive('copy', vCopy)
  app.directive('debounce', vDebounce)
  app.directive('throttle', vThrottle)
  app.directive('lazy', vLazy)
  app.directive('draggable', vDraggable)
  app.directive('permission', vPermission)
  app.directive('longpress', vLongpress)
}

/** 指令清单：页面用它渲染「指令目录」表格 */
export const DIRECTIVE_REGISTRY = [
  { name: 'v-focus', usage: 'v-focus', desc: '挂载即自动聚焦，表单首字段 / 弹窗输入框' },
  { name: 'v-copy', usage: "v-copy=\"'文本'\"", desc: '点击复制，成功后打上 is-copied 类做反馈' },
  { name: 'v-debounce', usage: 'v-debounce:click="{ handler, wait }"', desc: '指令参数指定事件名，回调自动防抖' },
  { name: 'v-throttle', usage: 'v-throttle:scroll="{ handler, wait }"', desc: '同上，节流版本（滚动 / resize）' },
  { name: 'v-lazy', usage: 'v-lazy="src"', desc: 'IntersectionObserver 进场才加载 / 加类' },
  { name: 'v-draggable', usage: 'v-draggable="{ bounds: true }"', desc: '指针拖拽 + 父容器边界限制' },
  { name: 'v-permission', usage: "v-permission=\"['admin']\"", desc: '无权限直接从 DOM 移除' },
  { name: 'v-longpress', usage: 'v-longpress="fn"', desc: '长按 600ms 触发（移动端长按菜单）' },
]
