import { useMemo, useRef, useState } from 'react'
import { Menu, Card, Typography, Input, Button, Space, Tag, Switch, Segmented } from 'antd'
import {
  FieldTimeOutlined, FontSizeOutlined, AppstoreOutlined,
  ApartmentOutlined, DatabaseOutlined, HighlightOutlined,
  ControlOutlined, DownloadOutlined, ThunderboltOutlined,
} from '@ant-design/icons'
import {
  useDebounce, useThrottle, useLocalStorage, useCopy, useWatermark,
  useOnline, useMediaQuery, useClickOutside, useHover, useSize,
  useKeyPress, useInterval, useToggle, useCounter,
  formatDate, formatRelativeTime, diffDays, formatFileSize, formatThousands,
  formatPercent, mask, arrayToObject, groupBy, unique, sortBy, flatten,
  deepMerge, pick, omit, treeToArray, arrayToTree, findTreeNode,
  exportCsv, copyText, retry, sleep, debounce, throttle,
} from '../../components/Utils/index.js'
import './index.scss'

const { Title, Paragraph, Text } = Typography

/* ============ 演示数据（全部中性虚构） ============ */
const SAMPLE_ROWS = [
  { name: '应用服务器-A', group: '机房组', value: 92, status: '在线' },
  { name: '核心交换机-01', group: '网络组', value: 78, status: '在线' },
  { name: '边缘网关-03', group: '物联网组', value: 41, status: '离线' },
  { name: '审计主机', group: '安全组', value: 63, status: '在线' },
  { name: '备份存储', group: '机房组', value: 55, status: '在线' },
]

const SAMPLE_TREE = [
  { id: 'g1', name: '分组一', children: [{ id: 'n1', name: '子项 1' }, { id: 'n2', name: '子项 2' }] },
  { id: 'g2', name: '分组二', children: [{ id: 'n3', name: '子项 3' }] },
]

const FLAT_LIST = [
  { id: 1, parentId: null, name: '根' },
  { id: 2, parentId: 1, name: '子 A' },
  { id: 3, parentId: 1, name: '子 B' },
  { id: 4, parentId: 2, name: '孙 A-1' },
]

const CSV_COLUMNS = [
  { key: 'name', title: '资源名称' },
  { key: 'group', title: '分组' },
  { key: 'value', title: '数值' },
  { key: 'status', title: '状态' },
]

/* ============ 小卡片容器 ============ */
function DemoCard({ title, desc, usage, children }) {
  return (
    <Card size="small" className="utils-demo__card">
      <Text strong className="utils-demo__title">{title}</Text>
      <Paragraph type="secondary" className="utils-demo__desc">{desc}</Paragraph>
      <div className="utils-demo__stage">{children}</div>
      {usage && <pre className="utils-demo__code">{usage}</pre>}
    </Card>
  )
}

/* ============ 各分组演示 ============ */

