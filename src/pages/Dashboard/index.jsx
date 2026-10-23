import { useEffect, useState } from 'react'
import { Skeleton } from 'antd'
import { Page, Kpi } from '@components/PageShell/index.jsx'
import { useI18n } from '@i18n/index.js'
import './index.scss'

/* 固定的示例趋势数据（不随机：每次进入图形一致，避免闪烁观感） */
const TREND = [18, 26, 22, 34, 30, 42, 38, 52, 46, 60, 55, 68, 62, 74, 70, 82, 78, 88, 84, 92, 88, 96, 94, 100]

function buildPaths(values, width = 240, height = 80) {
  const step = width / (values.length - 1)
  const points = values.map((v, i) => [i * step, height - (v / 100) * (height - 8) - 4])
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  return { line, area }
}

function Dashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({ users: 1280, posts: 3456, views: 98765, revenue: 42890 })
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const { line, area } = buildPaths(TREND)
  const rows = stats
    ? [
        { key: 'users', value: stats.users, prefix: undefined },
        { key: 'posts', value: stats.posts, prefix: undefined },
        { key: 'views', value: stats.views, prefix: undefined },
        { key: 'revenue', value: stats.revenue, prefix: '¥' },
      ]
    : []
  const max = stats ? Math.max(...Object.values(stats)) : 1

  return (
    <Page
      className="dashboard"
      eyebrow="Dashboard"
      title={t('dashboard.title')}
      subtitle={t('dashboard.lead')}
      accent="primary"
      shine
      gap="xl"
    >
      {!stats ? (
        <div className="pg-kpis" aria-busy="true" aria-label={t('dashboard.loading')}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="pg-kpi">
              <Skeleton active title={{ width: '50%' }} paragraph={{ rows: 1, width: '80%' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="pg-kpis m-stagger">
            {rows.map((row, i) => (
              <Kpi
                key={row.key}
                index={i}
                title={t(`dashboard.stat.${row.key}`)}
                value={row.value}
                prefix={row.prefix}
              />
            ))}
          </div>

          <div className="page-card dash-detail">
            <div className="dash-detail__head">
              <span className="dash-detail__caption">{t('dashboard.lead')}</span>
            </div>

            <svg className="dash-spark" viewBox="0 0 240 80" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="dashFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: 'var(--c-primary)', stopOpacity: 0.28 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--c-primary)', stopOpacity: 0 }} />
                </linearGradient>
                <linearGradient id="dashStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" style={{ stopColor: 'var(--c-primary)' }} />
                  <stop offset="60%" style={{ stopColor: 'var(--c-accent)' }} />
                  <stop offset="100%" style={{ stopColor: 'var(--c-accent-2)' }} />
                </linearGradient>
              </defs>
              <path className="dash-spark__area" d={area} fill="url(#dashFill)" />
              <path className="dash-spark__line" d={line} fill="none" stroke="url(#dashStroke)" />
            </svg>

            <ul className="dash-bars">
              {rows.map((row, i) => (
                <li key={row.key} className="dash-bar" style={{ '--i': i }}>
                  <span className="dash-bar__label">{t(`dashboard.stat.${row.key}`)}</span>
                  <span className="dash-bar__track">
                    <span
                      className="dash-bar__fill"
                      style={{ '--w': `${Math.round((row.value / max) * 100)}%` }}
                    />
                  </span>
                  <span className="dash-bar__value">{row.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Page>
  )
}

export default Dashboard
