import { useEffect, useRef } from 'react'
import { useInView } from '../hooks.js'

/**
 * InfiniteScroll · 触底加载
 * =====================================================================
 * 移植自 旧移动端项目 `components/LoadMore.js` 的交互意图，实现方式换成
 * IntersectionObserver：
 *   - 原实现要业务侧自己监听滚动、算 scrollTop + clientHeight 是否接近
 *     scrollHeight，掺杂在页面逻辑里；这里收敛成一个哨兵元素
 *   - 无需手动解绑滚动监听，容器尺寸变化（折叠/展开）也能正确触发
 *
 * 注意：哨兵节点**始终挂载**，加载中只是在其下方多渲染一行文案。
 * 如果把哨兵也一起卸载，observer 会跟着失效，加载完成后不会再次触发。
 *
 * 用法：
 *   <InfiniteScroll hasMore={hasMore} loading={loading} onLoadMore={loadNext}>
 *     {list.map(...)}
 *   </InfiniteScroll>
 */

export default function InfiniteScroll({
  onLoadMore,
  hasMore = true,
  loading = false,
  rootMargin = '120px',
  loadingText = '加载中…',
  endText = '没有更多了',
  children,
  className = '',
}) {
  const sentinelRef = useRef(null)
  const inView = useInView(sentinelRef, { rootMargin })
  const firedRef = useRef(false)

  const onLoadMoreRef = useRef(onLoadMore)
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    if (!inView || !hasMore || loading || firedRef.current) return
    // 防抖：同一次「进入视口」只发起一次请求，避免 observer 抖动导致重复请求
    firedRef.current = true
    Promise.resolve(onLoadMoreRef.current?.()).finally(() => {
      firedRef.current = false
    })
  }, [inView, hasMore, loading])

  return (
    <div className={className}>
      {children}
      <div ref={sentinelRef} className="kit-inf__sentinel" aria-hidden="true" />
      {hasMore ? (
        loading ? <div className="kit-inf__state">{loadingText}</div> : null
      ) : (
        <div className="kit-inf__state kit-inf__state--end">{endText}</div>
      )}
    </div>
  )
}
