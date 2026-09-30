import { Injectable, type WritableSignal } from '@angular/core'
import { deepClone } from '../../../utils'

/**
 * StorageService —— 官方 DI 封装的本地存储
 *
 * 统一前缀（避免多子应用共用主域名时键名冲突）+ JSON 序列化 + 异常兜底
 * （隐私模式 / 容量超限 / 被禁用都会静默降级为内存态）。
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'angular-app:'
  private readonly memory = new Map<string, unknown>()

  private key(k: string) { return `${this.prefix}${k}` }

  /** 读：反序列化失败 / 不存在都返回 fallback */
  get<T>(k: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(this.key(k))
      if (raw === null) return fallback
      return JSON.parse(raw) as T
    } catch {
      return (this.memory.get(k) as T) ?? fallback
    }
  }

  /** 写：失败时落内存 Map，保证当前会话仍可用 */
  set<T>(k: string, value: T) {
    try {
      localStorage.setItem(this.key(k), JSON.stringify(value))
    } catch {
      this.memory.set(k, value)
    }
  }

  remove(k: string) {
    try { localStorage.removeItem(this.key(k)) } catch { /* ignore */ }
    this.memory.delete(k)
  }

  /** 列出本应用写入的键（去掉前缀） */
  keys(): string[] {
    const out: string[] = []
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i)
        if (k?.startsWith(this.prefix)) out.push(k.slice(this.prefix.length))
      }
    } catch { /* ignore */ }
    return [...out, ...this.memory.keys()].filter((v, i, a) => a.indexOf(v) === i)
  }

  /** 统计占用字节数（近似，utf-16 按 2 字节估） */
  usageBytes(): number {
    let total = 0
    for (const k of this.keys()) {
      try {
        const raw = localStorage.getItem(this.key(k)) || ''
        total += (k.length + raw.length) * 2
      } catch { /* ignore */ }
    }
    return total
  }

  clearAll() {
    for (const k of this.keys()) this.remove(k)
  }

  /**
   * 把某个 signal 写回 localStorage（响应式持久化）
   * 用法：effect(() => storage.set('theme', theme())) 或手动调用返回的 sync 函数
   */
  bindSignal<T>(k: string, target: WritableSignal<T>) {
    const sync = () => this.set(k, target())
    return sync
  }

  /** 与 bindSignal 配套：从存储里恢复一个 signal 的初始值 */
  restore<T>(k: string, fallback: T): T {
    return deepClone(this.get(k, fallback))
  }
}

/** 主题状态的可持久化形态 */
export interface ThemeState {
  primary: string
  radius: number
  compact: boolean
}

export const DEFAULT_THEME: ThemeState = { primary: '#6366f1', radius: 12, compact: false }
