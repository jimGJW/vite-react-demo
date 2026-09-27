/**
 * 状态机与时间旅行 · 纯函数单测（零依赖）
 * 覆盖 src/components/StateMachine/machine.js。
 */
import {
  createMachine, createHistory, commit, undo, redo,
  current, canUndo, canRedo, jumpTo,
} from '../../src/components/StateMachine/machine.js'
import { eq, ok, deepEq, length as len } from './harness.mjs'

const M = createMachine({
  initial: 'draft',
  states: {
    draft: { label: '草稿', on: { SUBMIT: 'reviewing' } },
    reviewing: { label: '审核中', on: { APPROVE: 'approved', REJECT: 'rejected' } },
    approved: { label: '已通过', on: { ARCHIVE: 'archived' } },
    rejected: { label: '已驳回', on: { REEDIT: 'draft' } },
    archived: { label: '已归档', on: {} },
  },
})

export default [
  /* ---------- 合法流转 ---------- */
  ['transition 合法流转返回目标状态', () => {
    const r = M.transition('draft', 'SUBMIT')
    eq(r.ok, true)
    eq(r.to, 'reviewing')
    eq(r.reason, '')
  }],
  ['transition 走完一条完整链路', () => {
    let s = 'draft'
    s = M.transition(s, 'SUBMIT').to
    eq(s, 'reviewing')
    s = M.transition(s, 'APPROVE').to
    eq(s, 'approved')
    s = M.transition(s, 'ARCHIVE').to
    eq(s, 'archived')
  }],

  /* ---------- 非法流转 ---------- */
  ['transition 非法流转被拦下且状态不变', () => {
    const r = M.transition('draft', 'APPROVE')
    eq(r.ok, false)
    eq(r.to, 'draft', '非法流转不能改变当前状态')
    ok(r.reason.length > 0, '必须给出可读的拒绝原因')
  }],
  ['transition 拒绝原因带上中文状态名', () => {
    const r = M.transition('draft', 'APPROVE')
    ok(r.reason.includes('草稿'), 'reason 里应出现状态 label')
    ok(r.reason.includes('APPROVE'))
  }],
  ['transition 终态没有可触发事件', () => {
    eq(M.transition('archived', 'SUBMIT').ok, false)
    len(M.eventsOf('archived'), 0)
  }],
  ['transition 未知状态返回失败', () => {
    const r = M.transition('nope', 'SUBMIT')
    eq(r.ok, false)
    ok(r.reason.includes('未知状态'))
  }],
  ['next 指向未声明的状态视为配置错误', () => {
    const broken = createMachine({
      initial: 'a',
      states: { a: { label: 'A', on: { GO: 'missing' } } },
    })
    eq(broken.next('a', 'GO'), null, '目标状态不存在时应返回 null')
    eq(broken.transition('a', 'GO').ok, false)
  }],

  /* ---------- 查询接口 ---------- */
  ['can / next 一致', () => {
    eq(M.can('draft', 'SUBMIT'), true)
    eq(M.can('draft', 'APPROVE'), false)
    eq(M.next('reviewing', 'REJECT'), 'rejected')
    eq(M.next('reviewing', 'ARCHIVE'), null)
  }],
  ['eventsOf 列出可触发事件', () => {
    deepEq(M.eventsOf('reviewing'), ['APPROVE', 'REJECT'])
    deepEq(M.eventsOf('archived'), [])
    deepEq(M.eventsOf('unknown-state'), [])
  }],
  ['metaOf / keys', () => {
    eq(M.metaOf('draft').label, '草稿')
    eq(M.metaOf('nope'), null)
    len(M.keys(), 5)
  }],
  ['createMachine 缺省参数不崩', () => {
    const empty = createMachine()
    eq(empty.initial, '')
    len(empty.keys(), 0)
    eq(empty.transition('x', 'Y').ok, false)
  }],

  /* ---------- 时间旅行 ---------- */
  ['createHistory 初始栈', () => {
    const h = createHistory('draft')
    len(h.entries, 1)
    eq(h.cursor, 0)
    eq(current(h), 'draft')
    eq(canUndo(h), false)
    eq(canRedo(h), false)
  }],
  ['commit 追加并推进游标', () => {
    const h = commit(createHistory('draft'), 'reviewing')
    len(h.entries, 2)
    eq(h.cursor, 1)
    eq(current(h), 'reviewing')
    eq(canUndo(h), true)
    eq(canRedo(h), false)
  }],
  ['undo / redo 在范围内移动游标', () => {
    let h = createHistory('draft')
    h = commit(h, 'reviewing')
    h = commit(h, 'approved')
    eq(current(h), 'approved')

    h = undo(h)
    eq(current(h), 'reviewing')
    h = undo(h)
    eq(current(h), 'draft')
    eq(canUndo(h), false)

    h = redo(h)
    eq(current(h), 'reviewing')
    h = redo(h)
    eq(current(h), 'approved')
    eq(canRedo(h), false)
  }],
  ['undo / redo 越界时原样返回', () => {
    const h = createHistory('draft')
    eq(undo(h), h, '栈底再撤销应返回同一对象')
    eq(redo(h), h, '栈顶再重做应返回同一对象')
  }],
  ['commit 会丢弃 redo 分支（撤销栈标准行为）', () => {
    let h = createHistory('draft')
    h = commit(h, 'reviewing')
    h = commit(h, 'approved')
    h = undo(h)                       // 回到 reviewing，approved 成为可重做分支
    eq(current(h), 'reviewing')
    eq(canRedo(h), true)

    h = commit(h, 'rejected')         // 新操作应丢弃 approved 这条 redo 分支
    len(h.entries, 3, '截断后追加一项，总长应为 3')
    eq(h.entries[2], 'rejected')
    ok(!h.entries.includes('approved'), '可重做的 approved 分支必须被丢弃')
    eq(canRedo(h), false, 'redo 分支已被丢弃')
  }],
  ['jumpTo 跳到任意下标', () => {
    let h = createHistory('draft')
    h = commit(h, 'reviewing')
    h = commit(h, 'approved')

    eq(current(jumpTo(h, 0)), 'draft')
    eq(current(jumpTo(h, 2)), 'approved')
  }],
  ['jumpTo 越界被夹住', () => {
    let h = createHistory('draft')
    h = commit(h, 'reviewing')

    eq(jumpTo(h, 99).cursor, 1, '上界夹住')
    eq(jumpTo(h, -5).cursor, 0, '下界夹住')
  }],
  ['history 操作不修改原对象（保持不可变）', () => {
    const h = createHistory('draft')
    const h2 = commit(h, 'reviewing')
    len(h.entries, 1, '原对象不应被改动')
    len(h2.entries, 2)
  }],
]
