import { useCallback, useState } from 'react'
import CommandPalette from '../../components/CommandPalette'
import './index.scss'

/**
 * 命令面板演示页
 * 展示 CommandPalette 的接入方式与若干示例命令（导航 / 操作 / 帮助）。
 */
export default function CommandPaletteDemo() {
  const [last, setLast] = useState(null)
  const [closeCount, setCloseCount] = useState(0)

  const commands = [
    {
      id: 'nav-home',
      label: '前往首页',
      group: '导航',
      icon: '🏠',
      keywords: ['home', '首页', '主页'],
      action: () => setLast({ label: '前往首页' }),
    },
    {
      id: 'nav-dashboard',
      label: '前往控制台',
      group: '导航',
      icon: '📊',
      keywords: ['dashboard', '控制台', '仪表盘', '数据'],
      action: () => setLast({ label: '前往控制台' }),
    },
    {
      id: 'nav-about',
      label: '关于项目',
      group: '导航',
      icon: 'ℹ️',
      keywords: ['about', '关于'],
      action: () => setLast({ label: '关于项目' }),
    },
    {
      id: 'act-new',
      label: '新建文件',
      group: '操作',
      icon: '📄',
      keywords: ['new', 'create', '新建', '创建'],
      action: () => setLast({ label: '新建文件' }),
    },
    {
      id: 'act-save',
      label: '保存',
      group: '操作',
      icon: '💾',
      keywords: ['save', '保存', '存储'],
      action: () => setLast({ label: '保存' }),
    },
    {
      id: 'act-export',
      label: '导出数据',
      group: '操作',
      icon: '📦',
      keywords: ['export', '导出', 'download', '下载'],
      action: () => setLast({ label: '导出数据' }),
    },
    {
      id: 'act-theme',
      label: '切换主题',
      group: '操作',
      icon: '🎨',
      keywords: ['theme', '主题', 'dark', '夜间', '外观'],
      action: () => setLast({ label: '切换主题' }),
    },
    {
      id: 'help-shortcut',
      label: '查看快捷键',
      group: '帮助',
      icon: '⌨️',
      keywords: ['shortcut', '快捷键', 'keyboard'],
      action: () => setLast({ label: '查看快捷键' }),
    },
    {
      id: 'help-doc',
      label: '阅读文档',
      group: '帮助',
      icon: '📚',
      keywords: ['doc', '文档', 'document', '帮助'],
      action: () => setLast({ label: '阅读文档' }),
    },
    {
      id: 'help-feedback',
      label: '反馈问题',
      group: '帮助',
      icon: '💬',
      keywords: ['feedback', '反馈', 'bug', '问题'],
      action: () => setLast({ label: '反馈问题' }),
    },
  ]

  const handleClose = useCallback(() => {
    setCloseCount((c) => c + 1)
  }, [])

  return (
    <div className="page-card command-palette-demo">
      <h1>命令面板 CommandPalette</h1>
      <p className="demo-lead">
        一个零外部依赖（仅 React）的玻璃态命令面板组件。按下
        <kbd>⌘K</kbd>（macOS）或 <kbd>Ctrl K</kbd>（Windows / Linux）唤起面板，
        模糊搜索命令，<kbd>↑</kbd><kbd>↓</kbd> 选择并 <kbd>↵</kbd> 执行，<kbd>ESC</kbd> 关闭。
      </p>

      <div className="demo-hint-box">
        <span className="demo-hint-keys">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </span>
        <span className="demo-hint-text">点此组合键唤起面板（本页已接入）</span>
      </div>

      <CommandPalette
        commands={commands}
        placeholder="搜索命令，试试「保存」「home」「反馈」…"
        onClose={handleClose}
      />

      <h2>执行反馈</h2>
      <div className="demo-state">
        <div className="demo-state-card">
          <div className="demo-state-label">最近执行命令</div>
          <div className="demo-state-value">
            {last ? last.label : '— 暂无 —'}
          </div>
        </div>
        <div className="demo-state-card">
          <div className="demo-state-label">面板关闭次数</div>
          <div className="demo-state-value">{closeCount}</div>
        </div>
      </div>

      <h2>用法</h2>
      <pre className="demo-code">{`import CommandPalette from '../components/CommandPalette'

const commands = [
  {
    id: 'save',
    label: '保存',
    group: '操作',
    icon: '💾',
    keywords: ['save', '保存'],
    action: (cmd) => save(),
  },
  // ...
]

<CommandPalette
  commands={commands}
  placeholder="搜索命令…"
  onClose={() => console.log('closed')}
/>`}</pre>

      <h2>Props</h2>
      <table className="demo-table">
        <thead>
          <tr>
            <th>属性</th>
            <th>类型</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>commands</code>
            </td>
            <td>array</td>
            <td>
              命令列表，每项含 <code>id</code> / <code>label</code> / <code>group</code> /{' '}
              <code>icon</code> / <code>keywords</code> / <code>action</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>placeholder</code>
            </td>
            <td>string</td>
            <td>搜索框占位符，默认「搜索命令…」</td>
          </tr>
          <tr>
            <td>
              <code>onClose</code>
            </td>
            <td>function</td>
            <td>面板关闭后回调（ESC / 遮罩点击 / 执行命令后触发）</td>
          </tr>
        </tbody>
      </table>

      <h2>命令项字段</h2>
      <table className="demo-table">
        <thead>
          <tr>
            <th>字段</th>
            <th>类型</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>id</code>
            </td>
            <td>string</td>
            <td>唯一标识（用作 key）</td>
          </tr>
          <tr>
            <td>
              <code>label</code>
            </td>
            <td>string</td>
            <td>显示名称，参与模糊匹配</td>
          </tr>
          <tr>
            <td>
              <code>group</code>
            </td>
            <td>string</td>
            <td>分组名，缺省归「其他」</td>
          </tr>
          <tr>
            <td>
              <code>icon</code>
            </td>
            <td>any</td>
            <td>图标，任意可渲染内容（emoji / 字符 / JSX）</td>
          </tr>
          <tr>
            <td>
              <code>keywords</code>
            </td>
            <td>string | string[]</td>
            <td>匹配关键词，与 label 一同参与模糊搜索</td>
          </tr>
          <tr>
            <td>
              <code>action</code>
            </td>
            <td>(cmd) =&gt; void</td>
            <td>回车或点击时执行，参数为该命令对象</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
