/* =====================================================================
 * 命令面板（Vue 3 版本，与 @myorg/react-ui-basic 的 CommandPalette 一一对应）
 * 模糊匹配算法为纯函数，单独抽出便于复用与测试。
 * ===================================================================== */

/**
 * 对单段文本做模糊匹配评分。
 * - 空查询返回 1（视为全部匹配，保持原始顺序）
 * - 子串命中：高分，越靠前分越高
 * - 字符按顺序出现：累加连续奖励分（fuzzy 兜底）
 * - 完全不匹配返回 0
 * @param {string} query
 * @param {string} text
 * @returns {number}
 */
export function fuzzyScore(query, text) {
  if (!query) return 1
  const q = String(query).toLowerCase().trim()
  const t = String(text || '').toLowerCase()
  if (!q) return 1
  if (!t) return 0

  const at = t.indexOf(q)
  if (at !== -1) return 1000 - at // 子串命中，越靠前分越高

  let qi = 0
  let score = 0
  let consecutive = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t[ti] === q[qi]) {
      qi += 1
      consecutive += 1
      score += consecutive * 3
    } else {
      consecutive = 0
    }
  }
  return qi === q.length ? score : 0
}

/**
 * 用查询同时匹配 label 与 keywords，取最高分。
 * @param {string} query
 * @param {{label?:string, keywords?:(string|string[])}} command
 * @returns {{matched:boolean, score:number}}
 */
export function matchCommand(query, command) {
  const labelScore = fuzzyScore(query, command?.label)
  const kwSource = Array.isArray(command?.keywords)
    ? command.keywords.join(' ')
    : command?.keywords || ''
  const kwScore = fuzzyScore(query, kwSource)
  const score = Math.max(labelScore, kwScore)
  return { matched: score > 0, score }
}
