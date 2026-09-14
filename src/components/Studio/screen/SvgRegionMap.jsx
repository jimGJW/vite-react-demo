import { useMemo } from 'react'

/**
 * SvgRegionMap · 数据驱动区域图
 * =====================================================================
 * 移植自存量资产看板里的「楼宇/区域三层打点图」。原实现最有价值的不是业务语义，
 * 而是这套**数据驱动的分层打点模型**：
 *   第 1 层 底图区域（一张背景 + 若干可点击热区）
 *   第 2 层 区域块（各自带 x/y/缩放/层级，形成 2.5D 前后关系）
 *   第 3 层 标记气泡（按类型轮换配色，显示计数，点击下钻）
 *
 * 原实现把底图做成固定 800×600 画布再 `transform: scale(容器宽/800)` 适配，
 * 需要 JS 量宽度。这里换成一个 `viewBox` 的纯 SVG：**浏览器原生等比缩放**，
 * 零 JS 测量、零 ResizeObserver，任意容器宽度都自适应。
 *
 * 数据形态：
 *   regions: [{ id, name, x, y, w, h, active }]            // viewBox 坐标系
 *   nodes:   [{ id, regionId, type, count, label }]
 *
 * 用法：
 *   <SvgRegionMap regions={regions} nodes={nodes} onRegionClick={(r) => ...} />
 */

const PALETTE = ['#1677ff', '#13c2c2', '#722ed1', '#fa8c16', '#eb2f96', '#52c41a']

/** 把每个区域内的节点排成网格，返回带坐标的节点列表 */
function layoutNodes(nodes, regions) {
  const byRegion = new Map()
  nodes.forEach((node) => {
    const list = byRegion.get(node.regionId) || []
    list.push(node)
    byRegion.set(node.regionId, list)
  })

  const placed = []
  byRegion.forEach((list, regionId) => {
    const region = regions.find((r) => r.id === regionId)
    if (!region) return
    const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(list.length))))
    const rows = Math.ceil(list.length / cols)
    const padX = region.w * 0.16
    const padY = region.h * 0.22
    const stepX = cols > 1 ? (region.w - padX * 2) / (cols - 1) : 0
    const stepY = rows > 1 ? (region.h - padY * 2) / (rows - 1) : 0

    list.forEach((node, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      placed.push({
        ...node,
        cx: region.x + padX + col * stepX,
        cy: region.y + padY + row * stepY,
      })
    })
  })
  return placed
}

export default function SvgRegionMap({
  regions = [],
  nodes = [],
  width = 800,
  height = 520,
  onRegionClick,
  className = '',
}) {
  const placed = useMemo(() => layoutNodes(nodes, regions), [nodes, regions])

  const typeColor = useMemo(() => {
    const map = new Map()
    nodes.forEach((n) => {
      if (!map.has(n.type)) map.set(n.type, PALETTE[map.size % PALETTE.length])
    })
    return map
  }, [nodes])

  return (
    <div className={`st-regionmap ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="st-regionmap__svg" role="img">
        <defs>
          <filter id="st-regionmap-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" result="off" />
            <feComponentTransfer in="off" result="fade">
              <feFuncA type="linear" slope="0.28" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="fade" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 第 1 层：底板 */}
        <rect x="0" y="0" width={width} height={height} rx="14" fill="var(--c-bg-soft, #fafafa)" />

        {/* 第 2 层：区域块 */}
        {regions.map((region) => (
          <g
            key={region.id}
            className={`st-regionmap__region ${region.active ? 'is-active' : ''}`}
            onClick={() => onRegionClick?.(region)}
          >
            <rect
              x={region.x}
              y={region.y}
              width={region.w}
              height={region.h}
              rx="10"
              fill={region.active ? 'var(--c-primary-soft, rgba(22,119,255,.12))' : 'var(--c-card, #fff)'}
              stroke={region.active ? 'var(--c-primary, #1677ff)' : 'var(--c-border-soft, #f0f0f0)'}
              strokeWidth="1.5"
            />
            <text x={region.x + 12} y={region.y + 20} className="st-regionmap__label">
              {region.name}
            </text>
          </g>
        ))}

        {/* 第 3 层：标记气泡 */}
        {placed.map((node) => (
          <g
            key={node.id}
            className="st-regionmap__marker"
            transform={`translate(${node.cx} ${node.cy})`}
            filter="url(#st-regionmap-shadow)"
          >
            <circle r="13" fill={typeColor.get(node.type) || PALETTE[0]} />
            <text y="4" textAnchor="middle" className="st-regionmap__count">
              {node.count}
            </text>
            {node.label != null && (
              <text y="26" textAnchor="middle" className="st-regionmap__caption">
                {node.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {regions.length > 0 && (
        <div className="st-regionmap__legend">
          {Array.from(typeColor.entries()).map(([type, color]) => (
            <span key={type} className="st-regionmap__legend-item">
              <i style={{ background: color }} />
              {type}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