function FreqDemos() {
  const [text, setText] = useState('')
  const debounced = useDebounce(text, 400)
  const [clicks, setClicks] = useState(0)
  const throttled = useThrottle(clicks, 600)
  const [log, setLog] = useState('（点击按钮观察）')

  const dLog = useMemo(() => debounce((v) => setLog(`debounce 触发：${v}`), 500), [])
  const tLog = useMemo(() => throttle(() => setLog(`throttle 触发 @ ${new Date().toLocaleTimeString('zh-CN')}`), 800), [])
  const [retryOut, setRetryOut] = useState('')

  return (
    <>
      <DemoCard
        title="useDebounce · 防抖值"
        desc="输入停止 400ms 后才更新，适合搜索联想、表单校验。"
        usage="<const debounced = useDebounce(text, 400)>"
      >
        <Input placeholder="输入一些文字" value={text} onChange={(e) => setText(e.target.value)} style={{ maxWidth: 260 }} />
        <div className="utils-demo__out">防抖后：{debounced || '（空）'}</div>
      </DemoCard>

      <DemoCard
        title="useThrottle · 节流值"
        desc="600ms 内最多更新一次，适合滚动 / 高频点击。"
        usage="<const throttled = useThrottle(clicks, 600)>"
      >
        <Space>
          <Button size="small" onClick={() => setClicks((c) => c + 1)}>快速点击 +1</Button>
          <Text type="secondary">原始 {clicks} / 节流后 {throttled}</Text>
        </Space>
      </DemoCard>

      <DemoCard
        title="debounce / throttle 函数"
        desc="直接包裹回调；均带 cancel()，卸载自动清理。"
        usage="const d = debounce(fn, 500)  // d.cancel() / d.flush()"
      >
        <Space wrap>
          <Button size="small" onClick={() => dLog(Date.now())}>debounce 调用</Button>
          <Button size="small" onClick={() => tLog()}>throttle 调用</Button>
        </Space>
        <div className="utils-demo__out">{log}</div>
      </DemoCard>

      <DemoCard
        title="retry / sleep · 异步重试"
        desc="失败自动重试 N 次；sleep 为 Promise 版定时器。"
        usage="await retry(fetchData, { times: 3, delay: 200 })"
      >
        <Button
          size="small"
          onClick={async () => {
            setRetryOut('重试中…')
            let n = 0
            try {
              const r = await retry(async () => {
                n += 1
                if (n < 3) throw new Error('boom')
                await sleep(80)
                return `第 ${n} 次成功`
              }, { times: 3, delay: 60 })
              setRetryOut(r)
            } catch (e) {
              setRetryOut(`失败：${e.message}`)
            }
          }}
        >
          模拟「前 2 次失败」
        </Button>
        <div className="utils-demo__out">{retryOut || '点击按钮'}</div>
      </DemoCard>
    </>
  )
}

function FormatDemos() {
  const [phone, setPhone] = useState('13800138000')
  const now = new Date(2024, 0, 10, 12, 0, 0).getTime()

  return (
    <>
      <DemoCard
        title="formatDate · 日期格式化"
        desc="支持 YYYY/YY/MM/M/DD/D/HH/H/mm/m/ss/s 占位符。"
        usage="formatDate(date, 'YYYY-MM-DD HH:mm:ss')"
      >
        <div className="utils-demo__out">{formatDate(new Date(2024, 0, 2, 3, 4, 5))}</div>
        <div className="utils-demo__out">{formatDate(new Date(2024, 0, 2), 'YYYY/MM/DD')}</div>
      </DemoCard>

      <DemoCard
        title="formatRelativeTime · 相对时间"
        desc="刚刚 / x 分钟前 / x 小时前 / x 天前，超过 30 天回落日期。"
        usage="formatRelativeTime(time, now)"
      >
        <div className="utils-demo__out">30 秒前 → {formatRelativeTime(now - 30_000, now)}</div>
        <div className="utils-demo__out">5 分钟前 → {formatRelativeTime(now - 5 * 60_000, now)}</div>
        <div className="utils-demo__out">3 天前 → {formatRelativeTime(now - 3 * 86_400_000, now)}</div>
      </DemoCard>

      <DemoCard
        title="diffDays · 相差天数"
        desc="两个日期相差整天数，非法输入返回 0。"
        usage="diffDays(start, end)"
      >
        <div className="utils-demo__out">
          {formatDate(new Date(2024, 0, 1), 'YYYY-MM-DD')} ~ {formatDate(new Date(2024, 0, 15), 'YYYY-MM-DD')}
          {' → '}{diffDays(new Date(2024, 0, 1), new Date(2024, 0, 15))} 天
        </div>
      </DemoCard>

      <DemoCard
        title="formatFileSize / formatThousands / formatPercent"
        desc="文件体积、千分位、百分比三组常用格式化。"
        usage="formatFileSize(1536) // '1.50 KB'"
      >
        <Space wrap size={[8, 4]}>
          <Tag>{formatFileSize(1536)}</Tag>
          <Tag>{formatFileSize(5 * 1024 * 1024)}</Tag>
          <Tag>{formatThousands(1234567)}</Tag>
          <Tag>{formatPercent(0.8734)}</Tag>
        </Space>
      </DemoCard>

      <DemoCard
        title="mask · 字符串脱敏"
        desc="保留首尾、中间打码，常用于手机号 / 证件号展示。"
        usage="mask('13800138000') // '138****8000'"
      >
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ maxWidth: 220 }} />
        <div className="utils-demo__out">脱敏后：{mask(phone)}</div>
      </DemoCard>
    </>
  )
}

