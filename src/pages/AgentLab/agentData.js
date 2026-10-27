/**
 * AI Agent 实验室 —— 知识数据模块（纯数据，无 React，可被单测直接 import）
 * ===============================================================
 * 收录当前市场主流的 AI Agent 知识点（前端 / 后端 / 协议 / 框架四类）、
 * 主流 Agent 框架横向对比、常用提示词模板。
 *
 * 多语化约定（与看板数据模块一致）：文案字段是 { 'zh-CN': ..., en: ... }
 * 双语对象，页面用 pickText(field, lang) 取值，其余语种回退 en → zh-CN。
 */

export const CATS = ['frontend', 'backend', 'protocol', 'framework']

/* ---------------------------------------------------------------- 知识点 */

export const KNOWLEDGE = [
  {
    id: 'streaming-ui',
    cat: 'frontend',
    alias: 'SSE / Stream',
    hot: true,
    name: { 'zh-CN': '流式渲染', en: 'Streaming UI' },
    desc: {
      'zh-CN': '打字机效果、分帧协议与中断控制，Agent 前端的第一体验。',
      en: 'Typewriter effect, frame protocol and abort control — the first-class UX of agent frontends.',
    },
    points: [
      { 'zh-CN': 'SSE（text/event-stream）是最主流通道：单向、自动重连、天然过代理；WebSocket 用于双向（语音等）。', en: 'SSE (text/event-stream) is the mainstream channel: unidirectional, auto-reconnect, proxy-friendly; WebSocket for bidirectional needs like voice.' },
      { 'zh-CN': '按「行 JSON」或 OpenAI chunk 协议累积渲染，最后 stop 帧回传完整正文用于复制/分享。', en: 'Accumulate line-JSON or OpenAI-style chunks; the final stop frame returns the full text for copy/share.' },
      { 'zh-CN': '必须处理 AbortController 中断、IME 合成守卫与智能吸底滚动。', en: 'Handle AbortController cancellation, IME composition guards and smart stick-to-bottom scrolling.' },
    ],
  },
  {
    id: 'tool-call-ui',
    cat: 'frontend',
    alias: 'Widget Cards',
    hot: true,
    name: { 'zh-CN': '工具调用结果卡片化', en: 'Tool-result Cards' },
    desc: {
      'zh-CN': '把 function calling 的 JSON 结果渲染成表格 / 图表 / 任务卡。',
      en: 'Render function-calling JSON results as tables, charts or task cards.',
    },
    points: [
      { 'zh-CN': '回答帧带 contentType（table / echart / list / taskTable），前端按类型分发给富卡片组件。', en: 'Answer frames carry a contentType (table / echart / list / taskTable); the frontend dispatches to rich card widgets by type.' },
      { 'zh-CN': '卡片操作（导出 CSV、批量执行、切图表）通过回传 taskId 走独立端点，与正文解耦。', en: 'Card actions (CSV export, batch execution, chart switch) go through dedicated endpoints with taskIds, decoupled from the text body.' },
      { 'zh-CN': '本项目 ChatBot 的 AnswerWidget 即此模式，可注入真实后端复用。', en: 'This project\'s ChatBot AnswerWidget implements exactly this pattern and accepts a real backend via injection.' },
    ],
  },
  {
    id: 'reasoning-ui',
    cat: 'frontend',
    alias: 'CoT / Thinking',
    name: { 'zh-CN': '思考链可视化', en: 'Reasoning Visualization' },
    desc: {
      'zh-CN': '展示「已思考 X 秒」与步骤耗时，透明化推理过程。',
      en: 'Show "thought for X seconds" with per-step latency to make reasoning transparent.',
    },
    points: [
      { 'zh-CN': '推理模型（o系列 / DeepSeek-R1 / Qwen-Thinking）输出 reasoning 内容，单独展示不混入正文。', en: 'Reasoning models (o-series, DeepSeek-R1, Qwen-Thinking) emit reasoning content; show it separately, never mixed into the answer.' },
      { 'zh-CN': '步骤流（steps 帧）记录每阶段耗时，收口后可展开回看。', en: 'A steps frame records per-phase latency, expandable after the round finishes.' },
      { 'zh-CN': 'ThinkingStrip 是纯 UI 实现，跟随主题与减少动效偏好。', en: 'ThinkingStrip is a pure-UI implementation honoring theme tokens and reduced-motion.' },
    ],
  },
  {
    id: 'mcp-client',
    cat: 'frontend',
    alias: 'MCP Client',
    hot: true,
    name: { 'zh-CN': 'MCP 客户端接入', en: 'MCP Client Integration' },
    desc: {
      'zh-CN': '前端作为 MCP Host：工具市场、权限确认与调用进度 UI。',
      en: 'The frontend as MCP host: tool marketplace, permission prompts and call progress UI.',
    },
    points: [
      { 'zh-CN': 'MCP 三原语：Tools（可调用函数）、Resources（可读数据）、Prompts（提示模板）。', en: 'MCP has three primitives: Tools (callable functions), Resources (readable data) and Prompts (templates).' },
      { 'zh-CN': '工具首次调用要弹权限确认（allow once / always），这是桌面级 Agent 应用的标配交互。', en: 'First tool invocation requires a permission prompt (allow once / always) — a must-have interaction for desktop-grade agent apps.' },
      { 'zh-CN': 'stdio 用于本地进程，Streamable HTTP 用于远程服务。', en: 'stdio transports local processes; Streamable HTTP serves remote servers.' },
    ],
  },
  {
    id: 'multimodal-ui',
    cat: 'frontend',
    alias: 'Voice / Vision',
    name: { 'zh-CN': '多模态输入', en: 'Multimodal Input' },
    desc: {
      'zh-CN': '语音 ASR、图片上传与文件上下文的统一输入体验。',
      en: 'Unified input experience for voice ASR, image upload and file context.',
    },
    points: [
      { 'zh-CN': '语音用 WebSocket ASR 流式转写（VAD 断句），本项目已预留 useVoiceToText 思路。', en: 'Voice uses streaming WebSocket ASR with VAD segmentation; this project reserves the useVoiceToText approach.' },
      { 'zh-CN': '图片走 base64 / URL 混合上传，前端做压缩与格式白名单。', en: 'Images upload as base64 or URL with client-side compression and format whitelisting.' },
      { 'zh-CN': '文件上下文（PDF/代码）先切片再随消息发送，UI 需显示解析进度。', en: 'File context (PDF/code) is chunked before sending; the UI should show parsing progress.' },
    ],
  },
  {
    id: 'session-ui',
    cat: 'frontend',
    alias: 'Sessions / Share',
    name: { 'zh-CN': '多会话与分享', en: 'Sessions & Sharing' },
    desc: {
      'zh-CN': '会话列表、历史回放与只读分享链接，Agent 应用的留存基础。',
      en: 'Session list, history replay and read-only share links — the retention backbone of agent apps.',
    },
    points: [
      { 'zh-CN': 'sessionId 续写锚点：新一轮停止帧回传 sessionId，续问带上即可续写上下文。', en: 'sessionId as continuation anchor: each stop frame returns it and the next ask passes it back.' },
      { 'zh-CN': '分享协议把选中轮次组装成只读 items，末条带 sessionId 支持接力追问。', en: 'The share protocol packs selected rounds into read-only items; the last carries sessionId for follow-ups.' },
      { 'zh-CN': '本项目 QASharing 即完整实现（ConversationList + SharedConversationView）。', en: 'This project\'s QASharing is a complete implementation (ConversationList + SharedConversationView).' },
    ],
  },
  {
    id: 'react-loop',
    cat: 'backend',
    alias: 'ReAct',
    hot: true,
    name: { 'zh-CN': 'ReAct 循环', en: 'ReAct Loop' },
    desc: {
      'zh-CN': 'Reason + Act 交替的 Agent 主循环，一切框架的内核。',
      en: 'The Reason + Act loop — the kernel inside every agent framework.',
    },
    points: [
      { 'zh-CN': '循环体：模型推理 → 解析工具调用 → 执行工具 → 结果回填 → 再次推理，直到不再调用工具。', en: 'Loop: model inference → parse tool call → run tool → feed result back → infer again, until no tool is called.' },
      { 'zh-CN': '工程要点：最大迭代数、工具超时、失败重试与整体预算控制。', en: 'Engineering essentials: max iterations, tool timeouts, retry policy and overall budget control.' },
      { 'zh-CN': '现代实现不再解析文本 ReAct，而是用原生 function calling 多轮。', en: 'Modern implementations drop text-based ReAct parsing in favor of native multi-turn function calling.' },
    ],
  },
  {
    id: 'function-calling',
    cat: 'backend',
    alias: 'Tool Use',
    hot: true,
    name: { 'zh-CN': 'Function Calling / Tool Use', en: 'Function Calling / Tool Use' },
    desc: {
      'zh-CN': '用 JSON Schema 描述工具，让模型结构化地「调 API」。',
      en: 'Describe tools with JSON Schema so the model calls APIs structurally.',
    },
    points: [
      { 'zh-CN': 'tools 数组传 JSON Schema（name/description/parameters），模型返回 tool_calls 而非文本。', en: 'Pass a tools array of JSON Schema (name/description/parameters); the model returns tool_calls instead of text.' },
      { 'zh-CN': 'description 写得越具体，选择越准；参数枚举与 required 是防幻觉的关键。', en: 'Sharper descriptions mean better tool choice; parameter enums and required fields are the anti-hallucination keys.' },
      { 'zh-CN': 'OpenAI / Anthropic / Gemini 协议同构，网关层可做一次适配多端复用。', en: 'OpenAI / Anthropic / Gemini protocols are isomorphic; one gateway adapter serves them all.' },
    ],
  },
  {
    id: 'rag',
    cat: 'backend',
    alias: 'RAG',
    hot: true,
    name: { 'zh-CN': 'RAG 检索增强', en: 'RAG (Retrieval-Augmented Generation)' },
    desc: {
      'zh-CN': '向量检索外挂知识库，企业落地的第一形态。',
      en: 'Vector-retrieved external knowledge — the first form of enterprise adoption.',
    },
    points: [
      { 'zh-CN': '链路：切片 → embedding 入库（Milvus/pgvector/Qdrant）→ 检索 top-k → rerank → 拼上下文。', en: 'Pipeline: chunk → embed into a vector store (Milvus/pgvector/Qdrant) → retrieve top-k → rerank → assemble context.' },
      { 'zh-CN': '引用溯源（每段回答标注来源片段）是企业刚需，也是幻觉治理手段。', en: 'Citation tracing (annotating answer segments with sources) is an enterprise must-have and a hallucination countermeasure.' },
      { 'zh-CN': '进阶：GraphRAG（知识图谱）、HyDE（假设文档检索）、多路召回融合。', en: 'Advanced: GraphRAG (knowledge graph), HyDE (hypothetical document retrieval), multi-way recall fusion.' },
    ],
  },
  {
    id: 'memory',
    cat: 'backend',
    alias: 'Memory',
    name: { 'zh-CN': '记忆系统', en: 'Memory Systems' },
    desc: {
      'zh-CN': '短期窗口 + 长期向量 + 摘要压缩的三层记忆。',
      en: 'Three-tier memory: short-term window, long-term vectors and summary compression.',
    },
    points: [
      { 'zh-CN': '短期 = 会话内上下文窗口；长期 = 跨会话向量库；摘要 = 超长对话压缩成记忆卡。', en: 'Short-term = in-session context window; long-term = cross-session vector store; summary = compressing long threads into memory cards.' },
      { 'zh-CN': '写入策略比读取更关键：什么值得记、何时去重、何时过期。', en: 'Write policy matters more than reads: what to memorize, when to dedupe, when to expire.' },
      { 'zh-CN': '主流方案：Mem0、LangGraph Memory、OpenAI Assistants Threads。', en: 'Mainstream options: Mem0, LangGraph Memory, OpenAI Assistants Threads.' },
    ],
  },
  {
    id: 'multi-agent',
    cat: 'backend',
    alias: 'Orchestration',
    name: { 'zh-CN': '多智能体编排', en: 'Multi-agent Orchestration' },
    desc: {
      'zh-CN': 'Planner-Worker、状态图与智能体互联三种主流编排。',
      en: 'Three mainstream orchestrations: planner-worker, state graphs and agent interconnect.',
    },
    points: [
      { 'zh-CN': 'LangGraph 用图状态机编排（节点=步骤，边=路由），生产级首选。', en: 'LangGraph orchestrates with graph state machines (nodes = steps, edges = routing) — the production choice.' },
      { 'zh-CN': 'Planner-Worker（计划分发）与 Debate/Critic（辩论批判）提升复杂任务质量。', en: 'Planner-Worker and Debate/Critic patterns improve quality on complex tasks.' },
      { 'zh-CN': 'A2A 协议让不同厂商的 Agent 互相发现与协作。', en: 'The A2A protocol lets agents from different vendors discover and cooperate with each other.' },
    ],
  },
  {
    id: 'guardrails',
    cat: 'backend',
    alias: 'Eval / Guard',
    name: { 'zh-CN': '评估与护栏', en: 'Evals & Guardrails' },
    desc: {
      'zh-CN': '上线前的评测集、运行时护栏与沙箱执行。',
      en: 'Pre-launch eval sets, runtime guardrails and sandboxed execution.',
    },
    points: [
      { 'zh-CN': '评测：LLM-as-judge + 金标集回归（Ragas / DeepEval / promptfoo）。', en: 'Evals: LLM-as-judge plus golden-set regression (Ragas, DeepEval, promptfoo).' },
      { 'zh-CN': '护栏：输入脱敏、话题白名单、输出审查、工具调用权限分级。', en: 'Guardrails: input sanitization, topic whitelists, output review and tiered tool permissions.' },
      { 'zh-CN': '代码/命令类工具必须沙箱执行（容器 / WASM），并保留审计日志。', en: 'Code/command tools must run sandboxed (container / WASM) with audit logs.' },
    ],
  },
  {
    id: 'proto-mcp',
    cat: 'protocol',
    alias: 'MCP',
    hot: true,
    name: { 'zh-CN': 'MCP 协议', en: 'MCP (Model Context Protocol)' },
    desc: {
      'zh-CN': 'Anthropic 开源的「AI 界 USB-C」，工具生态事实标准。',
      en: 'Anthropic\'s open "USB-C for AI" — the de-facto tool ecosystem standard.',
    },
    points: [
      { 'zh-CN': 'JSON-RPC 2.0 消息，Host（应用）— Client（连接）— Server（能力）三角色。', en: 'JSON-RPC 2.0 messages with three roles: Host (app), Client (connection), Server (capability).' },
      { 'zh-CN': '2025 年后主流 IDE / 桌面应用全部内置，工具市场按 MCP server 分发。', en: 'After 2025 mainstream IDEs and desktop apps ship built-in, with tool marketplaces distributing MCP servers.' },
      { 'zh-CN': '鉴权走 OAuth 2.1，远程服务器用 Streamable HTTP 传输。', en: 'Auth via OAuth 2.1; remote servers use the Streamable HTTP transport.' },
    ],
  },
  {
    id: 'proto-a2a',
    cat: 'protocol',
    alias: 'A2A',
    name: { 'zh-CN': 'A2A 协议', en: 'A2A (Agent-to-Agent)' },
    desc: {
      'zh-CN': 'Google 发起的智能体互联协议，与 MCP 互补。',
      en: 'Google\'s agent interconnect protocol, complementary to MCP.',
    },
    points: [
      { 'zh-CN': 'Agent Card（能力名片）自描述，任务以 Task 对象在 Agent 间流转。', en: 'An Agent Card self-describes capabilities; work flows between agents as Task objects.' },
      { 'zh-CN': 'MCP 解决「Agent ↔ 工具」，A2A 解决「Agent ↔ Agent」。', en: 'MCP solves "agent to tool"; A2A solves "agent to agent".' },
      { 'zh-CN': '企业场景：跨团队 Agent 各管一域，通过 A2A 组合成交付链。', en: 'Enterprise scenario: per-team agents own their domains and chain up via A2A.' },
    ],
  },
  {
    id: 'proto-schema',
    cat: 'protocol',
    alias: 'JSON Schema',
    name: { 'zh-CN': '工具描述规范', en: 'Tool Description Specs' },
    desc: {
      'zh-CN': 'JSON Schema / OpenAPI 让工具定义可移植、可生成。',
      en: 'JSON Schema / OpenAPI make tool definitions portable and generatable.',
    },
    points: [
      { 'zh-CN': 'OpenAPI → tools 自动生成：把现有 REST 服务一键变成 Agent 可调用工具。', en: 'OpenAPI to tools generation: turn existing REST services into agent-callable tools in one step.' },
      { 'zh-CN': 'MCP 的 inputSchema 同样是 JSON Schema，一份数据模型三处复用。', en: 'MCP inputSchema is JSON Schema too — one data model reused in three places.' },
      { 'zh-CN': '严格模式（strict / additionalProperties: false）可显著降低参数幻觉。', en: 'Strict mode (strict / additionalProperties: false) markedly reduces parameter hallucination.' },
    ],
  },
  {
    id: 'fw-langchain',
    cat: 'framework',
    alias: 'LangGraph',
    hot: true,
    name: { 'zh-CN': 'LangChain / LangGraph', en: 'LangChain / LangGraph' },
    desc: {
      'zh-CN': '最流行的编排生态；LangGraph 图状态机是生产级 Agent 首选。',
      en: 'The most popular orchestration ecosystem; LangGraph state machines are the production choice.',
    },
    points: [
      { 'zh-CN': 'LangChain = 组件库（模型/检索/工具），LangGraph = 图编排（持久化、人审、时间旅行调试）。', en: 'LangChain = component library (models/retrieval/tools); LangGraph = graph orchestration with persistence, human-in-the-loop and time-travel debugging.' },
      { 'zh-CN': 'checkpointer 把每步状态落库，崩溃可恢复，支持 pause/resume。', en: 'Checkpointers persist every step so runs are resumable with pause/resume.' },
    ],
  },
  {
    id: 'fw-openai-sdk',
    cat: 'framework',
    alias: 'Agents SDK',
    name: { 'zh-CN': 'OpenAI Agents SDK', en: 'OpenAI Agents SDK' },
    desc: {
      'zh-CN': '轻量三件套：Agent、Handoff、Guardrail，原生 tracing。',
      en: 'A lightweight trio — Agent, Handoff, Guardrail — with native tracing.',
    },
    points: [
      { 'zh-CN': 'Handoff 把控制权在 Agent 间移交，比共享对话更可控。', en: 'Handoffs transfer control between agents, more controllable than shared transcripts.' },
      { 'zh-CN': '内置 Tracing 面板可直接查看每轮工具调用与 token 消耗。', en: 'Built-in tracing visualizes every tool call and token spend per run.' },
    ],
  },
  {
    id: 'fw-autogen',
    cat: 'framework',
    alias: 'AG2',
    name: { 'zh-CN': 'AutoGen / AG2', en: 'AutoGen / AG2' },
    desc: {
      'zh-CN': '微软多智能体对话框架：Agent 互相聊出结果。',
      en: 'Microsoft\'s multi-agent conversation framework: agents talk out the result.',
    },
    points: [
      { 'zh-CN': 'GroupChat 让多个角色轮询发言，适合评审、辩论类任务。', en: 'GroupChat lets multiple roles speak in turn — great for review and debate tasks.' },
      { 'zh-CN': 'v0.4 起事件驱动重构，可分布式部署 Actor 模型。', en: 'Since v0.4 it is event-driven with a distributed actor model.' },
    ],
  },
  {
    id: 'fw-crewai',
    cat: 'framework',
    alias: 'CrewAI',
    name: { 'zh-CN': 'CrewAI', en: 'CrewAI' },
    desc: {
      'zh-CN': '角色扮演式协作：给每个 Agent 一份「岗位说明书」。',
      en: 'Role-playing collaboration: give every agent a job description.',
    },
    points: [
      { 'zh-CN': 'role / goal / backstory 三元组定义角色，Task 显式指派与交付。', en: 'role / goal / backstory triplets define agents; Tasks assign and deliver explicitly.' },
      { 'zh-CN': '上手最快、心智负担最低，适合内容生产、调研类流水线。', en: 'Fastest to onboard with the lowest cognitive load — fits content and research pipelines.' },
    ],
  },
  {
    id: 'fw-dify',
    cat: 'framework',
    alias: 'LLMOps',
    name: { 'zh-CN': 'Dify / Coze', en: 'Dify / Coze' },
    desc: {
      'zh-CN': '低代码 LLMOps 平台：可视化编排、知识库、发布一体化。',
      en: 'Low-code LLMOps platforms: visual orchestration, knowledge base and publishing in one.',
    },
    points: [
      { 'zh-CN': '工作流画布 + 数据集管理 + 多渠道发布（API/网页/插件）。', en: 'Workflow canvas plus dataset management plus multi-channel publishing (API/web/plugin).' },
      { 'zh-CN': '适合业务团队自助搭建；深度定制仍需回到代码框架。', en: 'Great for business teams self-serving; deep customization still returns to code frameworks.' },
    ],
  },
  {
    id: 'fw-vercel-ai',
    cat: 'framework',
    alias: 'AI SDK',
    name: { 'zh-CN': 'Vercel AI SDK', en: 'Vercel AI SDK' },
    desc: {
      'zh-CN': '前端全栈流式首选：useChat / 流式工具调用 / 多模型适配。',
      en: 'The go-to frontend full-stack kit: useChat, streaming tool calls, multi-model adapters.',
    },
    points: [
      { 'zh-CN': 'useChat / useCompletion 封装流式状态，服务端 streamText 一行接多模型。', en: 'useChat / useCompletion wrap streaming state; server-side streamText adapts many models in one line.' },
      { 'zh-CN': 'RSC 生成式 UI：把工具结果直接流成 React 组件，与本页卡片思路同源。', en: 'RSC generative UI streams tool results straight into React components — same idea as this page\'s cards.' },
    ],
  },
]

