# src/i18n —— 全项目文案唯一真源

## 目录结构

```
src/i18n/
  index.js          核心：LANGUAGES / useI18n / re-export（组件侧只用这个入口）
  translate.mjs     纯函数 translate()（node 可直跑，单测覆盖）
  I18nProvider.jsx  语言状态 + 持久化 + <html lang>/title/meta 同步
  locales/
    index.js        import.meta.glob 自动发现（新增命名空间文件不用改 import）
    <lang>/<ns>.json   一种语言一个文件夹，一个分类一个文件
```

10 个语种：`zh-CN`（源语言）/ `zh-TW` / `en` / `ja` / `ko` / `de` / `fr` / `th` / `mn` / `bo`。

## 在代码里取文案

```jsx
import { useI18n } from '../../i18n/index.js'   // 路径按实际层级

const { t, lang } = useI18n()
t('nav.home')                                 // 按键路径
t('shell.footer', { year: 2026 })             // {year} 插值
t('creative.demo.x.title', {}, demo.title)    // 第三参兜底：键缺失退回数据原文
```

取值规则：当前语言 → 缺失回退 `zh-CN` → 仍缺失返回兜底值 / 键本身（开发期即可发现漏译）。

## 命名空间（ns）划分

一个业务领域一个文件，文件名即键的第一段：

| 文件 | 覆盖 |
|------|------|
| `nav` `shell` `lang` `loading` | 导航 / 外壳框架 / 语言切换 / 加载态 |
| `home` `about` `login` `notFound` `dashboard` `testCenter` | 独立页面 |
| `chatbot` `voice` `agent` `assistants` | AI 相关页 |
| `scan` `kit` `studio` `templates` `utils` `hooks` `embed` `formBuilder` `theme` `charts` `echarts` `palette` `notify` `dataTable` `assistantDemo` `antd` | 工具箱各 demo 页 |
| `compare` `perf` `errorBoundary` `stateMachine` `webApi` | 对比中心 / 进阶案例 |
| `astro` `geo` `ocean` `timeline` | 三块数据看板 |
| `creative` `dataViz` `orbit` `playground` | 创意实验室 |
| `micro` `changelog` `notVideos` | 微前端 / 版本 / 隐藏页 |
| `components` | 跨页复用组件（DictView / RelatedData / Notification 等） |
| `data` | 大型数据模块的译文（见下） |

键名规范：`<ns>.<页面或区块>.<元素>`，camelCase；列表项用有意义的词，禁止 `item1` 这种。

## 数据模块怎么办

`src/lib/**`、`src/components/**` 下的**数据文件**（词典、关联表、模板库、星表、mock 数据……）
被 node 单测直接 import，不能改成 JSON。规则：**文件留在原处，文案值改为按语种分键**：

```js
export const MISSION_TYPES = {
  Communications: {
    name: { 'zh-CN': '通信卫星', en: 'Communications', ja: '通信衛星', /* …10 语种 */ },
    desc: { 'zh-CN': '把数据链路搬上天…', en: '…', /* … */ },
  },
}
```

消费方按当前语种取值，缺语种落简体：

```js
const nm = entry.name[lang] || entry.name['zh-CN']
```

## 硬性规则（测试会钉死）

1. 10 个语种目录下**同命名空间文件、同键**，缺一个即红（`tests/unit/i18n.test.mjs`）。
2. 所有文案非空；`{var}` 占位符跨语种同名同集合。
3. 源码里 `t('ns.key')` 引用的键必须存在（注释中的示例会被剥掉，不影响）。
4. **不翻译**：代码注释、console 日志、路由 path、CSS 类名、`key`/`id` 字段值、API 字段名、URL。
5. ESLint：不条件调用 hook；渲染期不读 `ref.current`；不调 `Date.now()`；一个文件不同时导出组件 + 工具函数（豁免清单见 `eslint.config.js`）。
6. `src/creative/` 是独立同步单元，**不许 import `src/creative` 之外的模块**——创意 demo 的文案由外壳页用 `t(key, {}, 原文)` 解析。

## 进度跟踪

```bash
npm run i18n:scan            # 还剩哪些文件有用户可见中文（注释已剥离）
npm run i18n:scan AstroBoard # 只看某个目录
```
