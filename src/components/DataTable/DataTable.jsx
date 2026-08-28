import { useMemo, useState } from 'react'
import './DataTable.scss'

/* =====================================================================
 * 高级数据表格 · 零外部依赖（仅 React）
 * 统一消费 :root 设计 token，保持 Indigo 玻璃态风格
 * 能力：列排序、列级模糊筛选、分页、行选择、空状态、加载骨架、横向滚动
 * ===================================================================== */

const DEFAULT_EMPTY = '暂无数据'

/** 渲染单元格：优先用列 render，否则取 row[key]。 */
function renderCell(col, row, rowIndex) {
  if (typeof col.render === 'function') {
    return col.render(row[col.key], row, rowIndex)
  }
  return row[col.key]
}

/** 取比较用的字段值（数字按数值比较，其他转小写字符串）。 */
function getSortValue(row, key) {
  const v = row[key]
  if (v == null) return ''
  if (typeof v === 'number') return v
  return String(v).toLowerCase()
}

/**
 * 复选框（原生 input + 自定义玻璃态样式）。
 *
 * @param {Object} props
 * @param {boolean} [props.checked]
 * @param {boolean} [props.indeterminate]
 * @param {(e:import('react').ChangeEvent<HTMLInputElement>)=>void} [props.onChange]
 * @param {string} [props['aria-label']]
 * @returns {JSX.Element}
 */
function Checkbox({ checked = false, indeterminate = false, onChange, ...rest }) {
  return (
    <label className="dt-checkbox">
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate
        }}
        onChange={onChange}
        {...rest}
      />
      <span className="dt-checkbox-box" aria-hidden="true">
        {indeterminate ? '−' : checked ? '✓' : ''}
      </span>
    </label>
  )
}

/**
 * 高级数据表格。
 *
 * 列定义 `columns` 每项支持：
 * - `key` 字段名
 * - `title` 表头标题
 * - `render(value, row, index)` 自定义单元格渲染
 * - `sortable` 是否可排序
 * - `filterable` 是否显示筛选输入框
 * - `width` 列宽（数字或 CSS 长度）
 *
 * `rowSelection` 形如 `{ selectedRowKeys, onChange }`，
 * `onRow` 形如 `{ onClick, onDoubleClick }`。
 *
 * @param {Object} props
 * @param {Array} props.columns 列定义。
 * @param {Array<Object>} props.data 数据数组。
 * @param {number} [props.pageSize] 每页行数；不传或 <=0 则不分页。
 * @param {{selectedRowKeys:Array<string|number>,onChange:(keys:Array,rows:Array)=>void}} [props.rowSelection] 行选择配置。
 * @param {{onClick?:(row:Object,index:number)=>void,onDoubleClick?:(row:Object,index:number)=>void}} [props.onRow] 行事件。
 * @param {boolean} [props.loading=false] 是否显示加载骨架。
 * @param {string} [props.emptyText='暂无数据'] 空状态文案。
 * @param {string} [props.rowKey='id'] 行唯一标识字段名。
 * @param {string} [props.className] 额外类名。
 * @returns {JSX.Element}
 */
