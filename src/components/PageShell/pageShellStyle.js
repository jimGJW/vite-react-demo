/**
 * 页面外壳的样式解析（纯函数，可单测）。
 *
 * 为什么单独抽出这三条规则：全站 38 个页面都要给「页头强调色 / 栅格间距 /
 * 错峰序号」赋值，若各页手写 `style={{ '--pg-accent': '#08979c' }}`：
 *  1. 硬编码 hex 绕过主题令牌，暗色主题（[data-theme='dark']）下对比度会崩；
 *  2. 间距写魔法数，8pt 栅格形同虚设；
 *  3. 错峰序号不钳制，30 项列表最后一项要等 2 秒才入场（观感是"卡住了"）。
 * 这里把规则钉成函数：命名色 → CSS 变量、间距名 → --sp-* 令牌、序号 → 0..MAX。
 */

/** 命名强调色 → src/index.scss 的 token 名（暗色主题会自动换值） */
export const ACCENT_TOKENS = {
  primary: '--c-primary',
  accent: '--c-accent',
  cyan: '--c-accent-2',
  success: '--c-success',
  warning: '--c-warning',
  danger: '--c-danger',
  info: '--c-info',
}

/** 命名间距 → --sp-* token */
export const GAP_TOKENS = {
  none: '--sp-0',
  xs: '--sp-xs',
  sm: '--sp-sm',
  md: '--sp-md',
  lg: '--sp-lg',
  xl: '--sp-xl',
  '2xl': '--sp-2xl',
  '3xl': '--sp-3xl',
  fluid: '--sp-fluid',
}

/**
 * 允许直接透传的裸色值（外部数据驱动的场景，如模块自身品牌色）。
 * 两条刻意的限制：
 *  - 不接受裸单词（'red'/'purpl'）：自定义属性会照收非法值，而消费处
 *    `var(--pg-accent, 兜底)` 的兜底不会生效，颜色会静默继承错值；
 *  - 不接受渐变：--pg-accent 会被 color-mix() 消费，渐变不是 <color>，
 *    整条声明会失效。要渐变质感请用 .m-shine-text / --grad-primary。
 */
const RAW_COLOR_RE = /^(#[0-9a-f]{3,8}|var\(|rgb|hsl|oklch|color-mix\(|transparent|currentColor)/i

/** 错峰入场序号上限：超过则不再延后，避免列表尾部长尾等待 */
export const STAGGER_MAX = 12

/** 允许直接透传的裸尺寸（'16px' / '2rem' / 'calc(...)' / 'clamp(...)' / 'var(...)'） */
const RAW_SIZE_RE = /^([0-9.]+(px|rem|em|%)|var\(|calc\(|clamp\()/

/**
 * 解析强调色。
 * @param {string} [value] 命名 token（'primary'/'accent'/'cyan'/…）或裸色值（'#08979c' / 'var(--x)'）
 * @returns {string|null} `var(--c-*)` 形式、原样透传的裸色值，或 null（未识别 → 交回 CSS 默认值）
 */
export function resolveAccent(value) {
  if (!value || typeof value !== 'string') return null
  const token = ACCENT_TOKENS[value]
  if (token) return `var(${token})`
  return RAW_COLOR_RE.test(value.trim()) ? value.trim() : null
}

/**
 * 解析间距。
 * @param {string} [name] 'none'|'xs'|'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'fluid' 或裸尺寸（'20px'）
 * @param {string} [fallback='lg'] 未识别时使用的命名档位
 * @returns {string} CSS 长度（`var(--sp-*)` 或透传值）
 */
export function resolveGap(name, fallback = 'lg') {
  if (name && typeof name === 'string') {
    const token = GAP_TOKENS[name]
    if (token) return `var(${token})`
    const raw = name.trim()
    if (RAW_SIZE_RE.test(raw)) return raw
  }
  return `var(${GAP_TOKENS[fallback] || GAP_TOKENS.lg})`
}

/**
 * 生成 <Page> / <Kpi> 根节点的 CSS 变量集合，可直接作为 React style。
 * @param {{ accent?: string, gap?: string }} [options]
 * @returns {Record<string, string>}
 */
export function shellStyle({ accent, gap } = {}) {
  const style = {}
  const color = resolveAccent(accent)
  if (color) style['--pg-accent'] = color
  if (gap) style['--pg-gap'] = resolveGap(gap)
  return style
}

/**
 * 错峰序号：钳制到 0..STAGGER_MAX，非法值按 0 处理（立即入场，不吞掉元素）。
 * @param {number|string} [index]
 * @returns {{ '--i': number }}
 */
export function stagger(index) {
  const n = Number(index)
  const safe = Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), STAGGER_MAX) : 0
  return { '--i': safe }
}

/**
 * KPI 数值是否可跑数字滚动。字符串（'1.2k'/'—'）与 NaN 一律原样显示。
 * @param {unknown} value
 * @returns {boolean}
 */
export function isCountable(value) {
  return typeof value === 'number' && Number.isFinite(value)
}
