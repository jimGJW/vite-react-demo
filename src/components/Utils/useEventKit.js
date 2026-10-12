/**
 * 事件监听与状态集合。
 *
 * 本文件由 hooks.js 按职责域拆分而来，实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js。
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
/* =====================================================================
   事件与状态小工具
   ===================================================================== */

/**
 * 声明式事件监听，组件卸载自动解绑。
 * target 可以传 DOM 节点、window / document，也可以传 ref 对象。
 *
 * 注意：handler 用 ref 收编，不会因为父组件重建而反复解绑重绑；
 * options 请传常量（或用 useMemo），否则每次渲染都视为变化。
 */
export function useEventListener(target, type, handler, options) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!type) return undefined
    const el = (target && typeof target === 'object' && 'current' in target) ? target.current : target
    if (!el || typeof el.addEventListener !== 'function') return undefined

    const listener = (e) => {
      if (handlerRef.current) handlerRef.current(e)
    }
    el.addEventListener(type, listener, options)
    return () => el.removeEventListener(type, listener, options)
  }, [target, type, options])
}

/** 强制重渲染。调试、或者依赖了 React 之外的可变数据源时用 */
export function useUpdate() {
  const [, setTick] = useState(0)
  return useCallback(() => setTick((t) => t + 1), [])
}

/**
 * Set 状态的便捷封装：多选、标签勾选、批量选择场景少写一堆展开语法。
 * 每次操作返回新 Set，保证引用变化能被 React 感知。
 */
export function useSet(initial = []) {
  const [set, setSet] = useState(() => new Set(initial))

  const add = useCallback((v) => setSet((s) => new Set(s).add(v)), [])
  const remove = useCallback((v) => setSet((s) => {
    const next = new Set(s)
    next.delete(v)
    return next
  }), [])
  const toggle = useCallback((v) => setSet((s) => {
    const next = new Set(s)
    if (next.has(v)) next.delete(v)
    else next.add(v)
    return next
  }), [])
  const clear = useCallback(() => setSet(new Set()), [])
  const has = useCallback((v) => set.has(v), [set])
  const toArray = useMemo(() => Array.from(set), [set])

  return { set, has, add, remove, toggle, clear, toArray, size: set.size }
}
