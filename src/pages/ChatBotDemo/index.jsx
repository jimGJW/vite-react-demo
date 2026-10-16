import { Alert, Card, Col, Row, Space, Tag, Typography } from 'antd'
import { ChatBot } from '../../components/ChatBot/index.js'
import { useI18n } from '../../i18n/index.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography


import { USAGE, PROTOCOL } from './components/chatbotConsts.js'

export default function ChatBotDemo() {
  const { t } = useI18n()
  return (
    <div className="chatbot-demo">
      <div className="chatbot-demo__head">
        <Title level={3} style={{ marginBottom: 6 }}>
          {t('chatbot.demo.title')}
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 10 }}>
          {t('chatbot.demo.desc')}
        </Paragraph>
        <Space wrap size={6}>
          <Tag color="blue">{t('chatbot.demo.tagStream')}</Tag>
          <Tag color="purple">{t('chatbot.demo.tagMarkdown')}</Tag>
          <Tag color="cyan">{t('chatbot.demo.tagCards')}</Tag>
          <Tag color="green">{t('chatbot.demo.tagHistory')}</Tag>
          <Tag color="orange">{t('chatbot.demo.tagFeedback')}</Tag>
          <Tag color="gold">{t('chatbot.demo.tagStop')}</Tag>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <ChatBot
            title={t('chatbot.header.title')}
            subtitle={t('chatbot.header.subtitle')}
            height={640}
            recommend={[
              t('chatbot.demo.recommendTable'),
              t('chatbot.demo.recommendChart'),
              t('chatbot.demo.recommendList'),
              t('chatbot.demo.recommendTask'),
            ]}
          />
        </Col>

        <Col xs={24} xl={9}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message={t('chatbot.demo.mockTitle')}
              description={t('chatbot.demo.mockDesc')}
            />

            <Card size="small" title={t('chatbot.demo.capsTitle')}>
              <ul className="chatbot-demo__list">
                <li>{t('chatbot.demo.capsStream')}</li>
                <li>{t('chatbot.demo.capsResetPre')}<Text code>body-reset</Text>{t('chatbot.demo.capsResetPost')}</li>
                <li>{t('chatbot.demo.capsCards')}</li>
                <li>{t('chatbot.demo.capsCsv')}</li>
                <li>{t('chatbot.demo.capsBatch')}</li>
                <li>{t('chatbot.demo.capsHistory')}</li>
                <li>{t('chatbot.demo.capsFeedback')}</li>
                <li>{t('chatbot.demo.capsStick')}</li>
                <li>{t('chatbot.demo.capsRender')}</li>
              </ul>
            </Card>

            <Card size="small" title={t('chatbot.demo.usageTitle')}>
              <pre className="chatbot-demo__code">{USAGE}</pre>
            </Card>

            <Card size="small" title={t('chatbot.demo.protocolTitle')}>
              <pre className="chatbot-demo__code">{PROTOCOL}</pre>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  )
}
