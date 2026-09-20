/**
 * 数据表卡片（contentType = "table"）
 * 入参 data 支持：数组 / JSON 字符串 / { content: [] }
 *
 * 能力：
 *   - 自动列：命中白名单字段用中文列名，未命中的字段按 key 自动生成列
 *   - 含 time 字段且存在数值列时，可一键切换「表格 / 图表」视图；
 *     图表会把**全部数值列**画成多序列（不再只取第一列）
 *   - 导出 CSV（BOM + 逗号转义，Excel 直接打开不乱码）
 */

import { memo, useMemo, useState } from 'react'
import { Button, Empty, Segmented, Space, Table } from 'antd'
import LineChart from './LineChart.jsx'
import { FIELD_LABELS } from '../config.js'
import { buildColumns, downloadCSV, normalizeRows, toCSV } from './utils.js'

export default memo(function DataTable({ data, title, shareState = false }) {
  /* 预生成行唯一键：antd 的 rowKey 函数第二参（index）已弃用且顺序不保证，
     改为数据自带 _key（下划线前缀由 buildColumns 排除，不会多出一列） */
  const rows = useMemo(
    () => normalizeRows(data).map((r, i) => ({ ...r, _key: r.id ?? `r-${i}` })),
    [data],
  )
  const columns = useMemo(() => buildColumns(rows), [rows])
  const [view, setView] = useState('table')

  /* 含 time + 至少一个数值列 → 可切图表（全部数值列作为多序列） */
  const chartModel = useMemo(() => {
    if (!rows.length || !('time' in rows[0])) return null
    const numericKeys = Object.keys(rows[0]).filter(
      (k) => k !== 'time' && typeof rows[0][k] === 'number',
    )
    if (!numericKeys.length) return null
    return {
      x: rows.map((r) => r.time),
      list: numericKeys.map((key) => ({
        name: FIELD_LABELS[key] || key,
        values: rows.map((r) => r[key]),
      })),
    }
  }, [rows])

  if (!rows.length) return <div className="cb-empty">暂无数据</div>

  const exportCSV = () => downloadCSV(`${title || 'data'}.csv`, toCSV(rows, columns))

  return (
    <div className="cb-table">
      <div className="cb-card__head">
        <span className="cb-card__title">{title || '数据明细'}</span>
        {!shareState && (
          <Space size={4}>
            {chartModel && (
              <Segmented
                size="small"
                value={view}
                onChange={setView}
                options={[
                  { label: '表格', value: 'table' },
                  { label: '图表', value: 'chart' },
                ]}
              />
            )}
            <Button size="small" type="text" aria-label="导出 CSV" onClick={exportCSV}>
              导出 CSV
            </Button>
          </Space>
        )}
      </div>

      {view === 'chart' && chartModel && !shareState ? (
        <LineChart series={chartModel} title={title || '数据明细'} />
      ) : (
        <Table
          size="small"
          rowKey="_key"
          columns={columns}
          dataSource={rows}
          pagination={rows.length > 10 ? { pageSize: 10, size: 'small' } : false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty description="暂无数据" /> }}
        />
      )}
    </div>
  )
})
