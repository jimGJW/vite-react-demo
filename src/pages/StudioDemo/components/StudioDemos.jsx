import { useState } from 'react'
import { Typography, Switch, Space, Tag, Button, Input, message } from 'antd'
import {
  FundProjectionScreenOutlined, PartitionOutlined, PictureOutlined,
  FormOutlined, FileSearchOutlined, CopyOutlined,
} from '@ant-design/icons'
import {
  ScanEmpty, AutoScrollList, DraggableBoard, AxisBreakBar, SvgRegionMap, AdaptTable,
  RuleBuilder, JsonDiff, ImageAnnotator, DynamicForm, OrgTree, ScanReport,
  AnchorNav, PageTabs, Highlighter, TreeTable, EditableTable, DragLayout,
  CanvasGauge, CardCarousel3D, FramePlayer, ContextMenu, ErrorBoundary, Fullscreen,
} from '@components/Studio/index.js'
import { useI18n } from '@i18n/index.js'

const { Text } = Typography

/* 原始数据值 → i18n 键（用于按值反查翻译，避免把展示文硬编码进数据） */
const STATUS_KEY = { '在线': 'online', '离线': 'offline', '维护': 'maintaining' }
const GROUP_KEY = { '网络组': 'net', '机房组': 'room', '物联网组': 'iot', '终端组': 'terminal', '安全组': 'sec' }

export const RANK_ITEMS = (t) => Array.from({ length: 12 }, (_, i) => ({
  key: `s${i}`,
  name: t('studio.data.rank.node', { letter: String.fromCharCode(65 + (i % 6)), no: i + 1 }),
  value: Math.round(900 - i * 64 + (i % 5) * 17),
}))

export const BOARD_CARDS = (t) => ([
  { id: 'a', x: 2, y: 3, w: 46, h: 42, title: t('studio.data.board.visits') },
  { id: 'b', x: 52, y: 3, w: 46, h: 42, title: t('studio.data.board.errors') },
  { id: 'c', x: 2, y: 50, w: 46, h: 44, title: t('studio.data.board.latency') },
  { id: 'd', x: 52, y: 50, w: 46, h: 44, title: t('studio.data.board.online') },
])

export const AXIS_CATS = (t) => ([
  t('studio.data.axis.m1'), t('studio.data.axis.m2'), t('studio.data.axis.m3'), t('studio.data.axis.m4'),
  t('studio.data.axis.m5'), t('studio.data.axis.m6'), t('studio.data.axis.m7'), t('studio.data.axis.m8'),
  t('studio.data.axis.m9'), t('studio.data.axis.m10'), t('studio.data.axis.m11'), t('studio.data.axis.m12'),
])
export const AXIS_VALS = [12, 8, 15, 9, 6, 320, 410, 280, 11, 14, 7, 9]

export const REGIONS = (t) => ([
  { id: 'r1', name: t('studio.data.region.datacenter'), x: 40, y: 40, w: 340, h: 200 },
  { id: 'r2', name: t('studio.data.region.office'), x: 420, y: 40, w: 340, h: 200 },
  { id: 'r3', name: t('studio.data.region.storage'), x: 40, y: 280, w: 340, h: 200 },
  { id: 'r4', name: t('studio.data.region.entrance'), x: 420, y: 280, w: 340, h: 200 },
])
export const NODES = (t) => ([
  { id: 'n1', regionId: 'r1', type: t('studio.data.nodeType.server'), count: 8, label: t('studio.data.nodeLabel.rackA') },
  { id: 'n2', regionId: 'r1', type: t('studio.data.nodeType.gateway'), count: 3, label: t('studio.data.nodeLabel.coreSwitch') },
  { id: 'n3', regionId: 'r2', type: t('studio.data.nodeType.terminal'), count: 14, label: t('studio.data.nodeLabel.officeTerminal') },
  { id: 'n4', regionId: 'r3', type: t('studio.data.nodeType.sensor'), count: 6, label: t('studio.data.nodeLabel.envSensor') },
  { id: 'n5', regionId: 'r4', type: t('studio.data.nodeType.terminal'), count: 5, label: t('studio.data.nodeLabel.accessControl') },
  { id: 'n6', regionId: 'r4', type: t('studio.data.nodeType.gateway'), count: 2, label: t('studio.data.nodeLabel.edge') },
])

