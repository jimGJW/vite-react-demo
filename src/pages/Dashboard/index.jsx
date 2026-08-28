import { useEffect, useState } from 'react'
import './index.scss'

function Dashboard() {
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
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="page-card">
      <h1>控制台</h1>
      <p>这里展示一些示例统计数据:</p>

      <div className="dashboard-grid">
        <StatCard label="用户数" value={stats.users.toLocaleString()} />
        <StatCard label="文章数" value={stats.posts.toLocaleString()} />
        <StatCard label="浏览量" value={stats.views.toLocaleString()} />
        <StatCard label="营收" value={`¥${stats.revenue.toLocaleString()}`} />
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