/* ---------------------------------------------------------------- 框架对比 */

export const FRAMEWORKS = [
  {
    id: 'langgraph',
    name: 'LangChain / LangGraph',
    kind: { 'zh-CN': '代码框架 · 图编排', en: 'Code framework · Graph' },
    lang: 'Python / JS',
    highlight: { 'zh-CN': '生态最全；图状态机、可持久化、人审节点', en: 'Richest ecosystem; graph state machine, persistence, human-in-the-loop' },
    scene: { 'zh-CN': '复杂生产级 Agent', en: 'Complex production agents' },
  },
  {
    id: 'openai-agents',
    name: 'OpenAI Agents SDK',
    kind: { 'zh-CN': '代码框架 · 轻量', en: 'Code framework · Lightweight' },
    lang: 'Python / JS',
    highlight: { 'zh-CN': 'Handoff 移交 + Guardrail + 原生 Tracing', en: 'Handoffs + guardrails + native tracing' },
    scene: { 'zh-CN': 'OpenAI 生态快速起步', en: 'Quick start in the OpenAI ecosystem' },
  },
  {
    id: 'autogen',
    name: 'AutoGen / AG2',
    kind: { 'zh-CN': '多智能体对话', en: 'Multi-agent chat' },
    lang: 'Python',
    highlight: { 'zh-CN': '群聊式协作、事件驱动、可分布式', en: 'Group-chat collaboration, event-driven, distributed' },
    scene: { 'zh-CN': '评审/辩论类研究任务', en: 'Review & debate research tasks' },
  },
  {
    id: 'crewai',
    name: 'CrewAI',
    kind: { 'zh-CN': '角色协作', en: 'Role-based crew' },
    lang: 'Python',
    highlight: { 'zh-CN': 'role/goal/backstory 建模，心智负担低', en: 'role/goal/backstory modeling, low cognitive load' },
    scene: { 'zh-CN': '内容生产、调研流水线', en: 'Content & research pipelines' },
  },
  {
    id: 'dify',
    name: 'Dify / Coze',
    kind: { 'zh-CN': '低代码 LLMOps', en: 'Low-code LLMOps' },
    lang: '可视化',
    highlight: { 'zh-CN': '画布编排 + 知识库 + 多渠道发布', en: 'Canvas orchestration + KB + publishing' },
    scene: { 'zh-CN': '业务团队自助搭建', en: 'Self-serve by business teams' },
  },
  {
    id: 'vercel-ai',
    name: 'Vercel AI SDK',
    kind: { 'zh-CN': '前端全栈', en: 'Frontend full-stack' },
    lang: 'TypeScript',
    highlight: { 'zh-CN': 'useChat 流式 + 生成式 UI + 多模型适配', en: 'useChat streaming + generative UI + adapters' },
    scene: { 'zh-CN': 'Web 端 AI 应用', en: 'Web AI applications' },
  },
]

