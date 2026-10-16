import { useState } from 'react'
import { Card, Col, Row, Space, Switch, Tag, Typography } from 'antd'
const { Paragraph, Text } = Typography
import {
  AutoScrollText, FloatingBall, InfiniteScroll,
  PullToRefresh, SignaturePad,
  SortableList,
} from '../../../components/Kit/index.js'
import { INITIAL_CARDS, makeRows } from './KitData.js'
import { ArrowUpOutlined } from '@ant-design/icons'
import { useI18n, pickLang } from '../../../i18n/index.js'

export default function InteractionTab() {
  const { t, lang } = useI18n()
  const [signature, setSignature] = useState('')
  const [pullItems, setPullItems] = useState([
    { id: 'p0', text: t('kit.pull.tipDrag') },
    { id: 'p1', text: t('kit.pull.tipRefresh') },
  ])
  const [rows, setRows] = useState(() => makeRows(0, 6))
  const [loadingMore, setLoadingMore] = useState(false)
  const [cards, setCards] = useState(INITIAL_CARDS)
  const [ballVisible, setBallVisible] = useState(true)
  const [ballPos, setBallPos] = useState(null)

  const hasMore = rows.length < 36

  const handleRefresh = () =>
    new Promise((resolve) => {
      setTimeout(() => {
        setPullItems((prev) => [
          { id: `p_${Date.now()}`, text: t('kit.pull.refreshedAt', { time: new Date().toLocaleTimeString(lang) }) },
          ...prev,
        ])
        resolve()
      }, 900)
    })

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return Promise.resolve()
    setLoadingMore(true)
    return new Promise((resolve) => {
      setTimeout(() => {
        setRows((prev) => [...prev, ...makeRows(prev.length, 6)])
        setLoadingMore(false)
        resolve()
      }, 800)
    })
  }

  const scrollToTop = () => {
    document.querySelector('.app-main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card size="small" title={t('kit.inter.signTitle')} extra={<Tag color="blue">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.inter.signDesc')}
          </Paragraph>
          <SignaturePad value={signature} onChange={setSignature} height={180} />
          <div className="kit-demo__status">
            {signature ? t('kit.sign.generated', { bytes: signature.length }) : t('kit.sign.empty')}
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" title={t('kit.inter.pullTitle')} extra={<Tag color="blue">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.inter.pullDesc')}
          </Paragraph>
          <PullToRefresh height={220} onRefresh={handleRefresh}>
            <div className="kit-demo__list">
              {pullItems.map((item) => (
                <div className="kit-demo__list-item" key={item.id}>{item.text}</div>
              ))}
            </div>
          </PullToRefresh>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" title={t('kit.inter.infiniteTitle')} extra={<Tag color="blue">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.inter.infiniteDesc', { loaded: rows.length })}
          </Paragraph>
          <div style={{ height: 240, overflowY: 'auto' }}>
            <InfiniteScroll
              hasMore={hasMore}
              loading={loadingMore}
              onLoadMore={handleLoadMore}
              endText={t('kit.inter.infiniteEnd')}
            >
              <div className="kit-demo__list">
                {rows.map((row) => (
                  <div className="kit-demo__list-item" key={row.id}>
                    <span>{t('kit.data.rowTitle', { no: row.no })}</span>
                    <Text type="secondary">{row.time}</Text>
                  </div>
                ))}
              </div>
            </InfiniteScroll>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" title={t('kit.inter.sortTitle')} extra={<Tag color="blue">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.inter.sortDesc')}
          </Paragraph>
          <SortableList
            items={cards}
            onChange={setCards}
            keyOf={(item) => item.key}
            renderItem={(item, index, { dragging }) => (
              <div className="kit-demo__sort-row">
                <div>
                  <div className="kit-demo__sort-title">
                    {index + 1}. {pickLang(item.title, lang)}
                    {dragging && <Tag color="processing" style={{ marginLeft: 8 }}>{t('kit.inter.dragging')}</Tag>}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{pickLang(item.desc, lang)}</Text>
                </div>
                <Switch
                  size="small"
                  checked={item.visible}
                  onChange={(checked) =>
                    setCards((prev) =>
                      prev.map((card) => (card.key === item.key ? { ...card, visible: checked } : card)),
                    )
                  }
                />
              </div>
            )}
          />
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" title={t('kit.inter.marqueeTitle')} extra={<Tag color="blue">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.inter.marqueeDesc')}
          </Paragraph>
          <div className="kit-demo__marquee">
            <AutoScrollText text={t('kit.data.longText')} speed={70} />
          </div>
          <div className="kit-demo__marquee is-narrow">
            <AutoScrollText text={t('kit.inter.marqueeShort')} speed={70} />
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          size="small"
          title={t('kit.inter.ballTitle')}
          extra={
            <Space size={8}>
              <Tag color="blue">mobile</Tag>
              <Switch
                size="small"
                checked={ballVisible}
                onChange={setBallVisible}
                checkedChildren={t('kit.inter.ballShow')}
                unCheckedChildren={t('kit.inter.ballHide')}
              />
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            {t('kit.inter.ballDesc')}
          </Paragraph>
          <div className="kit-demo__status">
            {ballPos ? t('kit.ball.position', { left: ballPos.left, top: ballPos.top }) : t('kit.ball.hint')}
          </div>
          {ballVisible && (
            <FloatingBall storageKey="kit.demo.ball" tooltip={t('kit.ball.backTop')} onClick={scrollToTop} onPositionChange={setBallPos}>
              <ArrowUpOutlined />
            </FloatingBall>
          )}
        </Card>
      </Col>
    </Row>
  )
}
