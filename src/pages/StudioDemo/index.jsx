import { useMemo, useState } from 'react'
import { Menu, Tabs, Card, Typography, Switch, Space, Tag, Button, Input, message } from 'antd'
import {
  FundProjectionScreenOutlined, PartitionOutlined, PictureOutlined,
  FormOutlined, FileSearchOutlined, CodepenOutlined, CopyOutlined,
} from '@ant-design/icons'
import {
  ScanEmpty, AutoScrollList, DraggableBoard, AxisBreakBar, SvgRegionMap, AdaptTable,
  RuleBuilder, JsonDiff, ImageAnnotator, DynamicForm, OrgTree, ScanReport,
  AnchorNav, PageTabs, Highlighter, TreeTable, EditableTable, DragLayout,
  CanvasGauge, CardCarousel3D, FramePlayer, ContextMenu, ErrorBoundary, Fullscreen,
} from '../../components/Studio/index.js'
import './StudioDemo.scss'

const { Title, Paragraph, Text } = Typography

/* ============ 演示数据（全部中性虚构，不含任何业务实体） ============ */

const RANK_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  key: `s${i}`,
  name: `服务节点 ${String.fromCharCode(65 + (i % 6))}${i + 1}`,
  value: Math.round(900 - i * 64 + (i % 5) * 17),
}))

const BOARD_CARDS = [
  { id: 'a', x: 2, y: 3, w: 46, h: 42, title: '访问量' },
  { id: 'b', x: 52, y: 3, w: 46, h: 42, title: '错误率' },
  { id: 'c', x: 2, y: 50, w: 46, h: 44, title: '响应耗时' },
  { id: 'd', x: 52, y: 50, w: 46, h: 44, title: '在线节点' },
]

const AXIS_CATS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const AXIS_VALS = [12, 8, 15, 9, 6, 320, 410, 280, 11, 14, 7, 9]

const REGIONS = [
  { id: 'r1', name: '机房区', x: 40, y: 40, w: 340, h: 200 },
  { id: 'r2', name: '办公区', x: 420, y: 40, w: 340, h: 200 },
  { id: 'r3', name: '仓储区', x: 40, y: 280, w: 340, h: 200 },
  { id: 'r4', name: '出入口', x: 420, y: 280, w: 340, h: 200 },
]
const NODES = [
  { id: 'n1', regionId: 'r1', type: '服务器', count: 8, label: '机架 A' },
  { id: 'n2', regionId: 'r1', type: '网关', count: 3, label: '核心交换' },
  { id: 'n3', regionId: 'r2', type: '终端', count: 14, label: '办公终端' },
  { id: 'n4', regionId: 'r3', type: '传感', count: 6, label: '环境传感' },
  { id: 'n5', regionId: 'r4', type: '终端', count: 5, label: '门禁' },
  { id: 'n6', regionId: 'r4', type: '网关', count: 2, label: '边界' },
]

const TABLE_COLS = [
  { key: 'name', title: '资源名称', width: 30 },
  { key: 'ip', title: '地址', width: 28 },
  { key: 'group', title: '分组', width: 22 },
  { key: 'status', title: '状态', width: 20, render: (v) => <Tag color={v === '在线' ? 'green' : 'default'}>{v}</Tag> },
]
const TABLE_ROWS = [
  { name: '核心交换机-01', ip: '10.0.1.1', group: '网络组', status: '在线' },
  { name: '应用服务器-A', ip: '10.0.2.10', group: '机房组', status: '在线' },
  { name: '边缘网关-03', ip: '10.0.3.3', group: '物联网组', status: '离线' },
  { name: '自助终端-12', ip: '10.0.4.12', group: '终端组', status: '在线' },
  { name: '审计主机', ip: '10.0.5.5', group: '安全组', status: '在线' },
  { name: '备份存储', ip: '10.0.6.6', group: '机房组', status: '在线' },
  { name: '门禁控制器', ip: '10.0.7.7', group: '安全组', status: '在线' },
  { name: '测试机-B', ip: '10.0.8.8', group: '网络组', status: '离线' },
]

