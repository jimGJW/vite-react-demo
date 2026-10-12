/**
 * KeyTermCard —— 案例页「📌 关键名词」卡。
 * 把一个具体名词从词典里取出来，用一句话告诉读者「它是什么 / 量级 / 怎么读」，
 * 让案例里的数字不再悬浮。内容统一来自 lib/boards/relations.js 的 getTerm，
 * 和「数据词典」（/timeline 的 GlossaryHub）是同一份释义，单一真源。
 *
 * 用法：
 *   import { getTerm } from '../../lib/boards/relations.js'
 *   <KeyTermCard term={getTerm('earth', 'depth')} />
 */

import './KeyTermCard.scss'

export default function KeyTermCard({ term, theme = 'dark' }) {
  if (!term) return null
  const isDark = theme !== 'light'
  return (
    <aside className={`kterm${isDark ? '' : ' light'}`}>
      <div className="kterm__h">
        <span className="kterm__pin" aria-hidden>📌</span>
        <span className="kterm__name">{term.zh}</span>
        {term.unit ? <span className="kterm__unit">{term.unit}</span> : null}
        <span className="kterm__tag">关键名词</span>
      </div>

      {term.what ? <p className="kterm__what">{term.what}</p> : null}

      <div className="kterm__rows">
        {term.scale ? (
          <div className="kterm__row">
            <span className="kterm__row-h">量级</span>
            <span className="kterm__row-b">{term.scale}</span>
          </div>
        ) : null}
        {term.soWhat ? (
          <div className="kterm__row">
            <span className="kterm__row-h">怎么读</span>
            <span className="kterm__row-b">{term.soWhat}</span>
          </div>
        ) : null}
      </div>

      <p className="kterm__foot">完整释义与检索见侧边「时空档案」→ 数据词典</p>
    </aside>
  )
}
