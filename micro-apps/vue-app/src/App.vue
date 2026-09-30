<template>
  <div class="vue-app-shell">
    <!--
      页内路由导航：**始终显示**（不再只在独立运行时显示）。
      原因：被 qiankun 融合时，主应用侧边栏的子应用菜单是异步注册的、且位置在宿主页之外，
      子应用内部看不到任何路由入口。这里常驻一条"子应用内导航条"，
      保证在子应用模块里随时能看到路由链接并直接跳转。

      布局是「顶栏 + 分组行」两段式：
        顶栏   —— 品牌 / 当前页 / 菜单过滤 / 运行模式 / 兜底演示
        分组行 —— 每行一个分组：左侧定宽组名（形成对齐的标签列），右侧链接自动换行
      相比早先「品牌、分组名、链接全部内联 flex-wrap」的一锅端写法，
      组名落成独立对齐列后，20+ 条链接读起来是「几行几组」，而不是「一大坨」。
    -->
    <nav class="app-nav">
      <div class="app-nav__bar">
        <span class="app-nav__brand">
          <span class="app-nav__logo">V</span>
          Vue 3 子应用
        </span>

        <!-- 当前页醒目标识：菜单点完一眼能看到"我现在在哪" -->
        <span class="app-nav__current">
          <em>当前页</em>
          <b>{{ currentTitle }}</b>
        </span>

        <span class="app-nav__spacer" />

        <!-- 菜单过滤：链接变多后，按名字/路径定位比肉眼扫更快 -->
        <label class="app-nav__filter">
          <span class="app-nav__filter-icon" aria-hidden="true">⌕</span>
          <input
            ref="filterInput"
            v-model="keyword"
            class="app-nav__filter-input"
            type="text"
            placeholder="过滤菜单（按 / 聚焦）"
            @keydown.enter.prevent="gotoFirstMatch"
            @keydown.esc="keyword = ''"
          />
          <button v-if="keyword" class="app-nav__filter-clear" type="button" @click="keyword = ''">×</button>
        </label>

        <span class="app-nav__mode" :class="{ 'is-embedded': !standalone }">
          {{ standalone ? '独立运行' : 'qiankun 融合中' }}
        </span>
        <a class="app-nav__link app-nav__link--muted" href="#" @click.prevent="go404">404 演示</a>
      </div>

      <div class="app-nav__rows">
        <div
          v-for="g in visibleGroups"
          :key="g.name"
          class="app-nav__row"
          :class="{ 'is-current': g.name === activeGroup }"
        >
          <span class="app-nav__row-name">{{ g.name }}</span>
          <span class="app-nav__row-links">
            <router-link
              v-for="item in g.items"
              :key="item.path"
              :to="item.path"
              class="app-nav__link"
              active-class="is-active"
            >
              {{ item.label }}
            </router-link>
          </span>
        </div>

        <p v-if="!visibleGroups.length" class="app-nav__empty">
          没有匹配「{{ keyword }}」的菜单，按 Esc 清空
        </p>
      </div>
    </nav>

    <main class="app-view">
      <!--
        路由切换淡入：点击页内导航后，内容区有一次可见的"换页"反馈。
        用 vue-router 官方推荐的 <router-view v-slot> + 内置 <transition>，
        :key="route.path" 保证同一组件（如嵌套子路由）之间也会重新挂载播放动画。
      -->
      <router-view v-slot="{ Component, route: current }">
        <transition name="view-fade" mode="out-in">
          <component :is="Component" :key="current.path" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { qiankunWindow } from 'vite-plugin-qiankun/es/helper'
import { MENU_GROUP_ORDER, MENU_ITEMS } from './router.js'
import { buildNavGroups, filterNavGroups } from './utils'

/** 是否独立运行（未被 qiankun 加载） */
const standalone = computed(() => !qiankunWindow.__POWERED_BY_QIANKUN__)
const router = useRouter()
const route = useRoute()

