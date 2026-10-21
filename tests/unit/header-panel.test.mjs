/**
 * 顶栏「统一菜单」浮层 · 数据驱动配置单测（零依赖）
 * 覆盖 src/layouts/headerPanel.js 的 buildHeaderPanelSections(ctx)。
 *
 * 为什么值得单测：面板是「配置驱动」的（后续加模块链接只 append section / item），
 * 结构一旦被改坏（段数不对 / 语言项数 ≠ 语种数 / 时间轴项数 ≠ 发布数 /
 * 显隐顶栏文案不随状态翻转 / 退出登录项漏显或误显）不会让构建失败，只会让
 * 顶栏菜单悄悄缺一块。这里把结构锁死。
 *
 * 注：LANGUAGES 真值在 i18n/index.js（含 import.meta.glob，node 不可 import），
 * 故此处用「形状一致的代表数组」驱动逻辑断言；真实 10 语种数量与文案由 i18n 单测另钉。
 */
import { eq, ok, deepEq } from './harness.mjs'
import { buildHeaderPanelSections } from '../../src/layouts/headerPanel.js'
import { RELEASES, TOTAL_CHANGES } from '../../src/components/Changelog/releases.js'

/* 镜像 i18n/index.js 的 LANGUAGES 形状（代表数组，含 flag 为空者：bo） */
const LANGUAGES = [
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳', mark: 'CN', color: '#e4002b' },
  { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼', mark: 'TW', color: '#0b5cab' },
  { code: 'en', label: 'English', flag: '🇬🇧', mark: 'EN', color: '#1d4ed8' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', mark: 'JA', color: '#bc002d' },
  { code: 'ko', label: '한국어', flag: '🇰🇷', mark: 'KO', color: '#0b3f8f' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', mark: 'DE', color: '#111827' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', mark: 'FR', color: '#0055a4' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭', mark: 'TH', color: '#7c3aed' },
  { code: 'mn', label: 'Монгол', flag: '🇲🇳', mark: 'MN', color: '#c4272d' },
  { code: 'bo', label: 'བོད་སྐད།', flag: '', mark: 'TIB', color: '#f59e0b' },
]

function makeCtx(overrides = {}) {
  return {
    t: (key, params) => (params && 'n' in params ? params.n : key),
    lang: 'zh-CN',
    setLang: () => {},
    closePanel: () => {},
    openChangelog: () => {},
    cycleHeader: () => {},
    logout: () => {},
    navigate: () => {},
    pickText: (field) => (field && typeof field === 'object' ? field['zh-CN'] : (field ?? '')),
    LANGUAGES,
    RELEASES,
    TOTAL_CHANGES,
    headerVisible: true,
    user: null,
    icons: {
      GlobalOutlined: () => null,
      HistoryOutlined: () => null,
      EyeOutlined: () => null,
      EyeInvisibleOutlined: () => null,
      LogoutOutlined: () => null,
    },
    ...overrides,
  }
}

function findItem(section, key) {
  return section.items.find((it) => it.key === key)
}

export default [
  ['面板固定为 3 段：lang(grid) / changelog(list) / actions(list)', () => {
    const sections = buildHeaderPanelSections(makeCtx())
    eq(sections.length, 3)
    deepEq(sections.map((s) => s.key), ['lang', 'changelog', 'actions'])
    eq(sections[0].variant, 'grid')
    eq(sections[1].variant, 'list')
    eq(sections[2].variant, 'list')
  }],

  ['lang 段项数 == 语种数，且当前语言恰好高亮一个', () => {
    const lang = buildHeaderPanelSections(makeCtx({ lang: 'ja' }))[0]
    eq(lang.items.length, LANGUAGES.length)
    const active = lang.items.filter((it) => it.active)
    eq(active.length, 1)
    eq(active[0].key, 'ja')
    for (const it of lang.items) {
      ok(typeof it.key === 'string' && typeof it.label === 'string' && typeof it.color === 'string')
      eq(typeof it.onClick, 'function')
    }
    // 无 flag 的语种（bo）应带 badge（mark+color），有 flag 的不带
    const bo = findItem(lang, 'bo')
    ok(bo.flag === '' && bo.badge && bo.badge.text === 'TIB')
    const cn = findItem(lang, 'zh-CN')
    ok(cn.flag === '🇨🇳' && cn.badge === null)
  }],

  ['changelog 段项数 == 1(全部) + 发布批次，且计数对齐', () => {
    const cl = buildHeaderPanelSections(makeCtx())[1]
    eq(cl.items.length, 1 + RELEASES.length)
    const all = findItem(cl, 'all')
    eq(all.count, TOTAL_CHANGES)
    for (const r of RELEASES) {
      const item = findItem(cl, r.id)
      ok(item, `changelog 段应含发布 ${r.id}`)
      eq(item.count, r.changes.length)
      eq(item.sub, r.title['zh-CN'])
    }
  }],

  ['actions 段含 toggle-header，文案随 headerVisible 翻转', () => {
    const ctxVis = makeCtx({ headerVisible: true })
    const ctxHid = makeCtx({ headerVisible: false })
    const visible = buildHeaderPanelSections(ctxVis)[2]
    const hidden = buildHeaderPanelSections(ctxHid)[2]
    const t1 = findItem(visible, 'toggle-header')
    const t2 = findItem(hidden, 'toggle-header')
    ok(t1 && t2)
    eq(t1.label, 'shell.hideHeader')
    eq(t2.label, 'shell.showHeader')
    // icon 组件应随状态切换（可见时显示「隐藏」图标 EyeInvisibleOutlined）
    eq(t1.icon.type, ctxVis.icons.EyeInvisibleOutlined)
    eq(t2.icon.type, ctxHid.icons.EyeOutlined)
  }],

  ['logout 项仅在 user 存在时出现', () => {
    const anon = buildHeaderPanelSections(makeCtx({ user: null }))[2]
    const logged = buildHeaderPanelSections(makeCtx({ user: { name: 'tester' } }))[2]
    ok(!findItem(anon, 'logout'), '匿名态不应有 logout')
    const lo = findItem(logged, 'logout')
    ok(lo && lo.danger === true)
    eq(typeof lo.onClick, 'function')
  }],
]
