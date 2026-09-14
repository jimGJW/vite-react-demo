/**
 * 按关键词把字符串拆分为命中 / 未命中片段，供 <Highlighter> 渲染高亮。
 * 不依赖任何框架，纯函数。
 */
export function splitByKeyword(text, keyword) {
  const str = String(text ?? '')
  if (!keyword) return [{ text: str, hit: false }]
  const lower = str.toLowerCase()
  const kw = keyword.toLowerCase()
  const parts = []
  let i = 0
  while (i < str.length) {
    const idx = lower.indexOf(kw, i)
    if (idx === -1) {
      parts.push({ text: str.slice(i), hit: false })
      break
    }
    if (idx > i) parts.push({ text: str.slice(i, idx), hit: false })
    parts.push({ text: str.slice(idx, idx + kw.length), hit: true })
    i = idx + kw.length
  }
  return parts
}
