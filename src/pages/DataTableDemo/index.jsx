import { useMemo, useState } from 'react'
import DataTable from '../../components/DataTable/index.js'
import './index.scss'

const STATUS_LIST = [
  { key: 'active', label: '正常', tone: 'success' },
  { key: 'pending', label: '待审', tone: 'warning' },
  { key: 'banned', label: '禁用', tone: 'danger' },
]
const STATUS_MAP = Object.fromEntries(STATUS_LIST.map((s) => [s.key, s]))

const NAMES = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二']
const DEPTS = ['研发部', '产品部', '设计部', '运营部', '市场部', '财务部', '人事部']
const ROLES = ['工程师', '产品经理', '设计师', '运营专员', '主管', '总监']

/** 生成 50 行演示数据 */
function makeRows() {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${i + 1}` : ''),
    age: 22 + (i * 7) % 30,
    email: `user${i + 1}@example.com`,
    dept: DEPTS[i % DEPTS.length],
    role: ROLES[i % ROLES.length],
    salary: 8000 + (i * 1234) % 22000,
    status: STATUS_LIST[i % STATUS_LIST.length].key,
    createdAt: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
  }))
}

/** 状态标签 */
function StatusTag({ value }) {
  const s = STATUS_MAP[value] || { label: value, tone: 'info' }
  return <span className={`status-tag is-${s.tone}`}>{s.label}</span>
}

const COLUMNS = [
  { key: 'id', title: 'ID', width: 60, sortable: true },
  { key: 'name', title: '姓名', width: 120, sortable: true, filterable: true },
  { key: 'age', title: '年龄', width: 80, sortable: true },
  { key: 'email', title: '邮箱', width: 200, filterable: true },
  { key: 'dept', title: '部门', width: 100, sortable: true, filterable: true },
  { key: 'role', title: '职位', width: 100, filterable: true },
  { key: 'salary', title: '月薪', width: 110, sortable: true, render: (v) => `¥${v.toLocaleString()}` },
  { key: 'status', title: '状态', width: 88, sortable: true, filterable: true, render: (v) => <StatusTag value={v} /> },
  { key: 'createdAt', title: '注册日期', width: 120, sortable: true },
]

const PAGE_SIZE_OPTIONS = [
  { value: 0, label: '不分页' },
  { value: 5, label: '5 条/页' },
  { value: 10, label: '10 条/页' },
  { value: 20, label: '20 条/页' },
]

function DataTableDemo() {
  const rows = useMemo(() => makeRows(), [])
  const [loading, setLoading] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [clickedRow, setClickedRow] = useState(null)

  return (
    <div className="page-card dt-demo">
      <header className="dt-demo-header">
        <div>
          <h1>高级数据表格</h1>
          <p>
            纯 React 实现，零外部依赖。支持列排序、列级模糊筛选、分页、行选择、加载骨架、空状态与响应式横向滚动，
            统一消费 <code>--c-primary</code> 等设计 token，保持 Indigo 玻璃态风格。
          </p>
        </div>
      </header>

      <div className="dt-demo-controls">
        <button type="button" className="btn" onClick={() => setLoading((v) => !v)}>
          {loading ? '停止加载' : '模拟加载'}
        </button>

        <label className="dt-demo-control">
          <span className="dt-demo-control-label">每页</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="dt-demo-select"
          >
            {PAGE_SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <div className="dt-demo-control">
          <span className="dt-demo-control-label">已选</span>
          <strong className="dt-demo-selected">{selectedRowKeys.length}</strong>
          {selectedRowKeys.length > 0 && (
            <button type="button" className="dt-demo-clear" onClick={() => setSelectedRowKeys([])}>
              清空
            </button>
          )}
        </div>

        {clickedRow && (
          <div className="dt-demo-control">
            <span className="dt-demo-control-label">最近点击</span>
            <code>#{clickedRow.id} · {clickedRow.name}</code>
          </div>
        )}
      </div>

      <div className="dt-demo-table">
        <DataTable
          columns={COLUMNS}
          data={rows}
          pageSize={pageSize > 0 ? pageSize : undefined}
          loading={loading}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          onRow={{
            onClick: (row) => setClickedRow(row),
          }}
        />
      </div>

      <section className="dt-demo-usage">
        <h2>用法说明</h2>
        <ul>
          <li><strong>排序</strong>：点击可排序列的表头切换升序 ▲ / 降序 ▼ / 取消 ⇅。</li>
          <li><strong>筛选</strong>：在表头筛选框输入关键字，对该列模糊匹配。</li>
          <li><strong>分页</strong>：传入 <code>pageSize</code> 启用分页；不传则展示全部。</li>
          <li><strong>行选择</strong>：传入 <code>rowSelection</code> 启用复选框，支持全选当前页。</li>
          <li><strong>加载态</strong>：传入 <code>loading</code> 显示骨架屏。</li>
          <li><strong>响应式</strong>：列宽超出容器时自动横向滚动。</li>
        </ul>

        <h3>API</h3>
        <pre className="dt-demo-code">{`<DataTable
  columns={[                    // 列定义
    { key, title, render?, sortable?, filterable?, width? }
  ]}
  data={rows}                   // 数据数组
  pageSize={10}                 // 可选：每页条数
  rowSelection={{                // 可选：行选择
    selectedRowKeys,
    onChange,
  }}
  onRow={{ onClick, onDoubleClick }}  // 可选：行事件
  loading={false}               // 可选：加载骨架
  emptyText="暂无数据"          // 可选：空状态文案
  rowKey="id"                   // 可选：行唯一标识字段
/>`}</pre>

        <h3>引入方式</h3>
        <pre className="dt-demo-code">{`import DataTable from '@/components/DataTable'
// 或
import { DataTable } from '@/components/DataTable'`}</pre>
      </section>

      <footer className="dt-demo-foot">
        <code>import DataTable from '@/components/DataTable'</code>
        <span className="dt-demo-tip">点击表格行可在控制区查看行数据</span>
      </footer>
    </div>
  )
}

export default DataTableDemo