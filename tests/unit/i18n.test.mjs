/**
 * i18n 单元测试：钉死「10 语种命名空间键结构完全一致 + 源码 t() 引用键全部存在 + 无空值」。
 *
 * 目录结构：src/i18n/locales/<lang>/<ns>.json（一种语言一个文件夹、一个分类一个文件）。
 * 新增页面文案的流程：在 10 个语种目录下同名字文件同时补键 → 在页面里 t('ns.key')，
 * 任何一步漏掉，这里的对应断言都会红。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ok, eq, length } from './harness.mjs'
import { SIMPLIFIED_CHARS } from '@root/scripts/zh-tw.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const LOCALE_DIR = path.join(ROOT, 'src', 'i18n', 'locales')
const SRC_DIR = path.join(ROOT, 'src')

const EXPECTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'th', 'mn', 'bo']

/** 递归取全部叶子键路径：{ nav: { home } } → ['nav.home'] */
function leafKeys(obj, prefix = '') {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...leafKeys(v, p))
    else out.push(p)
  }
  return out
}

/** 把 locales/<lang>/*.json 合并成与旧扁平结构同构的对象：lang → { ns → 文案 } */
function readLang(lang) {
  const dir = path.join(LOCALE_DIR, lang)
  const merged = {}
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    merged[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
  }
  return merged
}

/** 某语种目录下的命名空间文件名集合（不含 .json） */
function namespacesOf(lang) {
  return fs.readdirSync(path.join(LOCALE_DIR, lang))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
    .sort()
}

/** 递归收集 src 下的 js/jsx 文件 */
function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (/\.(jsx?|mjs)$/.test(e.name)) out.push(p)
  }
  return out
}

