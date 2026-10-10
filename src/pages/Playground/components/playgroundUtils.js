import { DEMOS, DEMO_GROUPS } from '../../../creative/index.js'

export const defaultsFor = (index) => Object.fromEntries(
  (DEMOS[index]?.params ?? []).map((p) => [p.key, p.value]),
)

/** 下标 → 所属分组序号。分组是连续区间，所以线性扫一遍就够（模块级算一次） */
export const GROUP_OF = DEMOS.map((_, i) => DEMO_GROUPS.findIndex((g) => i >= g.from && i <= g.to))

export const pad2 = (n) => String(n + 1).padStart(2, '0')
