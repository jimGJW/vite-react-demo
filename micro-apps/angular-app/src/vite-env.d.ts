/// <reference types="vite/client" />

/**
 * 让 TS 认识「副作用式样式导入」：import './styles.css'
 * （vite/client 已包含 *.css 声明，这里再显式兜一层，避免 tsconfig types: [] 时漏掉）
 */
declare module '*.css' {
  const content: string
  export default content
}