const RULE_FIELDS = [
  { name: 'name', label: '名称', type: 'string' },
  { name: 'count', label: '数量', type: 'number' },
  { name: 'status', label: '状态', type: 'enum', options: ['在线', '离线', '维护'] },
  { name: 'enabled', label: '启用', type: 'boolean' },
]

const JSON_LEFT = { name: '示例服务', replicas: 3, tags: ['web', 'core'], config: { timeout: 30, retry: true }, nodes: ['a', 'b'] }
const JSON_RIGHT = { name: '示例服务', replicas: 5, tags: ['web', 'core', 'edge'], config: { timeout: 60, retry: false }, nodes: ['a', 'b', 'c'] }

const FORM_SCHEMA = [
  { name: 'project', label: '项目名称', type: 'input', required: true, placeholder: '请输入' },
  { name: 'desc', label: '说明', type: 'textarea', placeholder: '可选' },
  { name: 'count', label: '数量', type: 'number', required: true },
  { name: 'category', label: '类别', type: 'select', options: [{ value: 'A', label: 'A 类' }, { value: 'B', label: 'B 类' }] },
  { name: 'enabled', label: '是否启用', type: 'switch' },
  { name: 'date', label: '开始日期', type: 'date' },
]

const ORG_TREE = [
  {
    id: 'g0', name: '根节点', tag: 'root',
    children: [
      { id: 'g1', name: '分组一', children: [{ id: 'n1', name: '子项 1' }, { id: 'n2', name: '子项 2' }] },
      { id: 'g2', name: '分组二', children: [{ id: 'n3', name: '子项 3' }, { id: 'n4', name: '子项 4', children: [{ id: 'n5', name: '子项 4-1' }] }] },
    ],
  },
]

const SCAN_REPORT = {
  title: '依赖与配置巡检报告',
  findings: [
    { id: 'f1', severity: 'critical', title: '存在已知高危漏洞的依赖', location: 'package.json:12', detail: '某依赖版本低于安全基线，建议升级。' },
    { id: 'f2', severity: 'high', title: '明文凭证出现在配置中', location: 'config/app.yaml:3', detail: '建议改用环境变量或密钥管理。' },
    { id: 'f3', severity: 'medium', title: '过期的 TLS 协议', location: 'nginx.conf:21', detail: '建议禁用 TLS1.0/1.1。' },
    { id: 'f4', severity: 'low', title: '调试端口对外暴露', location: 'docker-compose.yml:9', detail: '建议仅内网开放。' },
    { id: 'f5', severity: 'info', title: '缺少 LICENSE 声明', location: 'repo root', detail: '补充开源协议声明。' },
    { id: 'f6', severity: 'medium', title: '依赖版本未锁定', location: 'package.json:30', detail: '建议锁定补丁版本。' },
  ],
}

/* 生成一张中性「平面示意图」作为标注底图（内联 SVG，无需外部资源） */
function buildPlanSvg() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='520'>
    <rect width='800' height='520' fill='#f4f6fb'/>
    <g fill='none' stroke='#c3ccdd' stroke-width='2'>
      <rect x='40' y='40' width='340' height='200'/>
      <rect x='420' y='40' width='340' height='200'/>
      <rect x='40' y='280' width='340' height='200'/>
      <rect x='420' y='280' width='340' height='200'/>
      <line x1='210' y1='40' x2='210' y2='240'/>
      <line x1='590' y1='40' x2='590' y2='240'/>
    </g>
    <g fill='#9aa7c2' font-family='sans-serif' font-size='13'>
      <text x='52' y='62'>A 区</text><text x='432' y='62'>B 区</text>
      <text x='52' y='302'>C 区</text><text x='432' y='302'>D 区</text>
    </g>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const PLAN_SRC = buildPlanSvg()

