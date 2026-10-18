/**
 * 路径别名 —— 全项目唯一真源。
 *
 * ── 为什么要单独抽一个文件 ────────────────────────────────
 * 别名同时被三条互不相干的链路消费：
 *   1. vite.config.js 的 resolve.alias —— dev / build / ssrLoadModule
 *   2. tsconfig.json 的 compilerOptions.paths —— 编辑器跳转与类型检查
 *   3. scripts/alias-loader.mjs —— npm test 用的纯 Node 动态 import 链路
 * 以前这三处各自硬编码，加一个别名要改三个地方、漏一处就是"编辑器不报错但运行时炸"。
 * 现在收敛成本文件：1、3 直接 import 派生；2 由 tests/unit/alias.test.mjs 做一致性守卫，
 * 一旦 tsconfig 与本表不同步，npm test 立刻变红。
 *
 * ── 别名集合为什么只有这几个 ──────────────────────────────
 * 按真实引用频次选（迁移前统计 src 下 @/xxx 的二级目录分布）：
 *   i18n 195 / components 79 / lib 55 —— 这三项占全部引用的 92%。
 *   其余 pages 10 / utils 6 / micros 5 / contexts 4 / hooks 2 频次过低，
 *   单独给别名只会让写法更碎，统一走 '@/xxx' 即可。
 *
 * ── 两条边界（改动前务必知道）────────────────────────────
 *   1) micro-apps/ 子应用各有自己的 vite 配置，拿不到本别名，内部必须保持相对路径；
 *   2) src/creative/ 会被 sync:demos 原样复制进 vue/angular 子应用，
 *      同理不能出现任何别名，复制过去会解析失败。
 */
import path from 'node:path'

/** 项目根目录 */
export const ROOT = path.resolve(import.meta.dirname, '..')

/**
 * 别名表：import 里写的 specifier 前缀 -> 相对项目根的目标路径。
 * key 必须与源码里的写法逐字一致。
 *
 * 匹配语义与 @rollup/plugin-alias 保持一致 —— 「完全相等」或「前缀 + '/'」：
 *   '@/i18n' 命中 '@'；'@i18n/index.js' 不会被 '@' 吃掉（后者要求 '@/…'）。
 * 因此长短 key 并存是安全的，不需要额外排序。
 */
export const ALIAS_TARGETS = {
  '@': 'src', // 源码根：兜底，任何 src/ 下模块都能写
  '@i18n': 'src/i18n', // 查词入口 useI18n/t，全站最高频
  '@components': 'src/components', // 组件库
  '@lib': 'src/lib', // 纯逻辑/数据源层
  '@root': '.', // 项目根：用于 tests/、scripts/ 等 src 之外的资源（如 ?raw 文本）
}

/** 绝对路径形态（供 Node 侧 resolver 直接使用） */
export const ALIAS_DIRS = Object.entries(ALIAS_TARGETS).map(([key, rel]) => [
  key,
  path.join(ROOT, rel),
])

/** vite resolve.alias 所需的「别名 -> 绝对路径」形态 */
export const VITE_ALIAS = Object.fromEntries(ALIAS_DIRS)

/** tsconfig compilerOptions.paths 所需的形态（'@/x' -> ['src/x']） */
export const TSCONFIG_PATHS = Object.fromEntries(
  Object.entries(ALIAS_TARGETS).map(([key, rel]) => [`${key}/*`, [`${rel}/*`]]),
)

/**
 * 把一个带别名的 specifier 还原成绝对路径；不是别名则返回 null。
 * 供 Node 链路复用，避免 alias-loader 再手撸一遍匹配逻辑。
 */
export function resolveAliasPath(specifier) {
  for (const [key, dir] of ALIAS_DIRS) {
    if (specifier === key) return dir
    if (specifier.startsWith(`${key}/`)) return path.join(dir, specifier.slice(key.length + 1))
  }
  return null
}
