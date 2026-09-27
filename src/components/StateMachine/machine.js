/* =====================================================================
   有限状态机 + 时间旅行历史（零依赖纯函数）

   把「状态流转规则」从组件里抽出来，好处有三：
     · 规则集中声明，非法流转在 transition 里就被拦掉，不用到处写 if；
     · 纯函数，可以直接用 node 跑断言（见 tests/unit/machine.test.mjs）；
     · 配合 history 的 undo/redo，免费得到「时间旅行」能力。
   ===================================================================== */

/**
 * 建一个状态机。
 *
 * @param {object} config
 * @param {string} config.initial 初始状态 id
 * @param {object} config.states  { [id]: { label, desc?, on: { 事件: 目标状态 } } }
 * @returns 状态机对象
 *
 * @example
 *   const m = createMachine({
 *     initial: 'draft',
 *     states: {
 *       draft:     { label: '草稿', on: { SUBMIT: 'reviewing' } },
 *       reviewing: { label: '审核中', on: { APPROVE: 'done', REJECT: 'draft' } },
 *       done:      { label: '已完成', on: {} },
 *     },
 *   })
 *   m.transition('draft', 'SUBMIT')     // → { ok: true, to: 'reviewing' }
 *   m.transition('draft', 'APPROVE')    // → { ok: false, to: 'draft', reason: '…' }
 */
export function createMachine(config = {}) {
  const { initial = '', states = {} } = config

  const labelOf = (id) => {
    const node = states[id]
    return (node && node.label) || id
  }

  /** 查目标状态；事件不合法 / 目标不存在都返回 null */
  const nextOf = (from, event) => {
    const node = states[from]
    if (!node || !node.on) return null
    const to = node.on[event]
    if (typeof to !== 'string') return null
    if (!states[to]) return null          // 指向了未声明的状态，视为配置错误
    return to
  }

  return {
    initial,
    states,

    /** 该状态下能否触发这个事件 */
    can: (from, event) => nextOf(from, event) !== null,

    /** 触发后的目标状态；非法流转返回 null */
    next: nextOf,

    /** 该状态下所有可触发的事件 */
    eventsOf: (from) => {
      const node = states[from]
      return node && node.on ? Object.keys(node.on) : []
    },

    /** 状态元信息（label / desc / on） */
    metaOf: (id) => states[id] || null,

    /** 所有状态 id */
    keys: () => Object.keys(states),

    /**
     * 执行一次流转，永远返回结构化结果 —— 调用方不必判空。
     * @returns {{ ok: boolean, to: string, reason: string }}
     */
    transition: (from, event) => {
      if (!states[from]) {
        return { ok: false, to: from, reason: `未知状态：${from}` }
      }
      const to = nextOf(from, event)
      if (!to) {
        return {
          ok: false,
          to: from,
          reason: `「${labelOf(from)}」状态下不能触发「${event}」`,
        }
      }
      return { ok: true, to, reason: '' }
    },
  }
}

/* ==================== 时间旅行历史 ==================== */

/**
 * 初始历史栈。
 * @param {*} initial 首个条目
 */
export function createHistory(initial) {
  return { entries: [initial], cursor: 0 }
}

/**
 * 提交一个新条目。
 * 若当前不在末尾（即刚撤销过），会丢弃后面的 redo 分支 ——
 * 这是所有撤销栈的标准行为：新操作会让「重做」失效。
 */
export function commit(history, entry) {
  const entries = history.entries.slice(0, history.cursor + 1)
  entries.push(entry)
  return { entries, cursor: entries.length - 1 }
}

export function undo(history) {
  if (history.cursor <= 0) return history
  return { entries: history.entries, cursor: history.cursor - 1 }
}

export function redo(history) {
  if (history.cursor >= history.entries.length - 1) return history
  return { entries: history.entries, cursor: history.cursor + 1 }
}

/** 当前条目 */
export function current(history) {
  return history.entries[history.cursor]
}

export const canUndo = (history) => history.cursor > 0
export const canRedo = (history) => history.cursor < history.entries.length - 1

/**
 * 跳到指定下标（时间旅行条拖动用）。
 * 越界会被夹住，不会把 cursor 拉出数组范围。
 */
export function jumpTo(history, index) {
  const max = history.entries.length - 1
  const i = Math.max(0, Math.min(max, Math.floor(index)))
  return { entries: history.entries, cursor: i }
}
