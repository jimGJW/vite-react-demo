/**
 * 列表卡片（contentType = "list"）
 * 入参 data 支持：数组 或 JSON 字符串 或 { content: [] }
 * 点击某项 → onAsk(id, { sessionDetailId }) 追问，把该项作为下一轮问题抛回主流程。
 */

import { memo, useMemo } from 'react'
import { Tag } from 'antd'
import { useI18n } from '@i18n/index.js'
import { parseArray } from './utils.js'

export default memo(function ListCard({ data, onAsk, sessionDetailId }) {
  const { t } = useI18n()
  const items = useMemo(() => parseArray(data), [data])

  if (!items.length) return <div className="cb-empty">{t('chatbot.cards.noMatch')}</div>

  return (
    <div className="cb-list">
      {items.map((item, i) => {
        const id = item.id ?? item.key ?? item.name ?? ''
        const title = item.name || item.alias || item.title || id || t('chatbot.cards.unnamed')
        const offline = item.type === '离线' || item.status === 'offline'
        return (
          <button
            type="button"
            key={id || i}
            className="cb-list__item"
            onClick={() => onAsk?.(id, { sessionDetailId })}
          >
            <div className="cb-list__row">
              <span className="cb-list__title">{title}</span>
              {item.type ? (
                <Tag color={offline ? 'default' : 'blue'} bordered={false}>
                  {item.type}
                </Tag>
              ) : null}
            </div>
            {(item.location || item.note) && (
              <div className="cb-list__meta">
                {item.location ? <span>{item.location}</span> : null}
                {item.note ? <span className="cb-list__note">{item.note}</span> : null}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
})
