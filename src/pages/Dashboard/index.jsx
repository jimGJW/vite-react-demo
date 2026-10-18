import { useEffect, useState } from 'react'
import { useI18n } from '@i18n/index.js'
import './index.scss'

function Dashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        users: 1280,
        posts: 3456,
        views: 98765,
        revenue: 42890,
      })
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="page-card">
        <p>{t('dashboard.loading')}</p>
      </div>
    )
  }

  return (
    <div className="page-card">
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.lead')}</p>

      <div className="dashboard-grid">
        <StatCard label={t('dashboard.stat.users')} value={stats.users.toLocaleString()} />
        <StatCard label={t('dashboard.stat.posts')} value={stats.posts.toLocaleString()} />
        <StatCard label={t('dashboard.stat.views')} value={stats.views.toLocaleString()} />
        <StatCard label={t('dashboard.stat.revenue')} value={`¥${stats.revenue.toLocaleString()}`} />
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="dashboard-stat">
      <div className="dashboard-stat-label">{label}</div>
      <div className="dashboard-stat-value">{value}</div>
    </div>
  )
}

export default Dashboard