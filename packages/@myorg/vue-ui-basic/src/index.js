// Theme · 主题（light / dark / auto）+ 切换按钮
export { default as ThemeProvider } from './ThemeProvider.vue'
export { default as ThemeToggle } from './ThemeToggle.vue'
export {
  THEMES,
  THEME_KEY,
  createTheme,
  getDefaultTheme,
  useTheme,
  ThemePlugin,
} from './theme.js'

// Notification · 通知中心 + Toast + 历史抽屉
export { default as NotificationProvider } from './NotificationProvider.vue'
export { default as NotificationDrawer } from './NotificationDrawer.vue'
export {
  NOTIFY_TYPES,
  DEFAULT_DURATION,
  NOTIFICATION_KEY,
  TYPE_META,
  TYPE_LABEL,
  createNotification,
  getDefaultNotification,
  useNotification,
  NotificationPlugin,
  metaOf,
  relativeTime,
} from './notification.js'

// CommandPalette · 全局命令面板（Cmd/Ctrl + K）
export { default as CommandPalette } from './CommandPalette.vue'
export { fuzzyScore, matchCommand } from './commandPalette.js'

// DataTable · 零依赖通用数据表格（筛选、排序、分页、行选择）
export { default as DataTable } from './DataTable.vue'

// StarArray · 365 星辰周天防御大阵（5 层同心环 + 环内流动 + 径向跨环脉动）
export { default as StarArray } from './StarArray.vue'
export { STARS, TOTAL_DEGREES } from './stars-data.js'