export const TABLE_COLS = (t) => ([
  { key: 'name', title: t('studio.data.table.name'), width: 30 },
  { key: 'ip', title: t('studio.data.table.ip'), width: 28 },
  { key: 'group', title: t('studio.data.table.group'), width: 22 },
  { key: 'status', title: t('studio.data.table.status'), width: 20, render: (v) => { const k = 'studio.data.status.' + STATUS_KEY[v]; return <Tag color={STATUS_KEY[v] === 'online' ? 'green' : 'default'}>{t(k)}</Tag> } },
])
export const TABLE_ROWS = (t) => ([
  { name: '核心交换机-01', ip: '10.0.1.1', group: t('studio.data.group.net'), status: '在线' },
  { name: '应用服务器-A', ip: '10.0.2.10', group: t('studio.data.group.room'), status: '在线' },
  { name: '边缘网关-03', ip: '10.0.3.3', group: t('studio.data.group.iot'), status: '离线' },
  { name: '自助终端-12', ip: '10.0.4.12', group: t('studio.data.group.terminal'), status: '在线' },
  { name: '审计主机', ip: '10.0.5.5', group: t('studio.data.group.sec'), status: '在线' },
  { name: '备份存储', ip: '10.0.6.6', group: t('studio.data.group.room'), status: '在线' },
  { name: '门禁控制器', ip: '10.0.7.7', group: t('studio.data.group.sec'), status: '在线' },
  { name: '测试机-B', ip: '10.0.8.8', group: t('studio.data.group.net'), status: '离线' },
])

export const RULE_FIELDS = (t) => ([
  { name: 'name', label: t('studio.data.rule.name'), type: 'string' },
  { name: 'count', label: t('studio.data.rule.count'), type: 'number' },
  { name: 'status', label: t('studio.data.rule.status'), type: 'enum', options: [t('studio.data.status.online'), t('studio.data.status.offline'), t('studio.data.status.maintaining')] },
  { name: 'enabled', label: t('studio.data.rule.enabled'), type: 'boolean' },
])

export const JSON_LEFT = (t) => ({ name: t('studio.data.json.sampleName'), replicas: 3, tags: ['web', 'core'], config: { timeout: 30, retry: true }, nodes: ['a', 'b'] })
export const JSON_RIGHT = (t) => ({ name: t('studio.data.json.sampleName'), replicas: 5, tags: ['web', 'core', 'edge'], config: { timeout: 60, retry: false }, nodes: ['a', 'b', 'c'] })

export const FORM_SCHEMA = (t) => ([
  { name: 'project', label: t('studio.data.form.project'), type: 'input', required: true, placeholder: t('studio.data.form.required') },
  { name: 'desc', label: t('studio.data.form.desc'), type: 'textarea', placeholder: t('studio.data.form.optional') },
  { name: 'count', label: t('studio.data.form.count'), type: 'number', required: true },
  { name: 'category', label: t('studio.data.form.category'), type: 'select', options: [{ value: 'A', label: t('studio.data.form.catA') }, { value: 'B', label: t('studio.data.form.catB') }] },
  { name: 'enabled', label: t('studio.data.form.enabled'), type: 'switch' },
  { name: 'date', label: t('studio.data.form.date'), type: 'date' },
])

export const ORG_TREE = (t) => ([
  {
    id: 'g0', name: t('studio.data.org.root'), tag: 'root',
    children: [
      { id: 'g1', name: t('studio.data.org.group1'), children: [{ id: 'n1', name: t('studio.data.org.child1') }, { id: 'n2', name: t('studio.data.org.child2') }] },
      { id: 'g2', name: t('studio.data.org.group2'), children: [{ id: 'n3', name: t('studio.data.org.child3') }, { id: 'n4', name: t('studio.data.org.child4'), children: [{ id: 'n5', name: t('studio.data.org.child41') }] }] },
    ],
  },
])

