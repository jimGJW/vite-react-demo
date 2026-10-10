import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Modal,
  Row,
  Space,
  Switch,
  Tag,
  Typography,
  message as antdMessage,
} from 'antd'
import {
  CopyOutlined,
  LinkOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  SharedConversationView,
  createMockApi,
  createSharedRenderers,
  toShareRequest,
} from '../../components/ChatBot/index.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

import { DEFAULT_SHARE_ID, USAGE, CONTRACT, PITFALLS, WatermarkLayer } from './components/shareParts.jsx'

export default function ChatBotShareDemo() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const api = useMemo(() => createMockApi(), [])
  const request = useMemo(() => toShareRequest(api), [api])

  const userShareId = searchParams.get('userShareId') || DEFAULT_SHARE_ID

  const [useCards, setUseCards] = useState(true)
  const [withWatermark, setWithWatermark] = useState(false)
  const [showContinue, setShowContinue] = useState(true)
  const [creating, setCreating] = useState(false)
  const [handoff, setHandoff] = useState(null)

  const renderers = useMemo(
    () => (useCards ? createSharedRenderers({ api }) : {}),
    [useCards, api],
  )

  const setShareId = useCallback(
    (id) => setSearchParams(id === DEFAULT_SHARE_ID ? {} : { userShareId: id }, { replace: true }),
    [setSearchParams],
  )

  /** 演示闭环 ①：勾选若干轮对话 → POST /aigc/share → 拿到分享 ID */
  const createShare = useCallback(async () => {
    setCreating(true)
    try {
      const res = await api.post(api.endpoints.share, { sessionDetailIds: [] })
      setShareId(res.id)
      antdMessage.success(`已生成分享：${res.id}`)
    } catch {
      antdMessage.error('生成分享失败')
    } finally {
      setCreating(false)
    }
  }, [api, setShareId])

  const shareLink = `${window.location.origin}/share?userShareId=${userShareId}`

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      antdMessage.success('分享链接已复制')
    } catch {
      antdMessage.warning('复制失败，请手动选择链接')
    }
  }, [shareLink])

  /** 演示闭环 ③：续写锚点交回主聊天页（真实项目里由主页面接手 setContinuedId） */
  const onContinue = useCallback((id, payload) => {
    setHandoff({ id, sessionId: payload?.sessionId, rounds: payload?.data?.length ?? 0 })
  }, [])

  const onLoaded = useCallback(({ data, sessionId, userShareId: id }) => {
    // 真实项目在这里埋点：util.log({ type: '查看分享问答', target: `分享ID: ${id}` })
    console.log('[share] loaded', { id, sessionId, rounds: data.length })
  }, [])

  return (
    <div className="share-demo">
      <div className="share-demo__head">
        <Title level={3} style={{ marginBottom: 6 }}>
          QASharing · 对话分享只读页
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 10 }}>
          从云端文档库复用的「对话分享落地页」能力：A 勾选几轮对话生成分享，B（
          可能未登录）打开链接只读浏览，并可「继续追问」跳回主聊天。
          组件不发消息、不流式，只做「取数据 → 只读渲染 → 给一个续写入口」。
        </Paragraph>
        <Space wrap size={6}>
          <Tag color="blue">只读落地页</Tag>
          <Tag color="purple">可注入请求</Tag>
          <Tag color="cyan">卡片渲染器可插拔</Tag>
          <Tag color="green">续写回调</Tag>
          <Tag color="orange">水印插槽</Tag>
          <Tag color="gold">匿名可访问</Tag>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Card size="small" title="分享预览（模拟 B 用户视角）">
              <div className="share-demo__toolbar">
                <Space wrap size={12}>
                  <span className="share-demo__field">
                    <Text type="secondary">分享 ID</Text>
                    <Text code>{userShareId}</Text>
                  </span>
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlusOutlined />}
                    loading={creating}
                    onClick={createShare}
                  >
                    生成新的分享
                  </Button>
                  <Button size="small" icon={<CopyOutlined />} onClick={copyLink}>
                    复制分享链接
                  </Button>
                  {userShareId !== DEFAULT_SHARE_ID && (
                    <Button size="small" type="link" onClick={() => setShareId(DEFAULT_SHARE_ID)}>
                      回到示例分享
                    </Button>
                  )}
                </Space>

                <Divider style={{ margin: '10px 0' }} />

                <Space wrap size={16}>
                  <span className="share-demo__switch">
                    <Switch size="small" checked={useCards} onChange={setUseCards} />
                    <Text type="secondary">注入四类卡片渲染器</Text>
                  </span>
                  <span className="share-demo__switch">
                    <Switch size="small" checked={showContinue} onChange={setShowContinue} />
                    <Text type="secondary">显示「继续追问」</Text>
                  </span>
                  <span className="share-demo__switch">
                    <Switch size="small" checked={withWatermark} onChange={setWithWatermark} />
                    <Text type="secondary">渲染水印插槽</Text>
                  </span>
                </Space>
              </div>
            </Card>

            <div className="share-demo__stage">
              <SharedConversationView
                userShareId={userShareId}
                request={request}
                api={{ getShareMessage: api.endpoints.shareMessage }}
                renderers={renderers}
                showContinue={showContinue}
                onContinue={onContinue}
                onLoaded={onLoaded}
                renderWatermark={
                  withWatermark
                    ? ({ userShareId: sid }) => (
                        <WatermarkLayer text={`AI 生成内容 · ${sid}`} />
                      )
                    : undefined
                }
              />
            </div>
          </Space>
        </Col>

        <Col xs={24} xl={9}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="success"
              showIcon
              message={`分享链接：/share?userShareId=${userShareId}`}
              description="分享页是独立路由，不依赖登录态即可打开。点「生成新的分享」会走一次 POST /aigc/share，拿到新 ID 后立即回读，演示完整闭环。"
            />

            <Card size="small" title="链路与接口契约">
              <pre className="share-demo__code">{CONTRACT}</pre>
            </Card>

            <Card size="small" title="组件已修掉的 6 个坑">
              <ul className="share-demo__list">
                {PITFALLS.map(([k, v]) => (
                  <li key={k}>
                    <Text strong>{k}</Text>
                    <span className="share-demo__desc">{v}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card size="small" title="接入方式">
              <pre className="share-demo__code">{USAGE}</pre>
            </Card>

            <Card size="small" title="分享数据形态">
              <pre className="share-demo__code">{`ConversationItem = {
  sessionDetailId: string   // '0000' → 「全新的开始」分隔条
  sessionId?: string        // 末条带，作为续写锚点
  conversation: [
    { type: 0, message },                              // 用户
    { type: 1, message, contentType?, title?, taskIds? } // 助手
  ]
}
contentType ∈ list | table | taskTable | echart | 空(Markdown)`}</pre>
            </Card>
          </Space>
        </Col>
      </Row>

      <Modal
        open={!!handoff}
        title="续写锚点已交回主聊天页"
        onCancel={() => setHandoff(null)}
        onOk={() => {
          setHandoff(null)
          navigate('/chatbot')
        }}
        okText="前往主聊天页"
        cancelText="留在此页"
      >
        <Paragraph style={{ marginBottom: 8 }}>
          真实项目里，主聊天页会在 <Text code>useEffect</Text> 中接收这两个参数，
          调用 <Text code>setContinuedId(最后一条 sessionDetailId)</Text>，
          之后 <Text code>postMessage</Text> 带上 <Text code>continuedId</Text>，后端就能接着上下文回答。
        </Paragraph>
        <ul className="share-demo__list">
          <li>
            <Text strong>userShareId</Text>
            <span className="share-demo__desc">{handoff?.id || '-'}</span>
          </li>
          <li>
            <Text strong>sessionId</Text>
            <span className="share-demo__desc">{handoff?.sessionId || '（空）'}</span>
          </li>
          <li>
            <Text strong>首屏轮数</Text>
            <span className="share-demo__desc">{handoff?.rounds ?? 0}</span>
          </li>
        </ul>
        <Space size={4}>
          <RobotOutlined />
          <Text type="secondary">
            本页演示用内置模拟后端；真实接入时把 request 换成你自己的客户端即可。
          </Text>
        </Space>
      </Modal>

      <div className="share-demo__foot">
        <Space size={6} split={<Divider type="vertical" />}>
          <span>
            <UserOutlined /> 分享页默认不加水印
          </span>
          <span>
            <LinkOutlined /> 路由 <Text code>/share</Text>
          </span>
          <span>
            <RobotOutlined /> 完整文档见 <Text code>src/components/ChatBot/sharing/README.md</Text>
          </span>
        </Space>
      </div>
    </div>
  )
}