/** 当前页标题（直接读路由 meta，保证和小字菜单文案一致） */
const currentTitle = computed(() => route.meta?.title || '页面')

/**
 * 当前路由落在哪个分组 —— 用于把该分组那一行整体点亮。
 * 嵌套子路由（/nested/detail/3）按最长前缀归属到父级菜单项，因此也要做前缀匹配。
 */
const activeGroup = computed(() => {
  const path = route.path
  const hit =
    MENU_ITEMS.find((i) => i.path === path) ||
    MENU_ITEMS.filter((i) => i.path !== '/' && path.startsWith(i.path)).sort(
      (a, b) => b.path.length - a.path.length,
    )[0]
  return hit?.group || ''
})

/** 分组渲染：排序口径与主应用侧边栏、Angular 端共用同一份纯函数 */
const groups = computed(() => buildNavGroups(MENU_ITEMS, { order: MENU_GROUP_ORDER }))

/* —— 菜单过滤 —— */
const keyword = ref('')
const filterInput = ref(null)
const visibleGroups = computed(() => filterNavGroups(groups.value, keyword.value))
const firstMatch = computed(() => visibleGroups.value[0]?.items[0])

/** 回车 → 直接跳到第一条匹配项（省掉鼠标移动） */
const gotoFirstMatch = () => {
  if (firstMatch.value) router.push(firstMatch.value.path)
}

/**
 * 按 `/` 聚焦过滤框（不在输入态时）。
 * 用 window keydown 是因为过滤框本身可能还没被聚焦 —— 这是"命令面板"式的
 * 低成本键盘可达性，和 ⌘K 一个思路，但不占用浏览器保留快捷键。
 */
