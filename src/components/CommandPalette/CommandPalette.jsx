import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './CommandPalette.scss'

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

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
function fuzzyScore(query, text) {
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
function matchCommand(query, command) {
  const labelScore = fuzzyScore(query, command?.label)
  const kwSource = Array.isArray(command?.keywords)
    ? command.keywords.join(' ')
    : command?.keywords || ''
  const kwScore = fuzzyScore(query, kwSource)
  const score = Math.max(labelScore, kwScore)
  return { matched: score > 0, score }
}

/**
 * CommandPalette —— Indigo 玻璃态命令面板
 *
 * 零外部依赖（仅 React）。通过 createPortal 挂载到 document.body。
 *
 * 功能：
 * - `Cmd/Ctrl + K` 全局唤起，再次按下可切换
 * - 模糊搜索（同时匹配 label 与 keywords，子串优先、按序字符兜底）
 * - `↑/↓` 键盘选择、`Enter` 执行、`ESC` 或点击遮罩关闭
 * - 按 `group` 分组展示，空查询时保留传入顺序
 * - 空状态友好提示、底部快捷键说明与结果计数
 *
 * @param {object} props
 * @param {Array<{id:string,label:string,group?:string,icon?:*,keywords?:(string|string[]),action?:function}>} props.commands
 *        命令列表。每项：`id` 唯一标识；`label` 显示名；`group` 分组名（缺省归「其他」）；
 *        `icon` 任意可渲染内容（emoji / 字符 / JSX）；`keywords` 字符串或字符串数组，参与模糊匹配；
 *        `action(command)` 回调，回车或点击时触发。
 * @param {string} [props.placeholder='搜索命令…'] 搜索框占位符
 * @param {function} [props.onClose] 面板关闭后回调（不传则忽略）
 */
export default function CommandPalette({
  commands = [],
  placeholder = '搜索命令…',
  onClose,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // 用 ref 保存最新的 onClose，避免键盘 effect 因回调引用变化频繁重建
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // 全局 Cmd/Ctrl + K 唤起 / 切换
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 关闭面板的统一收口：重置查询与选中项，下次打开即全新状态
  // （避免在 effect 中同步 setState 触发级联渲染；onClose 调用留在事件/effect 中）
  const closePalette = () => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }

  // 打开时聚焦输入框（状态已在关闭时重置）
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  // 过滤 + 评分排序
  const filtered = useMemo(() => {
    return commands
      .map((cmd) => {
        const { matched, score } = matchCommand(query, cmd)
        return matched ? { cmd, score } : null
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.cmd)
  }, [commands, query])

  // 分组（保持过滤后的相对顺序，按首次出现的 group 聚合，并记录全局索引）
  const grouped = useMemo(() => {
    const groups = []
    const map = new Map()
    filtered.forEach((cmd, i) => {
      const g = cmd.group || '其他'
      if (!map.has(g)) {
        const item = { group: g, items: [] }
        map.set(g, item)
        groups.push(item)
      }
      map.get(g).items.push({ cmd, i })
    })
    return groups
  }, [filtered])

  // activeIndex 越界时在渲染期钳制（过滤结果变少时保持最近的有效项）
  const activeIdx = filtered.length ? Math.min(activeIndex, filtered.length - 1) : 0

  // 面板内键盘交互：ESC / ↑↓ / Enter（全局监听，焦点无关）
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closePalette()
        onCloseRef.current?.()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(filtered.length ? (activeIdx + 1) % filtered.length : 0)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(filtered.length ? (activeIdx - 1 + filtered.length) % filtered.length : 0)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const target = filtered[activeIdx]
        if (target) {
          closePalette()
          onCloseRef.current?.()
          target.action?.(target)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, activeIdx])

  // 滚动 active 项到可见区
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx, open, query])

  if (!open) return null

  return createPortal(
    <div
      className="cp-overlay"
      onMouseDown={() => {
        closePalette()
        onCloseRef.current?.()
      }}
    >
      <div
        className="cp-panel"
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cp-search">
          <span className="cp-search-icon">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            className="cp-input"
            type="text"
            value={query}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            autoComplete="off"
            spellCheck={false}
            aria-label="搜索命令"
          />
          <kbd className="cp-kbd">ESC</kbd>
        </div>

        <div className="cp-list" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-icon">⌘</div>
              <div className="cp-empty-text">没有匹配的命令</div>
              <div className="cp-empty-hint">试试更换关键词，或清空搜索查看全部命令</div>
            </div>
          ) : (
            grouped.map((group) => (
              <div className="cp-group" key={group.group}>
                <div className="cp-group-title">{group.group}</div>
                {group.items.map(({ cmd, i }) => {
                  const active = i === activeIdx
                  return (
                    <button
                      type="button"
                      key={cmd.id}
                      data-active={active}
                      className={`cp-item${active ? ' active' : ''}`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => {
                        closePalette()
                        onCloseRef.current?.()
                        cmd.action?.(cmd)
                      }}
                    >
                      <span className="cp-item-icon">{cmd.icon ?? '·'}</span>
                      <span className="cp-item-label">{cmd.label}</span>
                      {cmd.keywords && (
                        <span className="cp-item-kw">
                          {Array.isArray(cmd.keywords)
                            ? cmd.keywords[0]
                            : cmd.keywords}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="cp-footer">
          <span className="cp-tip">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            选择
          </span>
          <span className="cp-tip">
            <kbd>↵</kbd>
            执行
          </span>
          <span className="cp-tip">
            <kbd>ESC</kbd>
            关闭
          </span>
          <span className="cp-spacer" />
          <span className="cp-count">{filtered.length} 条结果</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
