/** 开源模板库数据完整性单测 */
import { TEMPLATES, GROUPS, FRAMEWORK_COLOR } from '../../src/components/Templates/templates.js'
import { eq, ok } from './harness.mjs'

const VALID_GROUPS = GROUPS.map((g) => g.key).filter((k) => k !== 'all')

export default [
  ['模板数量与唯一 id', () => {
    eq(TEMPLATES.length, 19, '共 19 个模板')
    const ids = new Set(TEMPLATES.map((t) => t.id))
    eq(ids.size, TEMPLATES.length, 'id 不重复')
  }],
  ['每条模板必填字段齐全', () => {
    TEMPLATES.forEach((t) => {
      ok(t.id && t.name, `${t.id} 缺 name`)
      ok(t.framework, `${t.id} 缺 framework`)
      ok(t.category, `${t.id} 缺 category`)
      ok(t.desc, `${t.id} 缺 desc`)
      ok(Array.isArray(t.features) && t.features.length > 0, `${t.id} 缺 features`)
      ok(Array.isArray(t.tags) && t.tags.length > 0, `${t.id} 缺 tags`)
    })
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
