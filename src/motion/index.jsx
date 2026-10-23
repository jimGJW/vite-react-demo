/* eslint-disable react-refresh/only-export-components --
   本文件是 motion 的公开出口，刻意同时导出组件（Reveal/Motion/PageTransition/Animate）
   与 hooks（useTilt/useReveal/useCountUp/useReducedMotion）。拆成两个入口会让 20+ 处
   import 变成双路径，代价大于收益（该规则只影响开发期 HMR 粒度，不影响运行）。 */
import { createContext, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { useReveal } from './hooks/useReveal.js'
import { useReducedMotion } from './hooks/useReducedMotion.js'
import { useTilt } from './hooks/useTilt.js'
import { useCountUp } from './hooks/useCountUp.js'
// animate.css 插件：<Animate> 组件 + 效果清单（自动引入 animate.css 样式）
import { Animate, ANIMATE_EFFECTS } from './animate/index.jsx'

/* —— 全局动效配置（可选；不包也可用，走默认值） —— */
const MotionCtx = createContext({ speed: 'normal', reduced: false })

export function MotionProvider({ speed = 'normal', children }) {
  const reduced = useReducedMotion()
  return <MotionCtx.Provider value={{ speed, reduced }}>{children}</MotionCtx.Provider>
}

export const useMotion = () => useContext(MotionCtx)

/**
 * 滚动揭示容器：进入视口时加 .is-visible 触发 motion.scss 的过渡。
 * 支持方向（fade-up / down / left / right / zoom / fade）与延迟。
 */
export function Reveal({
  as: Tag = 'div',
  type = 'fade-up',
  delay = 0,
  duration,
  once = true,
  className = '',
  style,
  children,
  ...rest
}) {
  const [ref, visible] = useReveal({ once })
  const cls = `m-reveal m-reveal--${type} ${visible ? 'is-visible' : ''} ${className}`.trim()
  const s = { ...style }
  if (delay) s.transitionDelay = `${delay}s`
  if (duration) s.transitionDuration = `${duration}s`
  return (
    <Tag ref={ref} className={cls} style={s} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * 命令式入场 / 循环动画包装：把 type 映射为 .m-* 工具类，可覆盖延迟与时长。
 */
export function Motion({
  as: Tag = 'div',
  type = 'fade-up',
  delay = 0,
  duration,
  infinite = false,
  className = '',
  style,
  children,
  ...rest
}) {
  const cls = `m-${type} ${className}`.trim()
  const s = { ...style }
  if (delay) s.animationDelay = `${delay}s`
  if (duration) s.animationDuration = `${duration}s`
  if (infinite) s.animationIterationCount = 'infinite'
  return (
    <Tag className={cls} style={s} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * 路由切换过渡：以 pathname 为 key 重挂，每次跳转都重放 m-page-in。
 * 放在 Layout 的 <Outlet/> 外层即可让全站页面淡入上浮。
 */
export function PageTransition({ children }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  )
}

export { useReveal, useReducedMotion, useTilt, useCountUp, Animate, ANIMATE_EFFECTS }
