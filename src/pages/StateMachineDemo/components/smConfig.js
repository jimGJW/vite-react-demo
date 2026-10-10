import { createMachine } from "../../../components/StateMachine/machine.js"
export const TICKET = createMachine({
  initial: 'draft',
  states: {
    draft: { label: '草稿', desc: '刚创建，可反复编辑', on: { SUBMIT: 'reviewing' } },
    reviewing: { label: '审核中', desc: '等待审批人处理', on: { APPROVE: 'approved', REJECT: 'rejected' } },
    approved: { label: '已通过', desc: '审批通过，可归档', on: { ARCHIVE: 'archived', REVOKE: 'reviewing' } },
    rejected: { label: '已驳回', desc: '需修改后重新提交', on: { REEDIT: 'draft' } },
    archived: { label: '已归档', desc: '流程终点', on: {} },
  },
})

export const EVENT_LABEL = {
  SUBMIT: '提交审核',
  APPROVE: '审批通过',
  REJECT: '驳回',
  ARCHIVE: '归档',
  REVOKE: '撤回归档',
  REEDIT: '重新编辑',
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
