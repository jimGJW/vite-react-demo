<!--
  VueMenu.vue · Vue 风格侧边栏（Element Plus + ElMenu）
  - 完全 Vue 3 SFC 实现
  - 折叠态：仅图标，hover 弹出子菜单（collapse → show popper）
  - 选中态：左 border 蓝色高亮（el-menu 默认样式）
  - 支持自定义分组标题（key 以 __sep- 开头的 item → 视为分组标签 group-title）
-->
<template>
  <el-menu
    class="vue-menu-sfc"
    mode="vertical"
    :collapse="collapsed"
    :default-active="activeKey"
    :default-openeds="normalizedOpenKeys"
    :collapse-transition="false"
    background-color="transparent"
    text-color="#303133"
    active-text-color="#409EFF"
    @select="onSelect"
    @open="onOpen"
    @close="onClose"
  >
    <template v-for="item in normalizedItems" :key="item.key">
      <!-- 自定义分隔 / 分组标题（不挂到 el-menu item-group，避免空白） -->
      <template v-if="item.isSep">
        <li class="vue-menu-sfc__sep-title vue-menu-sfc__item" :key="item.key + '-sep'">
          <span class="sep-title">
            <span class="sep-title__line" />
            <span class="sep-title__text">{{ item.sepText }}</span>
            <span class="sep-title__line" />
          </span>
        </li>
      </template>

      <!-- 子菜单 SubMenu -->
      <el-sub-menu
        v-else-if="item.children && item.children.length"
        :index="String(item.key)"
      >
        <template #title>
          <el-icon v-if="item.icon" class="el-menu-icon">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </template>

        <template v-for="child in item.children" :key="child.key">
          <!-- 子菜单中的分隔标题 -->
          <li v-if="child.isSep" :key="child.key + '-sep'" class="vue-menu-sfc__sep-title vue-menu-sfc__sub-item">
            <span class="sep-title">
              <span class="sep-title__line" />
              <span class="sep-title__text">{{ child.sepText }}</span>
              <span class="sep-title__line" />
            </span>
          </li>
          <el-menu-item
            v-else
            :index="String(child.key)"
            :disabled="child.disabled"
          >
            <el-icon v-if="child.icon" class="el-menu-icon">
              <component :is="child.icon" />
            </el-icon>
            <template #title>{{ child.label }}</template>
          </el-menu-item>
        </template>
      </el-sub-menu>

      <!-- 顶层 菜单项 -->
      <el-menu-item
        v-else
        :index="String(item.key)"
        :disabled="!!item.disabled"
      >
        <el-icon v-if="item.icon" class="el-menu-icon">
          <component :is="item.icon" />
        </el-icon>
        <template #title>{{ item.label }}</template>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import * as ElIcons from '@element-plus/icons-vue'

/**
 * 外部传入：
 *   items: [{ key, label, icon(ReactNode 忽略), children, disabled, __sepText? }]
 *   collapsed: boolean
 *   openKeys: string[] —— 外部控展
 *   pathname: string —— 当前路由路径，匹配 active
 *   onOpenChange: (keys:string[]) => void
 *   onSelect: (key:string) => void
 */
const props = defineProps({
  items: { type: Array, required: true },
  collapsed: { type: Boolean, default: false },
  openKeys: { type: Array, default: () => [] },
  pathname: { type: String, default: '/' },
  onOpenChange: { type: Function, default: null },
  onSelect: { type: Function, default: null },
})

// React 图标 → Vue Element Plus 图标映射（按 icon 组件 displayName / 名称 推断）
// fallback: 返回 undefined
function resolveVueIcon(reactIconNode) {
  if (!reactIconNode) return undefined
  const type = reactIconNode.type
  if (!type) return undefined
  // name like "HomeOutlined", "RobotOutlined", "ApiOutlined" ...
  let name = type.displayName || type.name || ''
  // 去掉 Outlined / Filled / TwoTone 后缀；替换 Antd 命名到 Element Plus 命名
  const map = {
    // antd → el-icon
    HomeOutlined: 'HomeFilled',
    RobotOutlined: 'MagicStick',
    AudioOutlined: 'Microphone',
    AimOutlined: 'Aim',
    ToolOutlined: 'Tools',
    ScanOutlined: 'Scan',
    DesktopOutlined: 'Monitor',
    FormOutlined: 'EditPen',
    BgColorsOutlined: 'Brush',
    BarChartOutlined: 'DataAnalysis',
    DashboardOutlined: 'Odometer',
    CodeOutlined: 'Files',
    BellOutlined: 'Bell',
    TableOutlined: 'Grid',
    LockOutlined: 'Lock',
    FundProjectionScreenOutlined: 'Histogram',
    AppstoreOutlined: 'Grid',
    SwapOutlined: 'Sort',
    ApiOutlined: 'Connection',
    InteractionOutlined: 'Share',
    ShareAltOutlined: 'Promotion',
    TeamOutlined: 'Avatar',
    PartitionOutlined: 'CopyDocument',
    // AimO2 fallback to Target (不存在时 fallback 为通用 icon)
  }
  if (map[name]) return ElIcons[map[name]] || undefined
  // 去除后缀尝试直接匹配
  const base = name.replace(/(Outlined|Filled|TwoTone)$/, '')
  // 尝试 Vue 图标 PascalCase 匹配 多种候选
  const candidates = [base, base + 'Filled', base + 'Icon', name]
  for (const c of candidates) {
    if (ElIcons[c]) return ElIcons[c]
  }
  // 通用回退
  return ElIcons['MoreFilled'] || undefined
}

