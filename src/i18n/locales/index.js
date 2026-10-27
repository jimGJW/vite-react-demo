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
 * 装载策略（性能优化，2026-10-27）：
 *   zh-CN 是「源语言 + 默认语言」——每个语种缺键时都回退它，因此**同步内置**（eager），
 *   保证首屏 t() 永远有值。其余 9 个语种走**动态 import 按需装载**（ensureLang），
 *   首屏 JS 从 10 语种全量 2.3MB 降到单语种约 1/10；切换语种时 I18nProvider 会先
 *   ensureLang 再提交状态，未就绪期间 translate 自动回退 zh-CN（无缝降级，无报错）。
 *   dev / build / SSR（Vite 管线）三者都走同一条发现逻辑。
 */
const eagerModules = import.meta.glob('./zh-CN/*.json', { eager: true, import: 'default' })
const lazyModules = import.meta.glob(['./*/*.json', '!./zh-CN/*.json'], { import: 'default' })

/** lang → { ns → 文案对象 }，与旧扁平结构（<lang>.json 顶层即分类）完全同构 */
export const MESSAGES = { 'zh-CN': {} }

for (const [filepath, dict] of Object.entries(eagerModules)) {
  const m = filepath.match(/^\.\/([^/]+)\/([^/]+)\.json$/)
  if (!m) continue
  const [, lang, ns] = m
  /* 同名文件重复命中（大小写差异等）时先到先得，测试会钉死文件名集合一致 */
  if (!(ns in MESSAGES[lang])) MESSAGES[lang][ns] = dict
}

/* 非默认语种：lang → [ns → 动态加载器]。Vite 会把每个 JSON 切成独立 chunk */
const LANG_LOADERS = {}
for (const [filepath, load] of Object.entries(lazyModules)) {
  const m = filepath.match(/^\.\/([^/]+)\/([^/]+)\.json$/)
  if (!m) continue
  const [, lang, ns] = m
  if (!LANG_LOADERS[lang]) LANG_LOADERS[lang] = []
  LANG_LOADERS[lang].push([ns, load])
}

const pendingLangs = new Map()
const readyLangs = new Set(['zh-CN'])

/**
 * 按需装载某语种的全部文案（幂等）：首次调用发起动态 import 并写入 MESSAGES，
 * 之后调用直接 resolve。装载完成后该语种的 t() 立即生效。
 * @param {string} lang 语种 code
 * @returns {Promise<void>}
 */
export function ensureLang(lang) {
  if (readyLangs.has(lang)) return Promise.resolve()
  if (!pendingLangs.has(lang)) {
    MESSAGES[lang] = MESSAGES[lang] || {}
    const task = Promise.all(
      (LANG_LOADERS[lang] || []).map(async ([ns, load]) => {
        MESSAGES[lang][ns] = await load()
      }),
    ).then(() => {
      readyLangs.add(lang)
    })
    pendingLangs.set(lang, task)
  }
  return pendingLangs.get(lang)
}

/** 某语种文案是否已就绪（同步可用）。zh-CN 恒为 true */
export function isLangLoaded(lang) {
  return readyLangs.has(lang)
}
