import { useCallback, useState } from 'react'

/**
 * 把「事件回调 / 异步代码里」的错误抛到渲染期，交给上层 ErrorBoundary 兜住。
 *
 * ErrorBoundary 只能抓渲染期抛出的错误。按钮点击、setTimeout、Promise.catch
 * 里的错误发生在 React 渲染之外，边界是看不见的 —— 这个 Hook 就是补上那一段：
 *
 *   const throwError = useAsyncError()
 *   fetchData().catch(throwError)
 *
 * 原理：setState 的函数式 updater 会在下一次渲染时执行，
 * 在 updater 里 throw 就等价于在渲染期 throw，于是被最近的 ErrorBoundary 捕获。
 */
export function useAsyncError() {
  const [, setState] = useState(null)

  return useCallback((error) => {
    const err = error instanceof Error ? error : new Error(String(error))
    setState(() => {
      throw err
    })
  }, [])
}
