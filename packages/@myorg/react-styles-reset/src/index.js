/* 入口：把设计系统 token + app 玻璃态外壳样式编译为统一 CSS，JS 端也提供一个 <DesignTokensReset /> 组件便于 SSR/懒加载场景 */
import './styles.scss'
import './app.scss'

/**
 * DesignTokensReset：占位组件，渲染为空（只用于在 React 树中触发样式引入）。
 * 更推荐直接在 main.jsx：`import '@myorg/react-styles-reset/style.css'`
 *
 * @returns {import('react').ReactElement|null}
 */
export function DesignTokensReset() {
  return null
}

export default DesignTokensReset
