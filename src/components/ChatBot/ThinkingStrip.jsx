/**
 * ThinkingStrip —— 「已完成思考 · 用时 X 秒」这条元信息 + 可展开的步骤流。
 *
 * 移植自 hc-apm-mobile-old 的思考态元信息条，去业务耦合、i18n 化：
 *   · 文案前缀/单位由调用方用 t() 传入，组件本身不写死任何语言；
 *   · 颜色全部走 --c-* 主题变量，亮/暗主题自动跟随；
 *   · 只有 >1 步才给折叠箭头（生成腿没有结构化步骤时不画箭头，避免"点开没东西"）。
 *
 * 数据来自 useMessage 在流式收口时写进助手消息的 { elapsedMs, steps }。
 */

import { useState } from 'react'
import './ThinkingStrip.scss'

const sec = (ms) => (Math.max(0, ms || 0) / 1000).toFixed(1)

/** 自绘线稿箭头：24 网格、圆头，与项目其它图标同笔触 */
function Caret({ open }) {
  return (
    <svg
      className={`cb-thinking__caret ${open ? 'is-open' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 5 L16 12 L9 19" />
    </svg>
  )
}

/**
 * @param {number} elapsedMs  端到端毫秒数（用户提交 → 答案落地）
 * @param {Array<{label:string, ms:number}>} [steps]  步骤流，>1 步才展开
 * @param {string} [prefixDone]  多步时的前缀，如 "已完成思考 · 用时 "
 * @param {string} [prefixPlain] 单步/无步时的前缀，如 "用时 "
 * @param {string} [unit]  时间单位，如 "秒"
 */
export default function ThinkingStrip({ elapsedMs, steps = [], prefixDone = '已完成思考 · 用时 ', prefixPlain = '用时 ', unit = '秒' }) {
  const [open, setOpen] = useState(false)

  if (elapsedMs == null) return null
  const expandable = steps.length > 1
  const prefix = expandable ? prefixDone : prefixPlain

  return (
    <div className="cb-thinking">
      <span
        className={`cb-thinking__head ${expandable ? 'is-clickable' : ''}`}
        role={expandable ? 'button' : undefined}
        tabIndex={expandable ? 0 : undefined}
        aria-label={expandable ? (open ? '收起思考过程' : '展开思考过程') : undefined}
        aria-expanded={expandable ? open : undefined}
        onClick={expandable ? () => setOpen((o) => !o) : undefined}
        onKeyDown={
          expandable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setOpen((o) => !o)
                }
              }
            : undefined
        }
      >
        <span>{`${prefix}${sec(elapsedMs)} ${unit}`}</span>
        {expandable && <Caret open={open} />}
      </span>
      {open && (
        <ul className="cb-thinking__steps">
          {steps.map((s, i) => (
            <li key={`${s.label}-${i}`}>
              <span className="cb-thinking__step-label">{s.label}</span>
              <em className="cb-thinking__step-ms">{`${sec(s.ms)} ${unit}`}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
