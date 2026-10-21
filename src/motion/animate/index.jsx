/* =====================================================================
   Motion · animate.css 插件封装
   ---------------------------------------------------------------------
   把社区知名的 animate.css（https://animate.style）变成 React 友好的
   <Animate> 组件，直接挂效果即可，无需手写 class：

     <Animate name="fadeInUp" delay={0.2} speed="fast">…</Animate>

   特性：
   - name：animate.css 效果名（不带 animate__ 前缀，见 ANIMATE_EFFECTS）
   - speed：'slow' | 'slower' | 'fast' | 'faster' 或数字（秒）
   - delay：数字（秒），任意值，内部转 animationDelay
   - infinite：循环播放
   - repeat：1~3，循环 N 次（与 infinite 二选一）
   - as：渲染的标签，默认 div
   - onAnimationEnd：动画结束后回调（一次性入场常用）

   尊重系统「减少动效」偏好：useReducedMotion 为真时直接渲染纯内容，
   不再加任何 animate.css 类（CSS 端也有兜底守卫）。
   ===================================================================== */

import { createElement } from 'react'
// 引入 animate.css 全部效果（经 Vite 处理为全局样式）
import 'animate.css'
// 引入本插件的 reduced-motion 守卫
import './animate.scss'

import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { ANIMATE_EFFECTS, SPEED_CLASS, buildAnimateClasses } from './effects.js'

export { ANIMATE_EFFECTS, SPEED_CLASS }

/**
 * animate.css 入场 / 循环动画包装组件。
 * 默认一次性播放；配合 onAnimationEnd 可做成"播完即定格"。
 */
export function Animate({
  name = 'fadeIn',
  speed,
  delay = 0,
  infinite = false,
  repeat,
  as: Tag = 'div',
  className = '',
  style,
  onAnimationEnd,
  children,
  ...rest
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    // 减动效：不做任何动画，直接渲染内容
    return createElement(Tag, { className, style, ...rest }, children)
  }

  const classes = buildAnimateClasses({ name, speed, infinite, repeat })

  const s = { ...style }
  if (typeof speed === 'number') s.animationDuration = `${speed}s`
  if (delay) s.animationDelay = `${delay}s`

  return createElement(
    Tag,
    {
      className: `${classes.join(' ')} ${className}`.trim(),
      style: s,
      onAnimationEnd,
      ...rest,
    },
    children,
  )
}

export default Animate
