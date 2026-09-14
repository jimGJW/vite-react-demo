/**
 * ChatBot 流式协议纯函数单测
 */
import {
  stripSsePrefix, classifyFrame, shouldAccumulateStreamText,
  shouldClearStatusForText, resolveMessageBody, resolveErrorMessage,
  createLineJsonParser, FRAME_STATUS, STREAM_ERROR_MESSAGES,
} from '../../src/components/ChatBot/chatStream.js'
import { eq, ok, deepEq } from './harness.mjs'

export default [
  ['stripSsePrefix 去 data: 前缀', () => {
    eq(stripSsePrefix('data: {"a":1}'), '{"a":1}')
    eq(stripSsePrefix('data:[DONE]'), '[DONE]')
    eq(stripSsePrefix('  {"a":1}  '), '{"a":1}', '裸 JSON 去空格')
  }],
  ['classifyFrame 识别状态帧', () => {
    const r = classifyFrame({ type: FRAME_STATUS, state: 'running', message: '思考中' })
    eq(r.kind, 'status')
    eq(r.state, 'running')
  }],
  ['classifyFrame 识别内容帧', () => {
    const r = classifyFrame({ output: { choices: [{ message: { content: 'hi' }, finish_reason: null }] } })
    eq(r.kind, 'content')
    eq(r.delta.content, 'hi')
  }],
  ['classifyFrame 识别错误帧', () => {
    const r = classifyFrame({ code: 3001 })
    eq(r.kind, 'error')
    eq(r.code, '3001')
  }],
  ['classifyFrame 未知帧', () => {
    eq(classifyFrame(null).kind, 'unknown')
    eq(classifyFrame({ foo: 1 }).kind, 'unknown')
  }],
  ['shouldAccumulateStreamText 只累加纯文本', () => {
    ok(shouldAccumulateStreamText({ content: 'a' }, null))
    ok(!shouldAccumulateStreamText({ content: 'a', contentType: 'card' }, null), '卡片帧不累加')
    ok(!shouldAccumulateStreamText({ content: 'a' }, 'stop'), 'stop 帧不累加')
    ok(!shouldAccumulateStreamText({}, null), '无 content 不累加')
  }],
  ['shouldClearStatusForText 正文到达清状态', () => {
    ok(shouldClearStatusForText({ content: 'a' }, null))
    ok(!shouldClearStatusForText({ content: 'a', contentType: 'card' }, null))
  }],
  ['resolveMessageBody stop 帧为权威正文', () => {
    eq(resolveMessageBody({ delta: { content: 'final' }, finishReason: 'stop', streamedText: 'partial' }), 'final')
    eq(resolveMessageBody({ delta: { content: 'x' }, finishReason: null, streamedText: 'partial' }), 'partial')
    eq(resolveMessageBody({ delta: {}, finishReason: 'stop', streamedText: 'partial' }), 'partial', 'stop 无内容回退流式文本')
  }],
  ['resolveErrorMessage 错误码映射', () => {
    eq(resolveErrorMessage(3001), STREAM_ERROR_MESSAGES['network-error'])
    eq(resolveErrorMessage(1001), STREAM_ERROR_MESSAGES['invalid-user'])
    eq(resolveErrorMessage(99999), STREAM_ERROR_MESSAGES.unknown, '未知码回落 unknown')
    eq(resolveErrorMessage(undefined), STREAM_ERROR_MESSAGES.unknown)
  }],
  ['createLineJsonParser 解析整行', () => {
    const got = []
    const p = createLineJsonParser((f) => got.push(f))
    p.push('{"a":1}\n{"b":2}\n')
    deepEq(got, [{ a: 1 }, { b: 2 }])
  }],
  ['createLineJsonParser 容忍半包', () => {
    const got = []
    const p = createLineJsonParser((f) => got.push(f))
    p.push('{"a":1}\n{"b":')
    deepEq(got, [{ a: 1 }], '半包不输出')
    p.push('2}\n')
    deepEq(got, [{ a: 1 }, { b: 2 }], '补齐后输出')
  }],
  ['createLineJsonParser 忽略非法行与 [DONE]', () => {
    const got = []
    const p = createLineJsonParser((f) => got.push(f))
    p.push('event: ping\n')
    p.push('data: [DONE]\n')
    p.push('\n')
    p.push('{"ok":true}\n')
    deepEq(got, [{ ok: true }])
  }],
]