export default [
  [
    '10 个语种目录齐备、可解析，且只有一层命名空间文件',
    () => {
      const dirs = fs.readdirSync(LOCALE_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
      eq(dirs.join(','), [...EXPECTED_LANGS].sort().join(','), '语种目录集合')
      for (const lang of EXPECTED_LANGS) {
        const j = readLang(lang)
        ok(j && typeof j === 'object' && Object.keys(j).length > 0, `${lang} 可解析为非空对象`)
      }
      /* locales 根下不应再残留扁平 <lang>.json（旧结构已废除） */
      const rootJson = fs.readdirSync(LOCALE_DIR).filter((f) => f.endsWith('.json'))
      eq(rootJson.length, 0, 'locales 根目录残留扁平 JSON')
    },
  ],
  [
    '各语种命名空间文件集合完全一致（同文件名 = 同分类）',
    () => {
      const base = namespacesOf('zh-CN')
      ok(base.length >= 8, `简体中文命名空间应 ≥8（实际 ${base.length}）`)
      for (const lang of EXPECTED_LANGS) {
        const ns = namespacesOf(lang)
        const missing = base.filter((k) => !ns.includes(k))
        const extra = ns.filter((k) => !base.includes(k))
        eq(missing.join(','), '', `${lang} 缺失命名空间文件`)
        eq(extra.join(','), '', `${lang} 多出命名空间文件`)
      }
    },
  ],
  [
    '10 个语种键结构与简体中文完全一致（无缺失 / 无多余）',
    () => {
      const base = leafKeys(readLang('zh-CN')).sort()
      ok(base.length >= 100, `简体中文键数量应 ≥100（实际 ${base.length}）`)
      for (const lang of EXPECTED_LANGS) {
        const ks = leafKeys(readLang(lang)).sort()
        const missing = base.filter((k) => !ks.includes(k))
        const extra = ks.filter((k) => !base.includes(k))
        eq(missing.join(','), '', `${lang} 缺失键`)
        eq(extra.join(','), '', `${lang} 多余键`)
        length(ks, base.length, `${lang} 键数量`)
      }
    },
  ],
  [
    '所有语种所有文案非空（含插值占位符语法检查）',
    () => {
      for (const lang of EXPECTED_LANGS) {
        const j = readLang(lang)
        for (const key of leafKeys(j)) {
          const v = key.split('.').reduce((o, s) => o[s], j)
          ok(typeof v === 'string' && v.trim().length > 0, `${lang}.${key} 为空`)
          /* {name} 占位符成对出现：花括号数必须为偶数，防止写花脸 */
          const opens = (v.match(/\{/g) || []).length
          const closes = (v.match(/\}/g) || []).length
          eq(opens, closes, `${lang}.${key} 花括号不成对`)
        }
      }
    },
  ],
  [
    '占位符跨语种一致：同一键的 {var} 名集合相同',
    () => {
      const base = readLang('zh-CN')
      const varsOf = (obj, prefix = '') => {
        const out = {}
        for (const [k, v] of Object.entries(obj)) {
          const p = prefix ? `${prefix}.${k}` : k
          if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, varsOf(v, p))
          else out[p] = (String(v).match(/\{(\w+)\}/g) || []).sort().join(',')
        }
        return out
      }
      const baseVars = varsOf(base)
      for (const lang of EXPECTED_LANGS) {
        const vars = varsOf(readLang(lang))
        for (const [key, set] of Object.entries(baseVars)) {
          eq(vars[key], set, `${lang}.${key} 占位符与简体中文不一致`)
        }
      }
    },
  ],
  [
    '源码中所有 t() 引用的键都存在于简体中文文案',
    () => {
      const base = new Set(leafKeys(readLang('zh-CN')))
      const files = walk(SRC_DIR)
      const pattern = /\bt\(\s*['"`]([\w.-]+)['"`]/g
      const bad = []
      for (const f of files) {
        /* 剥注释：文档注释里的用法示例（t('xxx.yyy')）不是真实引用 */
        const src = fs.readFileSync(f, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/(^|[^:])\/\/.*$/gm, '$1')
        for (const m of src.matchAll(pattern)) {
          if (!base.has(m[1])) bad.push(`${path.relative(ROOT, f)} → t('${m[1]}')`)
        }
      }
      eq(bad.join('\n'), '', '存在不存在的 i18n 键引用')
    },
  ],
  [
    /**
     * 非汉藏语种的文案里不得残留汉字 —— 守住「键对齐 ≠ 已翻译」。
     *
     * 背景：早期为了让本文件的前几条断言（结构一致 / 非空）通过，
     * 曾把 zh-CN 原文整体复制到各语种。结果是 3261 个键一个不缺、全都非空，
     * 但切换到日语 / 德语时界面上显示的仍是中文 —— 而所有断言都是绿的。
     * 这条用例就是专门为这类「结构完美但内容没翻译」的退化兜底。
     *
     * STRICT 是渐进名单：每治理干净一个语种就把它加进来，加进来之后它就再也不能退回。
     * 剩余待治理：th / mn / bo。
     * ⚠️ ja / ko 这类汉字圈语种永远不能进 STRICT：按钮「停止」在日语里就是「停止」，
     * 与原文同形是常态，拿「残留汉字」判它们会全量误报 —— 改用下面的「相同率」守卫。
     */
    '非汉藏语种文案不得残留汉字（防止「键对齐但没翻译」重演）',
    () => {
      const STRICT = ['en', 'de', 'fr']
      const HAN = /[一-鿿]/
      for (const lang of STRICT) {
        const j = readLang(lang)
        for (const key of leafKeys(j)) {
          const v = key.split('.').reduce((o, s) => o[s], j)
          ok(!HAN.test(v), `${lang}.${key} 仍未翻译：${v}`)
        }
      }
    },
  ],
  [
    /**
     * 韩文（ko）文案全量不得出现汉字。
     *
     * 为什么单列一条而不是并进上面的「相同率」守卫：相同率只数「值与原文完全一致」的条目，
     * 而历史上的真实退化是「大半译成谚文、零星几个词漏译成汉语」——值已异于原文，
     * 相同率只有个位数，相同率守卫和 sameCjk 体检都抓不到（曾漏过 15 处：
     * 「同样」「极深」「序列」「剪贴板」混在谚文里）。
     * 韩文 UI 翻译不使用汉字，出现即残留，判定零误报。
     */
    '韩文文案不得残留汉字（含「大半已译、零星漏译」的混合退化）',
    () => {
      const HAN = /[一-鿿]/
      const j = readLang('ko')
      const bad = []
      for (const key of leafKeys(j)) {
        const v = key.split('.').reduce((o, s) => o[s], j)
        if (typeof v === 'string' && HAN.test(v)) bad.push(`ko.${key} 残留汉字：${v}`)
      }
      eq(bad.join('\n'), '', 'ko 存在未翻译的汉字残留')
    },
  ],
  [
    /**
     * 汉字圈语种（ja / ko）用「相同率」而不是「零残留汉字」守。
     *
     * 日语本就大量使用汉字书写：操作、停止、数据、状态、保存……这些词日译后
     * 与中文完全同形，是正常语言现象而非漏译。但它们同时也意味着：
     * 一旦有人再把 zh-CN 整体复制进来，相同率会从个位数直接跳到 100%，
     * 这个信号足够干净、足够灵敏。
     *
     * 当前 ja 实测 284 / 3261 ≈ 8.7%，阈值取 12%（留出新增文案的余量，
     * 同时把「批量复制」这种量级的退化死死挡住）。
     * ko 实测 117 / 3261 ≈ 3.6%（剩余同形条目多为数字 / 品牌名 / 符号），
     * 治理干净后已按同样口径纳入。
     */
    '汉字圈语种与原文的相同率不得超过阈值',
    () => {
      const SAME_RATIO = { ja: 0.12, ko: 0.12 }
      const zh = readLang('zh-CN')
      const zhLeaves = leafKeys(zh)
      for (const [lang, limit] of Object.entries(SAME_RATIO)) {
        const j = readLang(lang)
        let same = 0
        for (const key of zhLeaves) {
          const v = key.split('.').reduce((o, s) => o[s], j)
          if (v === key.split('.').reduce((o, s) => o[s], zh)) same++
        }
        const ratio = same / zhLeaves.length
        ok(
          ratio <= limit,
          `${lang} 与原文相同率 ${(ratio * 100).toFixed(1)}% 超过阈值 ${limit * 100}%（疑似整篇复制）`,
        )
      }
    },
  ],
  [
    /**
     * zh-TW 不得残留简体字形。
     *
     * 判定口径和上一条刻意不同：zh-TW 与 zh-CN 共用大量传承字（系统、空间、天文…），
     * 所以「值与 zh-CN 相同」在这里是常态，拿它当漏翻译会误报一大片。
     * 真正的信号是「出现了只在简体里存在的字形」——数、据、时、动这些字
     * 在繁体里根本不存在，一旦出现就说明那一处没走简繁转换。
     */
    'zh-TW 文案不得残留简体字形',
    () => {
      const j = readLang('zh-TW')
      const bad = []
      for (const key of leafKeys(j)) {
        const v = key.split('.').reduce((o, s) => o[s], j)
        if (typeof v !== 'string') continue
        for (const ch of v) {
          if (SIMPLIFIED_CHARS.has(ch)) {
            bad.push(`zh-TW.${key} 残留简体字「${ch}」：${v}`)
            break
          }
        }
      }
      eq(bad.join('\n'), '', 'zh-TW 存在未转换的简体字形')
    },
  ],
  [
    '核心分类齐备：nav / shell / home / about / login / notFound / loading / lang',
    () => {
      const base = readLang('zh-CN')
      for (const cat of ['nav', 'shell', 'home', 'about', 'login', 'notFound', 'loading', 'lang']) {
        ok(base[cat] && Object.keys(base[cat]).length > 0, `缺少分类 ${cat}`)
      }
      /* 导航分类要覆盖侧边栏全部一级入口 */
      for (const key of ['home', 'dashboard', 'about', 'testCenter']) {
        ok(base.nav[key], `nav.${key} 缺失`)
      }
    },
  ],
  [
    'translate 兜底语义：缺失键返回第三参 fallback，而非键名',
    async () => {
      const { translate } = await import('../../src/i18n/translate.mjs')
      const messages = { 'zh-CN': { a: { b: '值' } }, en: {} }
      eq(translate(messages, 'en', 'a.b'), '值', '缺失语种回退简体中文')
      eq(translate(messages, 'en', 'a.c', {}, '兜底'), '兜底', 'fallback 参数生效')
      eq(translate(messages, 'en', 'a.c'), 'a.c', '无 fallback 时返回键名')
      eq(translate(messages, 'zh-CN', 'a.b', {}, '兜底'), '值', '有值时忽略 fallback')
    },
  ],
]
