import { useMemo, useState } from 'react'
import { Tag, Progress, Empty, Segmented } from 'antd'
import { WarningOutlined, InfoCircleOutlined, BugOutlined } from '@ant-design/icons'

/**
 * ScanReport · 安全扫描报告卡片
 * =====================================================================
 * 思路来自存量供应链安全工具里的「扫描结果可视化」：把一份结构化的检测报告
 * 渲染成「严重度分布 + 明细列表」。这里把具体检测规则全部抽象掉，只接收
 * `{ title, findings: [{ severity, title, location, detail }] }`，因此它可以
 * 承载任何「按严重度分类的清单」——依赖漏洞、代码审查、配置巡检皆可用。
 *
 * 用法：
 *   <ScanReport report={report} />
 */

const SEVERITY = {
  critical: { label: '严重', color: '#cf1322', order: 0 },
  high: { label: '高危', color: '#fa541c', order: 1 },
  medium: { label: '中危', color: '#faad14', order: 2 },
  low: { label: '低危', color: '#1677ff', order: 3 },
  info: { label: '提示', color: '#8c8c8c', order: 4 },
}

const ALL = Object.keys(SEVERITY)

export default function ScanReport({ report, className = '' }) {
  const findings = useMemo(() => report?.findings || [], [report])
  const [severity, setSeverity] = useState('all')

  const counts = useMemo(() => {
    const c = {}
    ALL.forEach((s) => (c[s] = 0))
    findings.forEach((f) => { if (c[f.severity] != null) c[f.severity] += 1 })
    return c
  }, [findings])

  const total = findings.length
  const shown = severity === 'all' ? findings : findings.filter((f) => f.severity === severity)
  const score = total === 0 ? 100 : Math.max(0, 100 - counts.critical * 12 - counts.high * 6 - counts.medium * 2)

  return (
    <div className={`st-scanreport ${className}`}>
      <div className="st-scanreport__head">
        <div>
          <div className="st-scanreport__title">{report?.title || '扫描报告'}</div>
          <div className="st-scanreport__sub">{total} 项发现 · 评分 {score}/100</div>
        </div>
        <Progress
          type="dashboard"
          size={84}
          percent={score}
          strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
        />
      </div>

      <div className="st-scanreport__bars">
        {ALL.map((s) => {
          const meta = SEVERITY[s]
          const pct = total ? Math.round((counts[s] / total) * 100) : 0
          return (
            <div key={s} className="st-scanreport__bar-row">
              <span className="st-scanreport__bar-label">
                <i style={{ background: meta.color }} />
                {meta.label}
              </span>
              <div className="st-scanreport__bar-track">
                <span className="st-scanreport__bar-fill" style={{ width: `${pct}%`, background: meta.color }} />
              </div>
              <b>{counts[s]}</b>
            </div>
          )
        })}
      </div>

      <div className="st-scanreport__toolbar">
        <Segmented
          size="small"
          value={severity}
          onChange={setSeverity}
          options={[{ label: `全部 ${total}`, value: 'all' }, ...ALL.map((s) => ({ label: `${SEVERITY[s].label} ${counts[s]}`, value: s }))]}
        />
      </div>

      <div className="st-scanreport__list">
        {shown.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无发现项" />
        ) : (
          shown.map((f) => {
            const meta = SEVERITY[f.severity] || SEVERITY.info
            return (
              <div key={f.id} className="st-scanreport__item">
                <Tag color={meta.color} className="st-scanreport__sev">
                  {meta.label}
                </Tag>
                <div className="st-scanreport__item-body">
                  <div className="st-scanreport__item-title">
                    {f.severity === 'info' ? <InfoCircleOutlined /> : f.severity === 'low' ? <BugOutlined /> : <WarningOutlined />}
                    {f.title}
                  </div>
                  {f.location && <code className="st-scanreport__loc">{f.location}</code>}
                  {f.detail && <div className="st-scanreport__detail">{f.detail}</div>}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
