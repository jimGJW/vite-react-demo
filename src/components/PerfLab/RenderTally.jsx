import { useEffect, useRef } from 'react'

/**
 * 渲染次数计数器。
 *
 * 计数用 ref + effect 直接写 textContent，而不是 useState：
 *  · 用 state 计数等于「数自己」，每数一次就再渲染一次，观测结果被污染；
 *  · 渲染期读写 ref.current 会被 React Compiler 规则拦下，放进 effect 才合法。
 *
 * 用法：把它放进任意组件里，页面刷新/父组件重渲染时数字会自增。
 *   function Child() { return <div>子组件 <RenderTally /></div> }
 */
export default function RenderTally({ className = '', label }) {
  const countRef = useRef(0)
  const nodeRef = useRef(null)

  useEffect(() => {
    countRef.current += 1
    const node = nodeRef.current
    if (!node) return undefined

    node.textContent = String(countRef.current)
    node.dataset.fresh = 'true'                 // 触发一次高亮，方便肉眼捕捉
    const timer = setTimeout(() => {
      delete node.dataset.fresh
    }, 320)
    return () => clearTimeout(timer)
  })

  return (
    <span className={`perf-tally ${className}`.trim()}>
      {label && <em className="perf-tally__label">{label}</em>}
      <b className="perf-tally__count" ref={nodeRef}>0</b>
    </span>
  )
}