/* ---- 新增组件演示数据（中性虚构） ---- */
const ANCHOR_SECTIONS = [
  { id: 'overview', title: '概览', content: <p className="studio-demo__para">该区域演示锚点滚动：左侧目录点击后，内容区平滑滚动到对应版块。</p> },
  { id: 'metric', title: '指标说明', content: <p className="studio-demo__para">滚动时左侧目录会随当前可视版块自动高亮（节流到每帧一次）。</p> },
  { id: 'usage', title: '使用场景', content: <p className="studio-demo__para">适合长文档、帮助中心、配置说明等需要目录导航的页面。</p> },
  { id: 'faq', title: '常见问题', content: <p className="studio-demo__para">目录与内容通过 id 锚定，无需额外状态同步。</p> },
]

const TREE_DATA = [
  {
    id: 'g1', name: '集群 A', value: 12, children: [
      { id: 'n1', name: '节点 a-1', value: 4 },
      { id: 'n2', name: '节点 a-2', value: 8, children: [{ id: 'n2a', name: '容器 a-2-1', value: 3 }] },
    ],
  },
  {
    id: 'g2', name: '集群 B', value: 7, children: [
      { id: 'n3', name: '节点 b-1', value: 5 },
      { id: 'n4', name: '节点 b-2', value: 2 },
    ],
  },
]

const EDIT_COLS = [
  { key: 'name', title: '名称', editable: true },
  { key: 'group', title: '分组', editable: 'select', options: [{ value: '网络组', label: '网络组' }, { value: '机房组', label: '机房组' }, { value: '安全组', label: '安全组' }] },
  { key: 'status', title: '状态', render: (v) => <Tag color={v === '在线' ? 'green' : 'default'}>{v}</Tag> },
]
const EDIT_ROWS = [
  { id: 1, name: '核心交换机-01', group: '网络组', status: '在线' },
  { id: 2, name: '应用服务器-A', group: '机房组', status: '在线' },
  { id: 3, name: '边界网关-03', group: '安全组', status: '离线' },
]

const DRAG_ITEMS = [
  { id: 'c1', x: 3, y: 4, w: 44, h: 42, title: '卡片一', content: <div style={{ padding: 8, fontSize: 12, color: '#666' }}>拖动标题移动，拖右下角缩放</div> },
  { id: 'c2', x: 51, y: 4, w: 44, h: 42, title: '卡片二', content: <div style={{ padding: 8, fontSize: 12, color: '#666' }}>落位自动限制在容器内</div> },
  { id: 'c3', x: 3, y: 52, w: 44, h: 40, title: '卡片三', content: <div style={{ padding: 8, fontSize: 12, color: '#666' }}>百分比定位，自适应缩放</div> },
  { id: 'c4', x: 51, y: 52, w: 44, h: 40, title: '卡片四', content: <div style={{ padding: 8, fontSize: 12, color: '#666' }}>可承载任意内容</div> },
]

const CAROUSEL_ITEMS = Array.from({ length: 5 }, (_, i) => (
  <div style={{ fontSize: 15, fontWeight: 600, color: '#1677ff' }}>内容卡片 {i + 1}</div>
))

