import { useCallback, useMemo, useRef, useState } from 'react'
import { TodoContext } from './todoContext.js'

const SEED = [
  { id: 1, text: '阅读 React 19 官方文档', done: true },
  { id: 2, text: '用 useMemo 缓存派生数据', done: false },
  { id: 3, text: '用 useCallback 稳定回调引用', done: false },
]

/**
 * Provider 里集中演示三件事：
 *  1. useMemo     —— 缓存「注入 Context 的 value 对象」，避免下游无差别重渲染
 *  2. useMemo     —— 缓存派生数据（统计 / 过滤列表），依赖不变就不重算
 *  3. useCallback —— 让操作函数引用保持稳定，配合 memo 子组件才真正生效
 *
 * 注：本组件只导出组件本身，Context 对象与消费 Hook 都放在 todoContext.js，
 * 既符合 react-refresh 的单文件导出约束，也是更好的模块边界。
 */
export default function TodoProvider({ children }) {
  const [todos, setTodos] = useState(SEED)
  const [filter, setFilter] = useState('all')
  const [theme, setTheme] = useState('light')
  const nextId = useRef(SEED.length)

  /* —— useCallback：函数引用在多次渲染之间保持不变 —— */
  const addTodo = useCallback((text) => {
    const value = text.trim()
    if (!value) return
    nextId.current += 1
    const id = nextId.current
    setTodos((prev) => [{ id, text: value, done: false }, ...prev])
  }, [])

  const toggleTodo = useCallback((id) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }, [])

  const removeTodo = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearDone = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.done))
  }, [])

  const changeFilter = useCallback((next) => {
    setFilter(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  /* —— useMemo：派生数据，只有 todos 变化时才重新计算 —— */
  const stats = useMemo(() => {
    const done = todos.filter((t) => t.done).length
    const total = todos.length
    return {
      total,
      done,
      active: total - done,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
    }
  }, [todos])

  const visible = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.done)
    if (filter === 'done') return todos.filter((t) => t.done)
    return todos
  }, [todos, filter])

  /* —— useMemo：Context 注入值。依赖不变 → 引用不变 → 下游不重渲染 —— */
  const value = useMemo(
    () => ({
      todos: visible,
      filter,
      theme,
      stats,
      addTodo,
      toggleTodo,
      removeTodo,
      clearDone,
      changeFilter,
      toggleTheme,
    }),
    [
      visible,
      filter,
      theme,
      stats,
      addTodo,
      toggleTodo,
      removeTodo,
      clearDone,
      changeFilter,
      toggleTheme,
    ],
  )

  /* React 19 起可以把 Context 直接当 Provider 用，不必再写 <TodoContext.Provider> */
  return <TodoContext value={value}>{children}</TodoContext>
}
