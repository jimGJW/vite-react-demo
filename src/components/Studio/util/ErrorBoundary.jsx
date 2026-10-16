import { Component } from 'react'
import { Button } from 'antd'
import { I18nContext, translate, MESSAGES, DEFAULT_LANG } from '../../../i18n/index.js'

/**
 * 错误边界：捕获子树渲染期异常，展示兜底 UI 并支持重试。
 * 来自 iws-web 的 ErrorBoundary 思路；class 组件以便使用 getDerivedStateFromError。
 */
export default class ErrorBoundary extends Component {
  static contextType = I18nContext

  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || translate(MESSAGES, DEFAULT_LANG, 'studio.comp.errMessage') }
  }

  reset() {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      const lang = this.context?.lang || DEFAULT_LANG
      const t = (key, vars) => translate(MESSAGES, lang, key, vars)
      return (
        <div className="st-errorboundary">
          <div className="st-errorboundary__icon">⚠️</div>
          <div className="st-errorboundary__msg">{this.state.message}</div>
          <Button size="small" onClick={this.reset}>{t('studio.comp.errRetry')}</Button>
        </div>
      )
    }
    return this.props.children
  }
}