function ArrayDemos() {
  return (
    <>
      <DemoCard
        title="groupBy / unique / sortBy"
        desc="按字段分组、去重、排序；均返回新数组，不改原数据。"
        usage="groupBy(rows, 'group')  sortBy(rows, 'value', 'desc')"
      >
        <div className="utils-demo__out">分组：{Object.keys(groupBy(SAMPLE_ROWS, 'group')).join(' / ')}</div>
        <div className="utils-demo__out">
          降序：{sortBy(SAMPLE_ROWS, 'value', 'desc').map((r) => r.value).join(' > ')}
        </div>
        <div className="utils-demo__out">
          去重分组数：{unique(SAMPLE_ROWS.map((r) => r.group)).length}
        </div>
      </DemoCard>

      <DemoCard
        title="arrayToObject · 建索引"
        desc="数组按 key 转成对象，O(1) 查找。"
        usage="arrayToObject(list, 'id')"
      >
        <pre className="utils-demo__json">
          {JSON.stringify(arrayToObject(SAMPLE_ROWS.slice(0, 2), 'name'), null, 2)}
        </pre>
      </DemoCard>

      <DemoCard
        title="flatten · 扁平化"
        desc="按深度展开嵌套数组，Infinity 全展开。"
        usage="flatten([1,[2,[3,[4]]]], 2)"
      >
        <div className="utils-demo__out">{JSON.stringify(flatten([1, [2, [3, [4]]]], 2))}</div>
        <div className="utils-demo__out">{JSON.stringify(flatten([1, [2, [3, [4]]]], Infinity))}</div>
      </DemoCard>

      <DemoCard
        title="deepMerge / pick / omit"
        desc="递归合并与字段裁剪，均不修改入参。"
        usage="deepMerge(a, b)   pick(obj, ['x'])   omit(obj, ['y'])"
      >
        <div className="utils-demo__out">
          merge: {JSON.stringify(deepMerge({ a: 1, b: { p: 1 } }, { b: { q: 2 }, c: 3 }))}
        </div>
        <div className="utils-demo__out">pick: {JSON.stringify(pick(SAMPLE_ROWS[0], ['name', 'status']))}</div>
        <div className="utils-demo__out">omit: {JSON.stringify(omit(SAMPLE_ROWS[0], ['value', 'group']))}</div>
      </DemoCard>
    </>
  )
}

function TreeDemos() {
  const tree = useMemo(() => arrayToTree(FLAT_LIST), [])
  return (
    <>
      <DemoCard
        title="treeToArray · 平铺"
        desc="树结构拍平为一维数组，便于搜索 / 统计。"
        usage="treeToArray(tree)"
      >
        <div className="utils-demo__out">
          {treeToArray(SAMPLE_TREE).map((n) => n.name).join(' / ')}（共 {treeToArray(SAMPLE_TREE).length} 个）
        </div>
      </DemoCard>

      <DemoCard
        title="arrayToTree · 建树"
        desc="按 id / parentId 还原层级，常用于接口平铺数据。"
        usage="arrayToTree(list, { id, parentId })"
      >
        <pre className="utils-demo__json">{JSON.stringify(tree, null, 2)}</pre>
      </DemoCard>

      <DemoCard
        title="findTreeNode · 深度查找"
        desc="深度优先按 id 查节点，未找到返回 null。"
        usage="findTreeNode(tree, 'n3')"
      >
        <div className="utils-demo__out">
          n3 → {JSON.stringify(findTreeNode(SAMPLE_TREE, 'n3'))}
        </div>
        <div className="utils-demo__out">不存在 → {String(findTreeNode(SAMPLE_TREE, 'zzz'))}</div>
      </DemoCard>
    </>
  )
}