/* ---------------------------------------------------------------- 提示词模板 */

export const PROMPTS = [
  {
    id: 'react',
    name: { 'zh-CN': 'ReAct 推理模板', en: 'ReAct reasoning template' },
    scene: { 'zh-CN': '让模型显式地「想一步做一步」', en: 'Make the model think one step, act one step' },
    text: {
      'zh-CN': `你是一个严谨的任务执行 Agent。对每个目标，交替输出：
Thought: 当前已知什么、还缺什么、下一步为什么这样做
Action: 要调用的工具名与 JSON 参数
（工具结果由系统回填为 Observation）
当 Thought 判断信息足够时，输出 Final Answer 并给出依据。
约束：一次只调用一个工具；参数必须符合工具 schema；不确定时先取证再回答。`,
      en: `You are a rigorous task-execution agent. For every goal, alternate:
Thought: what is known, what is missing, why the next step
Action: tool name and JSON arguments
(the system fills in Observation from the tool result)
When Thought decides evidence is sufficient, output Final Answer with rationale.
Constraints: one tool call at a time; arguments must match the tool schema; verify before answering.`,
    },
  },
  {
    id: 'tool-system',
    name: { 'zh-CN': '工具调用系统提示', en: 'Tool-use system prompt' },
    scene: { 'zh-CN': '约束模型只在必要时调工具', en: 'Constrain the model to call tools only when needed' },
    text: {
      'zh-CN': `你可以使用以下工具：{tools}
规则：
1. 能直接回答的问题不要调用工具；
2. 调用前先向用户确认涉及写操作（增删改）的意图；
3. 工具失败时说明原因并给出替代方案，不要编造结果；
4. 回答中引用工具结果时注明来自哪个工具。`,
      en: `You may use these tools: {tools}
Rules:
1. Never call a tool for questions you can answer directly;
2. Confirm intent with the user before any write operation;
3. On tool failure explain why and offer alternatives — never fabricate results;
4. When citing tool output, name the tool it came from.`,
    },
  },
  {
    id: 'rag-cite',
    name: { 'zh-CN': 'RAG 引用约束模板', en: 'RAG citation template' },
    scene: { 'zh-CN': '强制引用来源、拒答超纲问题', en: 'Force citations and refuse out-of-scope answers' },
    text: {
      'zh-CN': `基于以下检索片段回答问题，每个关键论断后标注 [n] 来源编号：
{context}
规则：只使用片段中的信息；片段不足以回答时明确说「资料中未提及」；不要输出片段之外的推测。`,
      en: `Answer using only the retrieved passages below, marking key claims with [n]:
{context}
Rules: use only the passages; if they are insufficient, say "not covered in the material"; no speculation beyond them.`,
    },
  },
  {
    id: 'planner',
    name: { 'zh-CN': '多智能体角色模板', en: 'Multi-agent role template' },
    scene: { 'zh-CN': 'Planner / Worker / Critic 分工', en: 'Planner / Worker / Critic split' },
    text: {
      'zh-CN': `你是 Planner：把目标拆成可并行的子任务清单（每项含验收标准），指派给 Worker；
Worker 只执行单个子任务并回报结果；
Critic 依据验收标准挑错，未通过则退回 Worker 重做，最多 2 轮；
全部通过后由 Planner 汇总交付。`,
      en: `You are the Planner: split the goal into parallelizable subtasks (each with acceptance criteria) and assign Workers;
each Worker executes one subtask and reports back;
the Critic checks against criteria, failing items go back to Workers, at most 2 rounds;
the Planner assembles the final delivery once everything passes.`,
    },
  },
  {
    id: 'json-output',
    name: { 'zh-CN': '结构化输出模板', en: 'Structured output template' },
    scene: { 'zh-CN': '稳定产出可解析 JSON', en: 'Produce reliably parseable JSON' },
    text: {
      'zh-CN': `只输出一个 JSON 对象，不要包裹 markdown 代码块，不要输出任何解释文字。
schema：{"summary": string, "steps": [{"title": string, "detail": string, "ms": number}], "confidence": number}
枚举值必须取自：confidence ∈ [0,1]。缺失字段用 null，不要省略键。`,
      en: `Output a single JSON object with no markdown fence and no commentary.
schema: {"summary": string, "steps": [{"title": string, "detail": string, "ms": number}], "confidence": number}
confidence ∈ [0,1]. Use null for missing fields; never omit keys.`,
    },
  },
]
