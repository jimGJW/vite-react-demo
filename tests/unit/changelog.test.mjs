import { eq, length, ok, deepEq } from './harness.mjs'
import { RELEASES, getRelease, ROUTE_LATEST, ROUTE_RELEASES, TOTAL_CHANGES } from '../../src/components/Changelog/releases.js'

export default [
  ['批次数量与顺序正确', () => {
    length(RELEASES, 3)
    eq(RELEASES[0].id, 'r1')
    eq(RELEASES[2].id, 'r3')
  }],
  ['getRelease 按 id 查找 / 缺失返回 null', () => {
    eq(getRelease('r2').title, '核心 API 演示 + 验证体系')
    eq(getRelease('nope'), null)
  }],
  ['ROUTE_LATEST 路由映射到最新批次（/utils 取 r3）', () => {
    eq(ROUTE_LATEST['/perf-lab'], 'r3')
    eq(ROUTE_LATEST['/kit'], 'r1')
    eq(ROUTE_LATEST['/utils'], 'r3')
    eq(ROUTE_LATEST['/home-missing'] === undefined, true)
  }],
  ['ROUTE_RELEASES 路由归属全部批次（/utils 在 r1、r3）', () => {
    eq(ROUTE_RELEASES['/utils'].includes('r1'), true)
    eq(ROUTE_RELEASES['/utils'].includes('r3'), true)
    deepEq(ROUTE_RELEASES['/perf-lab'], ['r3'])
    eq(ROUTE_RELEASES['/home-missing'] === undefined, true)
  }],
  ['TOTAL_CHANGES 等于各批次之和（6+2+5=13）', () => {
    const sum = RELEASES.reduce((n, r) => n + r.changes.length, 0)
    eq(sum, TOTAL_CHANGES)
    eq(TOTAL_CHANGES, 13)
  }],
  ['每条改动都有必填字段', () => {
    for (const r of RELEASES) {
      for (const c of r.changes) {
        ok(typeof c.title === 'string' && c.title.length > 0, `release ${r.id} change 缺 title`)
        ok(typeof c.changedAt === 'string', `release ${r.id} change 缺 changedAt`)
      }
    }
  }],
]
