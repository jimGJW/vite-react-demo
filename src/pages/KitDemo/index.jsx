import { useMemo, useState } from 'react'
import { Button, Card, Col, Row, Space, Switch, Tabs, Tag, Typography } from 'antd'
import { ArrowUpOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import {
  AsyncSelect, AutoScrollText, Countdown, Ellipsis, FloatingBall, InfiniteScroll,
  MiniArea, MiniBar, MiniProgress, NoticePanel, PullToRefresh, SignaturePad,
  SortableList, StatCard, TagInput, TimeRangeInput, TimelineChart, WaterWave,
} from '../../components/Kit/index.js'
import './index.scss'

const { Text, Paragraph } = Typography

/* =====================================================================
 * 模拟数据全部定义在模块级 —— 引用稳定，避免每次渲染都触发子组件更新
 * ===================================================================== */

const LONG_TEXT =
  '资产全生命周期管理平台覆盖采购论证、安装验收、日常巡检、预防性维护、计量校准、故障维修、效益分析与报废处置等环节，' +
  '任一环节的记录缺失都会影响资产状态判断与合规审计，因此需要把每一次操作都沉淀为可追溯的电子档案。'

const DEVICES = [
  { id: 'SRV-001', name: '应用服务器 A', dept: '机房', py: 'ying yong fu wu qi a' },
  { id: 'SRV-002', name: '应用服务器 B', dept: '机房', py: 'ying yong fu wu qi b' },
  { id: 'NET-101', name: '核心交换机', dept: '网络组', py: 'he xin jiao huan ji' },
  { id: 'IOT-201', name: '边缘采集网关', dept: '物联网组', py: 'bian yuan cai ji wang guan' },
  { id: 'TER-301', name: '自助终端一体机', dept: '终端组', py: 'zi zhu zhong duan' },
  { id: 'SEC-401', name: '日志审计一体机', dept: '安全组', py: 'ri zhi shen ji' },
]

const STAT_AREA = [
  { x: '周一', y: 32 }, { x: '周二', y: 45 }, { x: '周三', y: 38 },
  { x: '周四', y: 61 }, { x: '周五', y: 54 }, { x: '周六', y: 72 }, { x: '周日', y: 66 },
]

const STAT_BAR = [
  { x: '机房', y: 42 }, { x: '网络组', y: 68 },
  { x: '物联网组', y: 31 }, { x: '终端组', y: 55 },
]

const TIMELINE = Array.from({ length: 24 }, (_, i) => ({
  x: `${String(i).padStart(2, '0')}:00`,
  y1: Math.round(20 + Math.sin(i / 3) * 12 + Math.random() * 6),
  y2: Math.round(14 + Math.cos(i / 4) * 9 + Math.random() * 5),
}))

const NOTICE_TABS = [
  {
    key: 'todo',
    title: '待办',
    count: 3,
    items: [
      { id: 'n1', title: '工单 WO-2081 待验收', desc: '应用服务器 A · 电源模块更换', time: '10 分钟前' },
      { id: 'n2', title: '计量校准即将到期', desc: '6 台资产将在 7 天内到期', time: '1 小时前' },
      { id: 'n3', title: '巡检计划待确认', desc: '本周机房巡检排期', time: '昨天' },
    ],
  },
  {
    key: 'message',
    title: '消息',
    count: 1,
    items: [
      { id: 'm1', title: '系统升级通知', desc: '本周六 02:00-04:00 停机维护', time: '周一', read: true },
    ],
  },
]

const DEFAULT_RANGES = [
  { id: 'r1', start: '09:00', end: '12:00' },
  { id: 'r2', start: '13:30', end: '18:00' },
]

const OVERLAP_RANGES = [
  { id: 'r1', start: '09:00', end: '13:00' },
  { id: 'r2', start: '12:30', end: '18:00' },
]

const INITIAL_CARDS = [
  { key: 'overview', title: '概览卡片', desc: '设备总数、在线率、告警数', visible: true },
  { key: 'alarm', title: '告警卡片', desc: '实时告警与处理进度', visible: true },
  { key: 'workorder', title: '工单卡片', desc: '待办工单与超期提醒', visible: false },
  { key: 'report', title: '报表卡片', desc: '月度统计与导出入口', visible: true },
]

const INITIAL_TAGS = ['巡检', '预防性维护', '计量检定']

/** 倒计时目标写在模块级：渲染期调用 Date.now() 会被判为不纯函数 */
const COUNTDOWN_TARGET = Date.now() + 2 * 3600 * 1000 + 45 * 1000

function makeRows(start, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `r_${start + i}`,
    title: `巡检记录 #${String(start + i + 1).padStart(3, '0')}`,
    time: `${String(8 + ((start + i) % 10)).padStart(2, '0')}:${String(((start + i) * 7) % 60).padStart(2, '0')}`,
  }))
}

