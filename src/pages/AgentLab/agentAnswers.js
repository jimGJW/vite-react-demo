/**
 * AgentLab 的 ChatBot 主题化回答（注入 createMockApi 的 answers 解析器）
 * ===============================================================
 * 复用 ChatBot 的流式协议与卡片渲染，只是把「回答内容」换成 Agent 知识域：
 *   框架对比 → 表格卡片；MCP/RAG/ReAct/提示词/工具调用 → Markdown 流式正文。
 * 演示数据用中英混排（真实项目由后端按用户语种返回）。
 */

import { FRAMEWORKS } from './agentData.js'

const OVERVIEW = `### AI Agent 知识速览

**Agent = 模型 + 工具 + 循环**。当前主流技术栈分四层：

| 层 | 关键词 |
| --- | --- |
| 前端 | 流式渲染 · 工具卡片 · 思考链 · MCP 客户端 |
| 后端 | ReAct 循环 · Function Calling · RAG · 记忆 · 多智能体 |
| 协议 | MCP（Agent↔工具）· A2A（Agent↔Agent）· JSON Schema |
| 框架 | LangGraph · OpenAI Agents SDK · AutoGen · CrewAI · Dify · Vercel AI SDK |

> 试试问我：**对比主流 Agent 框架** / **讲讲 MCP 协议** / **RAG 是怎么工作的** / **怎么写 ReAct 提示词**
`

const MCP_ANSWER = `### MCP（Model Context Protocol）

Anthropic 开源的 **「AI 界 USB-C」**——把「模型 ↔ 工具/数据」的接法标准化。

- **三原语**：Tools（可调用函数）、Resources（可读数据）、Prompts（提示模板）
- **三角色**：Host（宿主应用）— Client（连接管理）— Server（能力提供方）
- **传输**：本地 stdio / 远程 Streamable HTTP，鉴权 OAuth 2.1
- **现状**：主流 IDE 与桌面应用已内置，工具市场按 MCP server 分发，是当前事实标准

> 与 A2A 的分工：**MCP 解决 Agent ↔ 工具，A2A 解决 Agent ↔ Agent**。
`

const RAG_ANSWER = `### RAG 检索增强生成

**链路**：切片 → embedding 入库（Milvus / pgvector / Qdrant）→ 检索 top-k → rerank → 拼上下文生成。

1. **切片**：按语义边界切 300~800 token，保留重叠
2. **召回**：向量检索 + 关键词（BM25）多路召回再融合
3. **重排**：cross-encoder rerank 压缩到最相关的几段
4. **引用**：回答标注来源片段 [n]，企业刚需 + 幻觉治理

> 进阶方向：GraphRAG（知识图谱）、HyDE（假设文档检索）。
`

const REACT_ANSWER = `### ReAct 循环

**Reason + Act 交替**的 Agent 主循环，所有框架的内核：

\`\`\`text
while (true) {
  推理 → 决定「直接回答」还是「调用工具」
  调用工具 → 拿到结果回填上下文
  if (不再需要工具) break
}
\`\`\`

工程要点：**最大迭代数**、**工具超时**、**失败重试**、**整体预算控制**。
现代实现已不解析文本式 ReAct，而是用原生 function calling 多轮。
`

const PROMPT_ANSWER = `### ReAct 提示词模板（可直接复制）

\`\`\`text
你是一个严谨的任务执行 Agent。对每个目标，交替输出：
Thought: 当前已知什么、还缺什么、下一步为什么这样做
Action: 要调用的工具名与 JSON 参数
（工具结果由系统回填为 Observation）
当 Thought 判断信息足够时，输出 Final Answer 并给出依据。
约束：一次只调用一个工具；参数必须符合工具 schema；不确定时先取证再回答。
\`\`\`

> 右侧「提示词模板」页签还有工具调用 / RAG 引用 / 多智能体 / 结构化输出四套模板，一键复制。
`

const TOOL_ANSWER = `### Function Calling / Tool Use

1. 请求里带 **tools 数组**（JSON Schema：name / description / parameters）
2. 模型不回文本，而是返回 **tool_calls**（结构化参数）
3. 后端执行工具 → 结果作为 \`role: "tool"\` 消息回填 → 模型继续推理

**防幻觉三件套**：description 写具体、参数加枚举与 required、开严格模式（strict）。
OpenAI / Anthropic / Gemini 协议同构，网关层一次适配多端复用。
`

function frameworkRows() {
  return FRAMEWORKS.map((f) => ({
    框架: f.name,
    定位: f.kind['zh-CN'],
    语言: f.lang,
    核心亮点: f.highlight['zh-CN'],
    适用场景: f.scene['zh-CN'],
  }))
}

/** Agent 主题的思考步骤（steps 帧，供 ThinkingStrip 展开回看） */
const STEPS = [
  { label: '解析意图 · 匹配知识域', ms: 120 },
  { label: '检索 Agent 知识库', ms: 260 },
  { label: '组织结构化回答', ms: 90 },
]

const withSteps = (ans) => ({ steps: STEPS, ...ans })

/** 问题 → 回答解析器（注入 createMockApi({ answers })） */
export function agentAnswers(question = '') {
  const q = String(question)
  if (/框架|对比|选型|framework|langchain|langgraph|crewai|autogen|dify|coze|vercel/i.test(q)) {
    return withSteps({
      contentType: 'table',
      title: '主流 Agent 框架对比',
      payload: frameworkRows(),
      recommend: ['讲讲 MCP 协议', 'RAG 是怎么工作的', '怎么写 ReAct 提示词'],
    })
  }
  if (/mcp|a2a|协议|protocol/i.test(q)) {
    return withSteps({ payload: MCP_ANSWER, recommend: ['对比主流 Agent 框架', 'Function Calling 怎么用', 'RAG 是怎么工作的'] })
  }
  if (/rag|检索|向量|embedding|知识库/i.test(q)) {
    return withSteps({ payload: RAG_ANSWER, recommend: ['对比主流 Agent 框架', '讲讲 MCP 协议', '生成一个 ReAct 模板'] })
  }
  if (/react|循环|推理|主循环/i.test(q)) {
    return withSteps({ payload: REACT_ANSWER, recommend: ['对比主流 Agent 框架', 'Function Calling 怎么用', '讲讲 MCP 协议'] })
  }
  if (/提示词|模板|prompt/i.test(q)) {
    return withSteps({ payload: PROMPT_ANSWER, recommend: ['RAG 引用约束怎么写', '多智能体角色怎么分', '对比主流 Agent 框架'] })
  }
  if (/工具|调用|function|tool/i.test(q)) {
    return withSteps({ payload: TOOL_ANSWER, recommend: ['对比主流 Agent 框架', '怎么写 ReAct 提示词', '讲讲 MCP 协议'] })
  }
  return withSteps({
    payload: OVERVIEW,
    recommend: ['对比主流 Agent 框架', '讲讲 MCP 协议', 'RAG 是怎么工作的', '怎么写 ReAct 提示词'],
  })
}
