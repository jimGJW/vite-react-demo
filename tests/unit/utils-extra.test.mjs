/**
 * 小功能集 · 新增工具函数单测（零依赖）
 * 覆盖 utils.js 后追加的：字符串增强 / 数值统计 / 数组增强 /
 * 对象路径 / 日期增强 / 颜色 / 常用校验。
 */
import {
  truncate, wordCount, toHalfWidth, escapeRegExp, slugify, initials, trimAll,
  sum, avg, median, inRange, roundTo, percentOf, formatDuration,
  chunk, range, shuffle, sample, difference, intersection, union, compact,
  countBy, sumBy, move,
  get, set, has, invert, mapValues,
  startOfDay, endOfDay, addDays, isSameDay, weekdayOf, daysInMonth, isLeapYear,
  colorFromString, contrastColor,
  isEmail, isPhone, isIdCard, isUrl, isNumeric, isChinese,
} from '../../src/components/Utils/utils.js'
import { eq, ok, deepEq, close, length as len } from './harness.mjs'

export default [
  /* ---------- 字符串增强 ---------- */
  ['truncate 超长才截断且总长不超 max', () => {
    eq(truncate('hello world', 5), 'hell…')
    eq(truncate('hello world', 5).length, 5, '含省略号总长不超过 max')
    eq(truncate('hi', 5), 'hi', '不超长时原样返回')
    eq(truncate('hello', 0), '')
  }],
  ['wordCount 中日韩按字、英文按词', () => {
    eq(wordCount('你好世界'), 4)
    eq(wordCount('hello world'), 2)
    eq(wordCount('你好 hello'), 3)
    eq(wordCount(''), 0)
  }],
  ['toHalfWidth 全角转半角', () => {
    eq(toHalfWidth('ＡＢＣ１２３'), 'ABC123')
    eq(toHalfWidth('　'), ' ', '全角空格转普通空格')
    eq(toHalfWidth('abc'), 'abc')
  }],
  ['escapeRegExp 转义元字符', () => {
    eq(escapeRegExp('a.b*c'), 'a\\.b\\*c')
    ok(new RegExp(escapeRegExp('a.b')).test('a.b'), '应能匹配字面点号')
    ok(!new RegExp(escapeRegExp('a.b')).test('axb'), '点号已被转义，不应通配')
  }],
  ['slugify 生成 URL 友好串', () => {
    eq(slugify('Hello World! 你好'), 'hello-world-你好')
    eq(slugify('  A_B  '), 'a-b')
    eq(slugify(''), '')
  }],
  ['initials 取首字母', () => {
    eq(initials('张伟'), '张伟')
    eq(initials('john smith'), 'JS')
    eq(initials(''), '')
  }],
  ['trimAll 压缩中间空白', () => {
    eq(trimAll('  a   b  '), 'a b')
    eq(trimAll(''), '')
  }],

  /* ---------- 数值统计 ---------- */
  ['sum / avg 忽略非数字', () => {
    eq(sum([1, 2, 3]), 6)
    eq(sum([1, 'a', 3]), 4)
    eq(avg([1, 2, 3]), 2)
    eq(avg([]), 0, '空数组返回 0，不产生 NaN')
  }],
  ['median 奇偶数长度', () => {
    eq(median([3, 1, 2]), 2)
    eq(median([1, 2, 3, 4]), 2.5)
    eq(median([1, 'x', 3]), 2, '忽略非数字')
    eq(median([]), 0)
  }],
  ['inRange 闭区间', () => {
    eq(inRange(5, 1, 10), true)
    eq(inRange(1, 1, 10), true, '边界含在内')
    eq(inRange(0, 1, 10), false)
  }],
  ['roundTo 指定小数位', () => {
    eq(roundTo(1.234, 2), 1.23)
    eq(roundTo(1.235, 2), 1.24)
    close(roundTo(3.14159, 3), 3.142, 0.001)
  }],
  ['percentOf 分母为 0 时不产生 NaN', () => {
    eq(percentOf(25, 100), 25)
    close(percentOf(1, 3, 2), 33.33, 0.01)
    eq(percentOf(5, 0), 0)
  }],
  ['formatDuration 逐级降级', () => {
    eq(formatDuration(0), '0秒')
    eq(formatDuration(42000), '42秒')
    eq(formatDuration(65000), '1分5秒')
    eq(formatDuration(3661000), '1小时1分1秒')
    eq(formatDuration(90061000), '1天1小时1分')
    eq(formatDuration(-5), '0秒', '负数兜底为 0')
  }],

  /* ---------- 数组增强 ---------- */
  ['chunk 按长度分块', () => {
    deepEq(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
    deepEq(chunk([], 2), [])
    deepEq(chunk([1, 2], 0), [[1], [2]], 'size 为 0 时兜底成 1')
  }],
  ['range 生成序列', () => {
    deepEq(range(3), [0, 1, 2])
    deepEq(range(1, 5), [1, 2, 3, 4])
    deepEq(range(5, 0, -2), [5, 3, 1])
    deepEq(range(0), [])
  }],
  ['shuffle 不改原数组且元素不丢失', () => {
    const src = [1, 2, 3, 4, 5]
    const out = shuffle(src)
    len(out, 5)
    deepEq(src, [1, 2, 3, 4, 5], '原数组必须保持不变')
    deepEq([...out].sort(), [1, 2, 3, 4, 5], '洗牌不能丢元素')
  }],
  ['sample 抽 n 个不重复', () => {
    const out = sample([1, 2, 3, 4], 2)
    len(out, 2)
    eq(new Set(out).size, 2, '不应重复')
    len(sample([1, 2], 0), 0)
  }],
  ['difference / intersection / union', () => {
    deepEq(difference([1, 2, 3], [2]), [1, 3])
    deepEq(intersection([1, 2, 3], [2, 3, 4]), [2, 3])
    deepEq(union([1, 2], [2, 3]), [1, 2, 3], '并集需去重')
  }],
  ['compact 去掉 falsy', () => {
    deepEq(compact([1, 0, '', null, undefined, 2]), [1, 2])
  }],
  ['countBy 支持属性名与取值函数', () => {
    const rows = [{ s: '在线' }, { s: '在线' }, { s: '离线' }]
    deepEq(countBy(rows, 's'), { 在线: 2, 离线: 1 })
    eq(countBy([1, 2, 2, 3], (n) => n % 2)['0'], 2)
  }],
  ['sumBy 按字段求和', () => {
    eq(sumBy([{ v: 1 }, { v: 2 }, { v: 'x' }], 'v'), 3)
    eq(sumBy([1, 2, 3], (n) => n * 2), 12)
  }],
  ['move 移动元素', () => {
    deepEq(move([1, 2, 3], 0, 2), [2, 3, 1])
    deepEq(move([1, 2, 3], 5, 0), [1, 2, 3], '越界时原样返回')
    deepEq(move([1, 2, 3], 2, 0), [3, 1, 2])
  }],

  /* ---------- 对象路径 ---------- */
  ['get 安全取深层值', () => {
    eq(get({ a: { b: { c: 1 } } }, 'a.b.c'), 1)
    eq(get({ a: { b: [1, 2] } }, 'a.b[1]'), 2, '支持数组下标写法')
    eq(get({}, 'a.b', '兜底'), '兜底')
    eq(get(null, 'a', '兜底'), '兜底')
    eq(get({ a: 1 }, 'a.b.c.d', '兜底'), '兜底', '中间层不是对象时不能抛错')
  }],
  ['set 不可变写入', () => {
    const src = { a: 1 }
    const out = set(src, 'b.c', 2)
    deepEq(src, { a: 1 }, '原对象必须不变')
    eq(out.b.c, 2)
    eq(set({ a: { b: 1 } }, 'a.c', 2).a.b, 1, '同级字段要保留')
  }],
  ['set 支持数组下标', () => {
    const out = set({ list: [{ n: 1 }, { n: 2 }] }, 'list[1].n', 9)
    eq(out.list[1].n, 9)
    eq(out.list[0].n, 1)
  }],
  ['has 判断路径存在', () => {
    eq(has({ a: { b: 1 } }, 'a.b'), true)
    eq(has({ a: {} }, 'a.b'), false)
    eq(has({}, 'a'), false)
    eq(has({ a: { b: undefined } }, 'a.b'), true, '键存在即算存在')
  }],
  ['invert / mapValues', () => {
    deepEq(invert({ a: '1', b: '2' }), { 1: 'a', 2: 'b' })
    deepEq(mapValues({ a: 1, b: 2 }, (v) => v * 2), { a: 2, b: 4 })
  }],

  /* ---------- 日期增强 ---------- */
  ['startOfDay / endOfDay', () => {
    const d = new Date(2024, 0, 15, 13, 30, 45)
    eq(startOfDay(d).getHours(), 0)
    eq(startOfDay(d).getMinutes(), 0)
    eq(endOfDay(d).getHours(), 23)
    eq(endOfDay(d).getMinutes(), 59)
  }],
  ['addDays 支持跨月与负数', () => {
    eq(addDays(new Date(2024, 0, 31), 1).getDate(), 1, '跨月')
    eq(addDays(new Date(2024, 0, 31), 1).getMonth(), 1)
    eq(addDays(new Date(2024, 0, 1), -1).getDate(), 31, '负数往前')
  }],
  ['isSameDay 只比较年月日', () => {
    eq(isSameDay(new Date(2024, 0, 1, 10), new Date(2024, 0, 1, 22)), true)
    eq(isSameDay(new Date(2024, 0, 1), new Date(2024, 0, 2)), false)
    eq(isSameDay(new Date('bad'), new Date()), false)
  }],
  ['weekdayOf 返回中文星期', () => {
    eq(weekdayOf(new Date(2024, 0, 1)), '星期一', '2024-01-01 是周一')
    eq(weekdayOf(new Date(2024, 0, 7)), '星期日')
  }],
  ['daysInMonth 各月天数', () => {
    eq(daysInMonth(2024, 2), 29, '闰年 2 月')
    eq(daysInMonth(2023, 2), 28)
    eq(daysInMonth(2024, 1), 31)
    eq(daysInMonth(2024, 4), 30)
  }],
  ['isLeapYear 百年规则', () => {
    eq(isLeapYear(2024), true)
    eq(isLeapYear(2023), false)
    eq(isLeapYear(1900), false, '百年不闰')
    eq(isLeapYear(2000), true, '四百年再闰')
  }],

  /* ---------- 颜色 ---------- */
  ['colorFromString 同一输入稳定', () => {
    eq(colorFromString('abc'), colorFromString('abc'))
    ok(/^hsl\(\d{1,3}, 65%, 52%\)$/.test(colorFromString('xyz')), '格式应为 hsl')
  }],
  ['contrastColor 按亮度返回黑白', () => {
    eq(contrastColor('#ffffff'), '#000000', '白底用黑字')
    eq(contrastColor('#000000'), '#ffffff', '黑底用白字')
    eq(contrastColor('#1677ff'), '#ffffff', '品牌蓝偏暗，用白字')
    eq(contrastColor('#ffff00'), '#000000', '黄色亮度高，用黑字')
    eq(contrastColor('非法输入'), '#000000', '非法输入兜底')
  }],

  /* ---------- 常用校验 ---------- */
  ['isEmail', () => {
    eq(isEmail('a@b.com'), true)
    eq(isEmail('a.b+c@sub.example.cn'), true)
    eq(isEmail('a@b'), false, '缺少顶级域')
    eq(isEmail('a b@c.com'), false)
    eq(isEmail(''), false)
  }],
  ['isPhone 中国大陆手机号', () => {
    eq(isPhone('13800138000'), true)
    eq(isPhone('19912345678'), true)
    eq(isPhone('12345678901'), false, '第二位必须 3-9')
    eq(isPhone('1380013800'), false, '位数不足')
    eq(isPhone('138001380001'), false, '位数超出')
  }],
  ['isIdCard 含校验位', () => {
    eq(isIdCard('11010519491231002X'), true)
    eq(isIdCard('110105194912310021'), false, '校验位错误')
    eq(isIdCard('1101051949123100'), false, '位数不足')
    eq(isIdCard(''), false)
  }],
  ['isUrl', () => {
    eq(isUrl('https://example.com/a?b=1'), true)
    eq(isUrl('not a url'), false)
    eq(isUrl(''), false)
  }],
  ['isNumeric', () => {
    eq(isNumeric('12.5'), true)
    eq(isNumeric('-3'), true)
    eq(isNumeric('abc'), false)
    eq(isNumeric(''), false)
  }],
  ['isChinese', () => {
    eq(isChinese('你好'), true)
    eq(isChinese('你好a'), false)
    eq(isChinese(' 你好 '), true, '首尾空格应被 trim')
    eq(isChinese(''), false)
  }],
]
