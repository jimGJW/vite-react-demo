import { useState } from 'react'
import { Button, Tooltip, message } from 'antd'
import { CodeOutlined, CopyOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'
import { useI18n } from '@i18n/index.js'

/**
 * 教学用代码块：默认展开、带语言标签与一键复制。
 * 这里刻意不引入语法高亮依赖 —— 保持零额外体积，纯等宽字体展示即可。
 */
export default function CodeBlock({
  title,
  lang = 'jsx',
  code,
  collapsible = false,
  defaultOpen = true,
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(defaultOpen)

  const copy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(
        () => message.success(t('hooks.code.copied')),
        () => message.warning(t('hooks.code.copyFailed')),
      )
      return
    }
    message.warning(t('hooks.code.clipboardUnsupported'))
  }

  return (
    <div className="rh-code">
      <div className="rh-code__bar">
        <span className="rh-code__title">
          <CodeOutlined /> {title ?? t('hooks.code.defaultTitle')}
        </span>
        <span className="rh-code__actions">
          <span className="rh-code__lang">{lang}</span>
          {collapsible && (
            <Button
              size="small"
              type="text"
              onClick={() => setOpen((v) => !v)}
              icon={open ? <DownOutlined /> : <RightOutlined />}
            >
              {open ? t('hooks.code.collapse') : t('hooks.code.expand')}
            </Button>
          )}
          <Tooltip title={t('hooks.code.copyTooltip')}>
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={copy} />
          </Tooltip>
        </span>
      </div>
      {open && (
        <pre className="rh-code__pre">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
