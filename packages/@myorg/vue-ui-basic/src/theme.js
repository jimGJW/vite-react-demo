import { ref, computed, inject, readonly, watch } from 'vue'

/* =====================================================================
 * 主题（Vue 3 版本，与 @myorg/react-ui-basic 的 Theme 一一对应）
 * 在 document.documentElement 上设置 data-theme，由 CSS 变量覆盖驱动暗色。
 * 支持 light / dark / auto（跟随系统）三态，选择持久化到 localStorage。
 * ===================================================================== */

/** 可用主题：亮色 / 暗色 / 跟随系统 */
export const THEMES = ['light', 'dark', 'auto']

/** provide/inject 注入键 */
export const THEME_KEY = Symbol('vue-ui-theme')

/** localStorage 存储键 */
const STORAGE_KEY = 'app-theme'

/** 系统暗色媒体查询 */
const DARK_MEDIA = '(prefers-color-scheme: dark)'

/** 读取系统当前主题偏好 */
function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia(DARK_MEDIA).matches ? 'dark' : 'light'
}

/** 从 localStorage 读取已持久化的主题；无记录或非法值返回 null */
function readStoredTheme() {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return THEMES.includes(v) ? v : null
  } catch {
    return null
  }
}

/**
 * 创建一个独立的主题实例。
 * @param {('light'|'dark'|'auto')} [defaultTheme='light']
 */
export function createTheme(defaultTheme = 'light') {
  const theme = ref(readStoredTheme() ?? defaultTheme)
  const systemTheme = ref(getSystemTheme())

  // auto 模式下取系统偏好，否则取用户显式选择
  const resolvedTheme = computed(() => (theme.value === 'auto' ? systemTheme.value : theme.value))

  // 将解析后的主题写入 <html data-theme="...">，触发 CSS 变量覆盖
  watch(
    resolvedTheme,
    (v) => {
      if (typeof document === 'undefined') return
      document.documentElement.setAttribute('data-theme', v)
    },
    { immediate: true },
  )

  // 监听系统主题变化（仅在 auto 模式下影响 resolvedTheme）
  let mql = null
  let handler = null
  if (typeof window !== 'undefined' && window.matchMedia) {
    mql = window.matchMedia(DARK_MEDIA)
    handler = (e) => {
      systemTheme.value = e.matches ? 'dark' : 'light'
    }
    mql.addEventListener('change', handler)
  }

  /** 切换主题并持久化 */
  function setTheme(next) {
    if (!THEMES.includes(next)) return
    theme.value = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* localStorage 不可用时静默降级，仅会话内生效 */
    }
  }

  /** 解绑系统主题监听（组件卸载时调用） */
  function dispose() {
    if (mql && handler) mql.removeEventListener('change', handler)
    mql = null
    handler = null
  }

  return {
    theme,
    resolvedTheme: readonly(resolvedTheme),
    setTheme,
    themes: THEMES,
    dispose,
  }
}

let defaultTheme = null

/** 获取进程内共享的默认主题实例（惰性创建） */
export function getDefaultTheme() {
  if (!defaultTheme) defaultTheme = createTheme()
  return defaultTheme
}

/**
 * 读取主题上下文。
 * - 若祖先组件通过 `<ThemeProvider>` 或 `app.use(ThemePlugin)` 注入过实例，则使用注入的实例
 * - 否则回退到模块级共享单例（无需 Provider 也可直接使用）
 */
export function useTheme() {
  return inject(THEME_KEY, null) || getDefaultTheme()
}

/** Vue 插件：安装后全应用可通过 inject(THEME_KEY) / useTheme() 获取主题 */
export const ThemePlugin = {
  install(app) {
    const t = getDefaultTheme()
    app.provide(THEME_KEY, t)
    app.config.globalProperties.$theme = t
  },
}
