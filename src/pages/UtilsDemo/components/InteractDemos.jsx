import { useRef, useState } from 'react'
import { Button, Space, Typography } from 'antd'
import {
  useWatermark, useClickOutside, useHover, useSize, useKeyPress, useCopy,
} from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'
import { useI18n } from '../../../i18n/index.js'

const { Text } = Typography

/** 交互与 DOM：水印 / 点击外部 / 悬停 / 尺寸 / 快捷键 / 剪贴板 */
export default function InteractDemos() {
  const { t } = useI18n()
  const wmRef = useRef(null)
  useWatermark(wmRef, ['示例水印', '2026-09'])
  const boxRef = useRef(null)
  const [open, setOpen] = useState(false)
  useClickOutside(boxRef, () => setOpen(false))
  const hoverRef = useRef(null)
  const hovered = useHover(hoverRef)
  const sizeRef = useRef(null)
  const size = useSize(sizeRef)
  const [keyHit, setKeyHit] = useState(t('utilsdemo.interactPressK'))
  useKeyPress('k', () => setKeyHit(`捕获到 k @ ${new Date().toLocaleTimeString('zh-CN')}`))
  const { copied, copy } = useCopy()

  return (
    <>
      <DemoCard
        title={t('utilsdemo.interactWmTitle')}
        desc={t('utilsdemo.interactWmDesc')}
        usage="const ref = useRef(null); useWatermark(ref, ['水印文字'])"
      >
        <div ref={wmRef} className="utils-demo__watermark">
          <Text>{t('utilsdemo.interactWmText')}</Text>
        </div>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.interactOutsideTitle')}
        desc={t('utilsdemo.interactOutsideDesc')}
        usage="useClickOutside(ref, () => setOpen(false))"
      >
        <div ref={boxRef} style={{ display: 'inline-block' }}>
          <Button size="small" onClick={() => setOpen((v) => !v)}>{open ? t('utilsdemo.interactExpanded') : t('utilsdemo.interactExpand')}</Button>
          {open && (
            <div className="utils-demo__pop">{t('utilsdemo.interactPanel')}</div>
          )}
        </div>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.interactHoverTitle')}
        desc={t('utilsdemo.interactHoverDesc')}
        usage="const hovered = useHover(ref);  const { width } = useSize(ref)"
      >
        <div ref={hoverRef} className={`utils-demo__hoverbox ${hovered ? 'is-hover' : ''}`}>{t('utilsdemo.interactHoverMe')}</div>
        <div ref={sizeRef} className="utils-demo__sizebox" style={{ marginTop: 8 }}>
          {t('utilsdemo.interactSize')}{size.width} × {size.height}
        </div>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.interactKeyTitle')}
        desc={t('utilsdemo.interactKeyDesc')}
        usage="useKeyPress('k', handler)"
      >
        <Text type="secondary">{keyHit}</Text>
      </DemoCard>

      <DemoCard
        title={t('utilsdemo.interactCopyTitle')}
        desc={t('utilsdemo.interactCopyDesc')}
        usage="const { copied, copy } = useCopy()"
      >
        <Space>
          <Button size="small" onClick={() => copy('复制成功示例文本')}>
            {copied ? t('utilsdemo.interactCopied') : t('utilsdemo.interactCopyText')}
          </Button>
          <Text type="secondary">{copied ? t('utilsdemo.interactResetCopy') : ''}</Text>
        </Space>
      </DemoCard>
    </>
  )
}
