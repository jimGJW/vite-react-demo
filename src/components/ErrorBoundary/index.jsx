import { Component } from 'react'

/**
 * 错误边界：拦住子树里的渲染错误，改渲染降级 UI，避免整页白屏。
 *
 * 必须写成 class —— React 目前只有 class 组件能实现
 * componentDidCatch / getDerivedStateFromError，Hook 版本尚未提供。
 *
 * 用法：
 *   <ErrorBoundary
 *     fallback={({ error, reset }) => (
 *       <Result status="error" extra={<Button onClick={reset}>重试</Button>} />
 *     )}
 *     onError={(err, info) => report(err)}
 *     resetKeys={[userId]}          // 依赖变化时自动复位
 *   >
 *     <RiskyWidget />
 *   </ErrorBoundary>
 *
 * 抓不到的三类错误（这是 React 的边界，不是本组件的缺陷）：
 *   1. 事件回调里的错误   → 用 useAsyncError() 手动抛
 *   2. 异步代码里的错误   → 同上，或在 catch 里手动抛
 *   3. 服务端渲染的错误   → 需要框架层处理
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, info)
    }
  }

  componentDidUpdate(prevProps) {
    const keys = this.props.resetKeys
    if (!Array.isArray(keys) || !Array.isArray(prevProps.resetKeys)) return
    if (this.state.error === null) return

    const changed = keys.length !== prevProps.resetKeys.length
      || keys.some((k, i) => k !== prevProps.resetKeys[i])
    if (changed) this.reset()
  }

  reset() {
    this.setState({ error: null, info: null })
    if (typeof this.props.onReset === 'function') this.props.onReset()
  }

  render() {
    const { error, info } = this.state
    const { fallback, children } = this.props

    if (error) {
      if (typeof fallback === 'function') {
        return fallback({ error, info, reset: this.reset })
      }
      return fallback ?? null
    }

    return children
  }
}