const FRAME_SLIDES = Array.from({ length: 6 }, (_, i) => (
  <div style={{ width: 180, height: 120, borderRadius: 8, background: `hsl(${i * 55}, 70%, 90%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: `hsl(${i * 55}, 70%, 45%)` }}>{i + 1}</div>
))

const CTX_MENU = [
  { key: 'copy', label: '复制' },
  { key: 'rename', label: '重命名' },
  { key: 'delete', label: '删除' },
]

/* ============ 用法代码片段（可一键复制） ============ */

function CodeBlock({ code }) {
  const [open, setOpen] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(code).then(
      () => message.success('用法已复制'),
      () => message.warning('当前环境不支持剪贴板'),
    )
  }
  return (
    <div className="studio-demo__code">
      <Space size={6}>
        <Button size="small" type="text" onClick={() => setOpen((v) => !v)}>
          {open ? '收起用法' : '查看用法'}
        </Button>
        {open && (
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={copy}>复制</Button>
        )}
      </Space>
      {open && <pre className="studio-demo__pre">{code}</pre>}
    </div>
  )
}

/* ============ 分类 → 组件演示 配置 ============ */

const CATEGORIES = [
  {
    key: 'screen', label: '可视化大屏', icon: <FundProjectionScreenOutlined />,
    demos: [
      {
        key: 'scanempty', title: 'ScanEmpty · 扫描式空态',
        desc: '用纯 CSS/SVG 实现的大屏空态扫描动效，不依赖图表库，任意容器可用。',
        usage: `<ScanEmpty text="暂无告警" subText="最近 24 小时无异常事件" height={180} />`,
        render: () => <ScanEmpty text="暂无告警" subText="最近 24 小时无异常事件" height={180} />,
      },
      {
        key: 'autoscroll', title: 'AutoScrollList · 无缝滚动榜单',
        desc: '内容超出容器自动垂直循环滚动，悬停暂停；位移由 CSS 变量驱动，无状态抖动。',
        usage: `<AutoScrollList\n  items={rows}\n  rowHeight={36}\n  maxHeight={220}\n  renderItem={(r) => <span>{r.name} · {r.value}</span>}\n/>`,
        render: () => (
          <AutoScrollList
            items={RANK_ITEMS}
            maxHeight={220}
            rowHeight={36}
            renderItem={(r) => (
              <Space>
                <Text strong>{r.name}</Text>
                <Text type="secondary">{r.value}</Text>
              </Space>
            )}
          />
        ),
      },
      {
        key: 'board', title: 'DraggableBoard · 可编排看板',
        desc: '百分比定位 + 碰撞检测 + 指针事件统一；开启编辑后可拖动/缩放卡片，非法落位回弹。',
        usage: `<DraggableBoard\n  items={[{ id:'a', x:2, y:3, w:46, h:42, title:'访问量' }]}\n  editable={edit}\n  aspect={0.42}\n  onChange={setCards}\n  renderItem={(it) => <Chart data={it} />}\n/>`,
        render: () => <BoardDemo />,
      },
      {
        key: 'axisbreak', title: 'AxisBreakBar · 断轴柱状图',
        desc: '高低值悬殊时折叠空白区间；在图上横向拖拽可选则要折叠的 Y 区间。',
        usage: `<AxisBreakBar\n  categories={months}\n  values={values}\n  unit="万"\n  title="月度指标"\n/>`,
        render: () => <AxisBreakBar categories={AXIS_CATS} values={AXIS_VALS} unit="万" title="月度指标" />,
      },
      {
        key: 'regionmap', title: 'SvgRegionMap · 数据驱动区域图',
        desc: 'viewBox 纯 SVG 等比缩放，分层打点（底图/区域块/气泡），点击区域回调。',
        usage: `<SvgRegionMap\n  regions={[{ id:'r1', name:'机房区', x:40, y:40, w:340, h:200 }]}\n  nodes={[{ id:'n1', regionId:'r1', type:'服务器', count:8, label:'机架 A' }]}\n  onRegionClick={(r) => setActive(r.name)}\n/>`,
        render: () => <RegionMapDemo />,
      },
      {
        key: 'adapttable', title: 'AdaptTable · 大屏自适应表格',
        desc: '列宽百分比平分、可拖拽调列宽/行高、单元格内容超长自动跑马灯。',
        usage: `<AdaptTable\n  columns={[{ key:'name', title:'资源名称', width:30 }]}\n  dataSource={rows}\n  autoScroll\n  marquee\n/>`,
        render: () => <AdaptTable columns={TABLE_COLS} dataSource={TABLE_ROWS} autoScroll marquee />,
      },
    ],
  },
  {
    key: 'builder', label: '规则与编排', icon: <PartitionOutlined />,
    demos: [
      {
        key: 'rulebuilder', title: 'RuleBuilder · 可视化条件编排',
        desc: 'AND/OR 嵌套组 + 叶子条件递归树，按字段类型自动切换操作符；输出结构化 JSON。',
        usage: `<RuleBuilder\n  fields={[{ name:'count', label:'数量', type:'number' }]}\n  value={tree}\n  onChange={setTree}\n/>\n// tree: { op:'AND', conditions:[{ field, op, value }, { op:'OR', conditions:[...] }] }`,
        render: () => <RuleDemo />,
      },
      {
        key: 'jsondiff', title: 'JsonDiff · 结构化对象对比',
        desc: '结构 diff 而非文本 diff：准确标出新增/删除/修改/未变，路径一目了然。',
        usage: `<JsonDiff left={before} right={after} />`,
        render: () => <JsonDiff left={JSON_LEFT} right={JSON_RIGHT} />,
      },
    ],
  },
  {
    key: 'media', label: '图像与标注', icon: <PictureOutlined />,
    demos: [
      {
        key: 'annotator', title: 'ImageAnnotator · 图像标注与缩放平移',
        desc: '滚轮缩放、拖拽平移；标注锚点用归一化坐标存储，缩放/平移后不漂移。',
        usage: `<ImageAnnotator\n  src={imageUrl}\n  annotations={list}\n  onAdd={(m) => setList(p => [...p, m])}\n  onRemove={(id) => setList(p => p.filter(m => m.id !== id))}\n/>\n// 锚点: { id, x: 0~1, y: 0~1, label }`,
        render: () => <AnnotatorDemo />,
      },
    ],
  },
  {
    key: 'form', label: '表单与树', icon: <FormOutlined />,
    demos: [
      {
        key: 'dynform', title: 'DynamicForm · schema 驱动动态表单',
        desc: '一份字段 schema 即一份 UI；支持多种通用字段类型与必填校验。',
        usage: `<DynamicForm\n  schema={[{ name:'project', label:'项目名称', type:'input', required:true }]}\n  onChange={setValues}\n/>`,
        render: () => <FormDemo />,
      },
      {
        key: 'orgtree', title: 'OrgTree · 层级组织树',
        desc: '任意深度可逐级展开/收起、可单选检索的层级树。',
        usage: `<OrgTree\n  data={[{ id:'g0', name:'根节点', children:[...] }]}\n  defaultExpanded\n  selectedId={id}\n  onSelect={(node) => setId(node.id)}\n/>`,
        render: () => <OrgTree data={ORG_TREE} defaultExpanded />,
      },
    ],
  },
  {
    key: 'report', label: '报告与溯源', icon: <FileSearchOutlined />,
    demos: [
      {
        key: 'scanreport', title: 'ScanReport · 安全扫描报告卡片',
        desc: '把结构化检测报告渲染为严重度分布 + 明细列表，可承载漏洞/审查/巡检等任意清单。',
        usage: `<ScanReport report={{\n  title: '依赖与配置巡检报告',\n  findings: [{ id:'f1', severity:'critical', title:'...', location:'package.json:12', detail:'...' }],\n}} />`,
        render: () => <ScanReport report={SCAN_REPORT} />,
      },
    ],
  },
  {
    key: 'interact', label: '交互·进阶', icon: <PartitionOutlined />,
    demos: [
      {
        key: 'anchornav', title: 'AnchorNav · 锚点滚动导航',
        desc: '左侧目录吸顶 + 右侧内容区，点击平滑滚动，滚动时自动高亮当前版块（rAF 节流）。',
        usage: `<AnchorNav\n  sections={[{ id:'s1', title:'概览', content:<p/> }]}\n  height={260}\n/>`,
        render: () => <AnchorDemo />,
      },
      {
        key: 'pagetabs', title: 'PageTabs · 多标签页工作区',
        desc: '路由式标签栏：可切换、可关闭、可新建；内容区由当前标签的 render 提供。',
        usage: `<PageTabs\n  panels={panels}\n  activeKey={active}\n  onChange={setActive}\n  onClose={close}\n  onAdd={add}\n/>`,
        render: () => <PageTabsDemo />,
      },
      {
        key: 'treetable', title: 'TreeTable · 树表 + 祖先保留搜索',
        desc: '可逐级展开；按名称检索时自动保留命中子孙的父节点并展开，不丢上下文。',
        usage: `<TreeTable\n  treeData={[{ id:'g1', name:'集群A', value:12, children:[...] }]}\n  valueTitle="数值"\n/>`,
        render: () => <TreeTableDemo />,
      },
      {
        key: 'highlighter', title: 'Highlighter · 关键词高亮',
        desc: '把命中关键词的文本片段用 <mark> 包裹，纯函数拆分、可嵌入任意列表或表格单元格。',
        usage: `<Highlighter text="核心交换机 服务正常" keyword="服务" />`,
        render: () => <HighlighterDemo />,
      },
      {
        key: 'editabletable', title: 'EditableTable · 行内编辑表格',
        desc: '点击「编辑」整行切换为输入/下拉，保存即写回；取消则还原初值。',
        usage: `<EditableTable\n  columns={[{ key:'name', title:'名称', editable:true }]}\n  data={rows}\n  rowKey="id"\n/>`,
        render: () => <EditableDemo />,
      },
      {
        key: 'draglayout', title: 'DragLayout · 自由拖拽缩放布局',
        desc: '卡片以百分比定位，可拖动移动、拖角缩放，落位自动限制在容器内；适合轻量低代码仪表盘。',
        usage: `<DragLayout\n  items={[{ id:'c1', x:3, y:4, w:44, h:42, title:'卡片一', content:<div/> }]}\n  editable={edit}\n  onLayoutChange={setItems}\n/>`,
        render: () => <DragLayoutDemo />,
      },
      {
        key: 'gauge', title: 'CanvasGauge · Canvas 仪表盘',
        desc: '零依赖 Canvas 仪表盘：rAF 缓动到目标值、DPR 高清、容器自适应。',
        usage: `<CanvasGauge value={v} max={100} title="完成度" unit="%" />`,
        render: () => <GaugeDemo />,
      },
      {
        key: 'carousel3d', title: 'CardCarousel3D · 3D 卡片轮播',
        desc: '手势方向判定（>45° 让位纵向滚动），卡片按相对位置做 Z 轴景深与旋转切换。',
        usage: `<CardCarousel3D\n  items={[<div>卡片1</div>, <div>卡片2</div>]}\n  autoPlay={auto}\n  height={200}\n/>`,
        render: () => <CarouselDemo />,
      },
      {
        key: 'frameplayer', title: 'FramePlayer · 帧序列播放器',
        desc: '按 fps 在若干「帧」间循环播放，支持播放/暂停、逐帧、进度拖动；帧可为任意节点。',
        usage: `<FramePlayer frames={[<img/>, <div/>]} fps={3} height={200} />`,
        render: () => <FrameDemo />,
      },
      {
        key: 'contextmenu', title: 'ContextMenu · 右键菜单',
        desc: '在包裹区域右键弹出菜单，点击任意处或滚动即关闭。',
        usage: `<ContextMenu menu={[{ key:'copy', label:'复制' }]}>\n  <div>右键此区域</div>\n</ContextMenu>`,
        render: () => <ContextMenuDemo />,
      },
      {
        key: 'errorboundary', title: 'ErrorBoundary · 错误边界',
        desc: '捕获子树渲染期异常，展示兜底 UI 并支持重试。',
        usage: `<ErrorBoundary>\n  <Child />\n</ErrorBoundary>`,
        render: () => <ErrorBoundaryDemo />,
      },
      {
        key: 'fullscreen', title: 'Fullscreen · 全屏容器',
        desc: '对指定区域调用 Fullscreen API，并同步当前全屏状态。',
        usage: `<Fullscreen>\n  <div>可全屏的内容</div>\n</Fullscreen>`,
        render: () => <FullscreenDemo />,
      },
    ],
  },
]

