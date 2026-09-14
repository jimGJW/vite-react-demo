/**
 * 任务表卡片（contentType = "taskTable"）
 * 入参 data 支持：数组 / JSON 字符串 / { content: [] }
 *
 * 能力：
 *   - 行选择 + 批量打包导出（提交任务 → 轮询结果 → 下载）
 *   - 全部导出
 *   - 轮询在组件卸载时自动取消
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Empty, Space, Table, Tag, Tooltip, message } from 'antd'
import { parseArray } from './utils.js'
import { FIELD_LABELS, POLL_INTERVAL, POLL_TIMEOUT } from '../config.js'

const STATUS_COLOR = {
  已完成: 'success',
  处理中: 'processing',
  待处理: 'default',
  失败: 'error',
}

const PREFERRED_ORDER = ['time', 'id', 'type', 'status', 'report']

function buildColumns() {
  const keys = PREFERRED_ORDER.filter((k) => FIELD_LABELS[k])
  return keys.map((key) => ({
    title: FIELD_LABELS[key] || key,
    dataIndex: key,
    key,
    ellipsis: true,
    render: (value) =>
      key === 'status' && value ? (
        <Tag color={STATUS_COLOR[value] || 'blue'} bordered={false}>
          {value}
        </Tag>
      ) : value === null || value === undefined || value === '' ? (
        '-'
      ) : (
        String(value)
      ),
  }))
}

export default memo(function TaskTable({ data, title, taskIds, shareState = false, api }) {
  const rows = useMemo(() => parseArray(data).filter((r) => r && typeof r === 'object'), [data])
  const columns = useMemo(() => buildColumns(), [])
  const [selected, setSelected] = useState([])
  const [exporting, setExporting] = useState(false)

  const cancelledRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  /** 轮询批量打包结果：status 0 继续 / 1 完成 / 2 失败 */
  const pollResult = (pollId) =>
    new Promise((resolve, reject) => {
      const startedAt = Date.now()
      const tick = async () => {
        if (cancelledRef.current) return reject(new Error('cancelled'))
        try {
          const res = await api.get(`${api.endpoints.batchExportResult}/${pollId}`)
          if (res?.status === 1 && res.url) return resolve(res.url)
          if (res?.status === 2) return reject(new Error('failed'))
          if (Date.now() - startedAt > POLL_TIMEOUT) return reject(new Error('timeout'))
          timerRef.current = setTimeout(tick, POLL_INTERVAL)
          return undefined
        } catch (err) {
          return reject(err)
        }
      }
      tick()
    })

  const exportBatch = async (ids) => {
    if (!ids?.length) {
      message.warning('请先选择要导出的任务')
      return
    }
    setExporting(true)
    const hide = message.loading('正在打包，请稍候…', 0)
    try {
      const res = await api.post(api.endpoints.batchExport, { ids })
      const pollId = res?.pollId ?? res?.id
      const url = await pollResult(pollId)
      hide()
      message.success('打包完成，开始下载')
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      hide()
      if (err?.message !== 'cancelled') message.error('打包失败，请稍后重试')
    } finally {
      setExporting(false)
    }
  }

  if (!rows.length) return <div className="cb-empty">暂无任务</div>

  const allIds = taskIds?.length ? taskIds : rows.map((r) => r.id).filter(Boolean)

  return (
    <div className="cb-table">
      <div className="cb-card__head">
        <span className="cb-card__title">{title || '任务列表'}</span>
        {!shareState && (
          <Space size={4}>
            <Tooltip title="导出勾选的任务（打包为 ZIP）">
              <Button
                size="small"
                type="text"
                aria-label="批量导出勾选的任务"
                loading={exporting}
                onClick={() => exportBatch(selected)}
              >
                批量导出{selected.length ? `(${selected.length})` : ''}
              </Button>
            </Tooltip>
            <Button
              size="small"
              type="text"
              aria-label="导出全部任务"
              onClick={() => exportBatch(allIds)}
            >
              全部导出
            </Button>
          </Space>
        )}
      </div>

      <Table
        size="small"
        rowKey={(record, i) => record.id || `t-${i}`}
        columns={columns}
        dataSource={rows}
        pagination={rows.length > 10 ? { pageSize: 10, size: 'small' } : false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description="暂无任务" /> }}
        rowSelection={
          shareState
            ? undefined
            : {
                selectedRowKeys: selected,
                onChange: (keys) => setSelected(keys),
                getCheckboxProps: () => ({ disabled: false }),
              }
        }
      />
    </div>
  )
})
