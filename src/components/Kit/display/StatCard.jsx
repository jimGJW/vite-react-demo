import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons'
import { formatNumber } from '../utils.js'

/**
 * StatCard · 指标卡
 * =====================================================================
 * 合并移植自 旧平板端项目 的 `components/NumberInfo` + `components/Trend`
 * （Ant Design Pro 血统）。原实现是两个只有 20~35 行的展示组件，合并后
 * 语义更完整：标题 / 大数字 / 单位 / 升降趋势 / 副标题 / 迷你图 / 页脚。
 *
 * 重要约定 —— 颜色遵循**国内习惯：涨红跌绿**。
 * 原组件默认是欧美习惯（涨绿跌红），这里是刻意反过来的；
 * 需要欧美配色时传 `colorMode="us"`。
 *
 * 用法：
 *   <StatCard title="今日工单" value={1286} status="up" trend={12.4} suffix="件" />
 *   <StatCard title="在线设备" value={312} chart={<MiniArea data={points} />} />
 */

export default function StatCard({
  title,
  value,
  prefix,
  suffix,
  precision = 0,
  status,
  trend,
  trendSuffix = '%',
  subTitle,
  footer,
  chart,
  loading = false,
  colorMode = 'cn',
  className = '',
}) {
  const showTrend = (status === 'up' || status === 'down') && trend != null

  return (
    <div className={`kit-stat ${colorMode === 'us' ? 'kit-stat--us' : ''} ${className}`}>
      {title != null && <div className="kit-stat__title">{title}</div>}

      <div className="kit-stat__value-row">
        {prefix != null && <span className="kit-stat__prefix">{prefix}</span>}
        <span className="kit-stat__value">{loading ? '--' : formatNumber(value, precision)}</span>
        {suffix != null && <span className="kit-stat__suffix">{suffix}</span>}
        {showTrend && (
          <span className={`kit-stat__trend is-${status}`}>
            {status === 'up' ? <CaretUpOutlined /> : <CaretDownOutlined />}
            {typeof trend === 'number'
              ? `${formatNumber(Math.abs(trend), 1)}${trendSuffix}`
              : trend}
          </span>
        )}
      </div>

      {subTitle != null && <div className="kit-stat__sub">{subTitle}</div>}
      {chart != null && <div className="kit-stat__chart">{chart}</div>}
      {footer != null && <div className="kit-stat__footer">{footer}</div>}
    </div>
  )
}
