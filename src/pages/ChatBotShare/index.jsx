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
import { useI18n } from '../../i18n/index.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

import { DEFAULT_SHARE_ID, USAGE, CONTRACT, PITFALLS, WatermarkLayer } from './components/shareParts.jsx'

export default function ChatBotShareDemo() {
  const { t } = useI18n()
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
      antdMessage.success(t('chatbot.share.created', { id: res.id }))
    } catch {
      antdMessage.error(t('chatbot.share.createFailed'))
    } finally {
      setCreating(false)
    }
  }, [api, setShareId, t])

  const shareLink = `${window.location.origin}/share?userShareId=${userShareId}`

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      antdMessage.success(t('chatbot.share.linkCopied'))
    } catch {
      antdMessage.warning(t('chatbot.share.copyFailed'))
    }
  }, [shareLink, t])

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
          {t('chatbot.share.pageTitle')}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 10 }}>
          {t('chatbot.share.pageDesc')}
        </Paragraph>
        <Space wrap size={6}>
          <Tag color="blue">{t('chatbot.share.tagReadonly')}</Tag>
          <Tag color="purple">{t('chatbot.share.tagRequest')}</Tag>
          <Tag color="cyan">{t('chatbot.share.tagCards')}</Tag>
          <Tag color="green">{t('chatbot.share.tagContinue')}</Tag>
          <Tag color="orange">{t('chatbot.share.tagWatermark')}</Tag>
          <Tag color="gold">{t('chatbot.share.tagAnonymous')}</Tag>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Card size="small" title={t('chatbot.share.previewTitle')}>
              <div className="share-demo__toolbar">
                <Space wrap size={12}>
                  <span className="share-demo__field">
                    <Text type="secondary">{t('chatbot.share.shareId')}</Text>
                    <Text code>{userShareId}</Text>
                  </span>
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlusOutlined />}
                    loading={creating}
                    onClick={createShare}
                  >
                    {t('chatbot.share.createNew')}
                  </Button>
                  <Button size="small" icon={<CopyOutlined />} onClick={copyLink}>
                    {t('chatbot.share.copyLink')}
                  </Button>
                  {userShareId !== DEFAULT_SHARE_ID && (
                    <Button size="small" type="link" onClick={() => setShareId(DEFAULT_SHARE_ID)}>
                      {t('chatbot.share.backToDemo')}
                    </Button>
                  )}
                </Space>

                <Divider style={{ margin: '10px 0' }} />

                <Space wrap size={16}>
                  <span className="share-demo__switch">
                    <Switch size="small" checked={useCards} onChange={setUseCards} />
                    <Text type="secondary">{t('chatbot.share.injectCards')}</Text>
                  </span>
                  <span className="share-demo__switch">
                    <Switch size="small" checked={showContinue} onChange={setShowContinue} />
                    <Text type="secondary">{t('chatbot.share.showContinue')}</Text>
                  </span>
                  <span className="share-demo__switch">
                    <Switch size="small" checked={withWatermark} onChange={setWithWatermark} />
                    <Text type="secondary">{t('chatbot.share.renderWatermark')}</Text>
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
                        <WatermarkLayer text={t('chatbot.share.watermark', { id: sid })} />
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
              message={t('chatbot.share.linkAlert', { id: userShareId })}
              description={t('chatbot.share.linkAlertDesc')}
            />

            <Card size="small" title={t('chatbot.share.contractTitle')}>
              <pre className="share-demo__code">{CONTRACT}</pre>
            </Card>

            <Card size="small" title={t('chatbot.share.pitfallsTitle')}>
              <ul className="share-demo__list">
                {PITFALLS.map(([k, v]) => (
                  <li key={k}>
                    <Text strong>{k}</Text>
                    <span className="share-demo__desc">{v}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card size="small" title={t('chatbot.share.usageTitle')}>
              <pre className="share-demo__code">{USAGE}</pre>
            </Card>

            <Card size="small" title={t('chatbot.share.shapeTitle')}>
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
        title={t('chatbot.share.modalTitle')}
        onCancel={() => setHandoff(null)}
        onOk={() => {
          setHandoff(null)
          navigate('/chatbot')
        }}
        okText={t('chatbot.share.modalOk')}
        cancelText={t('chatbot.share.modalCancel')}
      >
        <Paragraph style={{ marginBottom: 8 }}>
          {t('chatbot.share.modalDesc1')}<Text code>useEffect</Text>{t('chatbot.share.modalDesc2')}<Text code>setContinuedId(最后一条 sessionDetailId)</Text>{t('chatbot.share.modalDesc3')}<Text code>postMessage</Text>{t('chatbot.share.modalDesc4')}<Text code>continuedId</Text>{t('chatbot.share.modalDesc5')}
        </Paragraph>
        <ul className="share-demo__list">
          <li>
            <Text strong>userShareId</Text>
            <span className="share-demo__desc">{handoff?.id || '-'}</span>
          </li>
          <li>
            <Text strong>sessionId</Text>
            <span className="share-demo__desc">{handoff?.sessionId || t('chatbot.share.emptyValue')}</span>
          </li>
          <li>
            <Text strong>{t('chatbot.share.roundsLabel')}</Text>
            <span className="share-demo__desc">{handoff?.rounds ?? 0}</span>
          </li>
        </ul>
        <Space size={4}>
          <RobotOutlined />
          <Text type="secondary">{t('chatbot.share.mockNote')}</Text>
        </Space>
      </Modal>

      <div className="share-demo__foot">
        <Space size={6} split={<Divider type="vertical" />}>
          <span>
            <UserOutlined /> {t('chatbot.share.noWatermark')}
          </span>
          <span>
            <LinkOutlined /> {t('chatbot.share.routeLabel')}<Text code>/share</Text>
          </span>
          <span>
            <RobotOutlined /> {t('chatbot.share.docsLabel')}<Text code>src/components/ChatBot/sharing/README.md</Text>
          </span>
        </Space>
      </div>
    </div>
  )
}
