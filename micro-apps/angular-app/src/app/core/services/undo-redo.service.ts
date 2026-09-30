import { Injectable, computed, signal } from '@angular/core'
import { deepClone } from '../../../utils'

export interface Snapshot<T> {
  value: T
  at: Date
  label: string
}

/**
 * UndoRedoService —— 撤销栈（官方 DI 单例，可被多组件共享）
 *
 * 与 vue-app 的 useUndoRedo 组合式函数等价：
 *   Vue  → 每个组件调用一次拿到独立栈
 *   Angular → 由 DI 决定作用域：providedIn:'root' 是全局栈，
 *             若在组件 providers 里再 provide 一次则变成组件级私有栈
 */
@Injectable({ providedIn: 'root' })
export class UndoRedoService<T = unknown> {
  private readonly past = signal<Snapshot<T>[]>([])
  private readonly future = signal<Snapshot<T>[]>([])
  private readonly limit = 30

  /** 当前状态（服务内部维护，页面也可只用自己的 signal） */
  readonly current = signal<T | null>(null)

  readonly canUndo = computed(() => this.past().length > 1)
  readonly canRedo = computed(() => this.future().length > 0)
  readonly historyCount = computed(() => this.past().length)
  readonly futureCount = computed(() => this.future().length)

  /** 初始化（页面首帧调用一次），清空历史 */
  init(initial: T, label = '初始状态') {
    this.current.set(deepClone(initial))
    this.past.set([{ value: deepClone(initial), at: new Date(), label }])
    this.future.set([])
  }

  /** 记录一次变更：把「变更前」压栈 */
  commit(prev: T, label = '修改') {
    this.past.update((list) => [...list, { value: deepClone(prev), at: new Date(), label }].slice(-this.limit))
    this.future.set([])
  }

  /** 撤销：返回上一个快照（调用方把它写回自己的 signal） */
  undo(label = '撤销'): T | null {
    const list = this.past()
    if (list.length < 2) return null
    const currentSnap = list[list.length - 1]
    const prevSnap = list[list.length - 2]
    this.past.set(list.slice(0, -1))
    this.future.update((f) => [{ ...currentSnap, label }, ...f].slice(0, this.limit))
    this.current.set(deepClone(prevSnap.value))
    return deepClone(prevSnap.value)
  }

  /** 重做 */
  redo(): T | null {
    const f = this.future()
    if (!f.length) return null
    const nextSnap = f[0]
    this.past.update((list) => [...list, nextSnap].slice(-this.limit))
    this.future.set(f.slice(1))
    this.current.set(deepClone(nextSnap.value))
    return deepClone(nextSnap.value)
  }

  /** 时间线（给 UI 展示"操作流水"） */
  timeline() {
    return this.past().map((s) => ({ label: s.label, at: s.at }))
  }

  reset() {
    this.past.set([])
    this.future.set([])
    this.current.set(null)
  }
}