export const SCAN_REPORT = (t) => ({
  title: t('studio.data.report.title'),
  findings: [
    { id: 'f1', severity: 'critical', title: t('studio.data.report.f1Title'), location: 'package.json:12', detail: t('studio.data.report.f1Detail') },
    { id: 'f2', severity: 'high', title: t('studio.data.report.f2Title'), location: 'config/app.yaml:3', detail: t('studio.data.report.f2Detail') },
    { id: 'f3', severity: 'medium', title: t('studio.data.report.f3Title'), location: 'nginx.conf:21', detail: t('studio.data.report.f3Detail') },
    { id: 'f4', severity: 'low', title: t('studio.data.report.f4Title'), location: 'docker-compose.yml:9', detail: t('studio.data.report.f4Detail') },
    { id: 'f5', severity: 'info', title: t('studio.data.report.f5Title'), location: 'repo root', detail: t('studio.data.report.f5Detail') },
    { id: 'f6', severity: 'medium', title: t('studio.data.report.f6Title'), location: 'package.json:30', detail: t('studio.data.report.f6Detail') },
  ],
})

/* 生成一张中性「平面示意图」作为标注底图（内联 SVG，无需外部资源） */
export function buildPlanSvg(t) {
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
      <text x='52' y='62'>${t('studio.data.plan.zoneA')}</text><text x='432' y='62'>${t('studio.data.plan.zoneB')}</text>
      <text x='52' y='302'>${t('studio.data.plan.zoneC')}</text><text x='432' y='302'>${t('studio.data.plan.zoneD')}</text>
    </g>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const PLAN_SRC = (t) => buildPlanSvg(t)

/* ---- 新增组件演示数据（中性虚构） ---- */
export const ANCHOR_SECTIONS = (t) => ([
  { id: 'overview', title: t('studio.data.anchor.overview'), content: <p className="studio-demo__para">{t('studio.data.anchor.overviewText')}</p> },
  { id: 'metric', title: t('studio.data.anchor.metric'), content: <p className="studio-demo__para">{t('studio.data.anchor.metricText')}</p> },
  { id: 'usage', title: t('studio.data.anchor.usage'), content: <p className="studio-demo__para">{t('studio.data.anchor.usageText')}</p> },
  { id: 'faq', title: t('studio.data.anchor.faq'), content: <p className="studio-demo__para">{t('studio.data.anchor.faqText')}</p> },
])

export const TREE_DATA = (t) => ([
  {
    id: 'g1', name: t('studio.data.tree.clusterA'), value: 12, children: [
      { id: 'n1', name: t('studio.data.tree.nodeA1'), value: 4 },
      { id: 'n2', name: t('studio.data.tree.nodeA2'), value: 8, children: [{ id: 'n2a', name: t('studio.data.tree.podA21'), value: 3 }] },
    ],
  },
  {
    id: 'g2', name: t('studio.data.tree.clusterB'), value: 7, children: [
      { id: 'n3', name: t('studio.data.tree.nodeB1'), value: 5 },
      { id: 'n4', name: t('studio.data.tree.nodeB2'), value: 2 },
    ],
  },
])

export const EDIT_COLS = (t) => ([
  { key: 'name', title: t('studio.data.table.name'), editable: true },
  { key: 'group', title: t('studio.data.table.group'), editable: 'select', render: (v) => { const k = 'studio.data.group.' + GROUP_KEY[v]; return t(k) }, options: [{ value: '网络组', label: t('studio.data.group.net') }, { value: '机房组', label: t('studio.data.group.room') }, { value: '安全组', label: t('studio.data.group.sec') }] },
  { key: 'status', title: t('studio.data.table.status'), render: (v) => { const k = 'studio.data.status.' + STATUS_KEY[v]; return <Tag color={STATUS_KEY[v] === 'online' ? 'green' : 'default'}>{t(k)}</Tag> } },
])
export const EDIT_ROWS = () => ([
  { id: 1, name: '核心交换机-01', group: '网络组', status: '在线' },
  { id: 2, name: '应用服务器-A', group: '机房组', status: '在线' },
  { id: 3, name: '边界网关-03', group: '安全组', status: '离线' },
])

export const DRAG_ITEMS = (t) => ([
  { id: 'c1', x: 3, y: 4, w: 44, h: 42, title: t('studio.data.drag.card1'), content: <div style={{ padding: 8, fontSize: 12, color: '#666' }}>{t('studio.data.drag.card1Text')}</div> },
  { id: 'c2', x: 51, y: 4, w: 44, h: 42, title: t('studio.data.drag.card2'), content: <div style={{ padding: 8, fontSize: 12, color: '#666' }}>{t('studio.data.drag.card2Text')}</div> },
  { id: 'c3', x: 3, y: 52, w: 44, h: 40, title: t('studio.data.drag.card3'), content: <div style={{ padding: 8, fontSize: 12, color: '#666' }}>{t('studio.data.drag.card3Text')}</div> },
  { id: 'c4', x: 51, y: 52, w: 44, h: 40, title: t('studio.data.drag.card4'), content: <div style={{ padding: 8, fontSize: 12, color: '#666' }}>{t('studio.data.drag.card4Text')}</div> },
])

export const CAROUSEL_ITEMS = (t) => Array.from({ length: 5 }, (_, i) => (
  <div style={{ fontSize: 15, fontWeight: 600, color: '#1677ff' }}>{t('studio.data.carousel.item', { no: i + 1 })}</div>
))

export const FRAME_SLIDES = Array.from({ length: 6 }, (_, i) => (
  <div style={{ width: 180, height: 120, borderRadius: 8, background: `hsl(${i * 55}, 70%, 90%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, color: `hsl(${i * 55}, 70%, 45%)` }}>{i + 1}</div>
))

export const CTX_MENU = (t) => ([
  { key: 'copy', label: t('studio.data.ctx.copy') },
  { key: 'rename', label: t('studio.data.ctx.rename') },
  { key: 'delete', label: t('studio.data.ctx.delete') },
])

/* ============ 用法代码片段（可一键复制） ============ */

export function CodeBlock({ code }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(code).then(
      () => message.success(t('studio.code.copied')),
      () => message.warning(t('studio.code.clipUnsupported')),
    )
  }
  return (
    <div className="studio-demo__code">
      <Space size={6}>
        <Button size="small" type="text" onClick={() => setOpen((v) => !v)}>
          {open ? t('studio.code.collapse') : t('studio.code.expand')}
        </Button>
        {open && (
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={copy}>{t('studio.code.copy')}</Button>
        )}
      </Space>
      {open && <pre className="studio-demo__pre">{code}</pre>}
    </div>
  )
}

/* ============ 分类 → 组件演示 配置 ============ */

export const CATEGORIES = (t) => ([
  {
    key: 'screen', label: t('studio.cat.screen'), icon: <FundProjectionScreenOutlined />,
    demos: [
      {
        key: 'scanempty',
        title: `${t('studio.demo.scanempty.name')} · ${t('studio.demo.scanempty.title')}`,
        desc: t('studio.demo.scanempty.desc'),
        usage: `<ScanEmpty text="暂无告警" subText="最近 24 小时无异常事件" height={180} />`,
        render: () => <ScanEmpty text={t('studio.demo.scanempty.text')} subText={t('studio.demo.scanempty.subText')} height={180} />,
      },
      {
        key: 'autoscroll',
        title: `${t('studio.demo.autoscroll.name')} · ${t('studio.demo.autoscroll.title')}`,
        desc: t('studio.demo.autoscroll.desc'),
        usage: `<AutoScrollList\n  items={rows}\n  rowHeight={36}\n  maxHeight={220}\n  renderItem={(r) => <span>{r.name} · {r.value}</span>}\n/>`,
        render: () => {
          const rankItems = RANK_ITEMS(t)
          return (
            <AutoScrollList
              items={rankItems}
              maxHeight={220}
              rowHeight={36}
              renderItem={(r) => (
                <Space>
                  <Text strong>{r.name}</Text>
                  <Text type="secondary">{r.value}</Text>
                </Space>
              )}
            />
          )
        },
      },
      {
        key: 'board',
        title: `${t('studio.demo.board.name')} · ${t('studio.demo.board.title')}`,
        desc: t('studio.demo.board.desc'),
        usage: `<DraggableBoard\n  items={[{ id:'a', x:2, y:3, w:46, h:42, title:'访问量' }]}\n  editable={edit}\n  aspect={0.42}\n  onChange={setCards}\n  renderItem={(it) => <Chart data={it} />}\n/>`,
        render: () => <BoardDemo />,
      },
      {
        key: 'axisbreak',
        title: `${t('studio.demo.axisbreak.name')} · ${t('studio.demo.axisbreak.title')}`,
        desc: t('studio.demo.axisbreak.desc'),
        usage: `<AxisBreakBar\n  categories={months}\n  values={values}\n  unit="万"\n  title="月度指标"\n/>`,
        render: () => <AxisBreakBar categories={AXIS_CATS(t)} values={AXIS_VALS} unit={t('studio.data.axis.unit')} title={t('studio.data.axis.title')} />,
      },
      {
        key: 'regionmap',
        title: `${t('studio.demo.regionmap.name')} · ${t('studio.demo.regionmap.title')}`,
        desc: t('studio.demo.regionmap.desc'),
        usage: `<SvgRegionMap\n  regions={[{ id:'r1', name:'机房区', x:40, y:40, w:340, h:200 }]}\n  nodes={[{ id:'n1', regionId:'r1', type:'服务器', count:8, label:'机架 A' }]}\n  onRegionClick={(r) => setActive(r.name)}\n/>`,
        render: () => <RegionMapDemo />,
      },
      {
        key: 'adapttable',
        title: `${t('studio.demo.adapttable.name')} · ${t('studio.demo.adapttable.title')}`,
        desc: t('studio.demo.adapttable.desc'),
        usage: `<AdaptTable\n  columns={[{ key:'name', title:'资源名称', width:30 }]}\n  dataSource={rows}\n  autoScroll\n  marquee\n/>`,
        render: () => <AdaptTable columns={TABLE_COLS(t)} dataSource={TABLE_ROWS(t)} autoScroll marquee />,
      },
    ],
  },
  {
    key: 'builder', label: t('studio.cat.builder'), icon: <PartitionOutlined />,
    demos: [
      {
        key: 'rulebuilder',
        title: `${t('studio.demo.rulebuilder.name')} · ${t('studio.demo.rulebuilder.title')}`,
        desc: t('studio.demo.rulebuilder.desc'),
        usage: `<RuleBuilder\n  fields={[{ name:'count', label:'数量', type:'number' }]}\n  value={tree}\n  onChange={setTree}\n/>\n// tree: { op:'AND', conditions:[{ field, op, value }, { op:'OR', conditions:[...] }] }`,
        render: () => <RuleDemo />,
      },
      {
        key: 'jsondiff',
        title: `${t('studio.demo.jsondiff.name')} · ${t('studio.demo.jsondiff.title')}`,
        desc: t('studio.demo.jsondiff.desc'),
        usage: `<JsonDiff left={before} right={after} />`,
        render: () => <JsonDiff left={JSON_LEFT(t)} right={JSON_RIGHT(t)} />,
      },
    ],
  },
  {
    key: 'media', label: t('studio.cat.media'), icon: <PictureOutlined />,
    demos: [
      {
        key: 'annotator',
        title: `${t('studio.demo.annotator.name')} · ${t('studio.demo.annotator.title')}`,
        desc: t('studio.demo.annotator.desc'),
        usage: `<ImageAnnotator\n  src={imageUrl}\n  annotations={list}\n  onAdd={(m) => setList(p => [...p, m])}\n  onRemove={(id) => setList(p => p.filter(m => m.id !== id))}\n/>\n// 锚点: { id, x: 0~1, y: 0~1, label }`,
        render: () => <AnnotatorDemo />,
      },
    ],
  },
  {
    key: 'form', label: t('studio.cat.form'), icon: <FormOutlined />,
    demos: [
      {
        key: 'dynform',
        title: `${t('studio.demo.dynform.name')} · ${t('studio.demo.dynform.title')}`,
        desc: t('studio.demo.dynform.desc'),
        usage: `<DynamicForm\n  schema={[{ name:'project', label:'项目名称', type:'input', required:true }]}\n  onChange={setValues}\n/>`,
        render: () => <FormDemo />,
      },
      {
        key: 'orgtree',
        title: `${t('studio.demo.orgtree.name')} · ${t('studio.demo.orgtree.title')}`,
        desc: t('studio.demo.orgtree.desc'),
        usage: `<OrgTree\n  data={[{ id:'g0', name:'根节点', children:[...] }]}\n  defaultExpanded\n  selectedId={id}\n  onSelect={(node) => setId(node.id)}\n/>`,
        render: () => <OrgTree data={ORG_TREE(t)} defaultExpanded />,
      },
    ],
  },
  {
    key: 'report', label: t('studio.cat.report'), icon: <FileSearchOutlined />,
    demos: [
      {
        key: 'scanreport',
        title: `${t('studio.demo.scanreport.name')} · ${t('studio.demo.scanreport.title')}`,
        desc: t('studio.demo.scanreport.desc'),
        usage: `<ScanReport report={{\n  title: '依赖与配置巡检报告',\n  findings: [{ id:'f1', severity:'critical', title:'...', location:'package.json:12', detail:'...' }],\n}} />`,
        render: () => <ScanReport report={SCAN_REPORT(t)} />,
      },
    ],
  },
  {
    key: 'interact', label: t('studio.cat.interact'), icon: <PartitionOutlined />,
    demos: [
      {
        key: 'anchornav',
        title: `${t('studio.demo.anchornav.name')} · ${t('studio.demo.anchornav.title')}`,
        desc: t('studio.demo.anchornav.desc'),
        usage: `<AnchorNav\n  sections={[{ id:'s1', title:'概览', content:<p/> }]}\n  height={260}\n/>`,
        render: () => <AnchorDemo />,
      },
      {
        key: 'pagetabs',
        title: `${t('studio.demo.pagetabs.name')} · ${t('studio.demo.pagetabs.title')}`,
        desc: t('studio.demo.pagetabs.desc'),
        usage: `<PageTabs\n  panels={panels}\n  activeKey={active}\n  onChange={setActive}\n  onClose={close}\n  onAdd={add}\n/>`,
        render: () => <PageTabsDemo />,
      },
      {
        key: 'treetable',
        title: `${t('studio.demo.treetable.name')} · ${t('studio.demo.treetable.title')}`,
        desc: t('studio.demo.treetable.desc'),
        usage: `<TreeTable\n  treeData={[{ id:'g1', name:'集群A', value:12, children:[...] }]}\n  valueTitle="数值"\n/>`,
        render: () => <TreeTableDemo />,
      },
      {
        key: 'highlighter',
        title: `${t('studio.demo.highlighter.name')} · ${t('studio.demo.highlighter.title')}`,
        desc: t('studio.demo.highlighter.desc'),
        usage: `<Highlighter text="核心交换机 服务正常" keyword="服务" />`,
        render: () => <HighlighterDemo />,
      },
      {
        key: 'editabletable',
        title: `${t('studio.demo.editabletable.name')} · ${t('studio.demo.editabletable.title')}`,
        desc: t('studio.demo.editabletable.desc'),
        usage: `<EditableTable\n  columns={[{ key:'name', title:'名称', editable:true }]}\n  data={rows}\n  rowKey="id"\n/>`,
        render: () => <EditableDemo />,
      },
      {
        key: 'draglayout',
        title: `${t('studio.demo.draglayout.name')} · ${t('studio.demo.draglayout.title')}`,
        desc: t('studio.demo.draglayout.desc'),
        usage: `<DragLayout\n  items={[{ id:'c1', x:3, y:4, w:44, h:42, title:'卡片一', content:<div/> }]}\n  editable={edit}\n  onLayoutChange={setItems}\n/>`,
        render: () => <DragLayoutDemo />,
      },
      {
        key: 'gauge',
        title: `${t('studio.demo.gauge.name')} · ${t('studio.demo.gauge.title')}`,
        desc: t('studio.demo.gauge.desc'),
        usage: `<CanvasGauge value={v} max={100} title="完成度" unit="%" />`,
        render: () => <GaugeDemo />,
      },
      {
        key: 'carousel3d',
        title: `${t('studio.demo.carousel3d.name')} · ${t('studio.demo.carousel3d.title')}`,
        desc: t('studio.demo.carousel3d.desc'),
        usage: `<CardCarousel3D\n  items={[<div>卡片1</div>, <div>卡片2</div>]}\n  autoPlay={auto}\n  height={200}\n/>`,
        render: () => <CarouselDemo />,
      },
      {
        key: 'frameplayer',
        title: `${t('studio.demo.frameplayer.name')} · ${t('studio.demo.frameplayer.title')}`,
        desc: t('studio.demo.frameplayer.desc'),
        usage: `<FramePlayer frames={[<img/>, <div/>]} fps={3} height={200} />`,
        render: () => <FrameDemo />,
      },
      {
        key: 'contextmenu',
        title: `${t('studio.demo.contextmenu.name')} · ${t('studio.demo.contextmenu.title')}`,
        desc: t('studio.demo.contextmenu.desc'),
        usage: `<ContextMenu menu={[{ key:'copy', label:'复制' }]}>\n  <div>右键此区域</div>\n</ContextMenu>`,
        render: () => <ContextMenuDemo />,
      },
      {
        key: 'errorboundary',
        title: `${t('studio.demo.errorboundary.name')} · ${t('studio.demo.errorboundary.title')}`,
        desc: t('studio.demo.errorboundary.desc'),
        usage: `<ErrorBoundary>\n  <Child />\n</ErrorBoundary>`,
        render: () => <ErrorBoundaryDemo />,
      },
      {
        key: 'fullscreen',
        title: `${t('studio.demo.fullscreen.name')} · ${t('studio.demo.fullscreen.title')}`,
        desc: t('studio.demo.fullscreen.desc'),
        usage: `<Fullscreen>\n  <div>可全屏的内容</div>\n</Fullscreen>`,
        render: () => <FullscreenDemo />,
      },
    ],
  },
])

