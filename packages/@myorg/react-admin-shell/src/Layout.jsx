import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@myorg/react-core-hooks'
import GlobalAgent from './GlobalAgent.jsx'
import './Layout.scss'

/**
 * 分组导航配置：
 * - type: 'link'  顶层直达链接
 * - type: 'group' 折叠分组（在侧边栏里手风琴展开/收起）
 */
const navGroups = [
  { type: 'link', to: '/', label: '首页', icon: '🏠', end: true },
  {
    type: 'group',
    label: 'AI 助手',
    icon: '🤖',
    defaultOpen: false,
    children: [
      { to: '/voice', label: '语音助手', icon: '🎙️', desc: '语音识别与播报' },
      { to: '/agent', label: 'AI Agent 控制台', icon: '🎯', desc: '自然语言驱动页面操作' },
    ],
  },
  {
    type: 'group',
    label: '工具箱',
    icon: '🧰',
    defaultOpen: true,
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

const LS_KEY = 'app.layout.v1'
const DEFAULT = { sidebarMode: 'expanded', headerVisible: true, collapsed: {} }

function readLayout() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT
    const parsed = JSON.parse(raw)
    return { ...DEFAULT, ...parsed, collapsed: { ...DEFAULT.collapsed, ...(parsed.collapsed || {}) } }
  } catch {
    return DEFAULT
  }
}
function writeLayout(v) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(v)) } catch { /* ignore */ }
}

/**
 * 布局结构（严格一个滚动容器：.app-main-scroll）
 *
 *  .app-shell                       flex-col / h-screen / overflow-hidden  ← 全局不滚动
 *  ├─ header  .app-header           flex / height: var(--lh, 64px) 可隐藏（lh=0）
 *  ├─ section .app-body             flex / flex-1 / min-h-0 / overflow-hidden
 *  │    ├─ aside .app-sidebar       width: var(--sw) / flex-shrink-0 三态
 *  │    └─ div   .app-main-wrap     flex-1 / min-w-0 / display:flex / flex-col
 *  │          └─ main .app-main-scroll  flex-1 / min-h-0 / overflow-y-auto ← 唯一滚动层
 *  │                 └─ Outlet
 *  └─ footer .app-footer（可选，随内容区展开）
 */
