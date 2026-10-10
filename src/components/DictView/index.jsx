/**
 * DictView —— 通用「名词解释」渲染器。
 *
 * /astro、/geo、/ocean 三块看板都需要名词解释，词条结构（是什么 / 怎么读 / 所以呢）
 * 完全一致，只有主题色和词条内容不同，所以把渲染抽出来共用，避免三份复制。
 *
 * 主题为什么用 props 传而不是读 CSS 变量：
 *   GeoBoard 用 --g-*、OceanBoard 用 --o-*、AstroBoard 用 --a-*，变量名各不相同，
 *   共用组件去猜父级变量不可靠。直接传 theme 让样式走 data 属性选择器最稳。
 */
export default function DictView({ theme = 'light', intro, groups, defs, children }) {
  return (
    <div className="dv-root" data-dv-theme={theme}>
      <div className="dv-intro">{intro}</div>
      {groups.map((g) => (
        <div key={g.title} className="dv-group">
          <div className="dv-group__head">
            <span className="dv-group__icon">{g.icon}</span>
            <h4>{g.title}</h4>
          </div>
          <div className="dv-list">
            {g.items.map(([key, alias]) => {
              const d = defs[key]
              if (!d) return null
              return (
                <div key={key} className="dv-card">
                  <div className="dv-card__head">
                    <span className="dv-card__name">{d.zh}</span>
                    <span className="dv-card__alias">{alias}</span>
                    <span className="dv-card__unit">{d.unit}</span>
                  </div>
                  <dl>
                    <dt>是什么</dt>
                    <dd>{d.what}</dd>
                    <dt>怎么读</dt>
                    <dd>{d.scale}</dd>
                    <dt>所以呢</dt>
                    <dd>{d.soWhat}</dd>
                  </dl>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {children}
    </div>
  )
}
