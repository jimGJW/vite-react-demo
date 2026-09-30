<template>
  <div class="vue-app-shell">
    <!--
      页内路由导航：**始终显示**（不再只在独立运行时显示）。
      原因：被 qiankun 融合时，主应用侧边栏的子应用菜单是异步注册的、且位置在宿主页之外，
      子应用内部看不到任何路由入口。这里常驻一条"子应用内导航条"，
      保证在子应用模块里随时能看到路由链接并直接跳转。
    -->
    <nav class="app-nav">
      <span class="app-nav__brand">
        <span class="app-nav__logo">V</span>
        Vue 3 子应用
      </span>

      <!-- 当前页醒目标识：菜单点完一眼能看到"我现在在哪" -->
      <span class="app-nav__current">
        <em>当前页</em>
        <b>{{ currentTitle }}</b>
      </span>

      <span
        v-for="g in groups"
        :key="g.name"
        class="app-nav__group"
        :class="{ 'is-current': g.name === activeGroup }"
      >
        <em class="app-nav__group-label">{{ g.name }}</em>
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

      <span class="app-nav__spacer" />
      <span class="app-nav__mode" :class="{ 'is-embedded': !standalone }">
        {{ standalone ? '独立运行' : 'qiankun 融合中' }}
      </span>
      <a class="app-nav__link app-nav__link--muted" href="#" @click.prevent="go404">404 演示</a>
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { qiankunWindow } from 'vite-plugin-qiankun/es/helper'
import { MENU_ITEMS } from './router.js'

/** 是否独立运行（未被 qiankun 加载） */
const standalone = computed(() => !qiankunWindow.__POWERED_BY_QIANKUN__)
const router = useRouter()
const route = useRoute()

/** 当前页标题（直接读路由 meta，保证和小字菜单文案一致） */
const currentTitle = computed(() => route.meta?.title || '页面')

/**
 * 当前路由落在哪个分组 —— 用于把该分组的标签染色。
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

/** 按 meta.group 分组渲染导航 */
const groups = computed(() => {
  const order = ['基础', '能力', '鉴权', '通信']
  const map = new Map()
  for (const item of MENU_ITEMS) {
    const name = item.group || '其它'
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(item)
  }
  return [...map.entries()]
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([name, items]) => ({ name, items }))
})

/** 用一个不存在的 path 演示 404 兜底路由 */
const go404 = () => { router.push('/not-exist-demo') }
</script>

<style scoped>
.vue-app-shell {
  min-height: 100%;
  color: #303133;
}

/* —— 应用内导航（独立运行与 qiankun 融合都常驻显示） ——
   设计目标：在 22 个链接、3 行换行的密集排布里，"当前页"必须一眼可见。
   手段：实色底 + 白字加粗 + 光晕外圈 + 前置圆点 + 弹出动画 + 分组染色。 */
.app-nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  padding: 10px 20px 10px 17px;
  border-bottom: 1px solid #e4e7ed;
  border-left: 3px solid #42b883;
  background: linear-gradient(180deg, #ffffff 0%, #fafefb 100%);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
}
.app-nav__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 15px;
  margin-right: 6px;
}

/* 当前页徽标：浅底彩字。
   刻意**不做实色**，否则会和右侧那颗实心"当前菜单胶囊"抢视觉重心；
   标题文案靠右侧那颗实心胶囊承担，这里只做一句"你现在在哪"的旁白。 */
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

.app-nav__group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  padding: 2px 6px;
  border-radius: 10px;
  transition: background 0.2s;
}
.app-nav__group + .app-nav__group { border-left: 1px solid #f0f2f5; padding-left: 12px; }
/* 命中当前页的分组整体染色，给出"我在哪一组"的空间感 */
.app-nav__group.is-current { background: #eefaf3; }
.app-nav__group.is-current .app-nav__group-label { color: #2e8b5f; font-weight: 800; }

.app-nav__group-label {
  font-style: normal;
  font-size: 11px;
  color: #c0c4cc;
  margin-right: 2px;
  transition: color 0.2s;
}
.app-nav__spacer { flex: 1; }
.app-nav__mode {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f0f9eb;
  color: #529b2e;
  white-space: nowrap;
}
.app-nav__mode.is-embedded { background: #ecf5ff; color: #409eff; }
.app-nav__link--muted { color: #c0c4cc; }
.app-nav__logo {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #42b883;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.app-nav__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #606266;
  text-decoration: none;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid transparent;
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

.app-view {
  padding: 0;
}

/* 路由切换动画：新页面从下方 6px 处淡入，配合导航条上的弹入动画，
   让"点了一下确实换页了"这件事在视觉上无法忽略。 */
.view-fade-enter-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.view-fade-leave-active { transition: opacity 0.12s ease; }
.view-fade-enter-from { opacity: 0; transform: translateY(6px); }
.view-fade-leave-to { opacity: 0; }
</style>
