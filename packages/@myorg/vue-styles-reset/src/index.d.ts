import type { DefineComponent } from 'vue'

/**
 * DesignTokensReset：占位组件，渲染为空（只用于在 Vue 模板中触发样式引入）。
 * 更推荐直接在 main.js：`import '@myorg/vue-styles-reset/style.css'`
 */
export declare const DesignTokensReset: DefineComponent<Record<string, never>, Record<string, never>, unknown>

export default DesignTokensReset
