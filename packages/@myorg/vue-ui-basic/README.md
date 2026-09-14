# @myorg/vue-ui-basic

Vue 3 基础 UI 组件集：主题（亮/暗/跟随系统）、通知中心、命令面板（Cmd+K）、数据表格、365 星辰大阵。

> 与 [@myorg/react-ui-basic](../../react-ui-basic/README.md) 功能一一对应，Vue 3 `<script setup>` SFC + composables 实现。

---

## 安装

```bash
npm install @myorg/vue-ui-basic vue
```

`peerDependencies`: `vue@^3.0.0`。

## 使用

```vue
<script setup>
import {
  ThemeProvider, NotificationProvider, CommandPalette, DataTable, StarArray,
} from '@myorg/vue-ui-basic'
import '@myorg/vue-ui-basic/style.css'
</script>

<template>
  <ThemeProvider>
    <NotificationProvider>
      <StarArray />
      <DataTable :columns="cols" :data="rows" />
      <CommandPalette :commands="cmds" />
    </NotificationProvider>
  </ThemeProvider>
</template>
```

---

## 全部导出

### Theme · 主题

| 导出               | 类型       | 说明                              |
| ------------------ | ---------- | --------------------------------- |
| `ThemeProvider`    | 组件       | 主题 Provider（注入 `useTheme`）  |
| `ThemeToggle`      | 组件       | 亮/暗/跟随系统 切换按钮           |
| `THEMES` / `THEME_KEY` | 常量  | 主题枚举 / 存储 key               |
| `createTheme` / `getDefaultTheme` | 工厂 | 创建 / 获取默认主题 store    |
| `useTheme`         | composable | 读取主题状态：`mode` / `toggle`   |
| `ThemePlugin`      | 插件       | `app.use(ThemePlugin)` 全局注册   |

### Notification · 通知中心

| 导出                        | 类型       | 说明                                       |
| --------------------------- | ---------- | ------------------------------------------ |
| `NotificationProvider`      | 组件       | 通知 Provider（注入 `useNotification`）    |
| `NotificationDrawer`        | 组件       | 通知历史抽屉                               |
| `NOTIFY_TYPES` / `TYPE_META` / `TYPE_LABEL` | 常量 | 通知类型枚举与元信息             |
| `createNotification` / `getDefaultNotification` | 工厂 | 创建 / 获取默认通知 store      |
| `useNotification`           | composable | `notify()` / `toast()` / `clear()`         |
| `NotificationPlugin`        | 插件       | `app.use(NotificationPlugin)` 全局注册     |
| `metaOf` / `relativeTime`   | 工具函数   | 类型元信息 / 相对时间格式化                 |

### CommandPalette · 命令面板

| 导出               | 类型       | 说明                          |
| ------------------ | ---------- | ----------------------------- |
| `CommandPalette`   | 组件       | 全局命令面板（Cmd/Ctrl + K）  |
| `fuzzyScore` / `matchCommand` | 函数 | 模糊匹配评分 / 命令过滤    |

### DataTable · 数据表格

| 导出       | 类型  | 说明                                          |
| ---------- | ----- | --------------------------------------------- |
| `DataTable` | 组件 | 零依赖通用表格：筛选、排序、分页、固定列、行选择 |

### StarArray · 365 星辰大阵

| 导出            | 类型       | 说明                                  |
| --------------- | ---------- | ------------------------------------- |
| `StarArray`     | 组件       | 365 星辰周天防御大阵（5 层同心环 + 环内流动 + 径向跨环脉动） |
| `STARS` / `TOTAL_DEGREES` | 常量 | 星辰数据 / 周天度数            |

样式来自 `@myorg/vue-styles-reset`（`--c-*` / `--glass-*` 等 CSS 变量），需先行引入。
