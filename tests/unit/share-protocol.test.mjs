/**
 * 对话分享协议纯函数单测
 */
import {
  pickSessionId, normalizeShareItems, buildShareMessageUrl,
  isNewChatItem, countRounds, DEFAULT_SHARE_MESSAGE_PATH,
} from '../../src/components/ChatBot/sharing/shareProtocol.js'
import { eq, ok, length as len } from './harness.mjs'

export default [
  ['pickSessionId 取末条会话 ID', () => {
    eq(pickSessionId([{ sessionId: '' }, { sessionId: 's1' }]), 's1')
    eq(pickSessionId([{ sessionId: 's1' }, { sessionId: '' }]), 's1', '末条为空时向前找')
    eq(pickSessionId([]), '')
    eq(pickSessionId(null), '')
  }],
  ['normalizeShareItems 兼容 { data: [] }', () => {
    const items = normalizeShareItems({
      data: [{ conversation: [{ type: 0, message: 'q' }, { type: 1, message: 'a' }] }],
    })
    len(items, 1)
    len(items[0].conversation, 2)
    eq(items[0].conversation[0].type, 0)
    ok(items[0].sessionDetailId, '应补齐 sessionDetailId')
  }],
  ['normalizeShareItems 支持 transform 预处理', () => {
    const items = normalizeShareItems({ rows: [{ conversation: [] }] }, (r) => r.rows)
    len(items, 1)
  }],
  ['normalizeShareItems 非法输入回落空数组', () => {
    len(normalizeShareItems(null), 0)
    len(normalizeShareItems('x'), 0)
  }],
  ['normalizeShareItems 过滤非对象项', () => {
    const items = normalizeShareItems([null, 'x', [], { conversation: [] }])
    len(items, 1)
  }],
  ['buildShareMessageUrl 拼参数', () => {
    eq(buildShareMessageUrl('/p', { userShareId: 'u1', flag: 1 }), '/p?userShareId=u1&flag=1')
    eq(buildShareMessageUrl('/p', { userShareId: 'u1' }), '/p?userShareId=u1')
    eq(buildShareMessageUrl('/p'), '/p', '无参数不拼 query')
    eq(buildShareMessageUrl(''), DEFAULT_SHARE_MESSAGE_PATH, '空 base 用默认路径')
  }],
  ['buildShareMessageUrl 已有 query 用 & 连接', () => {
    eq(buildShareMessageUrl('/p?x=1', { userShareId: 'u' }), '/p?x=1&userShareId=u')
  }],
  ['isNewChatItem 识别新会话分隔条', () => {
    ok(isNewChatItem({ sessionDetailId: '0000', conversation: [] }))
    ok(!isNewChatItem({ sessionDetailId: '0000', conversation: [{ type: 0 }] }), '有消息则不是')
    ok(!isNewChatItem({ sessionDetailId: 'a', conversation: [] }), '非 0000 不是')
  }],
  ['countRounds 统计提问轮数', () => {
    eq(countRounds([{ sessionDetailId: '0000', conversation: [] }, { sessionDetailId: 'a' }]), 1)
    eq(countRounds(null), 0)
  }],
]
