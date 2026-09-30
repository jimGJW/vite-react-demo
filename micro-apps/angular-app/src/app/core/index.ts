/**
 * angular-app core 层统一出口
 *
 * 目录约定（与主应用 src/components/* 的组织方式对齐）：
 *   core/services/    官方 DI 服务（providedIn: 'root' 单例）
 *   core/pipes/       自定义管道
 *   core/directives/  自定义指令
 *   core/components/  自有组件（ng- 前缀）
 *   core/guards/      函数式路由守卫（CanActivateFn / CanDeactivateFn）
 *   core/resolvers/   函数式解析器（ResolveFn）
 */
export * from './services/toast.service'
export * from './services/storage.service'
export * from './services/theme.service'
export * from './services/mock-api.service'
export * from './services/undo-redo.service'
export * from './services/auth.service'

export * from './pipes/index'
export * from './directives/index'
export * from './components/index'
export * from './guards/index'
export * from './resolvers/index'