export default function Layout() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initial = useMemo(() => readLayout(), [])
  const [sidebarMode, setSidebarMode] = useState(initial.sidebarMode)    // 'expanded' | 'collapsed' | 'hidden'
  const [headerVisible, setHeaderVisible] = useState(initial.headerVisible) // boolean
  const [collapsed, setCollapsed] = useState(initial.collapsed)          // group 手风琴：{ [groupLabel]: boolean }

  // 持久化用户偏好
  useEffect(() => {
    writeLayout({ sidebarMode, headerVisible, collapsed })
  }, [sidebarMode, headerVisible, collapsed])

  const isGroupActive = (group) =>
    group.children.some((child) =>
      child.to === '/' ? pathname === '/' : pathname.startsWith(child.to),
    )

  const toggleSidebar = () => setSidebarMode((prev) => {
    if (prev === 'hidden') return 'expanded'
    if (prev === 'expanded') return 'collapsed'
    return 'hidden'
  })
  const cycleHeader = () => setHeaderVisible((v) => !v)
  const openSidebarIfHidden = () => setSidebarMode((prev) => (prev === 'hidden' ? 'expanded' : prev))

  const toggleGroup = (label, defaultOpen = false) => {
    setCollapsed((prev) => {
      const current = prev[label] ?? !defaultOpen
      return { ...prev, [label]: !current }
    })
  }

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`app-shell ${headerVisible ? 'header-on' : 'header-off'} sidebar-${sidebarMode}`}>
      {/* ========== 顶部导航（可隐藏） ========== */}
      <header className="app-header" aria-hidden={!headerVisible}>
        <div className="header-left">
          {/* 侧边栏三态切换：展开 → 折叠 → 隐藏 → 展开 */}
          <button
            type="button"
            className="icon-btn sidebar-toggle"
            onClick={toggleSidebar}
            title={`侧边栏：${sidebarMode === 'expanded' ? '点击折叠' : sidebarMode === 'collapsed' ? '点击隐藏' : '点击展开'}`}
            aria-label="切换侧边栏（展开 / 折叠 / 隐藏）"
          >
            <SidebarIcon mode={sidebarMode} />
          </button>

          <div className="brand" onClick={openSidebarIfHidden} title="点击展开侧边栏">
            <span className="brand-logo" aria-hidden="true">⚡</span>
            <span className="brand-name">星际控制台</span>
          </div>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="icon-btn header-toggle"
            onClick={cycleHeader}
            title={headerVisible ? '隐藏顶部导航栏' : '显示顶部导航栏'}
            aria-label="切换顶部导航栏显示"
          >
            {headerVisible ? <HideIcon /> : <ShowIcon />}
          </button>

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
        </div>
      </header>

      {/* ========== 中部：左侧栏 + 右侧内容（唯一滚动容器在这里） ========== */}
      <section className="app-body">
        <aside className="app-sidebar" aria-label="侧边导航">
          <nav className="sidebar-nav">
            <ul>
              {navGroups.map((item) =>
                item.type === 'group' ? (
                  <SidebarGroup
                    key={item.label}
                    group={item}
                    collapsed={collapsed[item.label] ?? !item.defaultOpen}
                    sidebarMode={sidebarMode}
                    isGroupActive={isGroupActive(item)}
                    onToggle={() => toggleGroup(item.label, item.defaultOpen)}
                  />
                ) : (
                  <SidebarLink key={item.to} item={item} sidebarMode={sidebarMode} />
                ),
              )}
            </ul>
          </nav>

          {sidebarMode === 'expanded' && (
            <div className="sidebar-foot" aria-hidden="true">
              <span className="sidebar-foot-dot" />
              点击左上角按钮切换：折叠 / 隐藏
            </div>
          )}
        </aside>

        <div className="app-main-wrap">
          <main className="app-main-scroll" role="main">
            <Outlet />
            <footer className="app-footer">
              <p>© {new Date().getFullYear()} 星际控制台 · Built with ❤️</p>
            </footer>
          </main>
        </div>
      </section>

      {/* ========== 应急浮动入口（header 隐藏 或 sidebar 隐藏 时仍然可见） ==========
           必须放在 app-shell 直接子节点（不属于 header / sidebar），
           解决「隐藏开关放在被隐藏容器里 → 无法恢复」的死锁问题。
           ================================================================= */}
      <div
        className={`emergency-fab ${headerVisible ? '' : 'show-header-btn'} ${sidebarMode !== 'hidden' ? 'no-sidebar-btn' : ''}`}
        aria-hidden={headerVisible && sidebarMode !== 'hidden'}
      >
        {!headerVisible && (
          <button
            type="button"
            className="fab-btn fab-show-header"
            onClick={cycleHeader}
            title="显示顶部导航栏"
            aria-label="显示顶部导航栏"
          >
            <ShowIcon />
          </button>
        )}
        {sidebarMode === 'hidden' && (
          <button
            type="button"
            className="fab-btn fab-show-sidebar"
            onClick={toggleSidebar}
            title="展开侧边栏"
            aria-label="展开侧边栏"
          >
            <SidebarIcon mode="hidden" />
          </button>
        )}
      </div>

      <GlobalAgent />
    </div>
  )
}

/* ---------- 侧边栏：单条 link ---------- */
function SidebarLink({ item, sidebarMode }) {
  return (
    <li className="sidebar-li">
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        title={sidebarMode === 'collapsed' ? item.label : undefined}
      >
        <span className="sidebar-icon">{item.icon}</span>
        <span className="sidebar-label">{item.label}</span>
      </NavLink>
    </li>
  )
}

