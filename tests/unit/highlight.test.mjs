/** 关键词高亮拆分单测 */
import { splitByKeyword } from '../../src/components/Studio/table/highlight.js'
import { eq, ok, deepEq } from './harness.mjs'

export default [
  ['splitByKeyword 无关键词返回整段', () => {
    deepEq(splitByKeyword('abc', ''), [{ text: 'abc', hit: false }])
    deepEq(splitByKeyword('abc', null), [{ text: 'abc', hit: false }])
  }],
  ['splitByKeyword 拆分命中片段', () => {
    deepEq(splitByKeyword('hello world', 'world'), [
      { text: 'hello ', hit: false }, { text: 'world', hit: true },
    ])
  }],
  ['splitByKeyword 忽略大小写', () => {
    // 全大写文本 + 小写关键词，应命中且保留原文大小写
    deepEq(splitByKeyword('ABC', 'abc'), [{ text: 'ABC', hit: true }])
    deepEq(splitByKeyword('Abc', 'aBc'), [{ text: 'Abc', hit: true }])
  }],
  ['splitByKeyword 多处命中（含未命中间隔）', () => {
    // 'Abc abc ABC' 按 'abc' 拆：3 段命中 + 2 段空格
    const parts = splitByKeyword('Abc abc ABC', 'abc')
    eq(parts.filter((p) => p.hit).length, 3, '命中 3 处')
    eq(parts.length, 5, '含 2 段未命中的空格')
    eq(parts.map((p) => p.text).join(''), 'Abc abc ABC', '拼接后还原原文')
  }],
  ['splitByKeyword 连续命中无间隔', () => {
    const parts = splitByKeyword('aaaaa', 'a')
    eq(parts.length, 5)
    ok(parts.every((p) => p.hit), '全部命中')
  }],
  ['splitByKeyword 未命中返回整段', () => {
    deepEq(splitByKeyword('abc', 'zzz'), [{ text: 'abc', hit: false }])
  }],
  ['splitByKeyword 空字符串输入返回空数组', () => {
    // 空文本无可渲染片段，返回 []（渲染为空，符合预期）
    deepEq(splitByKeyword('', 'a'), [])
  }],
  ['splitByKeyword 拼接可还原原文（不丢字符）', () => {
    const src = '核心交换机-01 服务节点状态正常'
    const parts = splitByKeyword(src, '服务')
    eq(parts.map((p) => p.text).join(''), src)
  }],
]
