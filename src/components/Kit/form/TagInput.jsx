import { useRef, useState } from 'react'
import { Tag } from 'antd'

/**
 * TagInput · 标签输入
 * =====================================================================
 * 移植自 旧移动端项目 `components/TagInput`。这份实现的「输入分词」逻辑
 * 是该组件最大的价值点，原样保留：
 *   - 空格 / 回车 / 逗号（中英文都认）都能提交当前词
 *   - 输入框为空时按退格删除最后一个标签
 *   - 粘贴 "a, b c" 这类文本会一次性拆成多个标签
 *
 * 补充的边界处理：
 *   1. 空格提交时若输入框为空则不拦截 —— 否则用户永远打不出带空格的词
 *   2. 去重、上限（max）在同一个函数里收敛，避免多处判断不一致
 *
 * 用法：
 *   const [tags, setTags] = useState(['巡检', '保养'])
 *   <TagInput value={tags} onChange={setTags} max={8} />
 */

export default function TagInput({
  value = [],
  onChange,
  placeholder = '输入后回车添加',
  max,
  disabled = false,
  allowDuplicates = false,
  className = '',
}) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const commit = (raw) => {
    const names = String(raw)
      .split(/[\s,，]+/)
      .map((name) => name.trim())
      .filter(Boolean)
    if (!names.length) {
      setInput('')
      return
    }
    const next = value.slice()
    names.forEach((name) => {
      if (!allowDuplicates && next.includes(name)) return
      if (max != null && next.length >= max) return
      next.push(name)
    })
    setInput('')
    if (next.length !== value.length) onChange?.(next)
  }

  const removeTag = (tag) => onChange?.(value.filter((item) => item !== tag))

  const handleKeyDown = (event) => {
    const isSeparator = event.key === 'Enter' || event.key === ',' || event.key === ' '
    if (isSeparator) {
      // 空输入时按空格不拦截，否则标签里永远无法包含空格
      if (event.key === ' ' && !input) return
      event.preventDefault()
      commit(input)
      return
    }
    if (event.key === 'Backspace' && !input && value.length) {
      onChange?.(value.slice(0, -1))
    }
  }

  const handlePaste = (event) => {
    const text = event.clipboardData?.getData('text') || ''
    if (!/[\s,，]/.test(text)) return // 单个词走默认流程即可
    event.preventDefault()
    commit(text)
  }

  const reachMax = max != null && value.length >= max

  return (
    <div
      className={`kit-taginput ${focused ? 'is-focused' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      onClick={() => !disabled && inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Tag
          key={tag}
          closable={!disabled}
          onClose={(event) => {
            event.preventDefault()
            removeTag(tag)
          }}
        >
          {tag}
        </Tag>
      ))}

      {!disabled && !reachMax && (
        <input
          ref={inputRef}
          className="kit-taginput__field"
          value={input}
          placeholder={value.length ? '' : placeholder}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            if (input) commit(input)
          }}
        />
      )}

      {max != null && (
        <span className="kit-hint" style={{ marginLeft: 'auto' }}>
          {value.length}/{max}
        </span>
      )}
    </div>
  )
}