/* ============ 需要内部状态的演示组件 ============ */

function BoardDemo() {
  const [cards, setCards] = useState(BOARD_CARDS)
  const [edit, setEdit] = useState(false)
  return (
    <div>
      <Space style={{ marginBottom: 10 }}>
        <Text>编辑模式</Text>
        <Switch checked={edit} onChange={setEdit} />
      </Space>
      <DraggableBoard items={cards} editable={edit} onChange={setCards} aspect={0.42} />
    </div>
  )
}

function RegionMapDemo() {
  const [active, setActive] = useState(null)
  return (
    <div>
      <SvgRegionMap regions={REGIONS} nodes={NODES} onRegionClick={(r) => setActive(r.name)} />
      {active && <Text type="secondary">已选择区域：{active}</Text>}
    </div>
  )
}

function RuleDemo() {
  const [tree, setTree] = useState({ op: 'AND', conditions: [{ field: 'count', op: '>', value: 10 }] })
  return <RuleBuilder fields={RULE_FIELDS} value={tree} onChange={setTree} />
}

function AnnotatorDemo() {
  const [list, setList] = useState([
    { id: 'm1', x: 0.25, y: 0.3, label: '设备 A' },
    { id: 'm2', x: 0.7, y: 0.6, label: '设备 B' },
  ])
  return (
    <ImageAnnotator
      src={PLAN_SRC}
      annotations={list}
      onAdd={(m) => setList((p) => [...p, m])}
      onRemove={(id) => setList((p) => p.filter((m) => m.id !== id))}
    />
  )
}

