import { useEffect, useRef, useState } from 'react'

/**
 * 进入视口时触发一次（或往复）可见状态，配合 motion.scss 的 .m-reveal。
 *
 * @param {Object}  options
 * @param {number}  options.threshold  可见比例阈值（0~1）
 * @param {string}  options.rootMargin 视口外扩/内缩
 * @param {boolean} options.once       仅揭示一次（默认 true）
 * @returns {[RefObject, boolean]}     [ref 绑定到元素, 是否已可见]
 */
export function useReveal({ threshold = 0.12, rootMargin = '0px 0px -8% 0px', once = true } = {}) {
  const ref = useRef(null)
  // 环境不支持 IntersectionObserver 时从首帧就可见，保证内容可达
  const supported = typeof IntersectionObserver !== 'undefined'
  const [visible, setVisible] = useState(() => !supported)

  useEffect(() => {
    const el = ref.current
    if (!el || !supported) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) io.unobserve(entry.target)
          } else if (!once) {
            setVisible(false)
          }
        }
      },
      { threshold, rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin, once, supported])

  return [ref, visible]
}
