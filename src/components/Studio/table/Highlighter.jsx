import { splitByKeyword } from './highlight.js'

/**
 * 关键词高亮：把命中关键词的文本片段用 <mark> 包裹。
 * 来自某中台项目的列内搜索高亮思路，去掉组件库依赖重写。
 */
export default function Highlighter({ text, keyword, className }) {
  const parts = splitByKeyword(text, keyword)
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="st-hl">{p.text}</mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  )
}