function normalize(inArr) {
  if (!Array.isArray(inArr)) return []
  return inArr.map((it) => {
    // 分隔项
    if (it.key && typeof it.key === 'string' && it.key.startsWith('__sep-')) {
      const text = typeof it.label === 'string'
        ? it.label
        : (typeof it.label === 'object' && it.label?.props?.children?.props?.children?.[1]?.props?.children) // our nested <span.sep-title__text>
      return {
        key: it.key,
        isSep: true,
        sepText: text || '专题对比案例',
      }
    }
    const out = {
      key: String(it.key),
      label: it.label ?? it.key,
      disabled: !!it.disabled || it.className === 'menu-sep-title' || false,
      icon: resolveVueIcon(it.icon),
    }
    if (Array.isArray(it.children)) {
      out.children = normalize(it.children)
    }
    return out
  }).filter((it) => it && !(it.className === 'menu-sep-title' && !it.isSep))
}

const normalizedItems = computed(() => normalize(props.items))

const normalizedOpenKeys = computed(() =>
  Array.isArray(props.openKeys) ? props.openKeys.map(String) : []
)

// 匹配当前激活项：pathname === key 或 pathname.startsWith(key + '/')
const activeKey = computed(() => {
  const p = props.pathname || '/'
  let best = ''
  let bestLen = -1
  function walk(arr) {
    for (const it of arr) {
      if (it.isSep) continue
      if (!it.disabled && typeof it.key === 'string' && !it.children) {
        const k = it.key
        if (k === p) { best = k; bestLen = k.length; return true }
        if (p.startsWith(k + '/') && k.length > bestLen) { best = k; bestLen = k.length }
      }
      if (it.children) if (walk(it.children)) return true
    }
    return false
  }
  walk(normalizedItems.value)
  return best
})

function onSelect(key) {
  if (typeof props.onSelect === 'function') props.onSelect(String(key))
}
function onOpen(key) {
  const keys = Array.from(new Set([...normalizedOpenKeys.value, String(key)]))
  if (typeof props.onOpenChange === 'function') props.onOpenChange(keys)
}
function onClose(key) {
  const keys = normalizedOpenKeys.value.filter((k) => k !== String(key))
  if (typeof props.onOpenChange === 'function') props.onOpenChange(keys)
}
</script>

<style lang="scss" scoped>
.vue-menu-sfc {
  border-right: none !important;
  background: transparent !important;
  width: 100%;
  min-height: 280px;
  padding: 6px 6px 12px;

  &__item,
  &__sub-item {
    list-style: none;
  }

  &__sep-title {
    height: auto !important;
    padding: 12px 4px 6px !important;
    margin: 4px 6px 0px;
  }
}

.sep-title {
  display: flex !important;
  width: 100%;
  align-items: center;
  justify-content: stretch;
  gap: 8px;
  color: #909399;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;

  &__line {
    flex: 1 1 auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, #d9ecff 40%, #d9ecff 60%, transparent);
  }
  &__text {
    flex: 0 0 auto;
    padding: 2px 8px;
    border: 1px solid #d9ecff;
    border-radius: 999px;
    background: #ecf5ff;
    color: #409eff;
  }
}

.el-menu-icon { vertical-align: middle; }

/* 折叠态：隐藏分隔标题 */
:deep(.el-menu--collapse) {
  .vue-menu-sfc__sep-title,
  .vue-menu-sfc__sep-title.vue-menu-sfc__sub-item { display: none !important; }
}
</style>
