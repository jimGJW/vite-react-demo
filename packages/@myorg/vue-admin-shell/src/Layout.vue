<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { useAuth } from '@myorg/vue-core-composables'
import GlobalAgent from './GlobalAgent.vue'
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

const route = useRoute()
const router = useRouter()
const { user, logout } = useAuth()

const initial = readLayout()
const sidebarMode = ref(initial.sidebarMode)        // 'expanded' | 'collapsed' | 'hidden'
const headerVisible = ref(initial.headerVisible)     // boolean
const collapsed = ref(initial.collapsed)             // group 手风琴：{ [groupLabel]: boolean }

// 持久化用户偏好
watch([sidebarMode, headerVisible, collapsed], () => {
  writeLayout({ sidebarMode: sidebarMode.value, headerVisible: headerVisible.value, collapsed: collapsed.value })
}, { deep: true })

const shellClass = computed(() => [
  'app-shell',
  headerVisible.value ? 'header-on' : 'header-off',
  `sidebar-${sidebarMode.value}`,
])

const linkActive = (to, end) => {
  const p = route.path
  if (end) return p === to
  return p === to || p.startsWith(to + '/')
}

const isGroupActive = (group) =>
  group.children.some((child) => linkActive(child.to, child.to === '/'))

const toggleSidebar = () => {
  const prev = sidebarMode.value
  sidebarMode.value = prev === 'hidden' ? 'expanded' : prev === 'expanded' ? 'collapsed' : 'hidden'
}
const cycleHeader = () => { headerVisible.value = !headerVisible.value }
const openSidebarIfHidden = () => { if (sidebarMode.value === 'hidden') sidebarMode.value = 'expanded' }

const toggleGroup = (label, defaultOpen = false) => {
  const current = collapsed.value[label] ?? !defaultOpen
  collapsed.value = { ...collapsed.value, [label]: !current }
}

const onLogout = () => {
  logout()
  router.push('/login')
}
</script>