/** 模拟异步查询：按名称 / 拼音 / 分组过滤，400ms 延迟 */
function loadDevices(keyword) {
  const kw = String(keyword || '').trim().toLowerCase()
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        DEVICES.filter(
          (item) =>
            !kw ||
            item.name.toLowerCase().includes(kw) ||
            item.py.includes(kw) ||
            item.dept.includes(kw) ||
            item.id.toLowerCase().includes(kw),
        ),
      )
    }, 400)
  })
}

/* =====================================================================
 * 各分组内容
 * ===================================================================== */

function InteractionTab() {
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

function DisplayTab() {
  const [range, setRange] = useState('week')
  const [noticeCount, setNoticeCount] = useState(undefined)
  const deadline = COUNTDOWN_TARGET

  const chartData = useMemo(
    () => (range === 'week' ? STAT_AREA : STAT_AREA.slice(0, 4).map((item, i) => ({ ...item, y: item.y + i * 4 }))),
    [range],
  )

  const noticeTabs = NOTICE_TABS

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card
          size="small"
          title="文本省略 Ellipsis"
          extra={
            <Space size={8}>
              <Tag color="purple">pad</Tag>
              <Button size="small" onClick={() => setRange((v) => (v === 'week' ? 'day' : 'week'))}>
                切换数据
              </Button>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            单行为 <Text code>nowrap + ellipsis</Text>，多行走 <Text code>-webkit-line-clamp</Text>。
            原实现的「二分法逐字测量」在支持 line-clamp 的浏览器上已无必要，整段删除。
          </Paragraph>
          <div className="kit-demo__stack">
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>单行 + Tooltip</Text>
              <Ellipsis lines={1}>{LONG_TEXT}</Ellipsis>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>两行省略</Text>
              <Ellipsis lines={2}>{LONG_TEXT}</Ellipsis>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>两行 + 可展开</Text>
              <Ellipsis lines={2} expandable>{LONG_TEXT}</Ellipsis>
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card size="small" title="倒计时 Countdown" extra={<Tag color="purple">pad</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            原实现每秒自减，后台标签页被节流后会累积漂移；这里每 tick 用
            <Text code> Date.now() </Text>重算，回到前台立即校正。
          </Paragraph>
          <div className="kit-demo__stack">
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>卡片样式（目标：2 小时 45 分钟后）</Text>
              <div style={{ marginTop: 6 }}>
                <Countdown target={deadline} />
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>纯文本样式 DD 天 HH:mm:ss</Text>
              <div style={{ marginTop: 6 }}>
                <Countdown target={deadline} variant="plain" pattern="DD 天 HH:mm:ss" />
              </div>
            </div>
          </div>
        </Card>
      </Col>

      <Col span={24}>
        <Card size="small" title="指标卡 StatCard（涨红跌绿）" extra={<Tag color="purple">pad</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            合并了原项目的 NumberInfo + Trend。颜色遵循国内习惯——
            <Text strong> 上涨红色、下跌绿色</Text>，需要欧美配色时传 <Text code>colorMode=&quot;us&quot;</Text>。
          </Paragraph>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="本月工单完成率"
                value={92.6}
                precision={1}
                suffix="%"
                status="up"
                trend={4.8}
                footer="较上月 +4.8 个百分点"
                chart={<MiniProgress percent={92.6} target={95} label="目标 95%" />}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="日均巡检量"
                value={54}
                suffix="次"
                status="down"
                trend={-3.2}
                subTitle="近 7 日均值"
                chart={<MiniArea data={chartData} height={56} />}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="各组资产数"
                value={196}
                suffix="台"
                footer="机房占比最高"
                chart={<MiniBar data={STAT_BAR} height={78} showLabel />}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatCard
                title="设备在线率"
                value={87.4}
                precision={1}
                suffix="%"
                status="up"
                trend={1.6}
                chart={<WaterWave percent={87.4} size={110} title="在线" />}
              />
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24} lg={14}>
        <Card size="small" title="时间趋势 TimelineChart" extra={<Tag color="purple">pad</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            原实现依赖 G2 + g2-plugin-slider（且 domId 用 <Text code>Math.random()</Text> 生成，
            React 19 严格模式下双调用会不一致）；ECharts 的 <Text code>dataZoom</Text> 是内置能力，
            底部缩放条 + 滚轮缩放一次配好。
          </Paragraph>
          <TimelineChart
            data={TIMELINE}
            height={260}
            seriesNames={['入库', '出库']}
          />
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card
          size="small"
          title="通知面板 NoticePanel"
          extra={
            <Space size={8}>
              <Tag color="purple">pad</Tag>
              <Button size="small" icon={<ReloadOutlined />} onClick={() => setNoticeCount(0)}>
                全部已读
              </Button>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            合并了原项目的 NoticeIcon 与 Cart（两者 90% 重复）。清空按钮支持二次确认
            —— 把 <Text code>onClear</Text> 写成返回 Promise 即可。
          </Paragraph>
          <div className="kit-demo__center">
            <NoticePanel
              count={noticeCount}
              tabs={noticeTabs}
              onItemClick={(item) => console.log('点击通知', item)}
              onClear={(key) => console.log('清空分组', key)}
            />
            <Text type="secondary" style={{ marginLeft: 16, fontSize: 12 }}>点铃铛展开</Text>
          </div>
        </Card>
      </Col>
    </Row>
  )
}

function FormTab() {
  const [tags, setTags] = useState(INITIAL_TAGS)
  const [device, setDevice] = useState()
  const [ranges, setRanges] = useState(DEFAULT_RANGES)

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card size="small" title="标签输入 TagInput" extra={<Tag color="cyan">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            空格 / 回车 / 中英文逗号都能提交；输入框为空时退格删除上一个；
            粘贴「甲, 乙 丙」会一次拆成三个标签。最多 6 个。
          </Paragraph>
          <TagInput value={tags} onChange={setTags} max={6} />
          <div className="kit-demo__status">当前标签：{tags.join(' / ') || '（空）'}</div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" title="异步选择器 AsyncSelect" extra={<Tag color="cyan">mobile</Tag>}>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            首次展开或输入关键字时才请求（惰性加载）+ 300ms 防抖 + 请求竞态保护。
            支持按 <Text code>fields</Text> 映射字段、自定义选项渲染。
          </Paragraph>
          <Space direction="vertical" style={{ width: '100%' }}>
            <AsyncSelect
              load={loadDevices}
              value={device}
              onChange={setDevice}
              fields={{ value: 'id', label: 'name' }}
              placeholder="搜索资产名称 / 拼音 / 分组"
              style={{ width: '100%' }}
              renderOption={(item) => (
                <div className="kit-async-option">
                  <span>{item.name}</span>
                  <span className="kit-async-option__desc">{item.dept}</span>
                </div>
              )}
            />
            <AsyncSelect
              multiple
              autoLoad
              load={loadDevices}
              placeholder="多选 + 挂载即加载"
              style={{ width: '100%' }}
              fields={{ value: 'id', label: 'name' }}
            />
          </Space>
          <div className="kit-demo__status">
            已选：{device ? `${device.value} · ${device.label}` : '（未选择）'}
          </div>
        </Card>
      </Col>

      <Col span={24}>
        <Card
          size="small"
          title="时段录入 TimeRangeInput"
          extra={
            <Space size={8}>
              <Tag color="cyan">mobile</Tag>
              <Button size="small" onClick={() => setRanges(OVERLAP_RANGES)}>
                填入重叠时段
              </Button>
              <Button size="small" onClick={() => setRanges(DEFAULT_RANGES)}>
                恢复
              </Button>
            </Space>
          }
        >
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            保留原实现的三条校验（结束晚于开始 / 单段不超上限 / 两段不重叠）并补了
            「起止未填完整」的提示；合计工时实时计算。
          </Paragraph>
          <TimeRangeInput value={ranges} onChange={setRanges} maxHours={12} />
        </Card>
      </Col>
    </Row>
  )
}

/* =====================================================================
 * 页面
 * ===================================================================== */

export default function KitDemo() {
  return (
    <div className="kit-demo">
      <div className="kit-demo__hero">
        <h2>
          <ThunderboltOutlined /> 组件工具箱 Kit
        </h2>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          从本地两个存量项目（旧移动端 / 旧平板端）里挑选出的通用能力，去掉业务耦合后重写为 React 19 + antd 5 组件。
          完整调研清单（选了什么、为什么、跳过了什么）见{' '}
          <Text code>src/components/Kit/README.md</Text>。
        </Paragraph>
      </div>

      <Tabs
        defaultActiveKey="interaction"
        items={[
          { key: 'interaction', label: '移动交互（6）', children: <InteractionTab /> },
          { key: 'display', label: '数据展示（9）', children: <DisplayTab /> },
          { key: 'form', label: '表单控件（3）', children: <FormTab /> },
        ]}
      />
    </div>
  )
}