/* ============ 需要内部状态的演示组件 ============ */

export function BoardDemo() {
  const { t } = useI18n()
  const [cards, setCards] = useState(() => BOARD_CARDS(t))
  const [edit, setEdit] = useState(false)
  return (
    <div>
      <Space style={{ marginBottom: 10 }}>
        <Text>{t('studio.ui.editMode')}</Text>
        <Switch checked={edit} onChange={setEdit} />
      </Space>
      <DraggableBoard items={cards} editable={edit} onChange={setCards} aspect={0.42} />
    </div>
  )
}

export function RegionMapDemo() {
  const { t } = useI18n()
  const [active, setActive] = useState(null)
  return (
    <div>
      <SvgRegionMap regions={REGIONS(t)} nodes={NODES(t)} onRegionClick={(r) => setActive(r.name)} />
      {active && <Text type="secondary">{t('studio.ui.regionSelected', { name: active })}</Text>}
    </div>
  )
}

export function RuleDemo() {
  const { t } = useI18n()
  const [tree, setTree] = useState({ op: 'AND', conditions: [{ field: 'count', op: '>', value: 10 }] })
  return <RuleBuilder fields={RULE_FIELDS(t)} value={tree} onChange={setTree} />
}

export function AnnotatorDemo() {
  const { t } = useI18n()
  const [list, setList] = useState([
    { id: 'm1', x: 0.25, y: 0.3, label: '设备 A' },
    { id: 'm2', x: 0.7, y: 0.6, label: '设备 B' },
  ])
  return (
    <ImageAnnotator
      src={PLAN_SRC(t)}
      annotations={list}
      onAdd={(m) => setList((p) => [...p, m])}
      onRemove={(id) => setList((p) => p.filter((m) => m.id !== id))}
    />
  )
}