export function DataTable({
  columns = [],
  data = [],
  pageSize,
  rowSelection,
  onRow,
  loading = false,
  emptyText = DEFAULT_EMPTY,
  rowKey = 'id',
  className = '',
}) {
  const [sorter, setSorter] = useState({ key: null, order: null })
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)
  const [prevPageSize, setPrevPageSize] = useState(pageSize)

  // pageSize 变化时回到第 1 页（渲染期间调整 state，避免 useEffect 级联渲染）
  if (pageSize !== prevPageSize) {
    setPrevPageSize(pageSize)
    setPage(1)
  }

  // 筛选：对配置了 filterable 且输入了关键字的列做模糊匹配
  const filteredData = useMemo(() => {
    const activeKeys = Object.keys(filters).filter((k) => filters[k])
    if (!activeKeys.length) return data
    return data.filter((row) =>
      activeKeys.every((k) => {
        const v = row[k]
        return v != null && String(v).toLowerCase().includes(filters[k].toLowerCase())
      }),
    )
  }, [data, filters])

  // 排序：asc / desc / null 三态
  const sortedData = useMemo(() => {
    if (!sorter.key || !sorter.order) return filteredData
    const dir = sorter.order === 'asc' ? 1 : -1
    return [...filteredData].sort((a, b) => {
      const va = getSortValue(a, sorter.key)
      const vb = getSortValue(b, sorter.key)
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
  }, [filteredData, sorter])

  // 分页
  const usePagination = typeof pageSize === 'number' && pageSize > 0
  const total = sortedData.length
  const totalPages = usePagination ? Math.max(1, Math.ceil(total / pageSize)) : 1
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pagedData = usePagination
    ? sortedData.slice((safePage - 1) * pageSize, safePage * pageSize)
    : sortedData

  // 行选择
  const hasSelection = !!rowSelection
  const selectedSet = useMemo(
    () => new Set(rowSelection?.selectedRowKeys || []),
    [rowSelection?.selectedRowKeys],
  )
  const pageKeys = pagedData.map((r) => r[rowKey])
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selectedSet.has(k))
  const somePageSelected = pageKeys.some((k) => selectedSet.has(k))

  const fireSelectionChange = (nextSet) => {
    if (!rowSelection?.onChange) return
    const keys = Array.from(nextSet)
    const rows = data.filter((r) => nextSet.has(r[rowKey]))
    rowSelection.onChange(keys, rows)
  }

  const toggleRow = (row) => {
    const key = row[rowKey]
    const next = new Set(selectedSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    fireSelectionChange(next)
  }

  const toggleSelectAll = () => {
    const next = new Set(selectedSet)
    if (allPageSelected) {
      pageKeys.forEach((k) => next.delete(k))
    } else {
      pageKeys.forEach((k) => next.add(k))
    }
    fireSelectionChange(next)
  }

  // 排序切换：asc -> desc -> 取消
  const onSort = (col) => {
    if (!col.sortable) return
    setSorter((prev) => {
      if (prev.key !== col.key) return { key: col.key, order: 'asc' }
      if (prev.order === 'asc') return { key: col.key, order: 'desc' }
      if (prev.order === 'desc') return { key: null, order: null }
      return { key: col.key, order: 'asc' }
    })
  }

  const onFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // 行事件
  const buildRowProps = (row, index) => {
    if (!onRow) return {}
    const props = {}
    if (typeof onRow.onClick === 'function') {
      props.onClick = () => onRow.onClick(row, index)
    }
    if (typeof onRow.onDoubleClick === 'function') {
      props.onDoubleClick = () => onRow.onDoubleClick(row, index)
    }
    return props
  }

  const colCount = columns.length + (hasSelection ? 1 : 0)

  return (
    <div className={`dt ${loading ? 'is-loading' : ''} ${className}`.trim()}>
      <div className="dt-scroll" role="region" aria-label="数据表格" tabIndex={0}>
        <table className="dt-table">
          {columns.length > 0 && (
            <thead>
              <tr>
                {hasSelection && (
                  <th className="dt-cell-check" scope="col">
                    <Checkbox
                      checked={allPageSelected}
                      indeterminate={!allPageSelected && somePageSelected}
                      onChange={toggleSelectAll}
                      aria-label="全选当前页"
                    />
                  </th>
                )}
                {columns.map((col) => {
                  const isActive = sorter.key === col.key && sorter.order
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      className={`dt-th ${col.sortable ? 'is-sortable' : ''} ${
                        isActive ? `is-${sorter.order}` : ''
                      }`.trim()}
                      style={col.width ? { width: col.width } : undefined}
                    >
                      <button
                        type="button"
                        className="dt-th-btn"
                        onClick={() => onSort(col)}
                        disabled={!col.sortable}
                      >
                        <span className="dt-th-title">{col.title}</span>
                        {col.sortable && (
                          <span className="dt-sort-icon" aria-hidden="true">
                            {isActive ? (sorter.order === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        )}
                      </button>
                      {col.filterable && (
                        <div className="dt-filter">
                          <input
                            type="search"
                            className="dt-filter-input"
                            placeholder={`筛选 ${col.title}`}
                            value={filters[col.key] || ''}
                            onChange={(e) => onFilter(col.key, e.target.value)}
                          />
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
          )}
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, ri) => (
                <tr key={`sk-${ri}`} className="dt-skeleton-row">
                  {hasSelection && (
                    <td className="dt-cell-check">
                      <div className="dt-skeleton dt-skeleton-check" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key}>
                      <div className="dt-skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pagedData.length === 0 ? (
              <tr className="dt-empty-row">
                <td colSpan={colCount}>
                  <div className="dt-empty">
                    <span className="dt-empty-icon" aria-hidden="true">📭</span>
                    <span className="dt-empty-text">{emptyText}</span>
                  </div>
                </td>
              </tr>
            ) : (
              pagedData.map((row, ri) => {
                const key = row[rowKey]
                const selected = selectedSet.has(key)
                const globalIndex = (usePagination ? (safePage - 1) * pageSize : 0) + ri
                return (
                  <tr
                    key={key ?? ri}
                    className={`dt-row ${selected ? 'is-selected' : ''}`.trim()}
                    {...buildRowProps(row, globalIndex)}
                  >
                    {hasSelection && (
                      <td className="dt-cell-check" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onChange={() => toggleRow(row)}
                          aria-label={`选择第 ${globalIndex + 1} 行`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="dt-cell">
                        {renderCell(col, row, globalIndex)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {usePagination && !loading && (
        <div className="dt-footer">
          <div className="dt-info">
            共 <strong>{total}</strong> 条
            {total > 0 && (
              <>
                {' '}· 第 {(safePage - 1) * pageSize + 1}-
                {Math.min(safePage * pageSize, total)} 条
              </>
            )}
          </div>
          <div className="dt-pager">
            <button
              type="button"
              className="dt-page-btn"
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              aria-label="首页"
            >
              «
            </button>
            <button
              type="button"
              className="dt-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="上一页"
            >
              ‹
            </button>
            <span className="dt-page-info">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              className="dt-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="下一页"
            >
              ›
            </button>
            <button
              type="button"
              className="dt-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              aria-label="末页"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
