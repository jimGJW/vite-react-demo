/**
 * 水印（canvas 平铺 + MutationObserver 防删除）。
 *
 * 本文件由 hooks.js 按职责域拆分而来，实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js。
 */

import { useEffect } from 'react'
/* =====================================================================
   水印（取材自存量项目 useWatermark：canvas 平铺 + 防删除）
   ===================================================================== */

function buildWatermarkTile(lines, { fontSize, color, fontFamily, rotate, gapX, gapY }) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `${fontSize}px ${fontFamily}`
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width), 1)
  const lineH = fontSize + 4
  const textH = lines.length * lineH
  const tileW = Math.ceil(textW + gapX)
  const tileH = Math.ceil(textH + gapY)
  canvas.width = tileW
  canvas.height = tileH
  // 修改 canvas 尺寸会重置上下文，需重新设置字体
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.translate(tileW / 2, tileH / 2)
  ctx.rotate((rotate * Math.PI) / 180)
  lines.forEach((l, i) => ctx.fillText(l, 0, -textH / 2 + i * lineH))
  return { url: canvas.toDataURL('image/png'), width: tileW, height: tileH }
}

/**
 * 容器水印（canvas 平铺 + MutationObserver 防删除/防改样式）
 * @param {React.RefObject<HTMLElement>} ref 由调用方 useRef 创建
 */
export function useWatermark(ref, text, options = {}) {
  const {
    rotate = -22, fontSize = 14, color = 'rgba(0, 0, 0, 0.12)',
    fontFamily = 'sans-serif', gapX = 120, gapY = 80, zIndex = 10,
  } = options
  const textKey = Array.isArray(text) ? text.join('|') : String(text ?? '')

  useEffect(() => {
    const container = ref?.current
    const lines = (Array.isArray(text) ? text : [text]).filter(Boolean).map(String)
    if (!container || lines.length === 0) return undefined

    if (window.getComputedStyle(container).position === 'static') {
      // 用 setProperty 而非属性赋值，避免直接改写由 ref 传入的节点属性
      container.style.setProperty('position', 'relative')
    }
    const { url, width, height } = buildWatermarkTile(lines, {
      fontSize, color, fontFamily, rotate, gapX, gapY,
    })
    const overlay = document.createElement('div')
    overlay.setAttribute('data-watermark', 'true')
    Object.assign(overlay.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      backgroundImage: `url(${url})`,
      backgroundRepeat: 'repeat',
      backgroundSize: `${width}px ${height}px`,
      zIndex: String(zIndex),
    })
    container.appendChild(overlay)

    // 被删除或样式被篡改时自动恢复（我们的修复同样触发回调，但检测后无需再改，不会死循环）
    const restore = () => {
      if (!container.contains(overlay)) container.appendChild(overlay)
      if (overlay.style.pointerEvents !== 'none') overlay.style.pointerEvents = 'none'
      if (overlay.style.position !== 'absolute') overlay.style.position = 'absolute'
    }
    const mo = new MutationObserver(restore)
    mo.observe(container, { childList: true, attributes: true, subtree: true, attributeFilter: ['style'] })

    return () => {
      mo.disconnect()
      overlay.remove()
    }
  }, [ref, textKey, text, rotate, fontSize, color, fontFamily, gapX, gapY, zIndex])
}
