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
import { useI18n, pickLang } from '@i18n/index.js'

const STATUS_COLOR = {
  已完成: 'success',
  处理中: 'processing',
  待处理: 'default',
  失败: 'error',
}

const PREFERRED_ORDER = ['time', 'id', 'type', 'status', 'report']

function buildColumns(lang) {
  const keys = PREFERRED_ORDER.filter((k) => FIELD_LABELS[k])
  return keys.map((key) => ({
    title: pickLang(FIELD_LABELS[key], lang) || key,
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
  const { t, lang } = useI18n()
  /* 同 DataTable：预生成行唯一键 _key，避免依赖 antd rowKey 已弃用的 index 参数 */
  const rows = useMemo(
    () =>
      parseArray(data)
        .filter((r) => r && typeof r === 'object')
        .map((r, i) => ({ ...r, _key: r.id || `t-${i}` })),
    [data],
  )
  const columns = useMemo(() => buildColumns(lang), [lang])
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
      message.warning(t('chatbot.task.selectFirst'))
      return
    }
    setExporting(true)
    const hide = message.loading(t('chatbot.task.packing'), 0)
    try {
      const res = await api.post(api.endpoints.batchExport, { ids })
      const pollId = res?.pollId ?? res?.id
      const url = await pollResult(pollId)
      hide()
      message.success(t('chatbot.task.packDone'))
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      hide()
      if (err?.message !== 'cancelled') message.error(t('chatbot.task.packFailed'))
    } finally {
      setExporting(false)
    }
  }

  if (!rows.length) return <div className="cb-empty">{t('chatbot.cards.noTask')}</div>

  const allIds = taskIds?.length ? taskIds : rows.map((r) => r.id).filter(Boolean)

  return (
    <div className="cb-table">
      <div className="cb-card__head">
        <span className="cb-card__title">{title || t('chatbot.cards.defaultTaskTitle')}</span>
        {!shareState && (
          <Space size={4}>
            <Tooltip title={t('chatbot.task.exportTip')}>
              <Button
                size="small"
                type="text"
                aria-label={t('chatbot.task.exportSelectedAria')}
                loading={exporting}
                onClick={() => exportBatch(selected)}
              >
                {t('chatbot.task.exportSelected', { count: selected.length })}
              </Button>
            </Tooltip>
            <Button
              size="small"
              type="text"
              aria-label={t('chatbot.task.exportAllAria')}
              onClick={() => exportBatch(allIds)}
            >
              {t('chatbot.task.exportAll')}
            </Button>
          </Space>
        )}
      </div>

      <Table
        size="small"
        rowKey="_key"
        columns={columns}
        dataSource={rows}
        pagination={rows.length > 10 ? { pageSize: 10, size: 'small' } : false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description={t('chatbot.cards.noTask')} /> }}
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
