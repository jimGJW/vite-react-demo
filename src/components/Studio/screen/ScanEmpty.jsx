/**
 * ScanEmpty · 扫描式空态
 * =====================================================================
 * 移植自存量大屏项目里的「空态扫描动效」。原实现把动画塞在 ECharts 的
 * `graphic.elements` 里，用 `lineDash` 关键帧描出文字轮廓——好处是与图表
 * 同层，坏处是**没有图表就没有空态**，且要依赖 ECharts 渲染管线。
 *
 * 这里改为纯 CSS/SVG 实现，因此：不依赖任何图表库、任意容器可用、
 * 尺寸自适应、可访问性更好（文本是真实文字而非矢量路径）。
 *
 * 用法：
 *   <ScanEmpty />
 *   <ScanEmpty text="暂无告警" subText="最近 24 小时无异常" height={220} />
 */

export default function ScanEmpty({
  text = '暂无数据',
  subText,
  height = 180,
  icon = true,
  className = '',
}) {
  return (
    <div className={`st-scanempty ${className}`} style={{ height }} role="status">
      {/* 网格底纹 + 扫描光带 */}
      <div className="st-scanempty__bg" aria-hidden="true">
        <div className="st-scanempty__grid" />
        <div className="st-scanempty__sweep" />
      </div>

      {icon && (
        <div className="st-scanempty__ring" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}

      <div className="st-scanempty__text">
        <div className="st-scanempty__title">{text}</div>
        {subText != null && <div className="st-scanempty__sub">{subText}</div>}
      </div>
    </div>
  )
}