function FormDemo() {
  const [vals, setVals] = useState({})
  const [show, setShow] = useState(false)
  return (
    <div>
      <DynamicForm schema={FORM_SCHEMA} onChange={setVals} />
      <Button size="small" style={{ marginTop: 10 }} onClick={() => setShow((s) => !s)}>
        {show ? '隐藏' : '查看'} 实时值
      </Button>
      {show && <pre className="studio-json">{JSON.stringify(vals, null, 2)}</pre>}
    </div>
  )
}

function AnchorDemo() {
  return <AnchorNav sections={ANCHOR_SECTIONS} height={260} />
}

function PageTabsDemo() {
  const [panels, setPanels] = useState(() => [
    { key: 'home', label: '首页', closable: false, render: () => <div style={{ padding: 12 }}>首页内容区</div> },
    { key: 'doc', label: '文档', closable: true, render: () => <div style={{ padding: 12 }}>文档内容区</div> },
    { key: 'log', label: '日志', closable: true, render: () => <div style={{ padding: 12 }}>日志内容区</div> },
  ])
  const [active, setActive] = useState('home')
  const close = (key) => {
    const next = panels.filter((p) => p.key !== key)
    setPanels(next)
    if (active === key) setActive(next[0]?.key ?? '')
  }
  const add = () => {
    const key = `new-${Date.now()}`
    setPanels((p) => [...p, { key, label: '新标签', closable: true, render: () => <div style={{ padding: 12 }}>新打开的标签页（演示）</div> }])
    setActive(key)
  }
  return <PageTabs panels={panels} activeKey={active} onChange={setActive} onClose={close} onAdd={add} />
}

