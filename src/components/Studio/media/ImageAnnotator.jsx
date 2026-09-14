import { useRef, useState } from 'react'
import { Button, Space, Input, Tag, Empty } from 'antd'
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, EnvironmentOutlined, ClearOutlined } from '@ant-design/icons'

/**
 * ImageAnnotator · 图像标注与缩放平移
 * =====================================================================
 * 移植自存量影像/图纸审阅项目里的「图面标注」能力。原实现最值得保留的是
 * **「标注锚点用归一化坐标(0~1)存储」**这一约定：无论图片被放大多少倍、被
 * 拖到哪个位置，标注点都通过相对坐标重新换算到屏幕位置，因此缩放/平移后锚点
 * 不会漂移。原项目还把整张图塞进一个固定像素画布再 scale 适配——这里改成
 * 纯 CSS `transform`，由浏览器负责合成，性能更好。
 *
 * 组件本身不依赖任何具体业务：图片源、标注标签语义全部通过 props 注入。
 *
 * 用法：
 *   <ImageAnnotator src={dataUrl} annotations={list} onAdd={...} onRemove={...} />
 */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

export default function ImageAnnotator({
  src,
  annotations = [],
  onAdd,
  onRemove,
  editable = true,
  className = '',
}) {
  const stageRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [annotateMode, setAnnotateMode] = useState(false)
  const [draftLabel, setDraftLabel] = useState('')
  const dragRef = useRef(null)

  const onWheel = (e) => {
    e.preventDefault()
    const next = clamp(scale * (e.deltaY < 0 ? 1.12 : 0.89), 0.4, 6)
    setScale(next)
  }

  const startPan = (e) => {
    if (annotateMode) return
    e.preventDefault()
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
    const move = (ev) => {
      const d = dragRef.current
      if (!d) return
      setOffset({ x: d.ox + (ev.clientX - d.x), y: d.oy + (ev.clientY - d.y) })
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onClickStage = (e) => {
    if (!annotateMode || !editable) return
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const px = (e.clientX - rect.left - offset.x) / scale
    const py = (e.clientY - rect.top - offset.y) / scale
    // 归一化到 0~1，使锚点在缩放/平移后保持相对位置
    const nx = clamp(px / rect.width, 0, 1)
    const ny = clamp(py / rect.height, 0, 1)
    onAdd?.({
      id: `mk_${Date.now().toString(36)}`,
      x: nx,
      y: ny,
      label: draftLabel.trim() || `标注 ${annotations.length + 1}`,
    })
    setDraftLabel('')
  }

  const zoomBy = (f) => setScale((s) => clamp(s * f, 0.4, 6))
  const reset = () => { setScale(1); setOffset({ x: 0, y: 0 }) }

  return (
    <div className={`st-annotator ${className}`}>
      <div className="st-annotator__toolbar">
        <Space size={4}>
          <Button size="small" icon={<ZoomOutOutlined />} onClick={() => zoomBy(0.85)} />
          <span className="st-annotator__scale">{Math.round(scale * 100)}%</span>
          <Button size="small" icon={<ZoomInOutlined />} onClick={() => zoomBy(1.18)} />
          <Button size="small" icon={<ReloadOutlined />} onClick={reset} title="复位" />
        </Space>
        <Space size={4}>
          <Button
            size="small"
            type={annotateMode ? 'primary' : 'default'}
            icon={<EnvironmentOutlined />}
            disabled={!editable}
            onClick={() => setAnnotateMode((v) => !v)}
          >
            {annotateMode ? '标注中(点图添加)' : '标注'}
          </Button>
          <Input
            size="small"
            className="st-annotator__label"
            placeholder="标注文案"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
          />
        </Space>
      </div>

      <div className="st-annotator__body">
        <div
          ref={stageRef}
          className={`st-annotator__stage ${annotateMode ? 'is-annotate' : ''}`}
          onWheel={onWheel}
          onPointerDown={startPan}
          onClick={onClickStage}
          style={{ cursor: annotateMode ? 'crosshair' : 'grab' }}
        >
          <div
            className="st-annotator__canvas"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          >
            {src ? (
              <img src={src} alt="" draggable={false} className="st-annotator__img" />
            ) : (
              <div className="st-annotator__placeholder">放入 src 以显示底图</div>
            )}
            {annotations.map((a) => (
              <button
                key={a.id}
                type="button"
                className="st-annotator__pin"
                style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }}
                title={a.label}
                onClick={(e) => {
                  e.stopPropagation()
                  if (editable && window.confirm(`删除标注「${a.label}」？`)) onRemove?.(a.id)
                }}
              >
                <EnvironmentOutlined />
                <span className="st-annotator__pin-label">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="st-annotator__side">
          <div className="st-annotator__side-head">
            <span>标注 ({annotations.length})</span>
            {editable && annotations.length > 0 && (
              <Button
                size="small"
                type="text"
                danger
                icon={<ClearOutlined />}
                onClick={() => annotations.forEach((a) => onRemove?.(a.id))}
              >
                清空
              </Button>
            )}
          </div>
          {annotations.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无标注" />
          ) : (
            <ul className="st-annotator__list">
              {annotations.map((a) => (
                <li key={a.id}>
                  <Tag color="blue">{`(${Math.round(a.x * 100)}, ${Math.round(a.y * 100)})`}</Tag>
                  <span className="st-annotator__list-label">{a.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