export function FormDemo() {
  const { t } = useI18n()
  const [vals, setVals] = useState({})
  const [show, setShow] = useState(false)
  return (
    <div>
      <DynamicForm schema={FORM_SCHEMA(t)} onChange={setVals} />
      <Button size="small" style={{ marginTop: 10 }} onClick={() => setShow((s) => !s)}>
        {show ? t('studio.ui.hide') : t('studio.ui.show')} {t('studio.ui.liveValues')}
      </Button>
      {show && <pre className="studio-json">{JSON.stringify(vals, null, 2)}</pre>}
    </div>
  )
}

export function AnchorDemo() {
  const { t } = useI18n()
  return <AnchorNav sections={ANCHOR_SECTIONS(t)} height={260} />
}

export function PageTabsDemo() {
  const { t } = useI18n()
  const [panels, setPanels] = useState(() => [
    { key: 'home', label: t('studio.ui.tabHome'), closable: false, render: () => <div style={{ padding: 12 }}>{t('studio.ui.homeContent')}</div> },
    { key: 'doc', label: t('studio.ui.tabDoc'), closable: true, render: () => <div style={{ padding: 12 }}>{t('studio.ui.docContent')}</div> },
    { key: 'log', label: t('studio.ui.tabLog'), closable: true, render: () => <div style={{ padding: 12 }}>{t('studio.ui.logContent')}</div> },
  ])
  const [active, setActive] = useState('home')
  const close = (key) => {
    const next = panels.filter((p) => p.key !== key)
    setPanels(next)
    if (active === key) setActive(next[0]?.key ?? '')
  }
  const add = () => {
    const key = `new-${Date.now()}`
    setPanels((p) => [...p, { key, label: t('studio.ui.newTab'), closable: true, render: () => <div style={{ padding: 12 }}>{t('studio.ui.newTabContent')}</div> }])
    setActive(key)
  }
  return <PageTabs panels={panels} activeKey={active} onChange={setActive} onClose={close} onAdd={add} />
}

