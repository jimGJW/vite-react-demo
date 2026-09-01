/* 入口：把设计系统 token + app 玻璃态外壳样式编译为统一 CSS，JS 端也提供一个 DesignTokensReset.vue 组件便于 SSR/懒加载场景 */
import './styles.scss'
import './app.scss'

export { default as DesignTokensReset } from './DesignTokensReset.vue'
export { default } from './DesignTokensReset.vue'
