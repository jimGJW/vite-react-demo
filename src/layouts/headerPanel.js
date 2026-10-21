/* =====================================================================
   顶栏「统一菜单」浮层 · 数据驱动配置（纯逻辑层）
   ---------------------------------------------------------------------
   把原本内联在 Layout.jsx 里的 headerPanelSections 抽成纯函数，便于
   单测锁定结构：

     - 3 个 section：lang（grid 彩色卡片）/ changelog（list）/ actions（list）
     - 新增「模块链接」只需在 actions 的 items 追加一项，或新增一个 list
       section —— 渲染层（renderPanelSection）自动按配置出面板，无需改动 JSX。

   ctx 注入所有外部依赖（i18n、语言表、发布数据、状态、图标组件、回调），
   本文件**不**直接 import i18n / Changelog / antd 图标，保证 Node 单测可
   纯逻辑 import（不碰 JSX / CSS / import.meta.glob）。

   icon 字段统一用 React.createElement(IconComponent) 生成元素，与
   Layout 原写法（<GlobalOutlined />）等价；单测传入占位组件即可。
   ===================================================================== */
import { createElement } from 'react'

export function buildHeaderPanelSections(ctx) {
  const {
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
    icons,
  } = ctx

  const {
    GlobalOutlined,
    HistoryOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    LogoutOutlined,
  } = icons

  return [
    {
      key: 'lang',
      icon: createElement(GlobalOutlined),
      title: t('lang.title'),
      variant: 'grid',
      items: LANGUAGES.map((l) => ({
        key: l.code,
        label: l.label,
        flag: l.flag,
        badge: l.flag ? null : { text: l.mark, color: l.color },
        color: l.color,
        active: l.code === lang,
        onClick: () => { setLang(l.code); closePanel() },
      })),
    },
    {
      key: 'changelog',
      icon: createElement(HistoryOutlined),
      title: t('changelog.title'),
      variant: 'list',
      items: [
        {
          key: 'all',
          label: t('changelog.allVersions'),
          dot: { gradient: true },
          count: t('changelog.changesCount', { n: TOTAL_CHANGES }),
          onClick: () => { openChangelog('all'); closePanel() },
        },
        ...RELEASES.map((r) => ({
          key: r.id,
          label: r.label,
          sub: pickText(r.title, lang),
          dot: { color: r.color },
          count: r.changes.length,
          onClick: () => { openChangelog(r.id); closePanel() },
        })),
      ],
    },
    {
      key: 'actions',
      variant: 'list',
      items: [
        {
          key: 'toggle-header',
          icon: createElement(headerVisible ? EyeInvisibleOutlined : EyeOutlined),
          label: headerVisible ? t('shell.hideHeader') : t('shell.showHeader'),
          onClick: () => { cycleHeader(); closePanel() },
        },
        ...(user ? [{
          key: 'logout',
          icon: createElement(LogoutOutlined),
          label: t('shell.logout'),
          danger: true,
          onClick: () => { logout(); navigate('/login', { replace: true }); closePanel() },
        }] : []),
      ],
    },
  ]
}
