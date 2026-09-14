# @myorg/vue-admin-shell

Vue 3 后台管理外壳组合件：AdminLayout（侧边/顶部导航，需要 vue-router）、GlobalAgent（可拖拽 AI 气泡 + 快捷键面板 + UniversalPageAgent 指令引擎）、TestCenter（Python Playwright E2E 测试中心组件）、UniversalPageAgent（自然语言操控页面的 AI 控制台）。

> 与 [@myorg/react-admin-shell](../../react-admin-shell/README.md) 功能一一对应，Vue 3 `<script setup>` SFC 实现。

---

## 安装

```bash
npm install @myorg/vue-admin-shell @myorg/vue-core-composables @myorg/vue-styles-reset vue vue-router
```

`peerDependencies`: `vue@^3.0.0`、`vue-router@^4`、`@myorg/vue-core-composables@^1.0.0`、`@myorg/vue-styles-reset@^1.0.0`（设计 token）、`@huggingface/transformers@^3` + `onnxruntime-web@^1`（UniversalPageAgent 离线语音，可选）。

## 使用

```vue
<script setup>
import { AdminLayout, GlobalAgent, TestCenter } from '@myorg/vue-admin-shell'
import '@myorg/vue-admin-shell/style.css'

const testCases = [
  { id: 'login', group: '登录', desc: '默认账号可登录', type: 'navigate', target: '/login', expect: '登录成功' },
]
</script>

<template>
  <AdminLayout>
    <!-- 业务路由出口（AdminLayout 内部已含 <RouterView/>） -->
  </AdminLayout>

  <!-- 全局浮动 AI 气泡（Ctrl+Shift+A 呼出），内部挂载 UniversalPageAgent -->
  <GlobalAgent />

  <!-- 测试中心：传入用例数组即可批量运行 -->
  <TestCenter :cases="testCases" python-script="..." run-command="pytest" />
</template>
```

---

## 全部导出

| 导出                  | 说明                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `AdminLayout`         | 后台外壳：侧边三态（展开/折叠/隐藏）+ 顶部显隐；内部使用 `RouterLink` 渲染激活态，依赖 `vue-router` 与 `useAuth` |
| `GlobalAgent`         | 可拖拽浮动 AI 气泡；`Ctrl+Shift+A` 快捷键呼出；内部挂载 `UniversalPageAgent`                      |
| `UniversalPageAgent`  | AI 控制台：自然语言（NLP 规则 + DOM 执行引擎）操控页面 DOM；支持 `direct` / `iframe` 双模式；离线语音依赖 transformers.js |
| `TestCenter`          | Playwright E2E 测试中心：用例分组、串行运行、通过率统计、Python 脚本展示/复制/下载                  |

### 依赖说明

- `AdminLayout` / `GlobalAgent` 依赖 `vue-router`（`useRoute` / `useRouter`）与 `@myorg/vue-core-composables` 的 `useAuth`。
- `UniversalPageAgent` 的离线语音依赖 `@huggingface/transformers` + `onnxruntime-web`（均为可选 peerDependency）。
- 设计 token（`--c-*` / `--glass-*` 等 CSS 变量）来自 `@myorg/vue-styles-reset`，需先行引入。
