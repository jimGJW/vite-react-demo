/** 开源模板库数据完整性单测 */
import { TEMPLATES, GROUPS, FRAMEWORK_COLOR } from '../../src/components/Templates/templates.js'
import { pickText } from '../../src/i18n/translate.mjs'
import { eq, ok } from './harness.mjs'

const VALID_GROUPS = GROUPS.map((g) => g.key).filter((k) => k !== 'all')
const HAS_CJK = /[一-鿿]/

/** 校验一个双语字段：{zh-CN, en} 双稿、英文非空、无中文残留；
 * 仅在简体含中文时才要求英译文与简体不同（antd/umi/vite 等专有名词缩写中英同形属正常） */
function assertBilingual(field, where, lang = 'en') {
  ok(field && typeof field === 'object', `${where} 未改为双语对象`)
  ok(typeof field['zh-CN'] === 'string' && field['zh-CN'].length > 0, `${where} 缺 zh-CN`)
  ok(typeof field[lang] === 'string' && field[lang].length > 0, `${where} 缺 ${lang} 稿`)
  ok(!HAS_CJK.test(field[lang]), `${where} ${lang} 稿残留中文`)
  if (HAS_CJK.test(field['zh-CN'])) {
    ok(field[lang] !== field['zh-CN'], `${where} ${lang} 稿未翻译（与简体相同）`)
  }
}

export default [
  ['模板数量与唯一 id', () => {
    eq(TEMPLATES.length, 19, '共 19 个模板')
    const ids = new Set(TEMPLATES.map((t) => t.id))
    eq(ids.size, TEMPLATES.length, 'id 不重复')
  }],
  ['每条模板必填字段齐全（含双语结构）', () => {
    TEMPLATES.forEach((t) => {
      ok(t.id && t.name, `${t.id} 缺 name`)
      ok(t.framework, `${t.id} 缺 framework`)
      assertBilingual(t.category, `${t.id}.category`)
      assertBilingual(t.desc, `${t.id}.desc`)
      ok(Array.isArray(t.features) && t.features.length > 0, `${t.id} 缺 features`)
      ok(Array.isArray(t.tags) && t.tags.length > 0, `${t.id} 缺 tags`)
      t.features.forEach((f, i) => assertBilingual(f, `${t.id}.features[${i}]`))
      t.tags.forEach((tg, i) => assertBilingual(tg, `${t.id}.tags[${i}]`))
    })
  }],
  ['双语取值：pickText 默认落 zh-CN，en 取英译文', () => {
    const first = TEMPLATES[0]
    eq(pickText(first.category), first.category['zh-CN'], 'pickText 默认落简体')
    eq(pickText(first.category, 'en'), first.category.en, 'pickText(en) 取英译文')
    eq(pickText(first.desc, 'de'), first.desc.en, '德语缺失时回退英文')
  }],
  ['group 均为已定义分组', () => {
    TEMPLATES.forEach((t) => {
      ok(VALID_GROUPS.includes(t.group), `${t.id} 的 group ${t.group} 未定义`)
    })
  }],
  ['framework 均有对应主题色', () => {
    TEMPLATES.forEach((t) => {
      ok(FRAMEWORK_COLOR[t.framework], `${t.id} 的 framework ${t.framework} 无配色`)
    })
  }],
  ['upstream 为 null 或 https 链接', () => {
    TEMPLATES.forEach((t) => {
      if (t.upstream == null) return
      ok(t.upstream.startsWith('https://'), `${t.id} 的 upstream 非 https`)
    })
  }],
  ['无内部仓库地址残留（去敏）', () => {
    const all = JSON.stringify(TEMPLATES)
    ok(!/github\.build|gitlab\.apps|hc-apm|hcdigital/i.test(all), '应无内部仓库/项目代号')
  }],
  ['分组计数与实际一致', () => {
    VALID_GROUPS.forEach((g) => {
      const n = TEMPLATES.filter((t) => t.group === g).length
      ok(n > 0, `分组 ${g} 不应为空`)
    })
    const sum = VALID_GROUPS.reduce((n, g) => n + TEMPLATES.filter((t) => t.group === g).length, 0)
    eq(sum, TEMPLATES.length, '各分组之和应等于总数')
  }],
]
