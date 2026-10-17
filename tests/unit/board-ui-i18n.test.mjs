/**
 * 看板共享 UI 文案（命名空间 boards）单元测试
 *
 * 为什么单开一个文件：这些键是「三块看板共用的骨架文案」（是什么 / 怎么读 / 所以呢、
 * 三方监控、关联数据、关键名词、G 级对照表），既不属于某块看板的业务词典，
 * 也不会被 i18n.test.mjs 的「键结构对齐」以外的规则覆盖。
 *
 * 这里钉死三件事：
 *   1. 共享 UI 的键在 10 个语种里都存在且非空（缺一个语种，切换时整块会掉成键名）；
 *   2. 英文稿必须是真翻译——非空、且与简体中文不同（防止回填脚本把中文铺满全语种）；
 *   3. G 级对照表七档齐备，且 kpLevel() / moonInfo() 这类纯函数的双语取值真的生效。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ok, eq, length } from './harness.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const LOCALE_DIR = path.join(ROOT, 'src', 'i18n', 'locales')

const LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'th', 'mn', 'bo']

/** 含中文字符视为「未翻译」（英文稿里漏残留是最常见的事故） */
const HAS_CJK = /[一-鿿]/

function readNs(lang, ns) {
  return JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, lang, `${ns}.json`), 'utf8'))
}

/** 递归取叶子键路径 → 值的映射 */
function leaves(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) leaves(v, p, out)
    else out[p] = v
  }
  return out
}

/** 需要按语种核验的共享 UI 分组：dict（释义骨架）/ related（关联）/ keyTerm（关键名词）/ ui（杂项） */
const REQUIRED_GROUPS = ['dict', 'related', 'keyTerm', 'ui']

/** G 级对照表的七个档位键（+ 在 i18n 键里换成 p，与 ui.jsx 的 gScaleRows 保持一致） */
const G_LEVELS = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6p']

