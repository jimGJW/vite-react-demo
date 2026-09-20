import { useEffect, useRef } from 'react'

/**
 * 渲染次数徽标 —— 本页所有性能类结论的「证据」。
 *
 * 计数通过 ref + effect 直接写到 DOM 上，而不是用 state：
 *  · 用 state 计数会「自己把自己再渲染一次」，观测结果被污染；
 *  · 渲染期读写 ref.current 会被 React Compiler 规则拦下，
 *    放到 effect 里执行才既合法又准确。
 */
export default function RenderBadge({ name }) {
  const countRef = useRef(0)
  const nodeRef = useRef(null)

  useEffect(() => {
    countRef.current += 1
    const node = nodeRef.current
    if (!node) return undefined

    node.textContent = `已渲染 ${countRef.current} 次`
    node.dataset.fresh = 'true' // 触发一次高亮闪烁，方便肉眼捕捉
    const timer = setTimeout(() => {
      delete node.dataset.fresh
    }, 320)
    return () => clearTimeout(timer)
  })

  return (
    <span className="rh-badge">
      {name && <em className="rh-badge__name">{name}</em>}
      <b className="rh-badge__count" ref={nodeRef}>
        已渲染 … 次
      </b>
    </span>
  )
}
