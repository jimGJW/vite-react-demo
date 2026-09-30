import { Injectable, signal } from '@angular/core'

export type ToastType = 'info' | 'success' | 'warn' | 'error'

export interface ToastItem {
  id: number
  text: string
  type: ToastType
  at: Date
}

/**
 * ToastService —— 官方 DI（providedIn: 'root' 应用级单例）
 *
 * 跨组件共享提示队列：任意组件 inject(ToastService) 后 push 一条，
 * 由 ToastHost 组件（挂在 AppComponent 里）统一渲染。
 * 与 vue-app 的 useToast 组合式函数形成对照：Angular 用「服务 + 注入」，
 * Vue 用「闭包 + 组合式函数」，React 用「Context + Provider」。
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly items = signal<ToastItem[]>([])
  private seq = 0

  push(text: string, type: ToastType = 'info', timeout = 2400) {
    const id = ++this.seq
    this.items.update((list) => [...list, { id, text, type, at: new Date() }])
    setTimeout(() => this.dismiss(id), timeout)
    return id
  }

  info(text: string, timeout?: number) { return this.push(text, 'info', timeout) }
  success(text: string, timeout?: number) { return this.push(text, 'success', timeout) }
  warn(text: string, timeout?: number) { return this.push(text, 'warn', timeout) }
  error(text: string, timeout?: number) { return this.push(text, 'error', timeout) }

  dismiss(id: number) {
    this.items.update((list) => list.filter((t) => t.id !== id))
  }

  clear() { this.items.set([]) }
}
