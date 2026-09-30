import { Injectable, computed, signal } from '@angular/core'

export interface Session {
  name: string
  token: string
  at: string
}

const STORAGE_KEY = 'angular-app:auth'

/** 从 localStorage 恢复会话（隐私模式 / 禁用存储时静默降级为未登录） */
function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    return parsed?.token ? parsed : null
  } catch {
    return null
  }
}

/**
 * AuthService —— 给「路由守卫」演示提供真实鉴权数据源
 *
 * 为什么登录态必须是**服务**而不是组件里的 signal：
 * `canActivate` 守卫在组件创建**之前**执行，此时还没有任何组件实例，
 * 只能通过官方 DI（`inject(AuthService)`）拿到全局单例的登录态。
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<Session | null>(readSession())

  /** 当前会话（未登录为 null） */
  readonly current = computed(() => this.session())
  readonly isLoggedIn = computed(() => Boolean(this.session()?.token))
  readonly name = computed(() => this.session()?.name ?? '')
  readonly token = computed(() => this.session()?.token ?? '')

  login(name: string): Session {
    const next: Session = {
      name: (name || '').trim() || '访客',
      token: `tk_${Math.random().toString(36).slice(2, 10)}`,
      at: new Date().toISOString(),
    }
    this.session.set(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    return next
  }

  logout() {
    this.session.set(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }
}