function TreeTableDemo() {
  return <TreeTable treeData={TREE_DATA} />
}

function HighlighterDemo() {
  const [kw, setKw] = useState('服务')
  return (
    <div>
      <Input.Search
        placeholder="输入关键词高亮"
        value={kw}
        onChange={(e) => setKw(e.target.value)}
        style={{ marginBottom: 10, maxWidth: 280 }}
      />
      <div style={{ lineHeight: 1.9 }}>
        <Highlighter text="核心交换机-01 服务节点状态正常" keyword={kw} />
        <br />
        <Highlighter text="应用服务器-A 服务响应耗时 12ms" keyword={kw} />
        <br />
        <Highlighter text="边界网关-03 离线，需人工介入" keyword={kw} />
      </div>
    </div>
  )
}

function EditableDemo() {
  return <EditableTable columns={EDIT_COLS} data={EDIT_ROWS} />
}

function DragLayoutDemo() {
  const [edit, setEdit] = useState(true)
  const [items, setItems] = useState(DRAG_ITEMS)
  return (
    <div>
      <Space style={{ marginBottom: 10 }}>
        <Text>编辑模式</Text>
        <Switch checked={edit} onChange={setEdit} />
      </Space>
      <DragLayout items={items} editable={edit} onLayoutChange={setItems} />
    </div>
  )
}

