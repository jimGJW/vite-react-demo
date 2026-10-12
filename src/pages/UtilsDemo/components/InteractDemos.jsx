import { useRef, useState } from 'react'
import { Button, Space, Typography } from 'antd'
import {
  useWatermark, useClickOutside, useHover, useSize, useKeyPress, useCopy,
} from '../../../components/Utils/index.js'
import DemoCard from './DemoCard.jsx'

const { Text } = Typography

/** 交互与 DOM：水印 / 点击外部 / 悬停 / 尺寸 / 快捷键 / 剪贴板 */
export default function InteractDemos() {
  const wmRef = useRef(null)
  useWatermark(wmRef, ['示例水印', '2026-09'])
  const boxRef = useRef(null)
  const [open, setOpen] = useState(false)
  useClickOutside(boxRef, () => setOpen(false))
  const hoverRef = useRef(null)
  const hovered = useHover(hoverRef)
  const sizeRef = useRef(null)
  const size = useSize(sizeRef)
  const [keyHit, setKeyHit] = useState('按 k 试试')
  useKeyPress('k', () => setKeyHit(`捕获到 k @ ${new Date().toLocaleTimeString('zh-CN')}`))
  const { copied, copy } = useCopy()

  return (
    <>
      <DemoCard
        title="useWatermark · 容器水印"
        desc="canvas 平铺生成 + MutationObserver 防删除，删掉会自动恢复。"
        usage="const ref = useRef(null); useWatermark(ref, ['水印文字'])"
      >
        <div ref={wmRef} className="utils-demo__watermark">
          <Text>此区域带水印（可在控制台尝试删除水印节点验证自愈）</Text>
        </div>
      </DemoCard>

      <DemoCard
        title="useClickOutside · 点击外部关闭"
        desc="常用于下拉 / 弹层；ref 由调用方创建后传入。"
        usage="useClickOutside(ref, () => setOpen(false))"
      >
        <div ref={boxRef} style={{ display: 'inline-block' }}>
          <Button size="small" onClick={() => setOpen((v) => !v)}>{open ? '已展开' : '展开面板'}</Button>
          {open && (
            <div className="utils-demo__pop">面板内容：点击外部关闭</div>
          )}
        </div>
      </DemoCard>

      <DemoCard
        title="useHover / useSize"
        desc="悬停状态与元素尺寸（ResizeObserver 驱动）。"
        usage="const hovered = useHover(ref);  const { width } = useSize(ref)"
      >
        <div ref={hoverRef} className={`utils-demo__hoverbox ${hovered ? 'is-hover' : ''}`}>悬停我</div>
        <div ref={sizeRef} className="utils-demo__sizebox" style={{ marginTop: 8 }}>
          拖动窗口宽度观察尺寸：{size.width} × {size.height}
        </div>
      </DemoCard>

      <DemoCard
        title="useKeyPress · 快捷键"
        desc="监听全局按键（大小写不敏感）。"
        usage="useKeyPress('k', handler)"
      >
        <Text type="secondary">{keyHit}</Text>
      </DemoCard>

      <DemoCard
        title="useCopy · 复制到剪贴板"
        desc="Clipboard API 优先，失败自动降级；copied 状态自动复位。"
        usage="const { copied, copy } = useCopy()"
      >
        <Space>
          <Button size="small" onClick={() => copy('复制成功示例文本')}>
            {copied ? '已复制 ✓' : '复制文本'}
          </Button>
          <Text type="secondary">{copied ? '1.5s 后复位' : ''}</Text>
        </Space>
      </DemoCard>
    </>
  )
}
