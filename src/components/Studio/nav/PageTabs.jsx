/**
 * 多标签页工作区（keep-alive 风格的标签栏）。
 * 由外部维护 panels / activeKey；点击标签切换、可关闭、可扩展「新增」入口。
 * 内容区由 panels[active].render() 提供，便于实现「打开新标签页」的交互。
 * 来自某中台项目的多标签页工作区思路，去 Umi 运行时重写。
 */
export default function PageTabs({ panels = [], activeKey, onChange, onClose, onAdd }) {
  const active = panels.find((p) => p.key === activeKey)
  return (
    <div className="st-pagetabs">
      <div className="st-pagetabs__bar">
        {panels.map((p) => (
          <span
            key={p.key}
            className={`st-pagetabs__tab ${p.key === activeKey ? 'is-active' : ''}`}
            onClick={() => onChange?.(p.key)}
          >
            <span className="st-pagetabs__label">{p.label}</span>
            {p.closable && (
              <span
                className="st-pagetabs__close"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose?.(p.key)
                }}
              >
                ×
              </span>
            )}
          </span>
        ))}
        {onAdd && (
          <span className="st-pagetabs__tab st-pagetabs__add" onClick={onAdd} title="新建标签">+</span>
        )}
      </div>
      <div className="st-pagetabs__body">{active?.render ? active.render() : null}</div>
    </div>
  )
}
