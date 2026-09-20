import { createContext, useContext } from 'react'

/**
 * createContext(defaultValue)
 * ─────────────────────────────────────────────────────────────
 * · 入参 defaultValue 只在「组件没有被任何 Provider 包裹」时生效；
 * · 返回值只是一个「数据通道」对象，本身不存数据：
 *     <TodoContext value={...}>  →  React 19 起可直接当 Provider 用（无需 .Provider）
 *     useContext(TodoContext)    →  任意深度的子组件读取
 *
 * ⚠️ 一定要在模块顶层创建。写在组件内部会导致每次渲染都产生一个新 Context，
 *    下游所有消费组件被强制重新挂载，是最常见也最隐蔽的误用。
 */
export const TodoContext = createContext(null)

/**
 * useContext 的惯用封装：把「必须在 Provider 内使用」的校验收敛到一处，
 * 调用方拿到的对象一定有值，省掉每个消费组件里重复判空。
 */
export function useTodos() {
  const ctx = useContext(TodoContext)
  if (!ctx) {
    throw new Error('useTodos 必须在 <TodoProvider> 内部使用')
  }
  return ctx
}
