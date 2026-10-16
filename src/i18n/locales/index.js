/**
 * 文案目录索引 —— 一种语言一个文件夹，一个分类一个 JSON，glob 自动发现。
 *
 *   src/i18n/locales/zh-CN/nav.json    简体中文 · 导航
 *   src/i18n/locales/zh-CN/astro.json  简体中文 · 深空看板
 *   src/i18n/locales/en/astro.json     English · 深空看板
 *   ……
 *
 * 约定：
 *   1. 目录名 = 语种 code（与 LANGUAGES 一一对应），文件名 = 命名空间（分类）。
 *   2. 只放一层：locales/<lang>/<ns>.json，不要再分子目录。
 *   3. 键路径 = '<ns>.<key>'，如 t('nav.home')、t('astro.sun.title')。
 *   4. 新增文案：10 个语种目录下同名字文件同时补键（tests/unit/i18n.test.mjs 钉死对齐）。
 *
 * 这里用 import.meta.glob 惰性收集：新增命名空间文件无需改任何 import，
 * dev / build / SSR（Vite 管线）三者都走同一条发现逻辑。
 */
const modules = import.meta.glob('./*/*.json', { eager: true, import: 'default' })

/** lang → { ns → 文案对象 }，与旧扁平结构（<lang>.json 顶层即分类）完全同构 */
export const MESSAGES = {}

for (const [filepath, dict] of Object.entries(modules)) {
  const m = filepath.match(/^\.\/([^/]+)\/([^/]+)\.json$/)
  if (!m) continue
  const [, lang, ns] = m
  if (!MESSAGES[lang]) MESSAGES[lang] = {}
  /* 同名文件重复命中（大小写差异等）时先到先得，测试会钉死文件名集合一致 */
  if (!(ns in MESSAGES[lang])) MESSAGES[lang][ns] = dict
}
