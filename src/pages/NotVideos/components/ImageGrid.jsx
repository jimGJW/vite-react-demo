import { memo, useEffect, useRef, useState } from 'react'
import { useI18n } from '../../../i18n/index.js'
import { fmtSize } from './notVideoUtils.js'

/**
 * 图片网格（memo + 滚动增量）。
 * 为什么要增量：一个特效工程的产物动辄上百张（实测 121 张），一次性全渲染意味着
 * ① DOM 平白多 240+ 节点，每次轮询重渲染都要全量 diff；
 * ② 用户根本不会往下滚完，却把所有 img 都塞进布局。
 * 现在首屏只挂 48 张，滚到距底部 400px 内再追加一页。
 *
 * 为什么用 scroll 监听而不是 IntersectionObserver：IO 只认「当前是否相交」，
 * 一步到位的滚动（scrollTop = scrollHeight、键盘 End）会让哨兵从视口下方直接
 * 跳到上方，中间态不存在，IO 一次都不触发。scroll 阈值判断没有这个问题。
 * 外层 memo：轮询 304 时 images 引用不变，整个网格跳过重渲染。
 */
const PAGE = 48
const NEAR_BOTTOM = 400

function ImageGridImpl({ images }) {
  const { t } = useI18n()
  const [shown, setShown] = useState(PAGE)
  const sentinelRef = useRef(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || shown >= images.length) return undefined
    // 滚动容器是 Layout 的 .app-main-scroll（window 本身不滚）
    const scroller = el.closest('.app-main-scroll') || document.scrollingElement
    if (!scroller) return undefined
    let ticking = false
    const check = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - NEAR_BOTTOM) {
          setShown((n) => Math.min(n + PAGE, images.length))
        }
      })
    }
    scroller.addEventListener('scroll', check, { passive: true })
    check() // 挂载时可能已在底部附近（目录切换后内容变短），先判一次
    return () => scroller.removeEventListener('scroll', check)
  }, [shown, images.length])

  if (!images.length) return null
  return (
    <>
      <div className="notvideos__imgGrid">
        {images.slice(0, shown).map((im) => (
          <a key={im.rel} href={im.url} target="_blank" rel="noreferrer" title={`${im.rel} · ${fmtSize(im.size)}`}>
            <img src={im.url} alt={im.rel} loading="lazy" />
          </a>
        ))}
      </div>
      {shown < images.length ? (
        <div ref={sentinelRef} className="notvideos__imgMore">
          {t('notvideos.imgMore', { n: images.length - shown })}
        </div>
      ) : null}
    </>
  )
}

const ImageGrid = memo(ImageGridImpl)
export default ImageGrid
