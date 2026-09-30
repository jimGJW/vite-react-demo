import { Injectable, computed, effect, inject, signal } from '@angular/core'
import { DEFAULT_THEME, StorageService, type ThemeState } from './storage.service'

/**
 * ThemeService —— 信号驱动 + 自动持久化
 *
 * 要点：
 * 1. 状态用 signal 承载 → 模板里写 `themeService.primary()` 即自动订阅
 * 2. effect() 里做副作用（写 localStorage + 改 CSS 变量），signal 一变自动跑
 * 3. 通过 `providedIn: 'root'` 保证全应用单例，任意组件 inject 拿到的是同一份
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService)
  private readonly KEY = 'theme'

  readonly primary = signal(this.storage.restore<ThemeState>(this.KEY, DEFAULT_THEME).primary)
  readonly radius = signal(this.storage.restore<ThemeState>(this.KEY, DEFAULT_THEME).radius)
  readonly compact = signal(this.storage.restore<ThemeState>(this.KEY, DEFAULT_THEME).compact)

  readonly snapshot = computed<ThemeState>(() => ({
    primary: this.primary(),
    radius: this.radius(),
    compact: this.compact(),
  }))

  constructor() {
    // effect：signal 变化 → 写存储 + 同步 CSS 变量（子应用只改自己容器上的变量，不污染主应用）
    effect(() => {
      const state = this.snapshot()
      this.storage.set(this.KEY, state)
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--ng-primary', state.primary)
        document.documentElement.style.setProperty('--ng-radius', `${state.radius}px`)
        document.documentElement.classList.toggle('ng-compact', state.compact)
      }
    })
  }

  setPrimary(color: string) { this.primary.set(color) }
  setRadius(px: number) { this.radius.set(px) }
  toggleCompact() { this.compact.update((v) => !v) }

  reset() {
    this.primary.set(DEFAULT_THEME.primary)
    this.radius.set(DEFAULT_THEME.radius)
    this.compact.set(DEFAULT_THEME.compact)
  }

  /** 清掉本地缓存（保留内存态），用于演示「缓存已清空」 */
  clearPersisted() {
    this.storage.remove(this.KEY)
  }

  /** 常用预设色板 */
  readonly presets = ['#6366f1', '#dd0031', '#409eff', '#67c23a', '#e6a23c', '#8e44ad', '#0ea5e9']
}