export function TreeTableDemo() {
  const { t } = useI18n()
  return <TreeTable treeData={TREE_DATA(t)} />
}

export function HighlighterDemo() {
  const { t } = useI18n()
  const [kw, setKw] = useState(t('studio.ui.hlKeyword'))
  return (
    <div>
      <Input.Search
        placeholder={t('studio.ui.searchPlaceholder')}
        value={kw}
        onChange={(e) => setKw(e.target.value)}
        style={{ marginBottom: 10, maxWidth: 280 }}
      />
      <div style={{ lineHeight: 1.9 }}>
        <Highlighter text={t('studio.ui.hlText1')} keyword={kw} />
        <br />
        <Highlighter text={t('studio.ui.hlText2')} keyword={kw} />
        <br />
        <Highlighter text={t('studio.ui.hlText3')} keyword={kw} />
      </div>
    </div>
  )
}

export function EditableDemo() {
  const { t } = useI18n()
  return <EditableTable columns={EDIT_COLS(t)} data={EDIT_ROWS()} />
}

export function DragLayoutDemo() {
  const { t } = useI18n()
  const [edit, setEdit] = useState(true)
  const [items, setItems] = useState(() => DRAG_ITEMS(t))
  return (
    <div>
      <Space style={{ marginBottom: 10 }}>
        <Text>{t('studio.ui.editMode')}</Text>
        <Switch checked={edit} onChange={setEdit} />
      </Space>
      <DragLayout items={items} editable={edit} onLayoutChange={setItems} />
    </div>
  )
}

