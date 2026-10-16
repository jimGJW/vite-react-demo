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