export default [
  [
    'boards 命名空间：共享 UI 分组在 10 个语种齐备且非空',
    () => {
      const base = readNs('zh-CN', 'boards')
      for (const g of REQUIRED_GROUPS) {
        ok(base[g] && Object.keys(base[g]).length > 0, `缺少分组 boards.${g}`)
      }
      const baseKeys = Object.keys(leaves(base))
      for (const lang of LANGS) {
        const j = readNs(lang, 'boards')
        for (const g of REQUIRED_GROUPS) {
          ok(j[g] && typeof j[g] === 'object', `${lang} 缺少 boards.${g}`)
        }
        const keys = leaves(j)
        const missing = baseKeys.filter((k) => keys[k] === undefined)
        eq(missing.join(','), '', `${lang} 缺失共享 UI 键`)
        for (const [k, v] of Object.entries(keys)) {
          ok(typeof v === 'string' && v.trim().length > 0, `${lang}.${k} 为空`)
        }
      }
    },
  ],
  [
    '英文稿是真翻译：非空、不带中文残留、且不等于简体中文',
    () => {
      const zh = leaves(readNs('zh-CN', 'boards'))
      const en = leaves(readNs('en', 'boards'))
      /* 量纲 / 单位 / 纯符号类允许与中文同形（如 G2 / Kp 5），这里只挑真正的文字键 */
      const skipSame = new Set(['ui.moonAria'])
      for (const [k, v] of Object.entries(zh)) {
        ok(en[k] !== undefined, `en 缺键 ${k}`)
        ok(typeof en[k] === 'string' && en[k].trim().length > 0, `en.${k} 为空`)
        ok(!HAS_CJK.test(en[k]), `en.${k} 残留中文：${en[k]}`)
        ok(en[k].length >= 2 || /[→·]/.test(en[k]), `en.${k} 文案过短疑似未翻译`)
        if (!skipSame.has(k)) ok(en[k] !== v, `en.${k} 与简体中文完全相同（疑似漏译）`)
      }
    },
  ],
  [
    'G 级对照表七档齐备（label + desc 双稿）',
    () => {
      for (const lang of LANGS) {
        const gs = readNs(lang, 'boards').gscale || {}
        length(Object.keys(gs), G_LEVELS.length, `${lang} 的 G 级档位数量`)
        for (const lv of G_LEVELS) {
          const item = gs[lv]
          ok(item && typeof item === 'object', `${lang} 缺 boards.gscale.${lv}`)
          ok(typeof item.label === 'string' && item.label.trim().length > 0, `${lang}.gscale.${lv}.label 为空`)
          ok(typeof item.desc === 'string' && item.desc.length > 10, `${lang}.gscale.${lv}.desc 过短`)
        }
      }
      /* 英文档位文案不得是中文，且与简体不同：这是「名单map + 回填」最容易翻车的地方 */
      const zhGs = readNs('zh-CN', 'boards').gscale
      const enGs = readNs('en', 'boards').gscale
      for (const lv of G_LEVELS) {
        ok(!HAS_CJK.test(enGs[lv].label), `en.gscale.${lv}.label 残留中文`)
        ok(!HAS_CJK.test(enGs[lv].desc), `en.gscale.${lv}.desc 残留中文`)
        ok(enGs[lv].label !== zhGs[lv].label, `en.gscale.${lv}.label 未翻译`)
      }
    },
  ],
  [
    'astro 观星指数因子文案（obsFactor）四键齐备且英文已翻译',
    () => {
      for (const lang of LANGS) {
        const f = readNs(lang, 'astro').obsFactor || {}
        for (const k of ['moon', 'dark', 'geo', 'noData']) {
          ok(typeof f[k] === 'string' && f[k].trim().length > 0, `${lang} 缺 astro.obsFactor.${k}`)
        }
      }
      /* 三个带插值的必须真的带参数，否则页面会渲染出 {pct} 字面量 */
      const en = readNs('en', 'astro').obsFactor
      ok(en.moon.includes('{pct}') && en.moon.includes('{phase}'), 'en.obsFactor.moon 缺插值占位符')
      ok(en.dark.includes('{hours}'), 'en.obsFactor.dark 缺插值占位符')
      ok(en.geo.includes('{kp}') && en.geo.includes('{level}'), 'en.obsFactor.geo 缺插值占位符')
      const zh = readNs('zh-CN', 'astro').obsFactor
      ok(!HAS_CJK.test(en.moon), 'en.obsFactor.moon 残留中文')
      ok(en.geo !== zh.geo, 'en.obsFactor.geo 未翻译')
    },
  ],
  [
    'kpLevel() 地磁等级：中英文双稿都生效，且等级/配色不随语种漂移',
    async () => {
      const { kpLevel } = await import('../../src/lib/astro/orbital.js')
      const cases = [
        [null, '-'],
        [1, 'G0'],
        [4.2, 'G1'],
        [5.5, 'G2'],
        [6.1, 'G3'],
        [7.4, 'G4'],
        [8.2, 'G5'],
        [9.3, 'G6+'],
      ]
      const colorOf = {}
      for (const [kp, expectLevel] of cases) {
        const zhInstance = kpLevel(kp)
        const enInstance = kpLevel(kp, 'en')
        eq(zhInstance.level, expectLevel, `Kp=${kp} 等级`)
        eq(enInstance.level, expectLevel, `Kp=${kp} 等级（英文）`)
        eq(enInstance.color, zhInstance.color, `Kp=${kp} 配色被语种影响`)
        ok(typeof zhInstance.label === 'string' && zhInstance.label.length > 0, `Kp=${kp} 中文标签为空`)
        ok(typeof enInstance.label === 'string' && enInstance.label.length > 0, `Kp=${kp} 英文标签为空`)
        if (expectLevel !== '-') {
          ok(!HAS_CJK.test(enInstance.label), `Kp=${kp} 英文标签残留中文：${enInstance.label}`)
          ok(!HAS_CJK.test(enInstance.desc), `Kp=${kp} 英文说明残留中文：${enInstance.desc}`)
        }
        colorOf[expectLevel] = zhInstance.color
      }
      /* 七档 G 级颜色互不相同：颜色是等级的唯一视觉标识，撞色等于白做分档 */
      eq(new Set(Object.values(colorOf)).size, cases.length, 'G 级配色出现重复')
    },
  ],
  [
    'moonInfo() 月相名称与距离档位支持双语',
    async () => {
      const { moonInfo } = await import('../../src/lib/astro/orbital.js')
      /* 2000-01-06 12:00 UTC 附近为新月后不久；固定日期让断言不随时间漂移 */
      const d = new Date(Date.UTC(2026, 0, 6, 12, 0, 0))
      const zh = moonInfo(d)
      const en = moonInfo(d, 'en')
      ok(typeof zh.phaseName === 'string' && zh.phaseName.length > 0, '中文月相名为空')
      ok(!HAS_CJK.test(en.phaseName), `英文月相名残留中文：${en.phaseName}`)
      ok(en.phaseName !== zh.phaseName, '英文月相名未翻译')
      ok(typeof en.distLabel === 'string' && en.distLabel.length > 0, '英文距离档位为空')
      /* 数值字段不受语种影响 */
      eq(en.phaseFraction, zh.phaseFraction, '月相比例被语种影响')
      eq(en.dist, zh.dist, '月地距被语种影响')
      /* 扫一圈朔望月，八相都要能吐出非空的英文名 */
      const seen = new Set()
      for (let i = 0; i < 30; i++) {
        const info = moonInfo(new Date(d.getTime() + i * 86400000), 'en')
        ok(typeof info.phaseName === 'string' && info.phaseName.length > 0, `第 ${i} 天月相名为空`)
        seen.add(info.phaseName)
      }
      ok(seen.size >= 8, `一个朔望月内应覆盖八个月相（实际 ${seen.size}）`)
    },
  ],
  [
    'astro/timeline 单位与看板标识键：10 语种齐备、英文已翻译、{n} 占位符保留',
    () => {
      // astro 侧：量纲 / 单位 / 银河事实值键，被 GalaxyFacts / CometTab / SkyTab 直接 t() 消费。
      const ASTRO_KEYS = ['gfArms', 'gfStarTotalVal', 'skyMaxAlt', 'unitBillionStars', 'unitDay', 'unitLy', 'unitYr']
      // timeline 侧：三看板轨道标识（天 / 地 / 海 → Sky / Earth / Sea），被 TrinityOrbit 直接消费。
      const TIMELINE_KEYS = ['orbitCharAstro', 'orbitCharGeo', 'orbitCharOcean']
      for (const lang of LANGS) {
        const a = readNs(lang, 'astro')
        const t = readNs(lang, 'timeline')
        for (const k of ASTRO_KEYS) {
          ok(typeof a[k] === 'string' && a[k].trim().length > 0, `${lang}.astro.${k} 缺失或为空`)
        }
        for (const k of TIMELINE_KEYS) {
          ok(typeof t[k] === 'string' && t[k].trim().length > 0, `${lang}.timeline.${k} 缺失或为空`)
        }
      }
      /* 英文稿质检：单位与看板标识是真正的翻译，不得残留中文或与简体同形
         （批量回填脚本最容易把中文铺满全语种而不报错） */
      const zhA = readNs('zh-CN', 'astro')
      const enA = readNs('en', 'astro')
      const zhT = readNs('zh-CN', 'timeline')
      const enT = readNs('en', 'timeline')
      for (const k of ASTRO_KEYS) {
        ok(!HAS_CJK.test(enA[k]), `en.astro.${k} 残留中文：${enA[k]}`)
        ok(enA[k] !== zhA[k], `en.astro.${k} 未翻译（与简体相同）`)
      }
      for (const k of TIMELINE_KEYS) {
        ok(!HAS_CJK.test(enT[k]), `en.timeline.${k} 残留中文：${enT[k]}`)
        ok(enT[k] !== zhT[k], `en.timeline.${k} 未翻译（与简体相同）`)
      }
      /* 带插值的键：{n} 占位符必须保留，否则页面会渲染出「条旋臂」而非「{n} 条旋臂」 */
      for (const lang of LANGS) {
        const a = readNs(lang, 'astro')
        ok(a.gfArms.includes('{n}'), `${lang}.astro.gfArms 丢失 {n} 占位符`)
        ok(a.skyMaxAlt.includes('{n}'), `${lang}.astro.skyMaxAlt 丢失 {n} 占位符`)
      }
    },
  ],
]
