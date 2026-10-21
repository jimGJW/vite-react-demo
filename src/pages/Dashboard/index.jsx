import { useEffect, useState } from 'react'
import { useI18n } from '@i18n/index.js'
import { Animate, useTilt } from '@/motion/index.jsx'
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
      <Animate name="fadeInDown" as="h1">{t('dashboard.title')}</Animate>
      <Animate name="fadeInUp" delay={0.1} as="p">{t('dashboard.lead')}</Animate>

      <div className="dashboard-grid m-stagger">
        <StatCard index={0} label={t('dashboard.stat.users')} value={stats.users.toLocaleString()} />
        <StatCard index={1} label={t('dashboard.stat.posts')} value={stats.posts.toLocaleString()} />
        <StatCard index={2} label={t('dashboard.stat.views')} value={stats.views.toLocaleString()} />
        <StatCard index={3} label={t('dashboard.stat.revenue')} value={`¥${stats.revenue.toLocaleString()}`} />
      </div>
    </div>
  )
}

function StatCard({ label, value, index = 0 }) {
  const tilt = useTilt({ max: 6, scale: 1.02 })
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      className="dashboard-stat m-stagger-item"
      style={{ '--i': index }}
    >
      <div className="dashboard-stat-label">{label}</div>
      <div className="dashboard-stat-value">{value}</div>
    </div>
  )
}

export default Dashboard