import { useState } from 'react'
import { Button, Tooltip, message } from 'antd'
import { CodeOutlined, CopyOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'

/**
 * 教学用代码块：默认展开、带语言标签与一键复制。
 * 这里刻意不引入语法高亮依赖 —— 保持零额外体积，纯等宽字体展示即可。
 */
export default function CodeBlock({
  title = '示例代码',
  lang = 'jsx',
  code,
  collapsible = false,
  defaultOpen = true,
}) {
  const [open, setOpen] = useState(defaultOpen)

  const copy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(
        () => message.success('已复制代码'),
        () => message.warning('复制失败，请手动选择'),
      )
      return
    }
    message.warning('当前环境不支持剪贴板')
  }

  return (
    <div className="rh-code">
      <div className="rh-code__bar">
        <span className="rh-code__title">
          <CodeOutlined /> {title}
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
              {open ? '收起' : '展开'}
            </Button>
          )}
          <Tooltip title="复制代码">
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
