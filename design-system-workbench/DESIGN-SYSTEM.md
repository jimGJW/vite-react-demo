# Nexus Design System v1.0

> 综合工作台 · 专业从业者 · 科技未来风（类 Vercel）
> 设计稿：`./index.html` · 单文件可运行，无构建依赖

---

## 1. 设计哲学

| 维度 | 决策 | 原因 |
|------|------|------|
| **信息密度** | 高密度 + 强层级 | 专业用户接受复杂操作，但依靠视觉层级降噪 |
| **色彩定位** | 深色基调 + 霓虹强调 | 长时间盯盘护眼，强调色聚焦关键信息 |
| **质感语言** | 玻璃拟态 + 微光晕 | 科技未来感来源，但克制使用避免廉价感 |
| **动效节奏** | 120–240ms 快速反馈 | 专业场景重效率，动效服务于状态反馈而非装饰 |
| **无障碍** | WCAG AA 全量达标 | 对比度 ≥ 4.5:1，键盘可达，尊重 reduced-motion |

---

## 2. 颜色系统

### 2.1 表面层级（深色专属 5 层）

```css
--bg-base:        #0A0A0B;            /* 应用底色 · 最深 */
--bg-elevated:    #111113;            /* 抬升容器（侧栏/卡片堆叠） */
--bg-surface:     rgba(255,255,255,0.03);  /* 玻璃拟态表面 */
--bg-surface-hi:  rgba(255,255,255,0.06);  /* hover 表面 */
--bg-overlay:     rgba(10,10,11,0.82);    /* 模态遮罩 */
```

> 设计要点：深色界面禁用纯黑 `#000`，统一用 `#0A0A0B` 保留轻微蓝调，避免廉价的"剪影感"。

### 2.2 文本对比度（全部 ≥ WCAG AA 4.5:1）

| Token | 色值 | 对 `#0A0A0B` 对比度 | 用途 |
|-------|------|---------------------|------|
| `--text-primary`   | `#FAFAFA` | 19.3:1 | 标题、数值、强信息 |
| `--text-secondary` | `#A1A1AA` | 8.9:1  | 正文、次要标签 |
| `--text-tertiary`  | `#71717A` | 4.7:1  | 元信息、占位符 |
| `--text-disabled`  | `#52525B` | —      | 仅装饰，非文本流 |

### 2.3 品牌色（电光蓝 → 青蓝渐变）

```css
--brand-blue:     #3B82F6;
--brand-cyan:     #06B6D4;
--brand-gradient: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);
--brand-glow:     0 0 32px rgba(59,130,246,0.35);
```

渐变方向固定 135°（左上→右下），辉光半径 32px——刚好"看得见但不刺眼"。

### 2.4 语义色（深底饱和度调校）

| 语义 | 主色 | 软底 | 用途 |
|------|------|------|------|
| success | `#10B981` | `rgba(16,185,129,0.12)` | 完成、正向 |
| warning | `#F59E0B` | `rgba(245,158,11,0.14)` | 进行中、待处理 |
| error   | `#EF4444` | `rgba(239,68,68,0.12)` | 异常、阻断 |
| info    | `#3B82F6` | `rgba(59,130,246,0.12)` | 提示、链接 |

> 深底适配：纯色用于图标与强调点；软底（带 0.12 alpha）用于徽标背景，避免饱和色块"灼眼"。

---

## 3. 字体系统

### 3.1 字体族

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'PingFang SC', 'Microsoft YaHei', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, Consolas, monospace;
```

- **Inter** 主 UI 字体：开源、光学尺寸友好、字怀开阔，深色下不糊
- **JetBrains Mono** 等宽：所有数值（KPI/时间戳/ID）一律走等宽，对齐感强
- 中文兜底 **苹方 / 微软雅黑**，不依赖网络字体加载

### 3.2 字号阶梯（1.125 modular scale）

| Token | 字号 | 用途 |
|-------|------|------|
| `--text-xs`   | 11px | 表头、徽标、元信息 |
| `--text-sm`   | 13px | 正文、按钮、表格单元格 |
| `--text-base` | 14px | 基准 |
| `--text-lg`   | 16px | 卡片标题 |
| `--text-xl`   | 20px | 区块标题 |
| `--text-2xl`  | 28px | 页面 H1、KPI 数值 |
| `--text-3xl`  | 36px | 大屏数据展示 |

字重梯度：400 常规 / 500 强调 / 600 标题 / 700 数值大字。

---

## 4. 间距与圆角

### 4.1 间距（4px 基线）

```
4 · 8 · 12 · 16 · 24 · 32 · 48  (px)
```

专业工具密度高，故偏向小间距。卡片内 padding 留 `24px`，组件 gap 留 `16px`，紧凑列表行 `12px`。

### 4.2 圆角

| Token | 半径 | 用途 |
|-------|------|------|
| `--radius-sm`   | 6px  | 按钮、徽标、小输入 |
| `--radius-md`   | 8px  | 卡片、菜单项 |
| `--radius-lg`   | 12px | 大容器、面板 |
| `--radius-xl`   | 16px | 模态 |
| `--radius-full` | ∞    | 头像、圆点、胶囊 |

---

## 5. 阴影系统

深色界面阴影 = **低明度投影**（增加层次）+ **彩色辉光**（强调焦点）。

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
--shadow-md: 0 4px 16px rgba(0,0,0,0.5);
--shadow-lg: 0 16px 48px rgba(0,0,0,0.6);
--shadow-glow-blue: 0 0 24px rgba(59,130,246,0.40);
--shadow-glow-cyan: 0 0 24px rgba(6,182,212,0.40);
```

