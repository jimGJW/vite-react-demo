import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import GlobalAgent from '../components/GlobalAgent/index.jsx'

/**
 * 分组导航配置：
 * - type: 'link'  顶层直达链接
 * - type: 'group' 下拉分组，children 为组内页面
 */
const navGroups = [
  { type: 'link', to: '/', label: '首页', icon: '🏠', end: true },
  {
    type: 'group',
    label: 'AI 助手',
    icon: '🤖',
    children: [
      { to: '/voice', label: '语音助手', icon: '🎙️', desc: '语音识别与播报' },
      { to: '/agent', label: 'AI Agent 控制台', icon: '🎯', desc: '自然语言驱动页面操作' },
    ],
  },
  {
    type: 'group',
    label: '工具箱',
    icon: '🧰',
    children: [
      { to: '/scan', label: '扫码', icon: '📱', desc: '摄像头扫码识别' },
      { to: '/embed', label: '嵌套预览', icon: '🖼️', desc: 'iframe 嵌套演示' },
      { to: '/form-builder', label: '配置表单', icon: '📝', desc: 'JSON 驱动动态表单' },
      { to: '/theme', label: '主题切换', icon: '🎨', desc: '暗/亮/跟随系统三态主题' },
      { to: '/charts', label: 'SVG 图表', icon: '📈', desc: '纯 SVG 图表组件演示' },
      { to: '/command-palette', label: '命令面板', icon: '⌘', desc: 'Cmd/K 全局搜索导航' },
      { to: '/notify', label: '通知中心', icon: '🔔', desc: 'Toast 与通知抽屉' },
      { to: '/data-table', label: '高级表格', icon: '📋', desc: '排序筛选分页行选择' },
      { to: '/login', label: '星空登录', icon: '🔐', desc: '星际登录页' },
    ],
  },
  { type: 'link', to: '/dashboard', label: '控制台', icon: '📊' },
  { type: 'link', to: '/test-center', label: '测试中心', icon: '🧪' },
  { type: 'link', to: '/about', label: '关于', icon: 'ℹ️' },
]

function Layout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isGroupActive = (group) =>
    group.children.some((child) =>
      child.to === '/' ? pathname === '/' : pathname.startsWith(child.to),
    )

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo">⚡</span>
          <span className="brand-name">Vite + React</span>
        </div>

        <nav className="app-nav" aria-label="主导航">
          <ul>
            {navGroups.map((item) =>
              item.type === 'group' ? (
                <li key={item.label} className={`nav-dropdown ${isGroupActive(item) ? 'group-active' : ''}`}>
                  <button type="button" className="nav-trigger" aria-haspopup="true">
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="nav-caret" aria-hidden="true">▾</span>
                  </button>
                  <ul className="dropdown-menu">
                    <li className="dropdown-title">{item.label}</li>
                    {item.children.map((child) => (
                      <li key={child.to} className="dropdown-item">
                        <NavLink
                          to={child.to}
                          className={({ isActive }) => (isActive ? 'active' : '')}
                        >
                          <span className="item-icon">{child.icon}</span>
                          <span className="item-text">
                            <span className="item-label">{child.label}</span>
                            <span className="item-desc">{child.desc}</span>
                          </span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => (isActive ? 'active' : '')}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </nav>

        {user && (
          <div className="user-chip">
            <span className="user-chip-avatar" aria-hidden="true">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="user-chip-name">{user.name}</span>
            <button
              type="button"
              className="user-chip-logout"
              onClick={onLogout}
              title="登出"
              aria-label="登出"
            >
              ⏻
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <GlobalAgent />

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Vite + React Demo · Built with ❤️</p>
      </footer>
    </div>
  )
}

export default Layout
