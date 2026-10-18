import { createMachine } from "@components/StateMachine/machine.js"
export const TICKET = createMachine({
  initial: 'draft',
  states: {
    draft: { label: { 'zh-CN': '草稿', en: 'Draft' }, desc: { 'zh-CN': '刚创建，可反复编辑', en: 'Just created, editable repeatedly' }, on: { SUBMIT: 'reviewing' } },
    reviewing: { label: { 'zh-CN': '审核中', en: 'Reviewing' }, desc: { 'zh-CN': '等待审批人处理', en: 'Waiting for approver' }, on: { APPROVE: 'approved', REJECT: 'rejected' } },
    approved: { label: { 'zh-CN': '已通过', en: 'Approved' }, desc: { 'zh-CN': '审批通过，可归档', en: 'Approved, ready to archive' }, on: { ARCHIVE: 'archived', REVOKE: 'reviewing' } },
    rejected: { label: { 'zh-CN': '已驳回', en: 'Rejected' }, desc: { 'zh-CN': '需修改后重新提交', en: 'Needs revision then resubmit' }, on: { REEDIT: 'draft' } },
    archived: { label: { 'zh-CN': '已归档', en: 'Archived' }, desc: { 'zh-CN': '流程终点', en: 'End of flow' }, on: {} },
  },
})

export const EVENT_LABEL = {
  SUBMIT: { 'zh-CN': '提交审核', en: 'Submit for review' },
  APPROVE: { 'zh-CN': '审批通过', en: 'Approve' },
  REJECT: { 'zh-CN': '驳回', en: 'Reject' },
  ARCHIVE: { 'zh-CN': '归档', en: 'Archive' },
  REVOKE: { 'zh-CN': '撤回归档', en: 'Revoke archive' },
  REEDIT: { 'zh-CN': '重新编辑', en: 'Re-edit' },
}
export const ALL_EVENTS = Object.keys(EVENT_LABEL)

/* 状态图坐标：viewBox 560×190，节点 96×34 */
export const NODES = {
  draft: { x: 8, y: 78 },
  reviewing: { x: 152, y: 78 },
  approved: { x: 300, y: 24 },
  rejected: { x: 300, y: 132 },
  archived: { x: 452, y: 24 },
}
export const NW = 96
