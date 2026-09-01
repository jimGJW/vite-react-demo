import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Button, Avatar, Dropdown, Typography, Tooltip, Badge } from 'antd'
import {
  HomeOutlined, RobotOutlined, AudioOutlined, AimOutlined,
  ToolOutlined, ScanOutlined, DesktopOutlined, FormOutlined,
  BgColorsOutlined, BarChartOutlined, DashboardOutlined, AppstoreOutlined,
  CodeOutlined, BellOutlined, TableOutlined, LockOutlined,
  ExperimentOutlined, InfoCircleOutlined, SwapOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  EyeInvisibleOutlined, EyeOutlined,
  LogoutOutlined, ThunderboltOutlined,
  DownOutlined,
  ApiOutlined, InteractionOutlined, ShareAltOutlined,
  TeamOutlined, PartitionOutlined, AimOutlined as AimO2,
  FundProjectionScreenOutlined,
  DeploymentUnitOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/useAuth.js'
import { useStyleMode } from '../contexts/StyleModeContext.jsx'
import GlobalAgent from '../components/GlobalAgent/index.jsx'
import VueMenu from '../components/VueMenu/index.jsx'
import './Layout.scss'

const { Text } = Typography

/* —— 导航配置：icon 全部用 antd 图标组件 —— */
const navItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  {
    key: 'group-ai', icon: <RobotOutlined />, label: 'AI 助手',
    children: [
      { key: '/voice', icon: <AudioOutlined />, label: '语音助手' },
      { key: '/agent', icon: <AimOutlined />, label: 'AI Agent 控制台' },
    ],
  },
  {
    key: 'group-toolbox', icon: <ToolOutlined />, label: '工具箱',
    children: [
      { key: '/scan', icon: <ScanOutlined />, label: '扫码' },
      { key: '/embed', icon: <DesktopOutlined />, label: '嵌套预览' },
      { key: '/form-builder', icon: <FormOutlined />, label: '配置表单' },
      { key: '/theme', icon: <BgColorsOutlined />, label: '主题切换' },
      { key: '/charts', icon: <BarChartOutlined />, label: 'SVG 图表' },
      { key: '/echarts', icon: <DashboardOutlined />, label: 'ECharts 仪表盘' },
      { key: '/command-palette', icon: <CodeOutlined />, label: '命令面板' },
      { key: '/notify', icon: <BellOutlined />, label: '通知中心' },
      { key: '/data-table', icon: <TableOutlined />, label: '高级表格' },
      { key: '/login', icon: <LockOutlined />, label: '星空登录' },
    ],
  },
  {
    key: 'group-compare', icon: <FundProjectionScreenOutlined />, label: '组件对比中心',
    children: [
      { key: '/antd', icon: <AppstoreOutlined />, label: 'Ant Design 组件库' },
      { key: '/vue-components', icon: <CodeOutlined />, label: 'Vue 组件库 (.vue)' },
      { key: '/angular-components', icon: <DeploymentUnitOutlined />, label: 'Angular 组件库 (.ts)' },
      { key: '/style-showcase', icon: <SwapOutlined />, label: '样式总对比' },
      {
        key: '__sep-compare__',
        disabled: true,
        className: 'menu-sep-title',
        label: (
          <span className="sep-title">
            <span className="sep-title__line" />
            <span className="sep-title__text">专题对比案例</span>
            <span className="sep-title__line" />
          </span>
        ),
      },
      { key: '/compare-parent-child', icon: <ApiOutlined />, label: '父子组件传值' },
      { key: '/compare-two-way', icon: <InteractionOutlined />, label: '双向绑定' },
      { key: '/compare-provide', icon: <ShareAltOutlined />, label: '跨层传值 (Provide/Inject)' },
      { key: '/compare-state', icon: <TeamOutlined />, label: '全局状态共享' },
      { key: '/compare-slot', icon: <PartitionOutlined />, label: '插槽 / Children 分发' },
      { key: '/compare-ref', icon: <AimO2 />, label: 'Ref / DOM 操作' },
    ],
  },
  { key: '/dashboard', icon: <DashboardOutlined />, label: '控制台' },
  { key: '/test-center', icon: <ExperimentOutlined />, label: '测试中心' },
  { key: '/about', icon: <InfoCircleOutlined />, label: '关于' },
]

/* 默认展开哪个分组 */
const DEFAULT_OPEN_KEYS = ['group-toolbox', 'group-compare']

const LS_KEY = 'app.layout.v1'
const DEFAULT = { sidebarMode: 'expanded', headerVisible: true, openKeys: DEFAULT_OPEN_KEYS }

