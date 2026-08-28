import { ThemeProvider, ThemeToggle, useTheme } from '../../components/ThemeProvider'
import './index.scss'

/** 读取并展示当前主题上下文值 */
function ThemeState() {
  const { theme, resolvedTheme, themes } = useTheme()
  return (
    <div className="theme-state">
      <div className="theme-state-row">
        <span>当前选择</span>
        <code>{theme}</code>
      </div>
      <div className="theme-state-row">
        <span>实际生效</span>
        <code>{resolvedTheme}</code>
      </div>
      <div className="theme-state-row">
        <span>可选主题</span>
        <code>{themes.join(' / ')}</code>
      </div>
    </div>
  )
}

function ThemeDemo() {
  return (
    <ThemeProvider defaultTheme="auto">
      <div className="page-card theme-demo">
        <h1>主题切换系统</h1>
        <p>
          支持 <strong>亮色 / 暗色 / 跟随系统</strong> 三态切换：在{' '}
          <code>&lt;html&gt;</code> 上设置 <code>data-theme</code> 属性，由 CSS 变量覆盖驱动暗色样式；
          选择持久化到 localStorage，<code>auto</code> 模式下实时响应系统{' '}
          <code>prefers-color-scheme</code> 变化。
        </p>

        <h2>立即体验</h2>
        <div className="theme-demo-actions">
          <ThemeToggle />
        </div>
        <ThemeState />

        <h2>用法</h2>
        <pre className="theme-code">{`// 1. 在应用根部包裹 Provider
import { ThemeProvider } from './components/ThemeProvider'

<ThemeProvider defaultTheme="auto">
  <App />
</ThemeProvider>

// 2. 任意子组件读取 / 切换
import { useTheme, ThemeToggle } from './components/ThemeProvider'

const { theme, resolvedTheme, setTheme, themes } = useTheme()`}</pre>

        <h2>三态说明</h2>
        <ul>
          <li>
            <strong>light</strong>：强制亮色主题，使用 <code>:root</code> 默认变量。
          </li>
          <li>
            <strong>dark</strong>：强制暗色主题，在 <code>[data-theme="dark"]</code> 覆盖主色（提亮）、
            背景（加深）、文本（反色）等 token。
          </li>
          <li>
            <strong>auto</strong>：跟随系统偏好，系统切换时实时响应。
          </li>
        </ul>

        <h2>组件预览（随主题变化）</h2>
        <div className="theme-samples">
          <div className="theme-sample theme-sample--primary">主色</div>
          <div className="theme-sample theme-sample--success">成功</div>
          <div className="theme-sample theme-sample--warning">警告</div>
          <div className="theme-sample theme-sample--danger">危险</div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default ThemeDemo