/* ---------- 侧边栏：group（手风琴） ---------- */
function SidebarGroup({ group, collapsed, sidebarMode, isGroupActive, onToggle }) {
  // 折叠态下，group 渲染为「带 tooltip 的按钮」+ 悬浮展开菜单（跟 header 下拉一致的体验）
  if (sidebarMode === 'collapsed') {
    return (
      <li className={`sidebar-li sidebar-group collapsed-mode ${isGroupActive ? 'group-active' : ''}`}>
        <button
          type="button"
          className="sidebar-link sidebar-trigger"
          title={group.label}
        >
          <span className="sidebar-icon">{group.icon}</span>
          <span className="sidebar-label">{group.label}</span>
        </button>
        <ul className="sidebar-popover" role="menu">
          <li className="popover-title">{group.label}</li>
          {group.children.map((child) => (
            <li key={child.to}>
              <NavLink to={child.to} className={({ isActive }) => `popover-item ${isActive ? 'active' : ''}`}>
                <span className="popover-icon">{child.icon}</span>
                <span className="popover-texts">
                  <span className="popover-label">{child.label}</span>
                  {child.desc && <span className="popover-desc">{child.desc}</span>}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </li>
    )
  }

  return (
    <li className={`sidebar-li sidebar-group ${isGroupActive ? 'group-active' : ''}`}>
      <button
        type="button"
        className={`sidebar-link sidebar-trigger ${collapsed ? 'is-collapsed' : 'is-open'}`}
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span className="sidebar-icon">{group.icon}</span>
        <span className="sidebar-label">{group.label}</span>
        <span className="sidebar-caret" aria-hidden="true">▾</span>
      </button>

      <ul className={`sidebar-children ${collapsed ? 'is-collapsed' : 'is-open'}`}>
        <div className="sidebar-children-inner">
          {group.children.map((child) => (
            <li key={child.to}>
              <NavLink
                to={child.to}
                className={({ isActive }) => `sidebar-children-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-children-icon">{child.icon}</span>
                <span className="sidebar-children-texts">
                  <span className="sidebar-children-label">{child.label}</span>
                  {child.desc && <span className="sidebar-children-desc">{child.desc}</span>}
                </span>
              </NavLink>
            </li>
          ))}
        </div>
      </ul>
    </li>
  )
}

/* ---------- 小图标（纯 SVG，零依赖，带 fallback 颜色） ---------- */
function SidebarIcon({ mode }) {
  const w = 22
  const stroke = 'currentColor'
  if (mode === 'hidden') {
    // 三条横线 + 右箭头（表示：被隐藏了 → 点一下展开）
    return (
      <svg viewBox="0 0 24 24" width={w} height={w} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6h16" /><path d="M4 12h10" /><path d="M4 18h16" />
        <path d="M17 9l4 3-4 3" strokeWidth="2" />
      </svg>
    )
  }
  if (mode === 'collapsed') {
    // 折叠：左侧窄（图标列）+ 右侧宽内容 + 右箭头（下一步会隐藏）
    return (
      <svg viewBox="0 0 24 24" width={w} height={w} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="5" height="16" rx="1.5" />
        <rect x="10" y="4" width="11" height="16" rx="1.5" />
        <path d="M14 15l3-3-3-3" />
      </svg>
    )
  }
  // expanded：左宽右窄 + 左箭头（下一步折叠）
  return (
    <svg viewBox="0 0 24 24" width={w} height={w} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="11" height="16" rx="1.5" />
      <rect x="16" y="4" width="5" height="16" rx="1.5" />
      <path d="M6 9l-3 3 3 3" />
    </svg>
  )
}

function HideIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-2.2 3.1M6.1 6.1C3.3 7.9 2 12 2 12s3 7 10 7a9.7 9.7 0 0 0 4.3-1" />
      <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
    </svg>
  )
}
function ShowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
