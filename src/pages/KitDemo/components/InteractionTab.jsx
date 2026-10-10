import { useMemo, useState } from 'react'
import { Button, Card, Col, Row, Space, Switch, Tag, Typography } from 'antd'
const { Paragraph, Text } = Typography
import {
  AsyncSelect, AutoScrollText, Countdown, Ellipsis, FloatingBall, InfiniteScroll,
  MiniArea, MiniBar, MiniProgress, NoticePanel, PullToRefresh, SignaturePad,
  SortableList, StatCard, TagInput, TimeRangeInput, TimelineChart, WaterWave,
} from '../../../components/Kit/index.js'
import { LONG_TEXT, DEVICES, STAT_AREA, STAT_BAR, TIMELINE, NOTICE_TABS, DEFAULT_RANGES, OVERLAP_RANGES, INITIAL_CARDS, INITIAL_TAGS, COUNTDOWN_TARGET, makeRows, loadDevices } from './KitData.js'
import { ArrowUpOutlined, ReloadOutlined } from '@ant-design/icons'

export default function InteractionTab() {
  const [signature, setSignature] = useState('')
  const [pullItems, setPullItems] = useState([
    { id: 'p0', text: '下拉试试（鼠标拖拽同样有效）' },
    { id: 'p1', text: '刷新会在顶部插入一条新记录' },
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
          { id: `p_${Date.now()}`, text: `刷新于 ${new Date().toLocaleTimeString('zh-CN')}` },
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
        <Card size="small" title="电子签名 SignaturePad" extra={<Tag color="blue">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            Canvas 手写 + DPR 高清 + 撤销 / 清空 / 导出 PNG。去掉 <Text code>react-canvas-draw</Text> 依赖，
            导出时铺白底（否则透明 PNG 在看图软件里会变黑）。
          </Paragraph>
          <SignaturePad value={signature} onChange={setSignature} height={180} />
          <div className="kit-demo__status">
            {signature ? `已生成签名（${signature.length} 字节 dataURL）` : '尚未签名'}
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" title="下拉刷新 PullToRefresh" extra={<Tag color="blue">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            阻尼系数 2.5、阈值 56px。只在「所有可滚动祖先都到顶」时才触发，
            用 <Text code>overscroll-behavior: contain</Text> 替代 preventDefault。
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
        <Card size="small" title="触底加载 InfiniteScroll" extra={<Tag color="blue">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            用 IntersectionObserver 替代手写滚动监听；哨兵节点始终挂载，
            加载中只在下方多渲染一行文案。已加载 {rows.length}/36 条。
          </Paragraph>
          <div style={{ height: 240, overflowY: 'auto' }}>
            <InfiniteScroll
              hasMore={hasMore}
              loading={loadingMore}
              onLoadMore={handleLoadMore}
              endText="共 36 条，已全部加载"
            >
              <div className="kit-demo__list">
                {rows.map((row) => (
                  <div className="kit-demo__list-item" key={row.id}>
                    <span>{row.title}</span>
                    <Text type="secondary">{row.time}</Text>
                  </div>
                ))}
              </div>
            </InfiniteScroll>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" title="拖拽排序 SortableList" extra={<Tag color="blue">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            零依赖（原实现用的 react-sortable-hoc 已不兼容 React 19）。
            拖手柄排序，手柄聚焦后也可用 ↑ / ↓ 键移动。
          </Paragraph>
          <SortableList
            items={cards}
            onChange={setCards}
            keyOf={(item) => item.key}
            renderItem={(item, index, { dragging }) => (
              <div className="kit-demo__sort-row">
                <div>
                  <div className="kit-demo__sort-title">
                    {index + 1}. {item.title}
                    {dragging && <Tag color="processing" style={{ marginLeft: 8 }}>拖动中</Tag>}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
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
        <Card size="small" title="跑马灯 AutoScrollText" extra={<Tag color="blue">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            只有内容真的超出容器宽度才启动；动画时长 = 超出像素 / speed，
            长文本不会滚得更快。
          </Paragraph>
          <div className="kit-demo__marquee">
            <AutoScrollText text={LONG_TEXT} speed={70} />
          </div>
          <div className="kit-demo__marquee is-narrow">
            <AutoScrollText text="短文本不会滚动" speed={70} />
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          size="small"
          title="悬浮球 FloatingBall"
          extra={
            <Space size={8}>
              <Tag color="blue">mobile</Tag>
              <Switch
                size="small"
                checked={ballVisible}
                onChange={setBallVisible}
                checkedChildren="显示"
                unCheckedChildren="隐藏"
              />
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            位置按「left / (屏宽 - 球宽)」的**比例**持久化，转屏或缩放窗口后依然合理。
            松手吸附左右最近边，点击回到页面顶部。
          </Paragraph>
          <div className="kit-demo__status">
            {ballPos ? `当前坐标：left ${ballPos.left}px / top ${ballPos.top}px` : '拖动后这里会显示吸附后的坐标'}
          </div>
          {ballVisible && (
            <FloatingBall storageKey="kit.demo.ball" tooltip="回到顶部" onClick={scrollToTop} onPositionChange={setBallPos}>
              <ArrowUpOutlined />
            </FloatingBall>
          )}
        </Card>
      </Col>
    </Row>
  )
}

