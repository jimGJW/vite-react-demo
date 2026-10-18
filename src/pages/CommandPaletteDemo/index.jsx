import { useCallback, useState } from 'react'
import CommandPalette from '@components/CommandPalette'
import { useI18n } from '@i18n/index.js'
import './index.scss'

/**
 * 命令面板演示页
 * 展示 CommandPalette 的接入方式与若干示例命令（导航 / 操作 / 帮助）。
 * 命令表在组件内定义（依赖 setLast 等 state），模块级不留副本。
 */

export default function CommandPaletteDemo() {
  const { t } = useI18n()
  const [last, setLast] = useState(null)
  const [closeCount, setCloseCount] = useState(0)

  const commands = [
    {
      id: 'nav-home',
      label: t('palette.cmd.navHome'),
      group: t('palette.group.nav'),
      icon: '🏠',
      keywords: ['home', '首页', '主页'],
      action: () => setLast({ label: t('palette.cmd.navHome') }),
    },
    {
      id: 'nav-dashboard',
      label: t('palette.cmd.navDashboard'),
      group: t('palette.group.nav'),
      icon: '📊',
      keywords: ['dashboard', '控制台', '仪表盘', '数据'],
      action: () => setLast({ label: t('palette.cmd.navDashboard') }),
    },
    {
      id: 'nav-about',
      label: t('palette.cmd.navAbout'),
      group: t('palette.group.nav'),
      icon: 'ℹ️',
      keywords: ['about', '关于'],
      action: () => setLast({ label: t('palette.cmd.navAbout') }),
    },
    {
      id: 'act-new',
      label: t('palette.cmd.actNew'),
      group: t('palette.group.action'),
      icon: '📄',
      keywords: ['new', 'create', '新建', '创建'],
      action: () => setLast({ label: t('palette.cmd.actNew') }),
    },
    {
      id: 'act-save',
      label: t('palette.cmd.actSave'),
      group: t('palette.group.action'),
      icon: '💾',
      keywords: ['save', '保存', '存储'],
      action: () => setLast({ label: t('palette.cmd.actSave') }),
    },
    {
      id: 'act-export',
      label: t('palette.cmd.actExport'),
      group: t('palette.group.action'),
      icon: '📦',
      keywords: ['export', '导出', 'download', '下载'],
      action: () => setLast({ label: t('palette.cmd.actExport') }),
    },
    {
      id: 'act-theme',
      label: t('palette.cmd.actTheme'),
      group: t('palette.group.action'),
      icon: '🎨',
      keywords: ['theme', '主题', 'dark', '夜间', '外观'],
      action: () => setLast({ label: t('palette.cmd.actTheme') }),
    },
    {
      id: 'help-shortcut',
      label: t('palette.cmd.helpShortcut'),
      group: t('palette.group.help'),
      icon: '⌨️',
      keywords: ['shortcut', '快捷键', 'keyboard'],
      action: () => setLast({ label: t('palette.cmd.helpShortcut') }),
    },
    {
      id: 'help-doc',
      label: t('palette.cmd.helpDoc'),
      group: t('palette.group.help'),
      icon: '📚',
      keywords: ['doc', '文档', 'document', '帮助'],
      action: () => setLast({ label: t('palette.cmd.helpDoc') }),
    },
    {
      id: 'help-feedback',
      label: t('palette.cmd.helpFeedback'),
      group: t('palette.group.help'),
      icon: '💬',
      keywords: ['feedback', '反馈', 'bug', '问题'],
      action: () => setLast({ label: t('palette.cmd.helpFeedback') }),
    },
  ]

  const handleClose = useCallback(() => {
    setCloseCount((c) => c + 1)
  }, [])

  return (
    <div className="page-card command-palette-demo">
      <h1>{t('palette.demo.title')}</h1>
      <p className="demo-lead">
        {t('palette.demo.leadBefore')}
        <kbd>⌘K</kbd>
        {t('palette.demo.leadMac')}
        <kbd>Ctrl K</kbd>
        {t('palette.demo.leadWin')}
        <kbd>↑</kbd>
        <kbd>↓</kbd>
        {t('palette.demo.leadSelect')}
        <kbd>↵</kbd>
        {t('palette.demo.leadRun')}
        <kbd>ESC</kbd>
        {t('palette.demo.leadClose')}
      </p>

      <div className="demo-hint-box">
        <span className="demo-hint-keys">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </span>
        <span className="demo-hint-text">{t('palette.demo.hintText')}</span>
      </div>

      <CommandPalette
        commands={commands}
        placeholder={t('palette.demo.placeholder')}
        onClose={handleClose}
      />

      <h2>{t('palette.demo.feedbackTitle')}</h2>
      <div className="demo-state">
        <div className="demo-state-card">
          <div className="demo-state-label">{t('palette.demo.lastCommand')}</div>
          <div className="demo-state-value">
            {last ? last.label : t('palette.demo.none')}
          </div>
        </div>
        <div className="demo-state-card">
          <div className="demo-state-label">{t('palette.demo.closeCount')}</div>
          <div className="demo-state-value">{closeCount}</div>
        </div>
      </div>

      <h2>{t('palette.demo.usageTitle')}</h2>
      <pre className="demo-code">{`import CommandPalette from '../components/CommandPalette'


<CommandPalette
  commands={commands}
  placeholder="搜索命令…"
  onClose={() => console.log('closed')}
/>`}</pre>

      <h2>{t('palette.demo.propsTitle')}</h2>
      <table className="demo-table">
        <thead>
          <tr>
            <th>{t('palette.demo.thProp')}</th>
            <th>{t('palette.demo.thType')}</th>
            <th>{t('palette.demo.thDesc')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>commands</code>
            </td>
            <td>array</td>
            <td>
              {t('palette.demo.propCommands')}
              <code>id</code> / <code>label</code> / <code>group</code> /{' '}
              <code>icon</code> / <code>keywords</code> / <code>action</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>placeholder</code>
            </td>
            <td>string</td>
            <td>{t('palette.demo.propPlaceholder')}</td>
          </tr>
          <tr>
            <td>
              <code>onClose</code>
            </td>
            <td>function</td>
            <td>{t('palette.demo.propOnClose')}</td>
          </tr>
        </tbody>
      </table>

      <h2>{t('palette.demo.cmdFieldsTitle')}</h2>
      <table className="demo-table">
        <thead>
          <tr>
            <th>{t('palette.demo.thField')}</th>
            <th>{t('palette.demo.thType')}</th>
            <th>{t('palette.demo.thDesc')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>id</code>
            </td>
            <td>string</td>
            <td>{t('palette.demo.fieldId')}</td>
          </tr>
          <tr>
            <td>
              <code>label</code>
            </td>
            <td>string</td>
            <td>{t('palette.demo.fieldLabel')}</td>
          </tr>
          <tr>
            <td>
              <code>group</code>
            </td>
            <td>string</td>
            <td>{t('palette.demo.fieldGroup')}</td>
          </tr>
          <tr>
            <td>
              <code>icon</code>
            </td>
            <td>any</td>
            <td>{t('palette.demo.fieldIcon')}</td>
          </tr>
          <tr>
            <td>
              <code>keywords</code>
            </td>
            <td>string | string[]</td>
            <td>{t('palette.demo.fieldKeywords')}</td>
          </tr>
          <tr>
            <td>
              <code>action</code>
            </td>
            <td>(cmd) =&gt; void</td>
            <td>{t('palette.demo.fieldAction')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