function readLayout() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT,
      ...parsed,
      openKeys: parsed.openKeys?.length ? parsed.openKeys : DEFAULT_OPEN_KEYS,
    }
  } catch { return DEFAULT }
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
  const { isVue } = useStyleMode()
  const navigate = useNavigate()

  const initial = useMemo(() => readLayout(), [])
  const [sidebarMode, setSidebarMode] = useState(initial.sidebarMode)
  const [headerVisible, setHeaderVisible] = useState(initial.headerVisible)
  const [openKeys, setOpenKeys] = useState(initial.openKeys)

  useEffect(() => {
    writeLayout({ sidebarMode, headerVisible, openKeys })
  }, [sidebarMode, headerVisible, openKeys])

  const toggleSidebar = () => setSidebarMode((prev) => {
    if (prev === 'hidden') return 'expanded'
    if (prev === 'expanded') return 'collapsed'
    return 'hidden'
  })
  const cycleHeader = () => setHeaderVisible((v) => !v)

  const onMenuClick = ({ key }) => navigate(key)

  /* —— 用户下拉菜单 —— */
  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]
  const onUserMenu = ({ key }) => {
    if (key === 'logout') { logout(); navigate('/login', { replace: true }) }
  }

  /* —— 选中状态：精确匹配 / 前缀匹配 —— */
  const selectedKeys = useMemo(() => {
    // 优先精确匹配
    const exact = navItems.flatMap(i => i.children ? i.children.map(c => c.key) : [i.key])
      .filter(k => k === pathname)
    if (exact.length) return exact
    // 前缀匹配（取最长匹配）
    const prefix = navItems.flatMap(i => i.children ? i.children.map(c => c.key) : [i.key])
      .filter(k => k !== '/' && pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)
    return prefix.length ? [prefix[0]] : []
  }, [pathname])

  const isCollapsed = sidebarMode === 'collapsed'

  /* —— 监听 Vue SFC 页面发起的跳转请求 —— */
  useEffect(() => {
    const onNav = (e) => {
      const p = e.detail?.path
      if (p && typeof p === 'string') navigate(p)
    }
    window.addEventListener('app:navigate', onNav)
    return () => window.removeEventListener('app:navigate', onNav)
  }, [navigate])

  return (
    <div className={`app-shell ${headerVisible ? 'header-on' : 'header-off'} sidebar-${sidebarMode}`}>
      {/* ========== 顶部导航（可隐藏） ========== */}
      <header className="app-header" aria-hidden={!headerVisible}>
        <div className="header-left">
          <Tooltip title={`侧边栏：${sidebarMode === 'expanded' ? '点击折叠' : sidebarMode === 'collapsed' ? '点击隐藏' : '点击展开'}`}>
            <Button
              type="text"
              className="sidebar-toggle-btn"
              icon={sidebarMode === 'expanded' ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              onClick={toggleSidebar}
            />
          </Tooltip>

          <div className="brand" onClick={() => setSidebarMode(p => p === 'hidden' ? 'expanded' : p)}>
            <ThunderboltOutlined className="brand-logo" />
            <Text strong className="brand-name">星际控制台</Text>
          </div>
        </div>

        <div className="header-right">
          <Tooltip title={headerVisible ? '隐藏顶部导航栏' : '显示顶部导航栏'}>
            <Button
              type="text"
              className="header-toggle-btn"
              icon={headerVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={cycleHeader}
            />
          </Tooltip>

          {user && (
            <Dropdown menu={{ items: userMenuItems, onClick: onUserMenu }} placement="bottomRight">
              <div className="user-chip-antd">
                <Avatar size="small" style={{ background: '#1677ff' }}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Text className="user-name-text">{user.name}</Text>
                <DownOutlined style={{ fontSize: '0.7rem', color: 'var(--c-text-3, #00000073)' }} />
              </div>
            </Dropdown>
          )}
        </div>
      </header>

      {/* ========== 中部：左侧栏 + 右侧内容（唯一滚动容器在这里） ========== */}
      <section className="app-body">
        <aside className="app-sidebar" aria-label="侧边导航">
          {isVue ? (
            <VueMenu
              items={navItems}
              collapsed={isCollapsed}
              openKeys={isCollapsed ? [] : openKeys}
              onOpenChange={setOpenKeys}
            />
          ) : (
            <Menu
              mode="inline"
              theme="light"
              items={navItems}
              selectedKeys={selectedKeys}
              openKeys={isCollapsed ? [] : openKeys}
              onOpenChange={setOpenKeys}
              onClick={onMenuClick}
              inlineCollapsed={isCollapsed}
              className="sidebar-menu"
            />
          )}

          {sidebarMode === 'expanded' && (
            <div className="sidebar-foot">
              <Badge status="processing" />
              <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                点击左上角按钮切换：折叠 / 隐藏
              </Text>
            </div>
          )}
        </aside>

        <div className="app-main-wrap">
          <main className="app-main-scroll" role="main">
            <Outlet />
            <footer className="app-footer">
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                © {new Date().getFullYear()} 星际控制台 · Built with Ant Design
              </Text>
            </footer>
          </main>
        </div>
      </section>

      {/* ========== 应急浮动入口（仅在 header 隐藏时出现） ========== */}
      <div
        className={`emergency-fab ${headerVisible ? '' : 'show-header-btn'}`}
        aria-hidden={headerVisible}
      >
        {!headerVisible && (
          <Tooltip title="显示顶部导航栏">
            <Button
              type="primary"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={cycleHeader}
            />
          </Tooltip>
        )}
        {!headerVisible && sidebarMode === 'hidden' && (
          <Tooltip title="展开侧边栏">
            <Button
              shape="circle"
              icon={<MenuUnfoldOutlined />}
              onClick={toggleSidebar}
            />
          </Tooltip>
        )}
      </div>

      <GlobalAgent />
    </div>
  )
}
