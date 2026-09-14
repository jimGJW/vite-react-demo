# Kit · 组件工具箱

从两个本地存量项目里**筛选**出的通用能力，去掉业务耦合后重写为 React 19 + antd 5 + Vite 组件。

| 项 | 内容 |
| --- | --- |
| 来源 A | 旧移动端项目（移动端 / 企业 IM 内嵌）：React 16.8 + Dva + antd 3 + antd-mobile 2 + react-weui + Webpack 4 |
| 来源 B | 旧平板端项目（平板 / 后台端）：React 16.8 + Dva + antd 3，血统是 Ant Design Pro（charts 用 AntV **G2 2.x**，不是 bizcharts） |
| 目标 | 本项目：React 19 + antd 5 + Vite + ECharts 6 + Sass |
| 产出 | 18 个组件 + 4 个 Hook + 1 组纯函数工具 |
| 路由 | `/kit`（`src/pages/KitDemo`） |

> 迁移基线：`React 16 → 19` 与 `antd 3 → 5` 的具体差异（已废弃 API、类名变更、图标组件化）见 [§7 迁移基线](#7-迁移基线)。

---

## 1. 目录结构

```
src/components/Kit/
├── index.js                     # 统一出口（组件 / Hook / 工具）
├── kit.scss                     # 全部样式，kit- 前缀 + --c-* 变量 + fallback
├── utils.js                     # 纯函数：dataURLtoFile / arrayMove / 时段校验 …
├── hooks.js                     # useCountdown / useInView / useOverflow
├── interaction/                 # ① 移动交互
│   ├── SignaturePad.jsx
│   ├── PullToRefresh.jsx
│   ├── InfiniteScroll.jsx
│   ├── FloatingBall.jsx
│   ├── SortableList.jsx
│   └── AutoScrollText.jsx
├── display/                     # ② 数据展示
│   ├── Ellipsis.jsx
│   ├── StatCard.jsx
│   ├── Countdown.jsx
│   ├── NoticePanel.jsx
│   └── charts/
│       ├── chartBase.js         # 纯配置：grid / tooltip / 轴线
│       ├── useEcharts.js        # 实例生命周期（内部使用，不在 index 导出）
│       ├── MiniArea.jsx
│       ├── MiniBar.jsx
│       ├── MiniProgress.jsx
│       ├── WaterWave.jsx
│       └── TimelineChart.jsx
└── form/                        # ③ 表单控件
    ├── TagInput.jsx
    ├── AsyncSelect.jsx
    └── TimeRangeInput.jsx
```

---

## 2. 调研范围

先对两个项目的 `src/components` 做了全量清点（mobile 约 13k 行 / 60+ 组件，pad 约 9k 行 / 30+ 组件），再逐个判定是否值得移植。

### 2.1 旧移动端项目 组件清单（按职责分组）

| 分组 | 组件 |
| --- | --- |
| 手写 / 安全 | `Signature` `SignatureImages` `AgreementSwitch` |
| 移动手势 | `pulltorefresh/PullToRefresh` `LoadMore` `xautoscroll` `SortCards` `FloatingBox` `Back` `BackToConsole` |
| 媒体采集 | `ImageUploader`(1164 行) `CustomImageGrid` `Preview` `Gallery` `GalleryEdit` `Audio`(709 行) `Attachment` `QrScanner` `QrCode` `QrCodeImage` `CacheImage` `WeChatAccountQrCodeImage` |
| 选择器 | `select/SelectCustomOption`(441 行) `SelectOrg` `SelectUser` `SelectSite` `SelectCustomOption` `SelectSupplier` `SelectOffice` `SelectFaulty` `SelectClinicals` `AddSupplier` |
| 筛选 | `APMFilter` `OrgFilter` `Query` |
| 表单原子 | `Form`(1137 行) `FormViewer` `WorkHoursInput`(439 行) `TagInput` `CustomDatePicker` `CustomSlider` `CustomRating` `Rating` `CheckBox` `Count` `ColoredText` `WorkHoursInput` |
| 展示 | `Card` `WoCard` `List` `ListItem` `PanelList` `APMPanelList` `APMList` `Steps` `WoSteps` `ProgressBar` `Grids` `Slides` `watermark` `Remark` `Svg` `Link` `CustomImageGrid` `DeviceGuide` |
| 业务容器 | `containers/`（chatbot / workorder / device / inventory / training / VIP 等 40+ 目录）— **纯业务，不迁** |

### 2.2 旧平板端项目 组件清单（Ant Design Pro 血统）

| 分组 | 组件 |
| --- | --- |
| 数据展示 | `NumberInfo` `Trend` `Ellipsis` `DescriptionList` `StandardTable` `ActiveChart` `Hygrograph` |
| 图表 | `Charts/MiniArea` `MiniBar` `MiniProgress` `Pie` `Radar` `Gauge` `TagCloud` `WaterWave` `TimelineChart` `Bar` `ChartCard` `Device/*` |
| 导航 / 布局 | `PageHeader` `GlobalFooter` `HeaderSearch` `NoticeIcon` `Cart` `FooterToolbar` `AvatarList` `EditableLinkGroup` |
| 表单 / 交互 | `TagSelect` `CountDown` `EditableItem` `Subscribe`(1596 行) `Qrcode` `Result` `Exception` |
| 业务 | `APM/*`（Filter / CTInfo / CTStatus / AssetSider / WoHistory / Messages）— **纯业务，不迁** |

---

## 3. 选型台账

判定分四类：**A** 直接移植 · **B** 重写移植 · **C** 借鉴思路重写 · **D** 明确不移植。

### 3.1 已落地（A / B / C）

| 新组件 | 来源 | 类 | 判定理由与改造点 |
| --- | --- | --- | --- |
| `SignaturePad` | mobile `Signature.js` | B | canvas 手写是刚需；但原库 `react-canvas-draw` 依赖 `findDOMNode`（React 19 已移除），改用原生 Canvas 2D 重写。顺带修了「导出透明 PNG 变黑底」和 DPR 发虚 |
| `PullToRefresh` | mobile `pulltorefresh/PullToRefresh.js` | B | 阻尼 + 阈值 + 异步 resolve 的交互值得保留；`findDOMNode` → `ref`，`preventDefault + passive:false` → `overscroll-behavior: contain`，并补鼠标支持 |
| `InfiniteScroll` | mobile `LoadMore.js` | C | 原实现把滚动计算散落在业务页面里；换成 `IntersectionObserver`，收敛成一个哨兵节点 |
| `FloatingBall` | mobile `floatingBox/FloatingBox.js` | B | 本批质量最高的一个，**按比例持久化位置**这点尤其好（转屏/缩放后仍合理）。修掉原实现的陈旧闭包 bug，touch → pointer |
| `SortableList` | mobile `SortCards.js` | C | 「拖拽 + 逐项显隐」交互保留；`react-sortable-hoc` 已停止维护且不兼容 React 19，改为零依赖的 pointer 实现，并补键盘排序 |
| `AutoScrollText` | mobile `xautoscroll/` | C | 原实现只有 21 行且有两个缺陷（`useEffect` 缺依赖数组、强依赖父容器定位）；改为 transform + 速度恒定的实现 |
| `Ellipsis` | pad `Ellipsis/index.js` | B | 多行省略 + tooltip 的封装有价值；原实现的「shadowNode 二分法逐字测量」在 line-clamp 普及后已无必要，整段删除 |
| `StatCard` | pad `NumberInfo` + `Trend` | B | 两个 20~35 行的小展示组件，合并成语义完整的指标卡；**颜色改为国内习惯（涨红跌绿）**，并提供 `colorMode="us"` 翻转 |
| `Countdown` | pad `CountDown/index.js` | B | 原实现用 setTimeout 每秒自减，后台标签页被节流后会**累积漂移且不校正**；改为记录目标时间戳、每 tick 用 `Date.now()` 重算 |
| `NoticePanel` | pad `NoticeIcon` + `Cart` | B | 原项目里这两个组件 90% 重复（都是铃铛 + Popover + 多 Tab + 清空），合并为一个；默认空状态图从阿里 CDN 外链换成 antd 内置 Empty |
| `MiniArea` | pad `Charts/MiniArea` | B | G2 → ECharts 6 重写：双图层 area+line 合并为单 series，`forceFit` → ResizeObserver |
| `MiniBar` | pad `Charts/MiniBar` | B | 同上；**删掉了原实现里硬编码的 `y.min = 3.5`**（那是某个评分业务的特例） |
| `MiniProgress` | pad `Charts/MiniProgress` | A | 本来就是纯 DOM/CSS，不依赖图表库，几乎原样保留；仅把硬编码的「目标值」文案抽成 props |
| `WaterWave` | pad `Charts/WaterWave` | B | 本来就是纯 Canvas 手写动画，逻辑保留；把「每帧 setState 驱动百分比文字」改为 props 直接渲染，动画完全留在 canvas 内 |
| `TimelineChart` | pad `Charts/TimelineChart` | B | G2 + `g2-plugin-slider` → ECharts 内置 `dataZoom`，去掉了一个插件依赖；原实现用 `Math.random()` 生成 domId（严格模式下不一致），已消除 |
| `TagInput` | mobile `TagInput/` | A | 分词逻辑（空格/回车/中英文逗号提交、退格删除、粘贴拆分）原样保留，只补了「空输入时空格不拦截」这类边界 |
| `AsyncSelect` | mobile `select/SelectCustomOption.js` | B | 441 行里最有价值的一个。保留防抖搜索 + 请求竞态保护 + 字段映射 + 自定义渲染；去掉 dva `preload` 与 react-weui 表单壳。**加载时机改为惰性**（展开或搜索时才请求） |
| `TimeRangeInput` | mobile `WorkHoursInput.js` | C | 只保留三条校验（结束晚于开始 / 单段不超上限 / 两段不重叠）+ 求和，UI 用 antd 5 重写；补了原实现缺失的「起止未填完整」提示 |

### 3.2 明确不移植（D）

| 原组件 | 不移植的原因 |
| --- | --- |
| mobile `watermark/Watermark.js` | 就是 antd 官方 Watermark 的早期实现（原目录 README 直接写「查看 antd 文档」），目标栈 antd 5 **已内置 `<Watermark>`** |
| mobile `APMFilter.js` | 污染 `Array.prototype`（`Array.prototype.diff = ...`），且 antd 3 与 antd-mobile 2 混用；「筛选栏 + 弹层 + 多选全选」的交互可用 antd 5 `Dropdown` 重写，但那是另一个量级的活 |
| mobile `Accordion.js` | 依赖 `react-transition-group@1` 的 `CSSTransitionGroup`（v2 已移除），且 transition 类名的 CSS 不在组件内，搬过来也动不起来；antd 5 有 `Collapse` |
| mobile `LoadMore.js` / `ColoredText.js` | 一个三态条件渲染、一个 `<span style={{color}}>`，没有封装价值 |
| mobile `Count.js` | 角标数字却强耦合 `rest.count(pathname, query)` 远程计数接口；antd 5 有 `Badge` |
| mobile `Preview.js`(434 行) | 「字段配置驱动 + Modal 编辑」思路可借鉴，但整组件深度绑定 redux `preload.val/label`、业务路由与积分逻辑；纯展示部分 antd 5 `Descriptions` 已覆盖 |
| mobile `Steps.js` / `WoSteps.js` / `ProgressBar.js` | 分别耦合 `state.preload.woSteps`、硬编码四步工单图标路径、硬编码审批状态换算；antd 5 有 `Steps` |
| mobile `QrScanner` / `QrCode` | **本项目已有** `src/hooks/useWebQrScanner` + `components/QrScanBtn.jsx`，避免重复造轮子 |
| mobile `SignatureImages` / `QrCodeImage` | 围绕 `objectStorageId` / `urls.qrCodeImg` 等内部字段，antd 5 `Upload` + `Image.PreviewGroup` 可直接替代 |
| mobile `CacheImage.js` | 用 `window._cacheImgUrl` 全局缓存 + canvas `toDataURL`（跨域图会失败）；要做应写成受控 hook |
| pad `StandardTable` | 本质是 Ant Design Pro 的官方示例，`columns` 写死了「规则编号 / 调用次数 / 关单时间」等业务字段 |
| pad `PageHeader` | 强依赖 dva/router 的 legacy context（React 19 已移除），antd 5 生态用 `@ant-design/pro-components` 的 PageHeader |
| pad `DescriptionList` / `Result` / `Exception` | antd 5 已内置 `<Descriptions>` / `<Result>`，且 Exception 的 403 图是阿里 CDN 外链、498/499 是项目自定义码 |
| pad `TagCloud` | 依赖 `g-cloud` 私有布局 API + G2 自定义 shape，ECharts 无原生词云（`echarts-wordcloud` 需另引）；性价比低 |
| pad `HeaderSearch` | 198 行里大部分是 Android WebView 输入法的兼容补丁与私有 `judgeUs` 语义，真正的通用能力只有「图标展开 + 防抖 + 回车」三件事 |
| pad `Subscribe`(1596 行) / `APM/*` / mobile `containers/*` | 业务页面，不属于组件库范畴 |
| 两端 `select/` 下的业务选择器（SelectOffice / SelectFaulty / SelectSite / SelectSupplier / SelectClinicals 等） | 全部强耦合内部接口路径与 redux model，且彼此高度重复；统一用 `AsyncSelect` 承接 |

### 3.3 借鉴了思路但本轮未落地

如果后续需要，这些可以按同样的方式补进来：

- **组织树筛选**（mobile `OrgFilter.js` / `select/SelectOrgNew`）：树 + 搜索 + 计数 + 禁用节点的实现骨架可用 antd 5 `Tree` 重写，数据源与层级映射注入化。
- **图集预览**（mobile `Gallery.js` / `PreviewItem`）：轮播 + 工具栏的 UI 值得移植，但三端下载（GFC bridge / 微信小程序路由 / 浏览器 blob）要剥离成可注入的 `onDownload`。
- **带 logo 的二维码**（mobile `WeChatAccountQrCodeImage.js`）：「隐藏 canvas 转 dataURL + 中央叠 logo」这个技巧通用，但原组件带内部接口与品牌 Logo。
- **扫码分派骨架**（mobile `QrCode.js`）：GFC / 钉钉 / 字节 / 微信 / H5 的环境分派逻辑本身有价值，解析器改注入即可 —— 本项目已有扫码实现，暂不需要。
- **图片会话级缓存 hook**（mobile `CacheImage.js`）：思路可用，需重写为 `Map` 缓存 + `crossOrigin` 处理。

---

## 4. 组件 API

### 4.1 交互（interaction）

#### `SignaturePad` 电子签名板

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | `''` | 签名图 dataURL，用于回显 |
| `onChange` | `(dataURL\|null) => void` | — | 落笔结束 / 撤销 / 清空时回调；空签名回调 `null` |
| `height` | `number` | `200` | 画布高度（宽度自适应容器） |
| `lineWidth` | `number` | `2.4` | 笔宽 |
| `penColors` | `string[]` | 5 色 | 可选笔色 |
| `defaultPenColor` | `string` | 首色 | 初始笔色 |
| `showToolbar` | `boolean` | `true` | 是否显示工具栏 |
| `showBaseline` | `boolean` | `true` | 是否显示基线 |
| `placeholder` | `string` | `在此手写签名` | 空态提示 |
| `downloadName` | `string` | `signature.png` | 导出文件名 |
| `disabled` | `boolean` | `false` | 只读 |

配套：`dataURLtoFile(dataURL, filename)` 可把结果直接转成可上传的 `File`。

#### `PullToRefresh` 下拉刷新

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onRefresh` | `() => Promise \| void` | — | 返回 Promise 时会等它 resolve 再收起 |
| `height` | `number` | `320` | 容器高度 |
| `threshold` | `number` | `56` | 触发刷新的下拉距离（阻尼后） |
| `resistence` | `number` | `2.5` | 阻尼系数，越大越"重" |
| `disabled` | `boolean` | `false` | 禁用 |
| `pullText` / `releaseText` / `refreshingText` | `string` | — | 三种状态的提示文案 |

#### `InfiniteScroll` 触底加载

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onLoadMore` | `() => Promise \| void` | — | 进入视口时触发，返回 Promise 时会在 resolve 前防重复 |
| `hasMore` | `boolean` | `true` | 是否还有更多 |
| `loading` | `boolean` | `false` | 加载中（显示 loadingText） |
| `rootMargin` | `string` | `120px` | 提前触发的距离 |
| `loadingText` / `endText` | `string` | — | 文案 |

#### `FloatingBall` 悬浮球

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | 球内内容 |
| `size` | `number` | `52` | 直径 |
| `edgeGap` | `number` | `12` | 吸附时距屏幕边缘的间距 |
| `storageKey` | `string` | `kit.floating-ball` | 位置持久化 key |
| `defaultRight` / `defaultBottom` | `number` | `24` / `96` | 无存储时的初始位置 |
| `clickThreshold` | `number` | `4` | 位移小于该值视为点击 |
| `tooltip` | `string` | — | title / aria-label |
| `onClick` | `(e) => void` | — | 点击（非拖拽）回调 |
| `onPositionChange` | `({left, top}) => void` | — | 吸附结束后回调 |

#### `SortableList` 拖拽排序

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `any[]` | `[]` | 数据源 |
| `onChange` | `(next, {from, to}) => void` | — | 排序提交 |
| `renderItem` | `(item, index, {dragging}) => ReactNode` | — | 自定义渲染 |
| `keyOf` | `(item, index) => string` | `item.key ?? item.id ?? index` | key 取值 |
| `disabled` | `boolean` | `false` | 禁用 |

#### `AutoScrollText` 跑马灯

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | — | 文本 |
| `speed` | `number` | `60` | 滚动速度（px/s），动画时长由超宽像素算出 |
| `gap` | `number` | `48` | 循环首尾间距 |

### 4.2 展示（display）

#### `Ellipsis` 文本省略

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `string` | — | 文本内容 |
| `lines` | `number` | `1` | 显示行数；`1` 走 nowrap，`>1` 走 line-clamp |
| `tooltip` | `boolean` | `true` | 溢出时悬浮显示全文 |
| `expandable` | `boolean` | `false` | 是否显示展开 / 收起 |
| `expandText` / `collapseText` | `string` | `展开` / `收起` | 按钮文案 |

#### `StatCard` 指标卡

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `ReactNode` | — | 标题 |
| `value` | `number\|string` | — | 数值（自动千分位） |
| `precision` | `number` | `0` | 小数位 |
| `prefix` / `suffix` | `ReactNode` | — | 前后缀 |
| `status` | `'up'\|'down'` | — | 趋势方向 |
| `trend` | `number\|ReactNode` | — | 趋势值（数字会自动加 `trendSuffix`） |
| `trendSuffix` | `string` | `'%'` | 趋势后缀 |
| `subTitle` / `footer` | `ReactNode` | — | 副标题 / 页脚 |
| `chart` | `ReactNode` | — | 迷你图插槽 |
| `loading` | `boolean` | `false` | 显示 `--` |
| `colorMode` | `'cn'\|'us'` | `'cn'` | `cn` = 涨红跌绿 |

#### `Countdown` 倒计时

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `target` | `Date\|number\|string` | — | 目标时刻 |
| `interval` | `number` | `1000` | tick 间隔 |
| `onEnd` | `() => void` | — | 归零回调（只触发一次） |
| `variant` | `'cell'\|'plain'` | `'cell'` | 分格 / 纯文本 |
| `pattern` | `string` | `'HH:mm:ss'` | `variant='plain'` 时的格式，支持 `DD/HH/mm/ss` |

#### `NoticePanel` 通知面板

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tabs` | `{key, title, count?, items[], emptyText?}[]` | `[]` | 分组数据；`items[]` 为 `{id, title, desc?, time?, read?}` |
| `count` | `number` | 各 tab 之和 | 角标数字，传 `0` 可清空 |
| `onItemClick` | `(item) => void` | — | 点击某条通知 |
| `onClear` | `(tabKey) => void` | — | 清空某分组；需要二次确认时在外部弹确认框 |
| `children` | `ReactNode` | 铃铛按钮 | 自定义触发器 |
| `placement` / `width` / `listHeight` | — | `bottomRight` / `320` / `300` | 布局 |

#### 图表

| 组件 | 关键 props |
| --- | --- |
| `MiniArea` | `data:[{x,y}]` `height=60` `color` `smooth` `showAxis` `showTooltip` `opacity` |
| `MiniBar` | `data:[{x,y}]` `height=80` `color` `showAxis` `showLabel` `min` |
| `MiniProgress` | `percent` `target` `color` `height=8` `showTarget` `label` `targetText` |
| `WaterWave` | `percent` `size=160` `title` `color` `animated` |
| `TimelineChart` | `data:[{x,y1,y2}]` `height=260` `seriesNames` `colors` `smooth` `showZoom` `showLegend` |

> 图表组件的 `data` / `seriesNames` / `colors` 请用 `useMemo` 或模块级常量固定引用，否则每次渲染都会 `setOption`。

### 4.3 表单（form）

#### `TagInput` 标签输入

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string[]` | `[]` | 受控值 |
| `onChange` | `(tags) => void` | — | 变更回调 |
| `max` | `number` | — | 上限，达到后隐藏输入框 |
| `allowDuplicates` | `boolean` | `false` | 允许重复 |
| `placeholder` | `string` | `输入后回车添加` | 占位 |
| `disabled` | `boolean` | `false` | 禁用 |

分隔符固定为 `空格 / 回车 / , / ，`。

#### `AsyncSelect` 异步选择器

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `load` | `(keyword) => Promise<any[]>` | — | 异步数据源；不传则退化为静态 `options` |
| `options` | `any[]` | — | 静态数据源 |
| `fields` | `{value, label}` | `{value:'value', label:'label'}` | 字段映射 |
| `value` / `onChange` | — | — | 受控（支持 `labelInValue`） |
| `multiple` | `boolean` | `false` | 多选 |
| `debounce` | `number` | `300` | 搜索防抖 |
| `renderOption` | `(raw) => ReactNode` | — | 自定义选项渲染 |
| `autoLoad` | `boolean` | `false` | 挂载即加载（默认惰性：展开或搜索时才请求） |
| `emptyText` | `string` | `暂无数据` | 空态文案 |

#### `TimeRangeInput` 时段录入

| Prop | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `{id?, start, end}[]` | `[]` | 受控值，`start/end` 为 `'HH:mm'` |
| `onChange` | `(ranges) => void` | — | 变更回调 |
| `maxHours` | `number` | `24` | 单段时长上限 |
| `showSummary` | `boolean` | `true` | 是否显示合计 |
| `addText` / `summaryText` | `string` | — | 文案 |

### 4.4 Hook 与工具

| 名称 | 签名 | 说明 |
| --- | --- | --- |
| `useCountdown` | `(target, {interval, onEnd}) => {remaining, days, hours, minutes, seconds, finished}` | 用 `Date.now()` 重算，不做自减 |
| `useInView` | `(ref, {rootMargin, threshold, once}) => boolean` | 元素是否进入视口 |
| `useOverflow` | `(ref, watchKey) => boolean` | 内容是否溢出容器 |
| `useFormattedDuration` | `(ms, pattern) => string` | 毫秒格式化 |
| `dataURLtoFile` | `(dataURL, filename) => File` | 画布结果转可上传文件 |
| `arrayMove` | `(list, from, to) => list` | 返回新数组，不修改入参 |
| `validateTimeRanges` | `(ranges, {maxHours}) => {ok, errors, totalMinutes}` | 时段校验 + 合计 |
| `timeToMinutes` / `minutesToTime` | `('HH:mm') ⇄ number` | 时间与分钟互转 |
| `formatDuration` / `splitDuration` | `(ms, pattern)` / `(ms)` | 时长格式化 / 拆分 |
| `clamp` / `uid` / `formatNumber` / `toTime` | — | 通用小工具 |

---

## 5. 设计约定

1. **零业务耦合**：不引入任何接口、redux、i18n、路由依赖。所有数据通过 props 注入。
2. **样式自带 fallback**：全部形如 `var(--c-primary, #4f46e5)`，整目录复制到没有 `--c-*` 变量的项目也不会失色。
3. **类名 `kit-` 前缀**：不与业务样式冲突。
4. **ref 不作为 props 传出**：`useInView` / `useOverflow` 的 ref 由调用方创建后**传入**，避免触发 `react-hooks/refs`（渲染期读 ref）静态检查。
5. **不在 effect 中同步 setState**：`AsyncSelect` 的 `autoLoad` 走定时器、`useOverflow` 走 `requestAnimationFrame`、`useInView` 走 observer 回调 —— 都是为避免 `react-hooks/set-state-in-effect`。
6. **图表容器恒常挂载**：容器必须始终渲染并给出确定高度。若按数据有无决定是否渲染容器，首次无数据时 `elRef.current` 为空、`echarts.init` 被跳过，之后有数据也不会重新初始化（这正是原项目 LineChart 卡片「图永远画不出来」的根因）。
7. **`index.js` 不导出图表内部实现**：`charts/useEcharts.js` 不进统一出口，避免只想用表单组件的页面被迫引入 ECharts。

---

## 6. 接入示例

```jsx
// 1) 按需引入单个组件
import { SignaturePad } from '@/components/Kit/index.js'

function Form() {
  const [sign, setSign] = useState('')
  return <SignaturePad value={sign} onChange={setSign} height={180} />
}
```

```jsx
// 2) 拖拽排序 + 逐项显隐（对应原 SortCards 的用法）
import { SortableList } from '@/components/Kit/index.js'
import { Switch } from 'antd'

<SortableList
  items={cards}
  onChange={setCards}
  keyOf={(it) => it.key}
  renderItem={(it, index, { dragging }) => (
    <>
      <span>{index + 1}. {it.title}</span>
      <Switch size="small" checked={it.visible}
        onChange={(v) => setCards((prev) => prev.map((c) => c.key === it.key ? { ...c, visible: v } : c))} />
    </>
  )}
/>
```

```jsx
// 3) 懒加载选择器
import { AsyncSelect } from '@/components/Kit/index.js'

<AsyncSelect
  load={(kw) => api.get('/devices', { keyword: kw })}
  fields={{ value: 'id', label: 'name' }}
  onChange={(value, option) => setDevice(value)}
  renderOption={(item) => <div>{item.name}<span>{item.dept}</span></div>}
/>
```

```jsx
// 4) 时段录入（提交前自行校验）
import { TimeRangeInput, validateTimeRanges } from '@/components/Kit/index.js'

const { ok, errors } = validateTimeRanges(ranges, { maxHours: 12 })
<TimeRangeInput value={ranges} onChange={setRanges} maxHours={12} />
```

---

## 7. 迁移基线

移植过程中反复踩到的差异，供后续从这两个项目搬代码时对照：

| 旧（React 16 / antd 3） | 新（React 19 / antd 5） |
| --- | --- |
| `ReactDOM.render` / `unmountComponentAtNode` | 已移除 → `createRoot`；或直接改成受控组件（**已优先采用**） |
| `ReactDOM.findDOMNode(this.refs.x)` | 已移除 → `useRef` |
| `componentWillMount` / `componentWillReceiveProps` | 废弃 → Hook / `getDerivedStateFromProps` |
| `<Icon type="close-circle" />` | `@ant-design/icons` 的 `<CloseCircleOutlined />` |
| `message.warn` | `message.warning` |
| `Popover` / `Drawer` 的 `visible` / `onVisibleChange` | `open` / `onOpenChange` |
| `Select` 的 `dropdownClassName` / `dropdownStyle` | `popupClassName` / `styles.popup` |
| `DatePicker` 的 `getCalendarContainer` | `getPopupContainer` |
| `moment` | `dayjs`（本项目 `dayjs` 已在依赖内） |
| `Card` 的 `bodyStyle` | `styles.body` |
| `Tabs` 的 `<TabPane>` | `items` 数组 |
| `Tabs` / `Table` 的 `visible` 类受控 | 统一为 `open` / `items` |
| antd 3 的 less 类名（`.ant-select-selection__rendered` 等） | DOM 结构整体变化，样式须重写 |
| `react-weui` / `antd-mobile@2` / `react-transition-group@1` / `react-sortable-hoc` | 均已过时或不兼容 React 19，需整体替换 |
| `lodash-decorators` 的 `@Bind` / `@Debounce` | Vite/SWC 下不可用 → Hook 或 `lodash.debounce` |
| G2 / `g2-plugin-slider` / `g-cloud` | ECharts 6 内置对应能力（`dataZoom` / `gauge` / `radar`） |
| 类组件的 `this.setState` 命令式赋值（如 `e.target.value = ...`） | 一律改受控 props |

另有两个**不改也能跑、但会埋雷**的写法，本次一并修掉：

- **陈旧闭包**：`useEffect(..., [])` 里绑定的事件处理器读取首次渲染的 props（`FloatingBall` 原实现）。
- **渲染期副作用**：模块级计数器在渲染/事件中自增（`zSeed`），会触发 `react-hooks/globals`。

---

## 8. 去敏说明

原项目属于某企业级资产管理产品线，搬移过程中**刻意剔除**了以下内容，本模块不含任何一项（本文档也不再复述原文）：

- **内部域名与网关路径**：原项目配置中的内网域名、网关前缀、代码托管地址，一律不保留。
- **接口与存储键**：内部接口名、本地缓存键名（登录凭证、业务缓存等）全部改为 props 注入或移除。
- **企业标识**：企业品牌 Logo、企业邮箱作者信息、代码仓库远端地址。
- **业务实体**：多级组织层级契约、业务角色枚举、工单状态机与审批节点，以及企业 IM 容器（微信 / 钉钉 / 飞书 / 自研容器）的 bridge 调用。
- **外部 CDN 依赖**：原实现引用的第三方图床（默认空状态图、词云遮罩图）已替换为 antd 内置 `Empty` 或直接去掉。

演示页里的名称、分组与标签均为**虚构占位数据**，不来自原项目。

---

## 9. 常见问题

**Q：为什么 `PullToRefresh` 用鼠标也能拖？**
保留了鼠标事件分支，方便在桌面浏览器直接调试；生产移动端只走 touch 分支，互不影响。

**Q：`SignaturePad` 导出的图为什么是白底？**
Canvas 默认透明，`toDataURL` 出来的 PNG 在部分看图软件中会显示成黑底。导出时先铺了一层白色，同时用 2 倍缩放重绘，保证清晰度。

**Q：`Ellipsis` 展开后「收起」按钮会消失吗？**
不会。按钮显隐条件写成 `overflowing || expanded` —— 展开后 `scrollHeight` 不再溢出，若只看 `overflowing` 按钮就会消失。

**Q：`AsyncSelect` 为什么不支持依赖字段变化自动重载？**
那需要在 effect 中同步 `setLoading`，会触发 `react-hooks/set-state-in-effect`。改为惰性加载 + 搜索防抖后，既能覆盖同样的场景，也少发了请求。确实需要「父级字段变化就重载」时，给组件加 `key` 强制重挂载即可。

**Q：图表为什么必须有固定高度？**
`echarts.init` 时容器高度为 0 会初始化失败或警告。所有图表组件都通过 `style={{ height }}` 显式给出高度。

**Q：能直接把这个目录复制到别的项目用吗？**
可以。样式全部带 fallback，没有 `--c-*` 变量时使用括号内的默认色；唯一的外部依赖是 `antd`、`@ant-design/icons`、`echarts`、`dayjs`。
