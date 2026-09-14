import { useEffect, useRef, useState } from 'react'

/**
 * 锚点滚动导航：左侧目录吸顶 + 右侧内容区；点击目录用 rAF 分帧平滑滚动。
 * 滚动时自动高亮当前所在版块（滚动监听节流到每帧一次）。
 * 来自某后台项目的锚点滚动导航思路，去业务化重写。
 */
export default function AnchorNav({ sections = [], height = 320, navWidth = 150 }) {
  const bodyRef = useRef(null)
  const [active, setActive] = useState(sections?.[0]?.id ?? '')

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return undefined
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const top = el.scrollTop
        let current = sections[0]?.id
        for (const s of sections) {
          const node = el.querySelector(`#sec-${s.id}`)
          if (node && node.offsetTop - el.offsetTop <= top + 80) current = s.id
        }
        setActive(current)
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [sections])

  const goTo = (id) => {
    const el = bodyRef.current
    const node = el?.querySelector(`#sec-${id}`)
    if (!el || !node) return
    const target = node.offsetTop - el.offsetTop
    const step = (target - el.scrollTop) / 12
    let n = 0
    const tick = () => {
      el.scrollTop += step
      if (++n < 12) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  return (
    <div className="st-anchor" style={{ height }}>
      <nav className="st-anchor__nav" style={{ width: navWidth }}>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`st-anchor__tab ${active === s.id ? 'is-active' : ''}`}
            onClick={() => goTo(s.id)}
          >
            {s.title}
          </button>
        ))}
      </nav>
      <div className="st-anchor__body" ref={bodyRef}>
        {sections.map((s) => (
          <section key={s.id} id={`sec-${s.id}`} className="st-anchor__section">
            <h4 className="st-anchor__title">{s.title}</h4>
            {s.content}
          </section>
        ))}
      </div>
    </div>
  )
}
