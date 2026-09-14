import { Alert, Card, Col, Row, Space, Tag, Typography } from 'antd'
import { ChatBot } from '../../components/ChatBot/index.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

const USAGE = `// 1) 开箱即用：内置模拟后端，直接渲染即可
import { ChatBot } from '../../components/ChatBot'
<ChatBot title="AI 助手" height={620} />

// 2) 接入真实后端：注入自己的请求封装
import { createHttpApi, ChatBot } from '../../components/ChatBot'
const api = createHttpApi({
  baseURL: '/gateway',
  getToken: () => localStorage.getItem('token'),
  endpoints: { generation: '/aigc/generation' },  // 按需覆盖
})
<ChatBot api={api} userId={uid} title="AI 助手" />

// 3) 只要逻辑，自己写 UI
import { useMessage, createHttpApi } from '../../components/ChatBot'
const chat = useMessage({ api: createHttpApi({ baseURL }) })`

const PROTOCOL = `① 状态帧  { type:"status", state:"body-reset"|其它, message:"正在查询…" }
② 内容帧  { output:{ choices:[{ finish_reason, message:{ content, contentType, title } }] } }
③ 错误帧  { code: "1001" | "2001" | "2002" | ... }

累积规则（chatStream.js）：
· 只累加「无 contentType 且非 stop」的纯文本帧
· 正文一到，立刻撤掉状态条
· stop 帧的 content 是最终权威正文（避免重复追加）`

export default function ChatBotDemo() {
  return (
    <div className="chatbot-demo">
      <div className="chatbot-demo__head">
        <Title level={3} style={{ marginBottom: 6 }}>
          ChatBot · 流式对话助手
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 10 }}>
          从云端文档库复用的「流式对话 + 卡片渲染」能力，已去除内部标识与业务耦合，
          按本项目技术栈（React 19 / antd 5 / ECharts 6 / Sass）重写为可注入后端、可独立复用的模块。
        </Paragraph>
        <Space wrap size={6}>
          <Tag color="blue">逐行 JSON 流式</Tag>
          <Tag color="purple">Markdown</Tag>
          <Tag color="cyan">列表 / 表格 / 图表 / 任务卡片</Tag>
          <Tag color="green">历史会话</Tag>
          <Tag color="orange">赞踩反馈</Tag>
          <Tag color="gold">停止 / 重新生成</Tag>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <ChatBot
            title="AI 助手"
            subtitle="流式对话 · 卡片渲染 · 历史会话"
            height={640}
            recommend={[
              '用表格展示最近的监测数据',
              '画一张温度趋势折线图',
              '给我一份资源清单',
              '列一个任务列表并支持批量导出',
            ]}
          />
        </Col>

        <Col xs={24} xl={9}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message="当前使用内置模拟后端"
              description="无需后端即可体验完整链路：状态帧 → 内容帧 → stop 帧、四类卡片、历史会话与赞踩。接入真实接口时通过 api 属性注入即可。"
            />

            <Card size="small" title="能力清单">
              <ul className="chatbot-demo__list">
                <li>流式回答 + 状态条（工具调用进度）</li>
                <li>正文 <Text code>body-reset</Text> 重置与 stop 帧收口</li>
                <li>列表 / 表格 / 折线图 / 任务表四类卡片</li>
                <li>表格导出 CSV、含时间字段可切图表（多数值列画成多序列）</li>
                <li>任务表勾选批量打包导出（轮询）</li>
                <li>历史会话：列表 / 详情回读 / 删除 / 清空</li>
                <li>赞踩反馈、复制、重新生成、停止生成</li>
                <li>智能吸底：上翻阅读时不被拽回，回到底部自动跟随</li>
                <li>渲染优化：流式期间只重绘正在生成的那一条气泡</li>
              </ul>
            </Card>

            <Card size="small" title="接入方式">
              <pre className="chatbot-demo__code">{USAGE}</pre>
            </Card>

            <Card size="small" title="流协议要点（已抽象为纯函数）">
              <pre className="chatbot-demo__code">{PROTOCOL}</pre>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  )
}