function GaugeDemo() {
  const [v, setV] = useState(0)
  return (
    <div>
      <Space style={{ marginBottom: 10 }}>
        <Button size="small" onClick={() => setV(Math.round(Math.random() * 100))}>随机值</Button>
        <Button size="small" onClick={() => setV(0)}>归零</Button>
      </Space>
      <CanvasGauge value={v} max={100} title="完成度" unit="%" />
    </div>
  )
}

function CarouselDemo() {
  const [auto, setAuto] = useState(false)
  return (
    <div>
      <Space style={{ marginBottom: 10 }}>
        <Text>自动播放</Text>
        <Switch checked={auto} onChange={setAuto} />
      </Space>
      <CardCarousel3D items={CAROUSEL_ITEMS} autoPlay={auto} height={200} />
    </div>
  )
}

function FrameDemo() {
  return <FramePlayer frames={FRAME_SLIDES} fps={3} height={200} />
}

function ContextMenuDemo() {
  return (
    <ContextMenu menu={CTX_MENU}>
      <div style={{ padding: '28px 40px', border: '1px dashed #d9d9d9', borderRadius: 8, color: '#666', userSelect: 'none' }}>
        在此区域右键，弹出菜单
      </div>
    </ContextMenu>
  )
}

function ErrorBoundaryDemo() {
  const [boom, setBoom] = useState(false)
  if (boom) throw new Error('演示用异常：子组件渲染失败')
  return (
    <ErrorBoundary>
      <div style={{ padding: 12 }}>
        <Button size="small" danger onClick={() => setBoom(true)}>触发渲染异常</Button>
        <p style={{ marginTop: 10, color: '#666' }}>点击按钮让子树抛错，错误边界会兜底显示并支持重试。</p>
      </div>
    </ErrorBoundary>
  )
}

function FullscreenDemo() {
  return (
    <Fullscreen>
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', color: '#666' }}>
        点击右上角「全屏」按钮（沙箱内可能受限）
      </div>
    </Fullscreen>
  )
}

/* ============ 页面主体 ============ */

export default function StudioDemo() {
  const [cat, setCat] = useState('screen')
  const current = CATEGORIES.find((c) => c.key === cat)

  const totalCount = CATEGORIES.reduce((n, c) => n + c.demos.length, 0)

  const menuItems = useMemo(
    () => CATEGORIES.map((c) => ({
      key: c.key,
      icon: c.icon,
      label: <span className="studio-demo__menu-label">{c.label}<em>{c.demos.length}</em></span>,
    })),
    [],
  )

  const tabItems = useMemo(
    () => current.demos.map((d) => ({
      key: d.key,
      label: d.title.split(' · ')[0],
      children: (
        <div className="studio-demo__panel">
          <div className="studio-demo__meta">
            <Text strong>{d.title}</Text>
            <Paragraph type="secondary" className="studio-demo__desc">{d.desc}</Paragraph>
          </div>
          <div className="studio-demo__stage">{d.render()}</div>
          <CodeBlock code={d.usage} />
        </div>
      ),
    })),
    [current],
  )

  return (
    <div className="studio-demo">
      <div className="studio-demo__header">
        <Title level={3} style={{ marginBottom: 4 }}>
          <CodepenOutlined /> 组件工坊 Studio
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          从本地 80+ 存量前端项目里筛选、去业务化、零依赖重写而成的 {totalCount} 个可复用组件，按能力分为 {CATEGORIES.length} 组。
          所有演示数据均为中性虚构占位，不含任何原始敏感信息。
        </Paragraph>
      </div>

      <div className="studio-demo__layout">
        <Menu
          mode="inline"
          className="studio-demo__menu"
          selectedKeys={[cat]}
          items={menuItems}
          onClick={({ key }) => setCat(key)}
        />
        <div className="studio-demo__content">
          <Card size="small" className="studio-demo__card" title={current.label}>
            <Tabs items={tabItems} />
          </Card>
        </div>
      </div>
    </div>
  )
}