const onKeydown = (e) => {
  const tag = document.activeElement?.tagName
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable
  if (e.key === '/' && !typing) {
    e.preventDefault()
    filterInput.value?.focus()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

/** 用一个不存在的 path 演示 404 兜底路由 */
const go404 = () => { router.push('/not-exist-demo') }
</script>

<style scoped>
.vue-app-shell {
  min-height: 100%;
  color: #303133;
}

/* —— 应用内导航（独立运行与 qiankun 融合都常驻显示） ——
   设计目标：在 20+ 个链接、多行换行的密集排布里，既要"当前页一眼可见"，
   又要"整体读起来是有序的几组"，而不是一坨。
   手段：① 两段式结构（顶栏 + 分组行）；② 组名独立成对齐列；③ 当前页四层信号叠加。 */
.app-nav {
  border-bottom: 1px solid #e4e7ed;
  border-left: 3px solid #42b883;
  background: linear-gradient(180deg, #ffffff 0%, #fafefb 100%);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}

/* —— 顶栏：一行放得下，永不换行（信息密度最高的部分固定住） —— */
.app-nav__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 14px;
  border-bottom: 1px solid #f0f3f5;
}
.app-nav__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}
.app-nav__logo {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: #42b883;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 当前页徽标：浅底彩字。
   刻意**不做实色**，否则会和下方那颗实心"当前菜单胶囊"抢视觉重心；
   标题文案靠实心胶囊承担，这里只做一句"你现在在哪"的旁白。 */
.app-nav__current {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 11px;
  border-radius: 999px;
  background: #e8f8f0;
  border: 1px solid #a8dfc2;
  color: #1f7a4d;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.app-nav__current em {
  font-style: normal;
  font-size: 10px;
  letter-spacing: 0.5px;
  color: #4aa878;
  padding-right: 6px;
  border-right: 1px solid #a8dfc2;
}
.app-nav__current b { font-weight: 800; }

.app-nav__spacer { flex: 1; }

/* —— 菜单过滤框 —— */
.app-nav__filter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border: 1px solid #e0e6e3;
  border-radius: 999px;
  background: #fff;
  transition: border-color 0.16s, box-shadow 0.16s;
}
.app-nav__filter:focus-within {
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.14);
}
.app-nav__filter-icon { font-size: 13px; color: #a8b1ad; line-height: 1; }
.app-nav__filter-input {
  border: 0;
  outline: 0;
  width: 132px;
  font-size: 12px;
  background: transparent;
  color: #303133;
}
.app-nav__filter-input::placeholder { color: #b9c2be; }
.app-nav__filter-clear {
  border: 0;
  background: #eef2f0;
  color: #6b7a74;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  line-height: 1;
  font-size: 12px;
  cursor: pointer;
}
.app-nav__filter-clear:hover { background: #dfe7e3; color: #2e8b5f; }

.app-nav__mode {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f0f9eb;
  color: #529b2e;
  white-space: nowrap;
}
.app-nav__mode.is-embedded { background: #ecf5ff; color: #409eff; }

/* —— 分组行：组名是**定宽左栏**，链接在右栏自动换行 ——
   定宽列 = 所有分组的链接从同一条竖线开始，形成对齐网格。
   这是「整齐」的关键，比把组名混在链接流里强得多。 */
.app-nav__rows {
  padding: 2px 16px 8px 14px;
}
.app-nav__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 3px 0;
  position: relative;
  transition: background 0.2s;
}
.app-nav__row + .app-nav__row { border-top: 1px dashed #eef3f0; }
.app-nav__row-name {
  flex: 0 0 40px;
  text-align: right;
  padding-top: 7px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #5f6f68;
  white-space: nowrap;
  transition: color 0.2s;
}
.app-nav__row-links {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 1px 0;
}
/* 命中当前页的那一行：左侧框架色竖条 + 组名染成框架色加粗 */
.app-nav__row.is-current::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 2px;
  background: #42b883;
}
.app-nav__row.is-current .app-nav__row-name {
  color: #2e8b5f;
  font-weight: 800;
}

.app-nav__empty {
  margin: 6px 0 2px;
  padding-left: 50px;
  font-size: 12px;
  color: #b7c2bc;
}

/* —— 链接胶囊 —— */
.app-nav__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  line-height: 1.6;
  color: #606266;
  text-decoration: none;
  padding: 4px 11px;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
  transition: background 0.16s, color 0.16s, border-color 0.16s, box-shadow 0.16s, transform 0.16s;
}
.app-nav__link:hover {
  color: #2e8b5f;
  background: #eefaf3;
  border-color: #b7e6cd;
  transform: translateY(-1px);
}
/* 按下瞬间给一个物理反馈 */
.app-nav__link:active { transform: translateY(0) scale(0.95); }

/* ★ 当前所在页：实色底 / 白字加粗 / 光晕 / 圆点 / 弹入动画 */
.app-nav__link.is-active {
  color: #fff;
  font-weight: 700;
  background: linear-gradient(135deg, #42b883, #2e9e6d);
  border-color: #2e9e6d;
  box-shadow: 0 3px 10px rgba(66, 184, 131, 0.45), 0 0 0 2px rgba(66, 184, 131, 0.16);
  transform: translateY(-1px);
  animation: navPop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.app-nav__link.is-active::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
}
@keyframes navPop {
  0% { transform: scale(0.82); }
  62% { transform: scale(1.07); }
  100% { transform: scale(1); }
}

.app-nav__link--muted { color: #c0c4cc; }

.app-view {
  padding: 0;
}

/* 路由切换动画：新页面从下方 6px 处淡入，配合导航条上的弹入动画，
   让"点了一下确实换页了"这件事在视觉上无法忽略。 */
.view-fade-enter-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.view-fade-leave-active { transition: opacity 0.12s ease; }
.view-fade-enter-from { opacity: 0; transform: translateY(6px); }
.view-fade-leave-to { opacity: 0; }

/* 窄视口：组名收成小徽标，避免挤压链接区 */
@media (max-width: 720px) {
  .app-nav__filter-input { width: 92px; }
  .app-nav__row-name { flex-basis: 32px; font-size: 10px; }
}
</style>