export function GaugeDemo() {
  const { t } = useI18n()
  const [v, setV] = useState(0)
  return (
    <div>
      <Space style={{ marginBottom: 10 }}>
        <Button size="small" onClick={() => setV(Math.round(Math.random() * 100))}>{t('studio.ui.randomValue')}</Button>
        <Button size="small" onClick={() => setV(0)}>{t('studio.ui.zero')}</Button>
      </Space>
      <CanvasGauge value={v} max={100} title={t('studio.ui.gaugeTitle')} unit="%" />
    </div>
  )
}

export function CarouselDemo() {
  const { t } = useI18n()
  const [auto, setAuto] = useState(false)
  return (
    <div>
      <Space style={{ marginBottom: 10 }}>
        <Text>{t('studio.ui.autoPlay')}</Text>
        <Switch checked={auto} onChange={setAuto} />
      </Space>
      <CardCarousel3D items={CAROUSEL_ITEMS(t)} autoPlay={auto} height={200} />
    </div>
  )
}

export function FrameDemo() {
  return <FramePlayer frames={FRAME_SLIDES} fps={3} height={200} />
}

export function ContextMenuDemo() {
  const { t } = useI18n()
  return (
    <ContextMenu menu={CTX_MENU(t)}>
      <div style={{ padding: '28px 40px', border: '1px dashed #d9d9d9', borderRadius: 8, color: '#666', userSelect: 'none' }}>
        {t('studio.ui.ctxHint')}
      </div>
    </ContextMenu>
  )
}

export function ErrorBoundaryDemo() {
  const { t } = useI18n()
  const [boom, setBoom] = useState(false)
  if (boom) throw new Error('演示用异常：子组件渲染失败')
  return (
    <ErrorBoundary>
      <div style={{ padding: 12 }}>
        <Button size="small" danger onClick={() => setBoom(true)}>{t('studio.ui.boomBtn')}</Button>
        <p style={{ marginTop: 10, color: '#666' }}>{t('studio.ui.boomHint')}</p>
      </div>
    </ErrorBoundary>
  )
}

export function FullscreenDemo() {
  const { t } = useI18n()
  return (
    <Fullscreen>
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', color: '#666' }}>
        {t('studio.ui.fullscreenHint')}
      </div>
    </Fullscreen>
  )
}

/* ============ 页面主体 ============ */
