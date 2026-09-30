import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Button, Avatar, Dropdown, Typography, Tooltip, Badge } from 'antd'
import {
  HomeOutlined, RobotOutlined, AudioOutlined, AimOutlined,
  ToolOutlined, ScanOutlined, DesktopOutlined, FormOutlined,
  BgColorsOutlined, BarChartOutlined, DashboardOutlined, AppstoreOutlined,
  CodeOutlined, BellOutlined, TableOutlined, LockOutlined, CodepenOutlined,
  ExperimentOutlined, InfoCircleOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  EyeInvisibleOutlined, EyeOutlined,
  LogoutOutlined, ThunderboltOutlined,
  DownOutlined,
  ApiOutlined, InteractionOutlined, ShareAltOutlined,
  TeamOutlined, PartitionOutlined, AimOutlined as AimO2,
  FundProjectionScreenOutlined,
  DeploymentUnitOutlined,
  MessageOutlined,
  BulbOutlined, RocketOutlined,
  SafetyCertificateOutlined, NodeIndexOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/useAuth.js'
import Assistants from '../components/Assistants/index.jsx'
import { PeriodTag } from '../components/Changelog/PeriodTag.jsx'
import { ChangelogMenu } from '../components/Changelog/ChangelogMenu.jsx'
import { ChangelogDrawer } from '../components/Changelog/ChangelogDrawer.jsx'
import { useChangelog } from '../contexts/ChangelogContext.jsx'
import { useSubApps } from '../contexts/SubAppContext.jsx'
import { MICRO_APPS } from '../micros/config.js'
import { ROUTE_RELEASES, getRelease } from '../components/Changelog/releases.js'
import './Layout.scss'

const { Text } = Typography

/* —— 导航配置：icon 全部用 antd 图标组件 —— */
const navItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  {
    key: 'group-ai', icon: <RobotOutlined />, label: 'AI 助手',
    children: [
      { key: '/chatbot', icon: <MessageOutlined />, label: '对话助手 ChatBot' },
      { key: '/share', icon: <ShareAltOutlined />, label: '对话分享 QASharing' },
      { key: '/voice', icon: <AudioOutlined />, label: '语音助手' },
      { key: '/agent', icon: <AimOutlined />, label: 'AI Agent 控制台' },
    ],
  },
  {
    key: 'group-toolbox', icon: <ToolOutlined />, label: '工具箱',
    children: [
      { key: '/scan', icon: <ScanOutlined />, label: '扫码' },
      { key: '/kit', icon: <ThunderboltOutlined />, label: '组件工具箱 Kit' },
      { key: '/studio', icon: <CodepenOutlined />, label: '组件工坊 Studio' },
  { key: '/templates', icon: <AppstoreOutlined />, label: '开源模板库' },
  { key: '/utils', icon: <ToolOutlined />, label: '小功能集 Utils' },
      { key: '/react-hooks', icon: <BulbOutlined />, label: 'React 核心 API' },
      { key: '/embed', icon: <DesktopOutlined />, label: '嵌套预览' },
      { key: '/form-builder', icon: <FormOutlined />, label: '配置表单' },
      { key: '/theme', icon: <BgColorsOutlined />, label: '主题切换' },
      { key: '/charts', icon: <BarChartOutlined />, label: 'SVG 图表' },
      { key: '/echarts', icon: <DashboardOutlined />, label: 'ECharts 仪表盘' },
      { key: '/command-palette', icon: <CodeOutlined />, label: '命令面板' },
      { key: '/notify', icon: <BellOutlined />, label: '通知中心' },
      { key: '/data-table', icon: <TableOutlined />, label: '高级表格' },
      { key: '/login', icon: <LockOutlined />, label: '星空登录' },
      { key: '/assistant-demo', icon: <ThunderboltOutlined />, label: '快捷助手' },
    ],
  },
  {
    key: 'group-compare', icon: <FundProjectionScreenOutlined />, label: '组件对比中心',
    children: [
      { key: '/antd', icon: <AppstoreOutlined />, label: 'Ant Design 组件库' },
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
  {
    key: 'group-case', icon: <ExperimentOutlined />, label: '进阶案例',
    children: [
      { key: '/perf-lab', icon: <RocketOutlined />, label: '性能实验室' },
      { key: '/error-boundary', icon: <SafetyCertificateOutlined />, label: '错误边界与容错' },
      { key: '/state-machine', icon: <NodeIndexOutlined />, label: '状态机与时间旅行' },
      { key: '/web-api', icon: <ApiOutlined />, label: '浏览器原生能力' },
    ],
  },
  {
    /* 子应用固定入口：启动 npm run dev:all 后，点这两项直达独立宿主页，
       进入即自动加载对应子应用；加载后子应用自身的功能菜单会动态追加到侧边栏 */
    key: 'group-micro', icon: <DeploymentUnitOutlined />, label: '子应用 (qiankun)',
    children: [
      { key: '/micro-frontend', icon: <PartitionOutlined />, label: '微前端融合总览' },
      {
        key: '/micro-vue',
        icon: <span className="micro-dot" style={{ background: '#42b883' }} />,
        label: 'Vue 子应用',
      },
      {
        key: '/micro-angular',
        icon: <span className="micro-dot" style={{ background: '#dd0031' }} />,
        label: 'Angular 子应用',
      },
    ],
  },
  { key: '/dashboard', icon: <DashboardOutlined />, label: '控制台' },
  { key: '/test-center', icon: <ExperimentOutlined />, label: '测试中心' },
  { key: '/about', icon: <InfoCircleOutlined />, label: '关于' },
]

/* 给「路由项」追加时间段下标 icon（侧边栏文字右上角小徽标），并按当前选中的批次高亮。
   selected==='all'（默认全选）时不做额外高亮；
   选中某批次时：属于该批次的项加 period-hit 高亮（用该批次颜色），其余淡化 period-off。
   分组项递归处理 children；非路由 key（分组 / 分隔符）原样保留。
   注意：仅作用于 antd Menu，Vue 菜单 label 必须是字符串，不注入。 */
function decorateMenuItems(items, selected) {
  return items.map((it) => {
    if (it.children) return { ...it, children: decorateMenuItems(it.children, selected) }
    /* 带 ?app= 参数的子应用菜单项，PeriodTag 按纯路径查批次 */
    const route = typeof it.key === 'string' && it.key.startsWith('/') ? it.key.split('?')[0] : null
    if (!route) return it

    const labelNode = (
      <span className="nav-label-with-tag">
        <span className="nav-label-text">{it.label}</span>
        <PeriodTag route={route} />
      </span>
    )

    let className
    let style
    if (selected && selected !== 'all') {
      const inRelease = (ROUTE_RELEASES[route] || []).includes(selected)
      if (inRelease) {
        className = 'nav-item--period-hit'
        const r = getRelease(selected)
        if (r) style = { '--period-color': r.color }
      } else {
        className = 'nav-item--period-off'
      }
    }
    return { ...it, label: labelNode, className, style }
  })
}

/* 默认展开哪个分组 */
const DEFAULT_OPEN_KEYS = ['group-toolbox', 'group-compare', 'group-case', 'group-micro']

/**
 * 「子应用 (qiankun)」是新加的分组：老用户 localStorage 里持久化的 openKeys 不含它，
 * 直接沿用会保持折叠 → 用户「在菜单里找不到 Vue / Angular 入口」。
 * 因此读配置时统一把 group-micro 并进去（用户之后手动折叠不影响，因为写回的是他自己的 openKeys）。
 */
const MICRO_GROUP_KEY = 'group-micro'
const withMicroOpen = (keys) => (keys.includes(MICRO_GROUP_KEY) ? keys : [...keys, MICRO_GROUP_KEY])

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
      openKeys: withMicroOpen(parsed.openKeys?.length ? parsed.openKeys : DEFAULT_OPEN_KEYS),
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
  const { selected } = useChangelog()
  const { subApps, requestSubApp } = useSubApps()
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

  const onMenuClick = ({ key }) => {
    /* 子应用功能菜单：key 形如 micro:vue:/pattern/state（path 内无冒号，安全拆分） */
    if (key.startsWith('micro:')) {
      const [, appKey, ...rest] = key.split(':')
      const path = rest.join(':')
      const entry = subApps[appKey]
      const hostPath = MICRO_APPS[appKey]?.hostPath || '/micro-frontend'
      if (entry?.microApp && pathname === hostPath) {
        /* 已在宿主页且已加载：直接 update 切换子应用内部页面 */
        try { entry.microApp.update({ path }) } catch { /* 子应用可能正在卸载 */ }
      } else {
        /* 记录定位意图并跳到该子应用的独立宿主页，进入后自动加载并定位 */
        requestSubApp(appKey, path)
        navigate(hostPath)
      }
      return
    }
    navigate(key)
  }

  /* —— 用户下拉菜单 —— */
  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]
  const onUserMenu = ({ key }) => {
    if (key === 'logout') { logout(); navigate('/login', { replace: true }) }
  }

  /* —— 选中状态：精确匹配 / 前缀匹配，外加「子应用内部页面」——
     子应用菜单项的 key 形如 `micro:vue:/kit`，永远不会等于 pathname（宿主页恒为 /micro-vue），
     所以必须单独从 subApps[key].currentPath 反推，否则点子应用菜单「完全没有高亮反馈」。
     currentPath 有两个来源：宿主主动导航时先行写入；子应用内部跳转时由 props.onRouteChange 回传。 */
  const selectedKeys = useMemo(() => {
    const all = navItems.flatMap(i => i.children ? i.children.map(c => c.key) : [i.key])
    const exact = all.filter(k => k === pathname)
    let keys = exact
    if (!keys.length) {
      const prefix = all
        .filter(k => k !== '/' && pathname.startsWith(k))
        .sort((a, b) => b.length - a.length)
      keys = prefix.length ? [prefix[0]] : []
    }
    for (const appKey of Object.keys(MICRO_APPS)) {
      const internal = subApps[appKey]?.currentPath
      const host = MICRO_APPS[appKey]?.hostPath
      if (internal && host === pathname) keys = [...keys, `micro:${appKey}:${internal}`]
    }
    return keys
  }, [pathname, subApps])

  const isCollapsed = sidebarMode === 'collapsed'

  /* —— 已加载子应用的动态功能菜单（子应用 mount 时经 qiankun props.registerMenu 注册） —— */
  const microMenuItems = useMemo(() => {
    const groups = []
    for (const [appKey, app] of Object.entries(MICRO_APPS)) {
      const entry = subApps[appKey]
      if (!entry?.menus?.length) continue
      groups.push({
        key: `group-micro-${appKey}`,
        icon: <span className="micro-dot" style={{ background: app.color }} />,
        label: entry.title || app.title,
        className: 'micro-menu-group',
        children: entry.menus.map((m) => ({
          key: `micro:${appKey}:${m.path}`,
          label: m.label,
          /* is-current 让「当前所在页」带上框架色标记，点过的项一眼能认出来 */
          className: entry.currentPath === m.path ? 'micro-menu-item is-current' : 'micro-menu-item',
        })),
      })
    }
    return groups
  }, [subApps])

  /**
   * 当前宿主页对应的子应用功能组自动展开。
   * 否则 `micro:vue:<path>` 的高亮项藏在折叠的分组里，用户依然「看不见点了什么」。
   * （只在处于该子应用宿主页时自动展开，不影响其它分组的折叠行为）
   */
  const microAutoOpenKeys = useMemo(
    () => Object.keys(MICRO_APPS)
      .filter((k) => MICRO_APPS[k]?.hostPath === pathname && subApps[k]?.menus?.length)
      .map((k) => `group-micro-${k}`),
    [pathname, subApps],
  )
  const menuOpenKeys = useMemo(
    () => [...new Set([...openKeys, ...microAutoOpenKeys])],
    [openKeys, microAutoOpenKeys],
  )

  // 注入时间段下标 icon 并按选中批次高亮的菜单项（仅 antd Menu 使用），末尾拼接子应用动态菜单
  const menuItems = useMemo(
    () => [...decorateMenuItems(navItems, selected), ...microMenuItems],
    [selected, microMenuItems],
  )

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
          <ChangelogMenu />

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
          <div className="sidebar-scroll">
            <Menu
              mode="inline"
              theme="light"
              items={menuItems}
              selectedKeys={selectedKeys}
              openKeys={isCollapsed ? [] : menuOpenKeys}
              onOpenChange={setOpenKeys}
              onClick={onMenuClick}
              inlineCollapsed={isCollapsed}
              className="sidebar-menu"
            />
          </div>

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

      {/* 助手中心：AI Agent + 语音助手 + 可拖动快捷助手键 */}
      <Assistants />

      {/* 功能版本时间轴抽屉（header 下拉联动） */}
      <ChangelogDrawer />
    </div>
  )
}
