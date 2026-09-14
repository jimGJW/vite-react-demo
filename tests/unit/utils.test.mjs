/**
 * 小功能集 · 纯工具函数单测（零依赖）
 * 覆盖 src/components/Utils/utils.js 的全部可在 node 下运行的能力。
 */
import {
  formatDate, formatRelativeTime, diffDays, toDate,
  debounce, throttle, sleep, retry,
  formatThousands, formatFileSize, mask, formatPercent,
  arrayToObject, groupBy, unique, sortBy, flatten,
  deepClone, deepMerge, isEmpty, isDef, pick, omit, safeJsonParse,
  treeToArray, arrayToTree, findTreeNode,
  parseQuery, stringifyQuery, classNames,
  hexToRgba, escapeHtml, camelToKebab, kebabToCamel, capitalize,
  randomInt, randomPick, randomId,
} from '../../src/components/Utils/utils.js'
import { eq, ok, deepEq, length as len, sleep as wait } from './harness.mjs'

export default [
  /* ---------- 时间 ---------- */
  ['formatDate 按 pattern 格式化', () => {
    const d = new Date(2024, 0, 2, 3, 4, 5)
    eq(formatDate(d, 'YYYY-MM-DD'), '2024-01-02')
    eq(formatDate(d, 'YYYY-MM-DD HH:mm:ss'), '2024-01-02 03:04:05')
    eq(formatDate(d, 'YY/M/D'), '24/1/2')
  }],
  ['formatDate 非法输入返回空串', () => {
    eq(formatDate(null), '')
    eq(formatDate(''), '')
    eq(formatDate('not-a-date'), '')
  }],
  ['toDate 兼容秒级与毫秒级时间戳', () => {
    const sec = toDate(1700000000)
    const ms = toDate(1700000000000)
    eq(sec.getTime(), 1700000000000, '秒级应补 3 位')
    eq(ms.getTime(), 1700000000000)
  }],
  ['formatRelativeTime 分级显示', () => {
    const now = new Date(2024, 0, 1, 12, 0, 0).getTime()
    eq(formatRelativeTime(new Date(now - 30 * 1000), now), '刚刚')
    eq(formatRelativeTime(new Date(now - 5 * 60 * 1000), now), '5 分钟前')
    eq(formatRelativeTime(new Date(now - 3 * 3600 * 1000), now), '3 小时前')
    eq(formatRelativeTime(new Date(now - 5 * 86400 * 1000), now), '5 天前')
  }],
  ['diffDays 计算相差天数', () => {
    eq(diffDays(new Date(2024, 0, 1), new Date(2024, 0, 5)), 4)
    eq(diffDays('bad', new Date(2024, 0, 5)), 0, '非法输入返回 0')
  }],

  /* ---------- 频率控制 ---------- */
  ['debounce 只执行最后一次', async () => {
    let calls = 0
    const d = debounce(() => { calls += 1 }, 30)
    d(); d(); d()
    eq(calls, 0, '等待期内不应触发')
    await wait(80)
    eq(calls, 1, '等待结束后只触发一次')
  }],
  ['debounce leading 立即执行首次', async () => {
    let calls = 0
    const d = debounce(() => { calls += 1 }, 30, { leading: true })
    d()
    eq(calls, 1, '首次立即执行')
    d(); d()
    await wait(80)
    eq(calls, 2, '尾部补一次')
  }],
  ['debounce cancel 可取消', async () => {
    let calls = 0
    const d = debounce(() => { calls += 1 }, 30)
    d(); d.cancel()
    await wait(60)
    eq(calls, 0)
  }],
  ['throttle 窗口内只执行一次', async () => {
    let calls = 0
    const t = throttle(() => { calls += 1 }, 50)
    t(); t(); t()
    eq(calls, 1, '立即执行首次')
    await wait(120)
    eq(calls, 2, '窗口结束后补尾调用')
  }],
  ['sleep 等待时长', async () => {
    const t0 = Date.now()
    await sleep(40)
    ok(Date.now() - t0 >= 35, '至少等待 35ms')
  }],
  ['retry 失败后重试直至成功', async () => {
    let n = 0
    const r = await retry(async () => {
      n += 1
      if (n < 3) throw new Error('boom')
      return 'ok'
    }, { times: 3, delay: 1 })
    eq(r, 'ok')
    eq(n, 3)
  }],
  ['retry 耗尽次数后抛错', async () => {
    let n = 0
    let err = null
    try {
      await retry(async () => { n += 1; throw new Error('always') }, { times: 2, delay: 1 })
    } catch (e) { err = e }
    ok(err, '应抛出异常')
    eq(n, 2)
  }],

  /* ---------- 格式化 / 脱敏 ---------- */
  ['formatThousands 千分位', () => {
    eq(formatThousands(1234567), '1,234,567')
    eq(formatThousands(-1234), '-1,234')
    eq(formatThousands('abc'), '', '非数字返回空串')
  }],
  ['formatFileSize 单位换算', () => {
    eq(formatFileSize(0), '0 B')
    eq(formatFileSize(1024), '1.00 KB')
    eq(formatFileSize(1536), '1.50 KB')
    eq(formatFileSize(1024 * 1024), '1.00 MB')
  }],
  ['mask 脱敏保留首尾', () => {
    eq(mask('13800138000'), '138****8000')
    eq(mask('abcdef', { start: 1, end: 1 }), 'a****f')
    eq(mask('ab'), '**', '过短则整体打码')
    eq(mask(''), '')
  }],
  ['formatPercent 百分比', () => {
    eq(formatPercent(0.5), '50.00%')
    eq(formatPercent(1), '100.00%')
  }],

  /* ---------- 数组 / 对象 ---------- */
  ['arrayToObject 按 key 建索引', () => {
    deepEq(arrayToObject([{ id: 'a', v: 1 }, { id: 'b', v: 2 }], 'id'), { a: { id: 'a', v: 1 }, b: { id: 'b', v: 2 } })
  }],
  ['groupBy 分组', () => {
    const g = groupBy([{ t: 'x' }, { t: 'y' }, { t: 'x' }], 't')
    len(g.x, 2); len(g.y, 1)
  }],
  ['unique 去重', () => {
    len(unique([{ id: 1 }, { id: 1 }, { id: 2 }], 'id'), 2)
    len(unique([1, 1, 2, 2, 3]), 3)
  }],
  ['sortBy 排序（不改动原数组）', () => {
    const src = [{ v: 3 }, { v: 1 }, { v: 2 }]
    deepEq(sortBy(src, 'v').map((x) => x.v), [1, 2, 3])
    deepEq(sortBy(src, 'v', 'desc').map((x) => x.v), [3, 2, 1])
    eq(src[0].v, 3, '原数组保持 3,1,2')
  }],
  ['flatten 按深度展开', () => {
    deepEq(flatten([1, [2, [3, [4]]]], 2), [1, 2, 3, [4]])
    deepEq(flatten([1, [2, [3, [4]]]], Infinity), [1, 2, 3, 4])
  }],
  ['deepClone 互不影响', () => {
    const src = { a: 1, b: { c: [1, 2] } }
    const c = deepClone(src)
    c.b.c.push(3)
    eq(src.b.c.length, 2)
    eq(c.b.c.length, 3)
  }],
  ['deepMerge 递归合并且不改原对象', () => {
    const a = { x: 1, b: { p: 1 } }
    deepEq(deepMerge(a, { b: { q: 2 }, y: 3 }), { x: 1, b: { p: 1, q: 2 }, y: 3 })
    eq(a.b.q, undefined, '原对象未被修改')
  }],
  ['isEmpty 空值判定', () => {
    ok(isEmpty(null) && isEmpty(undefined) && isEmpty('') && isEmpty([]) && isEmpty({}))
    ok(!isEmpty(0) && !isEmpty('a') && !isEmpty([1]) && !isEmpty({ a: 1 }), '0/非空值不算空')
  }],
  ['isDef 已定义判定', () => {
    ok(!isDef(undefined) && !isDef(null))
    ok(isDef(0) && isDef('') && isDef(false), '0/空串/false 也算已定义')
  }],
  ['pick / omit 字段裁剪', () => {
    deepEq(pick({ a: 1, b: 2, c: 3 }, ['a', 'c']), { a: 1, c: 3 })
    deepEq(omit({ a: 1, b: 2 }, ['a']), { b: 2 })
  }],
  ['safeJsonParse 容错', () => {
    deepEq(safeJsonParse('{"a":1}'), { a: 1 })
    eq(safeJsonParse('{bad', 'fallback'), 'fallback')
  }],

  /* ---------- 树 ---------- */
  ['treeToArray 平铺', () => {
    const tree = [{ id: '1', children: [{ id: '1-1', children: [{ id: '1-1-1' }] }] }, { id: '2' }]
    len(treeToArray(tree), 4)
  }],
  ['arrayToTree 建树', () => {
    const roots = arrayToTree([
      { id: 1, parentId: null }, { id: 2, parentId: 1 }, { id: 3, parentId: 1 }, { id: 4, parentId: 2 },
    ])
    len(roots, 1)
    len(roots[0].children, 2)
    len(roots[0].children[0].children, 1)
  }],
  ['findTreeNode 深度查找', () => {
    const tree = [{ id: 'a', children: [{ id: 'b', children: [{ id: 'c' }] }] }]
    eq(findTreeNode(tree, 'c')?.id, 'c')
    eq(findTreeNode(tree, 'zzz'), null, '未找到返回 null')
  }],

  /* ---------- URL ---------- */
  ['parseQuery / stringifyQuery 往返', () => {
    deepEq(parseQuery('?a=1&b=hello%20world'), { a: '1', b: 'hello world' })
    eq(stringifyQuery({ a: 1, b: 'x y' }), 'a=1&b=x%20y')
    eq(stringifyQuery({ a: 1, b: '', c: null }), 'a=1', '空值被忽略')
  }],
  ['classNames 拼接', () => {
    eq(classNames('a', { b: true, c: false }, ['d', null]), 'a b d')
    eq(classNames(), '')
  }],

  /* ---------- 字符串 / 随机 ---------- */
  ['hexToRgba 颜色转换', () => {
    eq(hexToRgba('#ff0000', 0.5), 'rgba(255, 0, 0, 0.5)')
    eq(hexToRgba('#fff', 1), 'rgba(255, 255, 255, 1)')
  }],
  ['escapeHtml 转义', () => {
    eq(escapeHtml('<b>&"'), '&lt;b&gt;&amp;&quot;')
  }],
  ['命名风格互转', () => {
    eq(camelToKebab('fooBar'), 'foo-bar')
    eq(kebabToCamel('foo-bar'), 'fooBar')
    eq(capitalize('abc'), 'Abc')
  }],
  ['随机工具', () => {
    const n = randomInt(1, 3)
    ok(n >= 1 && n <= 3, 'randomInt 落在区间内')
    eq(randomPick([7]), 7)
    ok(randomId('x').startsWith('x-'), 'randomId 带前缀')
    ok(randomId('a') !== randomId('a'), '两次生成不同')
  }],
]
