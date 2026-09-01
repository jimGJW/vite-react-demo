import type {
  App,
  Component,
  ComputedRef,
  DefineComponent,
  InjectionKey,
  Plugin,
  Ref,
  VNode,
} from 'vue'

/* =====================================================================
 * @myorg/vue-ui-basic · 类型声明
 * Vue 3 版本，与 @myorg/react-ui-basic 能力一一对应
 * ===================================================================== */

/* ---------------------------------------------------------------------
 * 公共类型
 * ------------------------------------------------------------------- */

export type ThemeName = 'light' | 'dark' | 'auto'
export type ResolvedTheme = 'light' | 'dark'
export type NotifyType = 'info' | 'success' | 'warning' | 'error' | 'primary'

/** 一条通知记录 */
export interface NotifyItem {
  id: string
  title?: string
  description?: string
  type: NotifyType
  duration: number
  createdAt: number
  read: boolean
  active: boolean
}

/** 一条命令定义 */
export interface CommandItem {
  id: string
  label: string
  group?: string
  icon?: unknown
  keywords?: string | string[]
  action?: (command: CommandItem) => void
  [key: string]: unknown
}

/** 表格列定义 */
export interface TableColumn<T = Record<string, any>> {
  key: string
  title: string
  /** 自定义单元格渲染，可返回原始值、VNode 或 VNode 数组 */
  render?: (value: any, row: T, index: number) => any
  sortable?: boolean
  filterable?: boolean
  width?: number | string
}

/** 星表条目 */
export interface StarItem {
  name: string
  en: string
  constellation: string
  tag: string
  mag: number
  distance: string
  color: string
  note: string
  approx?: boolean
}

/* ---------------------------------------------------------------------
 * Theme · 主题
 * ------------------------------------------------------------------- */

export interface ThemeContext {
  /** 用户显式选择的主题（可能为 auto） */
  theme: Ref<ThemeName>
  /** 实际生效的主题（auto 已解析为 light / dark） */
  resolvedTheme: Readonly<Ref<ResolvedTheme>>
  setTheme: (theme: ThemeName) => void
  themes: readonly ThemeName[]
  dispose: () => void
}

export const THEMES: readonly ThemeName[]
export const THEME_KEY: InjectionKey<ThemeContext>
export function createTheme(defaultTheme?: ThemeName): ThemeContext
export function getDefaultTheme(): ThemeContext
export function useTheme(): ThemeContext
export const ThemePlugin: Plugin

export const ThemeProvider: DefineComponent<{
  defaultTheme?: ThemeName
  /** 传 true 创建隔离实例（默认共享模块级单例） */
  scoped?: boolean
}>

export const ThemeToggle: DefineComponent<Record<string, never>>

/* ---------------------------------------------------------------------
 * Notification · 通知中心
 * ------------------------------------------------------------------- */

export type NotifyFn = (
  title?: string,
  description?: string,
  duration?: number,
) => string

export interface NotificationContext {
  /** 全部通知（新→旧） */
  items: Ref<NotifyItem[]>
  /** 当前仍在屏上显示的 Toast */
  toasts: ComputedRef<NotifyItem[]>
  /** 历史记录（含已消失的） */
  history: ComputedRef<NotifyItem[]>
  unreadCount: ComputedRef<number>
  notify: (options: Partial<NotifyItem>) => string
  success: NotifyFn
  error: NotifyFn
  warning: NotifyFn
  info: NotifyFn
  remove: (id: string) => void
  removeAll: () => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearHistory: () => void
  dispose: () => void
}

export const NOTIFY_TYPES: readonly NotifyType[]
export const DEFAULT_DURATION: number
export const NOTIFICATION_KEY: InjectionKey<NotificationContext>
export const TYPE_META: Record<
  NotifyType,
  { icon: string; accent: string; soft: string }
>
export const TYPE_LABEL: Record<NotifyType, string>
export function createNotification(): NotificationContext
export function getDefaultNotification(): NotificationContext
export function useNotification(): NotificationContext
export const NotificationPlugin: Plugin
export function metaOf(type: NotifyType): { icon: string; accent: string; soft: string }
export function relativeTime(ts: number): string

export const NotificationProvider: DefineComponent<{ scoped?: boolean }>

export const NotificationDrawer: DefineComponent<{
  triggerLabel?: string
  className?: string
}>

/* ---------------------------------------------------------------------
 * CommandPalette · 命令面板
 * ------------------------------------------------------------------- */

/** 模糊匹配评分：0 表示不匹配 */
export function fuzzyScore(query: string, text: string): number
export function matchCommand(
  query: string,
  command: Pick<CommandItem, 'label' | 'keywords'>,
): { matched: boolean; score: number }

export const CommandPalette: DefineComponent<{
  commands?: CommandItem[]
  placeholder?: string
}>

/* ---------------------------------------------------------------------
 * DataTable · 数据表格
 * ------------------------------------------------------------------- */

export interface RowSelection<T = Record<string, any>> {
  selectedRowKeys?: Array<string | number>
  onChange?: (keys: Array<string | number>, rows: T[]) => void
}

export interface RowEvents<T = Record<string, any>> {
  onClick?: (row: T, index: number) => void
  onDoubleClick?: (row: T, index: number) => void
}

export const DataTable: DefineComponent<{
  columns?: TableColumn[]
  data?: Record<string, any>[]
  /** 每页行数；不传或 <=0 则不分页 */
  pageSize?: number
  rowSelection?: RowSelection | null
  onRow?: RowEvents | null
  loading?: boolean
  emptyText?: string
  rowKey?: string
  className?: string
}>

/* ---------------------------------------------------------------------
 * StarArray · 周天星辰大阵
 * ------------------------------------------------------------------- */

export const StarArray: DefineComponent<Record<string, never>>
export const STARS: readonly StarItem[]
export const TOTAL_DEGREES: number