function StorageDemos() {
  const [note, setNote] = useLocalStorage('utils-demo:note', '改我，然后刷新页面')
  const online = useOnline()
  const isWide = useMediaQuery('(min-width: 1024px)')

  return (
    <>
      <DemoCard
        title="useLocalStorage · 持久化 state"
        desc="与 localStorage 双向同步，支持过期时间；刷新后仍保留。"
        usage="const [v, setV] = useLocalStorage('key', 初值, { expire })"
      >
        <Input value={note} onChange={(e) => setNote(e.target.value)} style={{ maxWidth: 300 }} />
        <div className="utils-demo__out">已写入 localStorage</div>
      </DemoCard>

      <DemoCard
        title="useOnline · 网络状态"
        desc="监听 online / offline 事件，断网提示常用。"
        usage="const online = useOnline()"
      >
        <Tag color={online ? 'green' : 'red'}>{online ? '在线' : '离线'}</Tag>
      </DemoCard>

      <DemoCard
        title="useMediaQuery · 媒体查询"
        desc="响应式断点判断，避免把断点写死在 JS 里。"
        usage="const isWide = useMediaQuery('(min-width: 1024px)')"
      >
        <Tag color={isWide ? 'blue' : 'default'}>{isWide ? '宽屏 (≥1024px)' : '窄屏 (<1024px)'}</Tag>
      </DemoCard>
    </>
  )
}

function InteractDemos() {
  const wmRef = useRef(null)
  useWatermark(wmRef, ['示例水印', '2026-09'])
  const boxRef = useRef(null)
  const [open, setOpen] = useState(false)
  useClickOutside(boxRef, () => setOpen(false))
  const hoverRef = useRef(null)
  const hovered = useHover(hoverRef)
  const sizeRef = useRef(null)
  const size = useSize(sizeRef)
  const [keyHit, setKeyHit] = useState('按 k 试试')
  useKeyPress('k', () => setKeyHit(`捕获到 k @ ${new Date().toLocaleTimeString('zh-CN')}`))
  const { copied, copy } = useCopy()

  return (
    <>
      <DemoCard
        title="useWatermark · 容器水印"
        desc="canvas 平铺生成 + MutationObserver 防删除，删掉会自动恢复。"
        usage="const ref = useRef(null); useWatermark(ref, ['水印文字'])"
      >
        <div ref={wmRef} className="utils-demo__watermark">
          <Text>此区域带水印（可在控制台尝试删除水印节点验证自愈）</Text>
        </div>
      </DemoCard>

      <DemoCard
        title="useClickOutside · 点击外部关闭"
        desc="常用于下拉 / 弹层；ref 由调用方创建后传入。"
        usage="useClickOutside(ref, () => setOpen(false))"
      >
        <div ref={boxRef} style={{ display: 'inline-block' }}>
          <Button size="small" onClick={() => setOpen((v) => !v)}>{open ? '已展开' : '展开面板'}</Button>
          {open && (
            <div className="utils-demo__pop">面板内容：点击外部关闭</div>
          )}
        </div>
      </DemoCard>

      <DemoCard
        title="useHover / useSize"
        desc="悬停状态与元素尺寸（ResizeObserver 驱动）。"
        usage="const hovered = useHover(ref);  const { width } = useSize(ref)"
      >
        <div ref={hoverRef} className={`utils-demo__hoverbox ${hovered ? 'is-hover' : ''}`}>悬停我</div>
        <div ref={sizeRef} className="utils-demo__sizebox" style={{ marginTop: 8 }}>
          拖动窗口宽度观察尺寸：{size.width} × {size.height}
        </div>
      </DemoCard>

      <DemoCard
        title="useKeyPress · 快捷键"
        desc="监听全局按键（大小写不敏感）。"
        usage="useKeyPress('k', handler)"
      >
        <Text type="secondary">{keyHit}</Text>
      </DemoCard>

      <DemoCard
        title="useCopy · 复制到剪贴板"
        desc="Clipboard API 优先，失败自动降级；copied 状态自动复位。"
        usage="const { copied, copy } = useCopy()"
      >
        <Space>
          <Button size="small" onClick={() => copy('复制成功示例文本')}>
            {copied ? '已复制 ✓' : '复制文本'}
          </Button>
          <Text type="secondary">{copied ? '1.5s 后复位' : ''}</Text>
        </Space>
      </DemoCard>
    </>
  )
}

