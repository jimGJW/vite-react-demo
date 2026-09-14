/**
 * Kit 工具集单测（旧移动端 / 旧平板端项目移植的纯函数）
 */
import {
  arrayMove, clamp, splitDuration, formatDuration,
  timeToMinutes, minutesToTime, validateTimeRanges, formatNumber, dataURLtoFile,
} from '../../src/components/Kit/utils.js'
import { eq, ok, deepEq } from './harness.mjs'

export default [
  ['arrayMove 移动元素并返回新数组', () => {
    const src = ['a', 'b', 'c', 'd']
    deepEq(arrayMove(src, 0, 2), ['b', 'c', 'a', 'd'])
    eq(src[0], 'a', '不修改原数组')
  }],
  ['arrayMove 越界/原地返回拷贝', () => {
    const src = ['a', 'b']
    deepEq(arrayMove(src, 5, 0), ['a', 'b'], '越界返回拷贝')
    deepEq(arrayMove(src, 1, 1), ['a', 'b'], '原地返回拷贝')
  }],
  ['clamp 夹取区间', () => {
    eq(clamp(5, 1, 10), 5)
    eq(clamp(-1, 0, 10), 0)
    eq(clamp(99, 0, 10), 10)
    eq(clamp(NaN, 3, 10), 3, '非数字返回下界')
  }],
  ['splitDuration 拆分毫秒', () => {
    const d = splitDuration(90061000) // 1天1时1分1秒
    eq(d.days, 1); eq(d.hours, 1); eq(d.minutes, 1); eq(d.seconds, 1)
  }],
  ['splitDuration 负数归零', () => {
    eq(splitDuration(-5000).total, 0)
  }],
  ['formatDuration 按 pattern 输出', () => {
    eq(formatDuration(93000, 'HH:mm:ss'), '00:01:33')
    eq(formatDuration(90061000, 'DD HH:mm:ss'), '01 25:01:01', '天数计入 HH')
  }],
  ['timeToMinutes / minutesToTime 往返', () => {
    eq(timeToMinutes('08:30'), 510)
    eq(minutesToTime(510), '08:30')
    ok(Number.isNaN(timeToMinutes('25:00')), '非法小时返回 NaN')
    ok(Number.isNaN(timeToMinutes('abc')), '非时间串返回 NaN')
    eq(minutesToTime(-5), '00:00', '负数夹到 0')
  }],
  ['validateTimeRanges 正常时段', () => {
    const r = validateTimeRanges([{ start: '09:00', end: '12:00' }])
    ok(r.ok, '应通过')
    eq(r.totalMinutes, 180)
  }],
  ['validateTimeRanges 结束早于开始', () => {
    const r = validateTimeRanges([{ start: '09:00', end: '08:00' }])
    ok(!r.ok)
    ok(r.errors[0].includes('结束时间'), `错误信息: ${r.errors[0]}`)
  }],
  ['validateTimeRanges 时段重叠', () => {
    const r = validateTimeRanges([{ start: '09:00', end: '12:00' }, { start: '11:00', end: '13:00' }])
    ok(!r.ok)
    ok(r.errors.some((e) => e.includes('重叠')), `错误信息: ${r.errors}`)
  }],
  ['validateTimeRanges 未填写完整', () => {
    const r = validateTimeRanges([{ start: '09:00' }])
    ok(!r.ok)
    ok(r.errors[0].includes('未填写完整'))
  }],
  ['validateTimeRanges 超过最大时长', () => {
    const r = validateTimeRanges([{ start: '00:00', end: '23:00' }], { maxHours: 2 })
    ok(!r.ok)
    ok(r.errors.some((e) => e.includes('超过')), `错误信息: ${r.errors}`)
  }],
  ['formatNumber 千分位与空值', () => {
    eq(formatNumber(1234.5, 1), '1,234.5')
    eq(formatNumber(null), '', '空值返回空串')
    eq(formatNumber(''), '')
  }],
  ['dataURLtoFile 生成 File', () => {
    const f = dataURLtoFile('data:image/png;base64,AAE=', 'x.png')
    eq(f.name, 'x.png')
    eq(f.type, 'image/png')
    eq(f.size, 2, 'base64 AAE= 解出 2 字节')
  }],
]
