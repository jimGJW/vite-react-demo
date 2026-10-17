/**
 * i18n 纯函数 —— 不依赖 React / Vite，可被 node 单测与浏览器端共用。
 *
 * 与 index.js 的分工：这里只放「按键路径取文案」的逻辑（含兜底语义），
 * index.js 负责语种元数据、Context 与 Hook。
 */

/** 源语言：任何语种缺键时回退到它；也作为 translate 的兜底查找对象 */
export const DEFAULT_LANG = 'zh-CN'

/**
 * 按 'ns.key.sub' 路径取纯文案；vars 做 {name} 占位符替换；fallback 兜底缺失键。
 * 数据类调用方（如创意 demo 目录）传第三参，键没翻译时退回数据自带的原文。
 *
 * @param {Record<string, object>} messages lang → { ns → 文案对象 }
 * @param {string} lang 目标语种
 * @param {string} key  键路径，如 'nav.home'
 * @param {Record<string, unknown>} [vars] 插值变量
 * @param {string} [fallback] 键缺失时的兜底文案（不传则返回键本身，便于开发期发现漏译）
 */
export function translate(messages, lang, key, vars, fallback) {
  const dict = messages[lang] || messages[DEFAULT_LANG]
  const raw = pick(dict, key) ?? pick(messages[DEFAULT_LANG], key)
  if (typeof raw !== 'string') return fallback !== undefined ? fallback : key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined ? m : String(vars[name])))
}

function pick(obj, path) {
  if (!obj || !path) return undefined
  return path.split('.').reduce((acc, seg) => (acc === undefined || acc === null ? undefined : acc[seg]), obj)
}

/**
 * 取「按语种分键」数据对象里的当前语种值，缺语种落简体。
 * 数据模块（词典 / 关联表 / 模板库…）的文案字段统一为 { '<lang>': text }，消费方这样取：
 *   pickLang(entry.name, lang)
 */
export function pickLang(obj, lang) {
  if (!obj || typeof obj !== 'object') return ''
  return obj[lang] || obj[DEFAULT_LANG] || ''
}

/**
 * 数据模块（术语词典 / 关联表 / 模板库…）文案字段取值。
 *
 * 与 pickLang 的差别：数据词典只维护 zh-CN + en 两稿（其余语种按「语族」兜底），
 * 所以兜底链是：本语种 → 中文族回简体 → 英文 → 简体。
 * 直接用 pickLang 会让德语用户看到简体中文（缺 de 键时落 zh-CN），这里修正为落英文。
 *
 * 同时容忍「尚未改造的字段仍是字符串」——数据模块是分批迁移的，不能一改全炸。
 *
 * @param {string|Record<string,string>} field 文案字段（字符串或 {lang:text}）
 * @param {string} lang 目标语种
 * @returns {string}
 */
export function pickText(field, lang = 'zh-CN') {
  if (typeof field === 'string') return field
  if (!field || typeof field !== 'object') return ''
  if (field[lang]) return field[lang]
  if (typeof lang === 'string' && lang.startsWith('zh')) return field['zh-CN'] || field.en || ''
  return field.en || field['zh-CN'] || ''
}

/** 数据模块里可能被多语化的字段名（localize 只处理这些，数值/颜色/枚举码原样保留） */
export const DATA_TEXT_KEYS = [
  'zh', 'desc', 'advice', 'unit', 'what', 'scale', 'soWhat',
  'title', 'label', 'alias', 'scope', 'why', 'detail', 'name', 'period', 'region',
]

/**
 * 把一条词典条目的文案字段就地解析成当前语种的字符串，其余字段原样透传。
 * 取值函数统一走它，调用方拿到的永远是「可直接渲染的字符串」而不是 {lang:text} 对象
 * ——否则 React 会抛 "Objects are not valid as a React child"。
 *
 * @template T
 * @param {T} item 词典条目
 * @param {string} [lang] 目标语种，缺省 zh-CN（未改造的消费方因此不受影响）
 * @param {string[]} [keys] 需要解析的字段，缺省 DATA_TEXT_KEYS
 * @returns {T} 浅拷贝，文案字段已解析
 */
export function localize(item, lang, keys = DATA_TEXT_KEYS) {
  if (!item || typeof item !== 'object') return item
  const out = { ...item }
  for (const k of keys) {
    if (out[k] !== undefined) out[k] = pickText(out[k], lang)
  }
  return out
}
