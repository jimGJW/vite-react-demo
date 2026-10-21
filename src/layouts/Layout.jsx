import { useEffect, useMemo, useState, Fragment } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Button, Avatar, Dropdown, Typography, Tooltip, Badge } from 'antd'
import {
  HomeOutlined, RobotOutlined, AudioOutlined, AimOutlined,
  ToolOutlined, ScanOutlined, DesktopOutlined, FormOutlined,
  BgColorsOutlined, BarChartOutlined, DashboardOutlined, AppstoreOutlined, FieldTimeOutlined,
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
  HighlightOutlined, StarOutlined, HeatMapOutlined, CompassOutlined, BlockOutlined,
  VideoCameraOutlined, GlobalOutlined, EnvironmentOutlined, RadarChartOutlined,
  HistoryOutlined, CheckOutlined, MenuOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/useAuth.js'
import Assistants from '../components/Assistants/index.jsx'
import { useI18n, LANGUAGES, pickText } from '../i18n/index.js'
import { PeriodTag } from '../components/Changelog/PeriodTag.jsx'
import { ChangelogDrawer } from '../components/Changelog/ChangelogDrawer.jsx'
import { useChangelog } from '../contexts/ChangelogContext.jsx'
import { useSubApps } from '../contexts/SubAppContext.jsx'
import { PageTransition } from '../motion/index.jsx'
import { buildHeaderPanelSections } from './headerPanel.js'
import { MICRO_APPS } from '../micros/config.js'
import { ROUTE_RELEASES, getRelease, RELEASES, TOTAL_CHANGES } from '../components/Changelog/releases.js'
import './Layout.scss'

const { Text } = Typography

/* —— 分组 key 与语言无关（localStorage 迁移逻辑复用），单独抽出 —— */
const NAV_GROUP_KEYS = [
  'group-ai', 'group-toolbox', 'group-compare', 'group-case',
  'group-creative', 'group-databoards', 'group-micro',
]

/* —— 导航配置：icon 全部用 antd 图标组件，label 经 t() 取多语言文案 —— */
function buildNavItems(t) {
  return [
    { key: '/', icon: <HomeOutlined />, label: t('nav.home') },
    {
      key: 'group-ai', icon: <RobotOutlined />, label: t('nav.groupAi'),
      children: [
        { key: '/chatbot', icon: <MessageOutlined />, label: t('nav.chatbot') },
        { key: '/share', icon: <ShareAltOutlined />, label: t('nav.share') },
        { key: '/voice', icon: <AudioOutlined />, label: t('nav.voice') },
        { key: '/agent', icon: <AimOutlined />, label: t('nav.agent') },
      ],
    },
    {
      key: 'group-toolbox', icon: <ToolOutlined />, label: t('nav.groupToolbox'),
      children: [
        { key: '/scan', icon: <ScanOutlined />, label: t('nav.scan') },
        { key: '/kit', icon: <ThunderboltOutlined />, label: t('nav.kit') },
        { key: '/studio', icon: <CodepenOutlined />, label: t('nav.studio') },
  { key: '/templates', icon: <AppstoreOutlined />, label: t('nav.templates') },
  { key: '/utils', icon: <ToolOutlined />, label: t('nav.utils') },
        { key: '/react-hooks', icon: <BulbOutlined />, label: t('nav.reactHooks') },
        { key: '/embed', icon: <DesktopOutlined />, label: t('nav.embed') },
        { key: '/form-builder', icon: <FormOutlined />, label: t('nav.formBuilder') },
        { key: '/theme', icon: <BgColorsOutlined />, label: t('nav.theme') },
        { key: '/charts', icon: <BarChartOutlined />, label: t('nav.charts') },
        { key: '/echarts', icon: <DashboardOutlined />, label: t('nav.echarts') },
        { key: '/command-palette', icon: <CodeOutlined />, label: t('nav.commandPalette') },
        { key: '/notify', icon: <BellOutlined />, label: t('nav.notify') },
        { key: '/data-table', icon: <TableOutlined />, label: t('nav.dataTable') },
        { key: '/login', icon: <LockOutlined />, label: t('nav.login') },
        { key: '/assistant-demo', icon: <ThunderboltOutlined />, label: t('nav.assistantDemo') },
      ],
    },
    {
      key: 'group-compare', icon: <FundProjectionScreenOutlined />, label: t('nav.groupCompare'),
      children: [
        { key: '/antd', icon: <AppstoreOutlined />, label: t('nav.antd') },
        {
          key: '__sep-compare__',
          disabled: true,
          className: 'menu-sep-title',
          label: (
            <span className="sep-title">
              <span className="sep-title__line" />
              <span className="sep-title__text">{t('nav.compareCases')}</span>
              <span className="sep-title__line" />
            </span>
          ),
        },
        { key: '/compare-parent-child', icon: <ApiOutlined />, label: t('nav.parentChild') },
        { key: '/compare-two-way', icon: <InteractionOutlined />, label: t('nav.twoWay') },
        { key: '/compare-provide', icon: <ShareAltOutlined />, label: t('nav.provide') },
        { key: '/compare-state', icon: <TeamOutlined />, label: t('nav.state') },
        { key: '/compare-slot', icon: <PartitionOutlined />, label: t('nav.slot') },
        { key: '/compare-ref', icon: <AimO2 />, label: t('nav.ref') },
      ],
    },
    {
      key: 'group-case', icon: <ExperimentOutlined />, label: t('nav.groupCase'),
      children: [
        { key: '/perf-lab', icon: <RocketOutlined />, label: t('nav.perfLab') },
        { key: '/error-boundary', icon: <SafetyCertificateOutlined />, label: t('nav.errorBoundary') },
        { key: '/state-machine', icon: <NodeIndexOutlined />, label: t('nav.stateMachine') },
        { key: '/web-api', icon: <ApiOutlined />, label: t('nav.webApi') },
      ],
    },
    {
      /* 创意分组：与两个子应用的「创意」分组一一对应（同一批 demo 三端各写一遍），
         便于横向对照 React / Vue / Angular 三套框架的写法差异 */
      key: 'group-creative', icon: <HighlightOutlined />, label: t('nav.groupCreative'),
      children: [
        { key: '/creative', icon: <StarOutlined />, label: t('nav.creative') },
        { key: '/data-viz', icon: <HeatMapOutlined />, label: t('nav.dataViz') },
        { key: '/orbit', icon: <CompassOutlined />, label: t('nav.orbit') },
        { key: '/playground', icon: <BlockOutlined />, label: t('nav.playground') },
      ],
    },
    {
      /* 数据看板分组：深空 / 地球 / 海洋 / 时间版本——「天上、地下、海洋、时间」四位一体。
         与「控制台」同级的顶级分组（原先挤在「创意」分组尾部，现独立成组便于发现） */
      key: 'group-databoards', icon: <BarChartOutlined />, label: t('nav.groupDataboards'),
      children: [
        { key: '/astro', icon: <GlobalOutlined />, label: t('nav.astro') },
        { key: '/geo', icon: <EnvironmentOutlined />, label: t('nav.geo') },
        { key: '/ocean', icon: <RadarChartOutlined />, label: t('nav.ocean') },
        /* 时空档案：三大看板 18 个数据源的时间档案 + 聚合名词库（模糊检索） */
        { key: '/timeline', icon: <FieldTimeOutlined />, label: t('nav.timeline') },
      ],
    },
    {
      /* 子应用固定入口：启动 npm run dev:all 后，点这两项直达独立宿主页，
         进入即自动加载对应子应用；加载后子应用自身的功能菜单会动态追加到侧边栏 */
      key: 'group-micro', icon: <DeploymentUnitOutlined />, label: t('nav.groupMicro'),
      children: [
        { key: '/micro-frontend', icon: <PartitionOutlined />, label: t('nav.microFrontend') },
        {
          key: '/micro-vue',
          icon: <span className="micro-dot" style={{ background: '#42b883' }} />,
          label: t('nav.microVue'),
        },
        {
          key: '/micro-angular',
          icon: <span className="micro-dot" style={{ background: '#dd0031' }} />,
          label: t('nav.microAngular'),
        },
      ],
    },
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard') },
    { key: '/test-center', icon: <ExperimentOutlined />, label: t('nav.testCenter') },
    { key: '/about', icon: <InfoCircleOutlined />, label: t('nav.about') },
  ]
}

/* 从导航树提取「当前路由」对应的菜单文案（纯字符串），供 header 中部标题使用。
   精确匹配 → 最长前缀匹配；找不到回退到品牌名。 */
function findPageTitle(items, pathname) {
  const flat = []
  const walk = (arr) => arr.forEach((it) => {
    if (it.children) walk(it.children)
    else if (typeof it.key === 'string' && it.key.startsWith('/')) flat.push(it)
  })
  walk(items)
  const exact = flat.find((it) => it.key === pathname)
  if (exact) return exact.label
  const prefix = flat
    .filter((it) => it.key !== '/' && pathname.startsWith(it.key))
    .sort((a, b) => b.key.length - a.key.length)
  return prefix.length ? prefix[0].label : null
}

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

/* 默认展开哪个分组：全展开 —— 不把任何入口藏在折叠里（用户手动折叠仍会被记住） */
const DEFAULT_OPEN_KEYS = NAV_GROUP_KEYS

/**
 * 新加的分组（如「子应用 (qiankun)」「创意」）在老用户的 localStorage 里不存在，
 * 直接沿用持久化的 openKeys 会保持折叠 → 用户「在菜单里找不到入口」。
 *
 * 用一个单独的「已见过分组」清单做**一次性迁移**：只有从没出现过的分组才补进展开态，
 * 之后用户自己折叠能正常持久化（早期的做法是每次读取都强行并进去，导致折叠永远不生效）。
 */
const SEEN_GROUPS_KEY = 'app.layout.seen-groups.v1'
function readSeenGroups() {
  try { return JSON.parse(localStorage.getItem(SEEN_GROUPS_KEY) || '[]') } catch { return [] }
}
function writeSeenGroups() {
  try { localStorage.setItem(SEEN_GROUPS_KEY, JSON.stringify(NAV_GROUP_KEYS)) } catch { /* ignore */ }
}

const LS_KEY = 'app.layout.v1'
const DEFAULT = { sidebarMode: 'expanded', headerVisible: true, openKeys: DEFAULT_OPEN_KEYS }

function readLayout() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT
    const parsed = JSON.parse(raw)
    const seen = readSeenGroups()
    const fresh = NAV_GROUP_KEYS.filter((k) => !seen.includes(k))
    return {
      ...DEFAULT,
      ...parsed,
      openKeys: [...new Set([...(parsed.openKeys?.length ? parsed.openKeys : DEFAULT_OPEN_KEYS), ...fresh])],
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
  const { selected, openChangelog } = useChangelog()
  const { subApps, requestSubApp } = useSubApps()
  const { t, lang, setLang } = useI18n()
  const navigate = useNavigate()

  /* 导航项随语言重建（label 全部走 i18n 文案） */
  const navItems = useMemo(() => buildNavItems(t), [t])

  /* header 中部标题：主菜单精确/前缀匹配；子应用内部页回退到子应用标题 */
  const pageTitle = useMemo(() => {
    const fromNav = findPageTitle(navItems, pathname)
    if (fromNav) return fromNav
    for (const appKey of Object.keys(MICRO_APPS)) {
      const internal = subApps[appKey]?.currentPath
      if (internal && MICRO_APPS[appKey]?.hostPath === pathname) {
        const m = subApps[appKey]?.menus?.find((mm) => mm.path === internal)
        if (m) return m.label
        return subApps[appKey]?.title || MICRO_APPS[appKey]?.title || appKey
      }
    }
    return t('shell.brand')
  }, [navItems, pathname, subApps, t])

  const initial = useMemo(() => readLayout(), [])
  const [sidebarMode, setSidebarMode] = useState(initial.sidebarMode)
  const [headerVisible, setHeaderVisible] = useState(initial.headerVisible)
  const [openKeys, setOpenKeys] = useState(initial.openKeys)

  useEffect(() => {
    writeLayout({ sidebarMode, headerVisible, openKeys })
    writeSeenGroups()
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

  /* —— 顶栏「统一菜单」浮层：数据驱动的分区面板（配置抽自 headerPanel.js）。
        后续要加别的模块链接，只需往 actions 的 items 追加一项，或新增一个 list
        section —— 渲染层（renderPanelSection）自动按配置出面板，无需改动 JSX 结构。 */
  const [menuOpen, setMenuOpen] = useState(false)
  const closePanel = () => setMenuOpen(false)

  const headerPanelSections = buildHeaderPanelSections({
    t,
    lang,
    setLang,
    closePanel,
    openChangelog,
    cycleHeader,
    logout,
    navigate,
    pickText,
    LANGUAGES,
    RELEASES,
    TOTAL_CHANGES,
    headerVisible,
    user,
    icons: {
      GlobalOutlined,
      HistoryOutlined,
      EyeOutlined,
      EyeInvisibleOutlined,
      LogoutOutlined,
    },
  })

  /* 按配置渲染单个区块：grid（彩色卡片网格）/ list（标题 + 行列表）两种布局 */
  const renderPanelSection = (section) => {
    if (section.variant === 'grid') {
      return (
        <div className="ahp-block" key={section.key}>
          <div className="ahp-block__title">{section.icon}<span>{section.title}</span></div>
          <div className="ahp-lang-grid">
            {section.items.map((it) => (
              <button
                key={it.key}
                type="button"
                className={`ahp-lang-cell${it.active ? ' is-active' : ''}`}
                style={{ '--lang-color': it.color }}
                title={it.label}
                onClick={it.onClick}
              >
                {it.flag
                  ? <span className="lang-flag lang-flag--sm">{it.flag}</span>
                  : <span className="lang-badge lang-badge--sm" style={{ background: it.badge.color }}>{it.badge.text}</span>}
                <span className="ahp-lang-cell__name">{it.label}</span>
                {it.active && <CheckOutlined className="ahp-lang-cell__check" />}
              </button>
            ))}
          </div>
        </div>
      )
    }
    return (
      <div className="ahp-block" key={section.key}>
        {section.title && (
          <div className="ahp-block__title">{section.icon}<span>{section.title}</span></div>
        )}
        <div className="ahp-cl-list">
          {section.items.map((it) => (
            <button
              key={it.key}
              type="button"
              className={`ahp-cl-row${it.danger ? ' ahp-cl-row--danger' : ''}`}
              onClick={it.onClick}
            >
              {it.dot && (
                <span className={`cl-dot${it.dot.gradient ? ' cl-dot--all' : ''}`} style={it.dot.color ? { background: it.dot.color } : undefined} />
              )}
              {it.icon && <span className="ahp-cl-row__icon">{it.icon}</span>}
              <span className="ahp-cl-row__title">{it.label}</span>
              {it.sub && <span className="ahp-cl-row__sub">{it.sub}</span>}
              {it.count != null && <span className="ahp-cl-row__count">{it.count}</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderHeaderPanel = () => (
    <div className="app-header-panel" role="menu">
      {headerPanelSections.map((section, i) => (
        <Fragment key={section.key}>
          {i > 0 && <div className="ahp-divider" />}
          {renderPanelSection(section)}
        </Fragment>
      ))}
    </div>
  )


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
  }, [pathname, subApps, navItems])

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
    [navItems, selected, microMenuItems],
  )

  /* 侧边栏工具提示随三态切换 */
  const sidebarTip = sidebarMode === 'expanded'
    ? t('shell.sidebarCollapse')
    : sidebarMode === 'collapsed'
      ? t('shell.sidebarHide')
      : t('shell.sidebarExpand')

  return (
    <div className={`app-shell ${headerVisible ? 'header-on' : 'header-off'} sidebar-${sidebarMode}`}>
      {/* ========== 顶部导航（可隐藏） ========== */}
      <header className="app-header" aria-hidden={!headerVisible}>
        <div className="header-left">
          <Tooltip title={`${t('shell.sidebarAria')}：${sidebarTip}`}>
            <Button
              type="text"
              className="sidebar-toggle-btn"
              icon={sidebarMode === 'expanded' ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              onClick={toggleSidebar}
            />
          </Tooltip>

          <div className="brand" onClick={() => setSidebarMode(p => p === 'hidden' ? 'expanded' : p)}>
            <ThunderboltOutlined className="brand-logo" />
            <Text strong className="brand-name">{t('shell.brand')}</Text>
          </div>
        </div>

        <div className="header-center">
          <span key={pageTitle} className="header-page-title">{pageTitle}</span>
        </div>

        <div className="header-right">
          {/* 统一入口：语言 / 功能版本时间轴 / 隐藏页眉 / 退出登录 全部收进一个下拉，
              与「退出登录」同级，header 不再散布零散按钮 */}
          <Dropdown
            open={menuOpen}
            onOpenChange={setMenuOpen}
            trigger={['click']}
            placement="bottomRight"
            dropdownRender={renderHeaderPanel}
          >
            {user ? (
              <div className="user-chip-antd">
                <Avatar size="small" style={{ background: '#1677ff' }}>
                  {user.name?.charAt(0).toUpperCase() || t('shell.userFallback')}
                </Avatar>
                <Text className="user-name-text">{user.name}</Text>
                <DownOutlined className="user-chip-caret" style={{ fontSize: '0.7rem', color: 'var(--c-text-3, #00000073)' }} />
              </div>
            ) : (
              <Button type="text" className="header-menu-btn" icon={<MenuOutlined />} aria-label={t('shell.menuAria', null, '菜单')} />
            )}
          </Dropdown>
        </div>
      </header>

      {/* ========== 中部：左侧栏 + 右侧内容（唯一滚动容器在这里） ========== */}
      <section className="app-body">
        <aside
          className="app-sidebar"
          aria-label={t('shell.sidebarAria')}
          onMouseMove={(e) => {
            const el = e.currentTarget
            const r = el.getBoundingClientRect()
            el.style.setProperty('--mx', `${e.clientX - r.left}px`)
            el.style.setProperty('--my', `${e.clientY - r.top}px`)
          }}
        >
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

          {/* 隐藏页入口：/not-videos 刻意不进菜单树，只在侧边栏底部留一行低调链接 */}
          {sidebarMode === 'expanded' && (
            <Link
              to="/not-videos"
              className={`sidebar-hidden-entry${pathname === '/not-videos' ? ' is-current' : ''}`}
              title={t('shell.hiddenEntryTitle')}
            >
              <VideoCameraOutlined />
              <span>{t('nav.hiddenVideo')}</span>
            </Link>
          )}

          {sidebarMode === 'expanded' && (
            <div className="sidebar-foot">
              <Badge status="processing" />
              <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                {t('shell.sidebarFoot')}
              </Text>
            </div>
          )}
        </aside>

        <div className="app-main-wrap">
          <main className="app-main-scroll" role="main">
            <PageTransition>
              <Outlet />
            </PageTransition>
            <footer className="app-footer">
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                {t('shell.footer', { year: new Date().getFullYear() })}
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
          <Tooltip title={t('shell.showHeader')}>
            <Button
              type="primary"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={cycleHeader}
            />
          </Tooltip>
        )}
        {!headerVisible && sidebarMode === 'hidden' && (
          <Tooltip title={t('shell.sidebarExpand')}>
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
