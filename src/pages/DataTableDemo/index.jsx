import { useMemo, useState } from 'react'
import DataTable from '@components/DataTable/index.js'
import { pickLang, useI18n } from '@i18n/index.js'
import './index.scss'


import {  STATUS_MAP, makeRows } from './components/tableData.js'

function StatusTag({ value }) {
  const { lang } = useI18n()
  const s = STATUS_MAP[value]
  if (!s) return <span className="status-tag is-info">{value}</span>
  return <span className={`status-tag is-${s.tone}`}>{pickLang(s.label, lang)}</span>
}

export default function DataTableDemo() {
  const { t, lang } = useI18n()
  const rows = useMemo(() => makeRows(lang), [lang])
  const [loading, setLoading] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [clickedRow, setClickedRow] = useState(null)

  const columns = [
    { key: 'id', title: t('dataTable.col.id'), width: 60, sortable: true },
    { key: 'name', title: t('dataTable.col.name'), width: 120, sortable: true, filterable: true },
    { key: 'age', title: t('dataTable.col.age'), width: 80, sortable: true },
    { key: 'email', title: t('dataTable.col.email'), width: 200, filterable: true },
    { key: 'dept', title: t('dataTable.col.dept'), width: 100, sortable: true, filterable: true },
    { key: 'role', title: t('dataTable.col.role'), width: 100, filterable: true },
    { key: 'salary', title: t('dataTable.col.salary'), width: 110, sortable: true, render: (v) => (typeof v === 'number' ? `¥${v.toLocaleString()}` : (v == null ? '' : String(v))) },
    { key: 'status', title: t('dataTable.col.status'), width: 88, sortable: true, filterable: true, render: (v) => <StatusTag value={v} /> },
    { key: 'createdAt', title: t('dataTable.col.createdAt'), width: 120, sortable: true },
  ]

  const pageSizeOptions = [
    { value: 0, label: t('dataTable.demo.pageAll') },
    { value: 5, label: t('dataTable.demo.pageSize', { count: 5 }) },
    { value: 10, label: t('dataTable.demo.pageSize', { count: 10 }) },
    { value: 20, label: t('dataTable.demo.pageSize', { count: 20 }) },
  ]

  return (
    <div className="page-card dt-demo">
      <header className="dt-demo-header">
        <div>
          <h1>{t('dataTable.demo.title')}</h1>
          <p>
            {t('dataTable.demo.leadBefore')}<code>--c-primary</code>{t('dataTable.demo.leadAfter')}
          </p>
        </div>
      </header>

      <div className="dt-demo-controls">
        <button type="button" className="btn" onClick={() => setLoading((v) => !v)}>
          {loading ? t('dataTable.demo.stopLoading') : t('dataTable.demo.startLoading')}
        </button>

        <label className="dt-demo-control">
          <span className="dt-demo-control-label">{t('dataTable.demo.perPage')}</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="dt-demo-select"
          >
            {pageSizeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <div className="dt-demo-control">
          <span className="dt-demo-control-label">{t('dataTable.demo.selected')}</span>
          <strong className="dt-demo-selected">{selectedRowKeys.length}</strong>
          {selectedRowKeys.length > 0 && (
            <button type="button" className="dt-demo-clear" onClick={() => setSelectedRowKeys([])}>
              {t('dataTable.demo.clear')}
            </button>
          )}
        </div>

        {clickedRow && (
          <div className="dt-demo-control">
            <span className="dt-demo-control-label">{t('dataTable.demo.lastClicked')}</span>
            <code>#{clickedRow.id} · {clickedRow.name}</code>
          </div>
        )}
      </div>

      <div className="dt-demo-table">
        <DataTable
          columns={columns}
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
        <h2>{t('dataTable.demo.usageTitle')}</h2>
        <ul>
          <li><strong>{t('dataTable.demo.usageSort')}</strong>{t('dataTable.demo.usageSortDesc')}</li>
          <li><strong>{t('dataTable.demo.usageFilter')}</strong>{t('dataTable.demo.usageFilterDesc')}</li>
          <li><strong>{t('dataTable.demo.usagePage')}</strong>{t('dataTable.demo.usagePageBefore')}<code>pageSize</code>{t('dataTable.demo.usagePageAfter')}</li>
          <li><strong>{t('dataTable.demo.usageSelect')}</strong>{t('dataTable.demo.usageSelectBefore')}<code>rowSelection</code>{t('dataTable.demo.usageSelectAfter')}</li>
          <li><strong>{t('dataTable.demo.usageLoading')}</strong>{t('dataTable.demo.usageLoadingBefore')}<code>loading</code>{t('dataTable.demo.usageLoadingAfter')}</li>
          <li><strong>{t('dataTable.demo.usageResponsive')}</strong>{t('dataTable.demo.usageResponsiveDesc')}</li>
        </ul>

        <h3>{t('dataTable.demo.apiTitle')}</h3>
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

        <h3>{t('dataTable.demo.importTitle')}</h3>
        <pre className="dt-demo-code">{`import DataTable from '@/components/DataTable'
// 或
import { DataTable } from '@components/DataTable'`}</pre>
      </section>

      <footer className="dt-demo-foot">
        <code>import DataTable from '@/components/DataTable'</code>
        <span className="dt-demo-tip">{t('dataTable.demo.footTip')}</span>
      </footer>
    </div>
  )
}