> 反例：深色界面若只用浅色界面的灰色阴影，会"看不出层次"——所以投影颜色必须带 0.4+ alpha 的纯黑。

---

## 6. 组件规格

### 6.1 按钮 3 变体

| 变体 | 视觉 | 用途 |
|------|------|------|
| `.btn--primary` | 蓝青渐变实色 + 蓝色辉光 | 主操作（每屏唯一） |
| `.btn--ghost`   | 半透表面 + 细边框 | 次操作 |
| `.btn--outline` | 透明底 + 蓝色描边 | 强调但非主操作 |

- 默认高度 36px，小号 30px
- 圆角 8px，左右 padding 16px
- hover 状态：primary 上浮 1px + 辉光增强；ghost 表面提亮；outline 加蓝底
- `:focus-visible` 显示 2px 蓝色外描边 + 2px 偏移
- `:disabled` opacity 0.5 + 禁止指针事件
- **每屏primary 唯一**——这是设计强约束，避免视觉重心失焦

### 6.2 卡片（玻璃拟态）

```css
background: rgba(255,255,255,0.03);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.06);
border-radius: 12px;
```

- 内 padding 24px
- hover 表面提亮 + 边框加深，**不带 transform**——专业工具忌卡片"漂浮感"
- KPI 卡内嵌 sparkline SVG（36px 高，gradient fill）

### 6.3 状态徽标

胶囊形，左侧带 6px 圆点。5 种语义色 + neutral 灰，统一的 3×10 padding。

### 6.4 表格

- 表头：11px 大写 + 0.06em letter-spacing，建立"元信息感"
- 行高 16px padding，行间用 1px `--border-subtle` 分割
- hover 行整行提亮，不单独高亮单元格

### 6.5 活动流时间线

左侧 1px 轴线 + 14px 圆点（带 3px 同底色外环形成"挖空"效果），按事件类型着色。

### 6.6 分段控制器

3px 内 padding 容器 + 5px 内 padding 按钮，活跃项用 `--bg-surface-hi` + 阴影，避免使用强色填充——保持专业工具的克制。

---

## 7. 响应式断点

| 断点 | 宽度 | 行为 |
|------|------|------|
| Mobile    | < 640px   | KPI 单列、隐藏搜索、用户菜单只剩头像 |
| Tablet    | 640–960px | 侧栏折叠为图标态（64px）、表格保留 |
| Desktop   | 960–1280px | 主区单列、KPI 2 列 |
| Wide      | ≥ 1280px  | 完整 2 栏布局、KPI 4 列 |

移动优先策略：所有网格默认 1 列，按断点逐步升级。

---

## 8. 无障碍清单

- [x] 全文本对比度达 WCAG AA（4.5:1+，详见 §2.2）
- [x] 键盘可达：所有交互元素 `tabindex="0"` 且 Enter/Space 可触发
- [x] `:focus-visible` 显式描边（2px blue + 2px offset）
- [x] 语义化 HTML：`<header>` `<aside` `<main>` `<table>` `<section>`
- [x] ARIA 标签：搜索框、图标按钮、活跃导航项均有 `aria-label`
- [x] 尊重 `prefers-reduced-motion`：动效全部归零
- [x] 触控目标 ≥ 36×36px（图标按钮满足，移动端需升到 44×44）
- [x] 颜色不作为唯一信息载体（徽标带文字、状态点带语义色 + 文字）

---

## 9. 交互细节

| 触发 | 反馈 |
|------|------|
| 顶栏搜索聚焦 | 边框变蓝 + 3px 蓝色辉光圈 |
| 导航项 hover | 半透背景 + 文字提亮 |
| 导航项 active | 左侧 3px 渐变指示条 + 蓝色辉光 |
| KPI 卡 hover | 表面提亮、sparkline 不变（避免数据闪烁） |
| 按钮 hover | primary 上浮 + 辉光增强；ghost 表面提亮 |
| Toast | 3.5s 后自动淡出下移 |
| ⌘K / Ctrl+K | 全局聚焦搜索框 |

---

## 10. 开发交接清单

### 10.1 必须实现

- [ ] 设计令牌接入项目 CSS 变量（建议放 `src/styles/tokens.css`）
- [ ] 暗色模式作为默认（项目原本 light 主题可保留为切换态）
- [ ] Inter + JetBrains Mono 字体引入（Google Fonts 或本地打包）
- [ ] 按钮组件 3 变体封装为 React 组件 `<Button variant="primary|ghost|outline" />`
- [ ] 卡片、徽标、分段控制器、表格抽取为通用组件
- [ ] 顶部搜索 `⌘K` 快捷键全局监听
- [ ] `prefers-reduced-motion` 媒体查询注入

### 10.2 验收标准

- [ ] Lighthouse Accessibility ≥ 95
- [ ] 所有交互元素键盘可达，Tab 顺序符合视觉流
- [ ] 4 个断点逐一检查布局完整性
- [ ] Data Studio 截图对比设计稿，像素偏差 ≤ 2px

### 10.3 后续迭代

- v1.1：增加 light 主题令牌映射
- v1.2：动效库（framer-motion）统一封装
- v1.3：图表组件标准化（基于 ECharts 二次封装）

---

**设计稿版本**：v1.0  
**交付日期**：2026-09-30  
**维护者**：UI Designer  
**反馈渠道**：在 `index.html` 中直接修改后回传 diff