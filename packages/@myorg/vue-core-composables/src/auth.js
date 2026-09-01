import { ref, computed, inject, readonly } from 'vue'

/* =====================================================================
 * 轻量登录态（Vue 3 版本，与 @myorg/react-core-hooks 的 Auth 一一对应）
 * - 会话持久化到 localStorage，刷新不掉线
 * - login(name) 写入会话；logout() 清除会话
 * - 会话在模块首次使用时同步恢复，ready 恒为 true
 * ===================================================================== */

/** localStorage 存储键 */
export const STORAGE_KEY = 'starfleet.session'

/** provide/inject 注入键 */
export const AUTH_KEY = Symbol('vue-core-auth')

/** 读取并解析本地会话（SSR 安全：无 localStorage 时返回 null） */
function loadSession() {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    /* 忽略损坏的会话 */
    return null
  }
}

/**
 * 创建一个独立的会话实例。
 * @returns {{ user: import('vue').Ref, ready: import('vue').Ref<boolean>,
 *             isLogin: import('vue').ComputedRef<boolean>,
 *             login: (name?: string) => void, logout: () => void }}
 */
export function createAuth() {
  const user = ref(loadSession())
  const ready = ref(true)
  const isLogin = computed(() => !!user.value)

  function login(name) {
    const u = { name: name?.trim() || '舰长', loginAt: Date.now() }
    user.value = u
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    } catch {
      /* 忽略隐私模式等写入失败 */
    }
  }

  function logout() {
    user.value = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 忽略 */
    }
  }

  return { user: readonly(user), ready: readonly(ready), isLogin, login, logout }
}

let defaultAuth = null

/** 获取进程内共享的默认会话实例（惰性创建） */
export function getDefaultAuth() {
  if (!defaultAuth) defaultAuth = createAuth()
  return defaultAuth
}

/**
 * 读取会话上下文。
 * - 若祖先组件通过 `<AuthProvider>` 或 `app.use(AuthPlugin)` 注入过实例，则使用注入的实例
 * - 否则回退到模块级共享单例（无需 Provider 也可直接使用）
 */
export function useAuth() {
  return inject(AUTH_KEY, null) || getDefaultAuth()
}

/** Vue 插件：安装后全应用可通过 inject(AUTH_KEY) / useAuth() 获取会话 */
export const AuthPlugin = {
  install(app) {
    const auth = getDefaultAuth()
    app.provide(AUTH_KEY, auth)
    app.config.globalProperties.$auth = auth
  },
}