function StateDemos() {
  const { value, toggle } = useToggle(false)
  const { count, inc, dec, reset } = useCounter(0, { min: 0, max: 10 })
  const [ticks, setTicks] = useState(0)
  const [running, setRunning] = useState(true)
  useInterval(() => setTicks((t) => t + 1), running ? 1000 : null)

  return (
    <>
      <DemoCard
        title="useToggle · 布尔开关"
        desc="比手写 useState + 取反更省事，附带 setOn / setOff。"
        usage="const { value, toggle } = useToggle()"
      >
        <Space>
          <Switch checked={value} onChange={toggle} />
          <Text type="secondary">{String(value)}</Text>
        </Space>
      </DemoCard>

      <DemoCard
        title="useCounter · 计数器"
        desc="带上下限夹取，适合数量选择 / 分页步进。"
        usage="const { count, inc, dec, reset } = useCounter(0, { min: 0, max: 10 })"
      >
        <Space>
          <Button size="small" onClick={() => dec()}>-</Button>
          <Text strong>{count}</Text>
          <Button size="small" onClick={() => inc()}>+</Button>
          <Button size="small" type="text" onClick={reset}>重置</Button>
        </Space>
      </DemoCard>

      <DemoCard
        title="useInterval · 定时器"
        desc="delay 传 null 即暂停；卸载自动清理。"
        usage="useInterval(fn, running ? 1000 : null)"
      >
        <Space>
          <Tag color="blue">ticks: {ticks}</Tag>
          <Switch checked={running} onChange={setRunning} checkedChildren="跑" unCheckedChildren="停" />
        </Space>
      </DemoCard>
    </>
  )
}

function ExportDemos() {
  return (
    <>
      <DemoCard
        title="exportCsv · 导出 CSV"
        desc="带 BOM，Excel 打开中文不乱码；字段值自动转义引号与换行。"
        usage="exportCsv({ columns, rows, filename: '资源清单.csv' })"
      >
        <Space wrap>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => exportCsv({ columns: CSV_COLUMNS, rows: SAMPLE_ROWS, filename: '资源清单.csv' })}
          >
            下载示例 CSV
          </Button>
          <Button size="small" onClick={() => copyText(JSON.stringify(SAMPLE_ROWS[0]))}>复制首行 JSON</Button>
        </Space>
        <div className="utils-demo__out">共 {SAMPLE_ROWS.length} 行 × {CSV_COLUMNS.length} 列</div>
      </DemoCard>
    </>
  )
}

/* ============ 分类配置 ============ */
const CATEGORIES = [
  { key: 'freq', label: '频率控制', icon: <FieldTimeOutlined />, render: () => <FreqDemos /> },
  { key: 'format', label: '格式化 · 脱敏', icon: <FontSizeOutlined />, render: () => <FormatDemos /> },
  { key: 'array', label: '数组 · 对象', icon: <AppstoreOutlined />, render: () => <ArrayDemos /> },
  { key: 'tree', label: '树结构', icon: <ApartmentOutlined />, render: () => <TreeDemos /> },
  { key: 'storage', label: '存储 · 环境', icon: <DatabaseOutlined />, render: () => <StorageDemos /> },
  { key: 'interact', label: '交互 · DOM', icon: <HighlightOutlined />, render: () => <InteractDemos /> },
  { key: 'state', label: '状态小工具', icon: <ControlOutlined />, render: () => <StateDemos /> },
  { key: 'export', label: '导出 · 下载', icon: <DownloadOutlined />, render: () => <ExportDemos /> },
]

export default function UtilsDemo() {
  const [cat, setCat] = useState('freq')
  const current = CATEGORIES.find((c) => c.key === cat)

  const menuItems = useMemo(
    () => CATEGORIES.map((c) => ({ key: c.key, icon: c.icon, label: c.label })),
    [],
  )

  return (
    <div className="utils-demo">
      <div className="utils-demo__header">
        <Title level={3} style={{ marginBottom: 4 }}>
          <ThunderboltOutlined /> 小功能集 Utils
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          从存量项目里挑出的高频小工具：{50}+ 个纯函数与 {20} 个 Hook，全部零依赖、去业务化。
          纯函数部分已纳入 <Text code>npm test</Text>（零依赖 node 断言，无需 vitest）。
        </Paragraph>
      </div>

      <div className="utils-demo__layout">
        <Menu
          mode="inline"
          className="utils-demo__menu"
          selectedKeys={[cat]}
          items={menuItems}
          onClick={({ key }) => setCat(key)}
        />
        <div className="utils-demo__content">
          <Segmented
            className="utils-demo__seg"
            options={CATEGORIES.map((c) => ({ label: c.label, value: c.key }))}
            value={cat}
            onChange={setCat}
          />
          <div className="utils-demo__grid">{current.render()}</div>
        </div>
      </div>
    </div>
  )
}