<template>
  <div :class="shellClass">
    <!-- ========== 顶部导航（可隐藏） ========== -->
    <header class="app-header" :aria-hidden="!headerVisible">
      <div class="header-left">
        <button
          type="button"
          class="icon-btn sidebar-toggle"
          @click="toggleSidebar"
          :title="sidebarMode === 'expanded' ? '点击折叠' : sidebarMode === 'collapsed' ? '点击隐藏' : '点击展开'"
          aria-label="切换侧边栏（展开 / 折叠 / 隐藏）"
        >
          <!-- 侧边栏三态图标 -->
          <svg v-if="sidebarMode === 'hidden'" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 6h16" /><path d="M4 12h10" /><path d="M4 18h16" /><path d="M17 9l4 3-4 3" stroke-width="2" />
          </svg>
          <svg v-else-if="sidebarMode === 'collapsed'" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="11" height="16" rx="1.5" /><path d="M14 15l3-3-3-3" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="11" height="16" rx="1.5" /><rect x="16" y="4" width="5" height="16" rx="1.5" /><path d="M6 9l-3 3 3 3" />
          </svg>
        </button>

        <div class="brand" @click="openSidebarIfHidden" title="点击展开侧边栏">
          <span class="brand-logo" aria-hidden="true">⚡</span>
          <span class="brand-name">星际控制台</span>
        </div>
      </div>

      <div class="header-right">
        <button
          type="button"
          class="icon-btn header-toggle"
          @click="cycleHeader"
          :title="headerVisible ? '隐藏顶部导航栏' : '显示顶部导航栏'"
          aria-label="切换顶部导航栏显示"
        >
          <svg v-if="headerVisible" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 3l18 18" /><path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-2.2 3.1M6.1 6.1C3.3 7.9 2 12 2 12s3 7 10 7a9.7 9.7 0 0 0 4.3-1" /><path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <div v-if="user" class="user-chip">
          <span class="user-chip-avatar" aria-hidden="true">{{ (user.name?.charAt(0) || 'U').toUpperCase() }}</span>
          <span class="user-chip-name">{{ user.name }}</span>
          <button type="button" class="user-chip-logout" @click="onLogout" title="登出" aria-label="登出">⏻</button>
        </div>
      </div>
    </header>

    <!-- ========== 中部：左侧栏 + 右侧内容（唯一滚动容器在这里） ========== -->
    <section class="app-body">
      <aside class="app-sidebar" aria-label="侧边导航">
        <nav class="sidebar-nav">
          <ul>
            <template v-for="item in navGroups" :key="item.type === 'link' ? item.to : item.label">
              <!-- group -->
              <li v-if="item.type === 'group'" :class="['sidebar-li', 'sidebar-group', isGroupActive(item) ? 'group-active' : '']">
                <!-- 折叠态：带 tooltip 的按钮 + 悬浮展开菜单 -->
                <template v-if="sidebarMode === 'collapsed'">
                  <button type="button" class="sidebar-link sidebar-trigger" :title="item.label">
                    <span class="sidebar-icon">{{ item.icon }}</span>
                    <span class="sidebar-label">{{ item.label }}</span>
                  </button>
                  <ul class="sidebar-popover" role="menu">
                    <li class="popover-title">{{ item.label }}</li>
                    <li v-for="child in item.children" :key="child.to">
                      <RouterLink :to="child.to" custom v-slot="{ href, navigate, isActive }">
                        <a
                          :href="href"
                          :class="['popover-item', isActive ? 'active' : '']"
                          @click="navigate"
                        >
                          <span class="popover-icon">{{ child.icon }}</span>
                          <span class="popover-texts">
                            <span class="popover-label">{{ child.label }}</span>
                            <span v-if="child.desc" class="popover-desc">{{ child.desc }}</span>
                          </span>
                        </a>
                      </RouterLink>
                    </li>
                  </ul>
                </template>

                <template v-else>
                  <button
                    type="button"
                    :class="['sidebar-link', 'sidebar-trigger', collapsed[item.label] ?? !item.defaultOpen ? 'is-collapsed' : 'is-open']"
                    @click="toggleGroup(item.label, item.defaultOpen)"
                    :aria-expanded="!(collapsed[item.label] ?? !item.defaultOpen)"
                  >
                    <span class="sidebar-icon">{{ item.icon }}</span>
                    <span class="sidebar-label">{{ item.label }}</span>
                    <span class="sidebar-caret" aria-hidden="true">▾</span>
                  </button>

                  <ul :class="['sidebar-children', collapsed[item.label] ?? !item.defaultOpen ? 'is-collapsed' : 'is-open']">
                    <div class="sidebar-children-inner">
                      <li v-for="child in item.children" :key="child.to">
                        <RouterLink :to="child.to" custom v-slot="{ href, navigate, isActive }">
                          <a :href="href" :class="['sidebar-children-link', isActive ? 'active' : '']" @click="navigate">
                            <span class="sidebar-children-icon">{{ child.icon }}</span>
                            <span class="sidebar-children-texts">
                              <span class="sidebar-children-label">{{ child.label }}</span>
                              <span v-if="child.desc" class="sidebar-children-desc">{{ child.desc }}</span>
                            </span>
                          </a>
                        </RouterLink>
                      </li>
                    </div>
                  </ul>
                </template>
              </li>

              <!-- link -->
              <li v-else class="sidebar-li">
                <RouterLink :to="item.to" custom v-slot="{ href, navigate, isActive }">
                  <a
                    :href="href"
                    :class="['sidebar-link', linkActive(item.to, item.end) || isActive ? 'active' : '']"
                    :title="sidebarMode === 'collapsed' ? item.label : undefined"
                    @click="navigate"
                  >
                    <span class="sidebar-icon">{{ item.icon }}</span>
                    <span class="sidebar-label">{{ item.label }}</span>
                  </a>
                </RouterLink>
              </li>
            </template>
          </ul>
        </nav>

        <div v-if="sidebarMode === 'expanded'" class="sidebar-foot" aria-hidden="true">
          <span class="sidebar-foot-dot" />
          点击左上角按钮切换：折叠 / 隐藏
        </div>
      </aside>

      <div class="app-main-wrap">
        <main class="app-main-scroll" role="main">
          <RouterView />
          <footer class="app-footer">
            <p>© {{ new Date().getFullYear() }} 星际控制台 · Built with ❤️</p>
          </footer>
        </main>
      </div>
    </section>

    <!-- ========== 应急浮动入口（header 隐藏 或 sidebar 隐藏 时仍然可见） ========== -->
    <div
      :class="['emergency-fab', !headerVisible ? 'show-header-btn' : '', sidebarMode === 'hidden' ? 'show-sidebar-btn' : '']"
      :aria-hidden="headerVisible && sidebarMode !== 'hidden'"
    >
      <button
        v-if="!headerVisible"
        type="button"
        class="fab-btn fab-show-header"
        @click="cycleHeader"
        title="显示顶部导航栏"
        aria-label="显示顶部导航栏"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      <button
        v-if="sidebarMode === 'hidden'"
        type="button"
        class="fab-btn fab-show-sidebar"
        @click="toggleSidebar"
        title="展开侧边栏"
        aria-label="展开侧边栏"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 6h16" /><path d="M4 12h10" /><path d="M4 18h16" /><path d="M17 9l4 3-4 3" stroke-width="2" />
        </svg>
      </button>
    </div>

    <GlobalAgent />
  </div>
</template>
