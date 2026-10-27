/**
 * AI Agent 实验室数据模块不变量
 * - 知识点 id 唯一、分类合法、双语齐备且 en 无汉字
 * - 框架对比 / 提示词模板字段齐备
 * - answers 解析器命中各知识域且 payload 合法
 */
import { eq, length, ok } from './harness.mjs'
import { CATS, KNOWLEDGE, FRAMEWORKS, PROMPTS, STREAM_MATRIX, STREAM_CHANNELS, STREAM_TEXT } from '../../src/pages/AgentLab/agentData.js'
import { agentAnswers } from '../../src/pages/AgentLab/agentAnswers.js'

const HAS_CJK = /[一-鿿]/

/** 双语字段校验：zh-CN 非空、en 非空且无汉字 */
function okBilingual(field, label) {
  ok(field && typeof field['zh-CN'] === 'string' && field['zh-CN'].length > 0, `${label} 缺 zh-CN`)
  ok(typeof field.en === 'string' && field.en.length > 0, `${label} 缺 en`)
  ok(!HAS_CJK.test(field.en), `${label} 的 en 残留汉字`)
}

export default [
  ['知识点 id 唯一、分类合法', () => {
    ok(KNOWLEDGE.length >= 20, '知识点应不少于 20 个')
    const ids = KNOWLEDGE.map((k) => k.id)
    eq(new Set(ids).size, ids.length, '知识点 id 重复')
    for (const k of KNOWLEDGE) ok(CATS.includes(k.cat), `${k.id} 分类非法: ${k.cat}`)
  }],
  ['每类都有知识点，且四大类覆盖均衡', () => {
    for (const cat of CATS) {
      const n = KNOWLEDGE.filter((k) => k.cat === cat).length
      ok(n >= 3, `分类 ${cat} 知识点不足 3 个`)
    }
  }],
  ['知识点双语字段齐备（name/desc/points）', () => {
    for (const k of KNOWLEDGE) {
      okBilingual(k.name, `${k.id}.name`)
      okBilingual(k.desc, `${k.id}.desc`)
      ok(Array.isArray(k.points) && k.points.length >= 2, `${k.id} 要点不足 2 条`)
      k.points.forEach((p, i) => okBilingual(p, `${k.id}.points[${i}]`))
    }
  }],
  ['框架对比字段齐备且 en 无汉字', () => {
    ok(FRAMEWORKS.length >= 5, '框架对比应不少于 5 行')
    const ids = FRAMEWORKS.map((f) => f.id)
    eq(new Set(ids).size, ids.length, '框架 id 重复')
    for (const f of FRAMEWORKS) {
      ok(typeof f.name === 'string' && f.name.length > 0, `${f.id} 缺 name`)
      ok(typeof f.lang === 'string' && f.lang.length > 0, `${f.id} 缺 lang`)
      okBilingual(f.kind, `${f.id}.kind`)
      okBilingual(f.highlight, `${f.id}.highlight`)
      okBilingual(f.scene, `${f.id}.scene`)
    }
  }],
  ['提示词模板双语齐备且正文非空', () => {
    ok(PROMPTS.length >= 4, '提示词模板应不少于 4 套')
    for (const p of PROMPTS) {
      okBilingual(p.name, `${p.id}.name`)
      okBilingual(p.scene, `${p.id}.scene`)
      okBilingual(p.text, `${p.id}.text`)
      ok(p.text['zh-CN'].length >= 60, `${p.id} 正文过短`)
    }
  }],
  ['answers 解析器命中各知识域', () => {
    const table = agentAnswers('对比主流 Agent 框架')
    eq(table.contentType, 'table')
    ok(Array.isArray(table.payload) && table.payload.length === FRAMEWORKS.length, '框架对比卡片行数应等于 FRAMEWORKS')
    ok(Array.isArray(table.steps) && table.steps.length >= 2, '回答应带思考步骤流')
    ok(Array.isArray(table.recommend) && table.recommend.length >= 2, '回答应带推荐追问')

    for (const q of ['讲讲 MCP 协议', 'RAG 是怎么工作的', 'ReAct 循环', '写一个提示词模板', 'Function Calling 怎么用', 'AI Agent 是什么']) {
      const ans = agentAnswers(q)
      ok(ans && typeof ans.payload === 'string' && ans.payload.length > 40, `"${q}" 回答过短`)
      ok(!ans.contentType, `"${q}" 应为 Markdown 正文而非卡片`)
    }

    /* 未命中关键词也应兜底给出概览 */
    const fallback = agentAnswers('随便聊聊')
    ok(fallback.payload.includes('Agent'), '兜底回答应包含 Agent 概览')
  }],
  ['对比实验室矩阵与通道数据齐备（行 × 三通道双语）', () => {
    ok(STREAM_TEXT['zh-CN'].length > 20 && !HAS_CJK.test(STREAM_TEXT.en), '演示文案双语不齐')
    eq(STREAM_CHANNELS.length, 3, '流式通道应为 3 条')
    for (const c of STREAM_CHANNELS) {
      okBilingual(c.name, `channel ${c.id}.name`)
      okBilingual(c.sub, `channel ${c.id}.sub`)
    }
    ok(STREAM_MATRIX.length >= 4, '特性矩阵应不少于 4 行')
    for (const row of STREAM_MATRIX) {
      okBilingual(row.feature, `matrix ${row.feature?.['zh-CN']}.feature`)
      for (const col of ['sse', 'fetch', 'ws']) okBilingual(row[col], `matrix[${col}] 单元格`)
    }
  }],
]
