import { Component } from 'react'
import { Button } from 'antd'

/**
 * 错误边界：捕获子树渲染期异常，展示兜底 UI 并支持重试。
 * 来自 iws-web 的 ErrorBoundary 思路；class 组件以便使用 getDerivedStateFromError。
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '渲染出错' }
  }

  reset() {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="st-errorboundary">
          <div className="st-errorboundary__icon">⚠️</div>
          <div className="st-errorboundary__msg">{this.state.message}</div>
          <Button size="small" onClick={this.reset}>重试</Button>
        </div>
      )
    }
    return this.props.children
  }
}
