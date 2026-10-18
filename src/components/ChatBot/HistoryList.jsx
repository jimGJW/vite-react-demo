/**
 * 历史会话抽屉
 * ===============================================================
 * 列表分页拉取、点击回填会话、单条删除、清空全部。
 * 分页约定：page 从 0 开始，pagetotal 为总页数。
 */

import { memo } from 'react'
import { Button, Drawer, Empty, List, Popconfirm, Space, Spin, Typography } from 'antd'
import { ClearOutlined, DeleteOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons'
import { useI18n } from '@i18n/index.js'

const { Text } = Typography

function formatTime(ts, t) {
  if (!ts) return ''
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return t('chatbot.history.justNow')
  if (diff < 3600_000) return t('chatbot.history.minutesAgo', { count: Math.floor(diff / 60_000) })
  if (diff < 86_400_000) return t('chatbot.history.hoursAgo', { count: Math.floor(diff / 3600_000) })
  return t('chatbot.history.date', { month: d.getMonth() + 1, day: d.getDate() })
}

export default memo(function HistoryList({
  open,
  onClose,
  history = [],
  historyTotal = 0,
  loading = false,
  currentSessionId,
  onLoadMore,
  onSelect,
  onDelete,
  onClear,
  onNewChat,
}) {
  const { t } = useI18n()
  const hasMore = history.length < historyTotal

  return (
    <Drawer
      title={t('chatbot.history.title')}
      placement="right"
      width={360}
      open={open}
      onClose={onClose}
      extra={
        <Space size={4}>
          <Button size="small" icon={<PlusOutlined />} onClick={onNewChat}>
            {t('chatbot.history.newChat')}
          </Button>
          <Popconfirm title={t('chatbot.history.clearAll')} onConfirm={onClear} disabled={!history.length}>
            <Button
              size="small"
              danger
              type="text"
              aria-label={t('chatbot.history.clearAllAria')}
              icon={<ClearOutlined />}
              disabled={!history.length}
            />
          </Popconfirm>
        </Space>
      }
    >
      <Spin spinning={loading}>
        {history.length === 0 && !loading ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('chatbot.history.empty')} />
        ) : (
          <List
            size="small"
            dataSource={history}
            renderItem={(item) => (
              <List.Item
                className={`cb-history__item${item.sessionId === currentSessionId ? ' is-active' : ''}`}
                onClick={() => onSelect?.(item.sessionId)}
                actions={[
                  <Popconfirm
                    key="del"
                    title={t('chatbot.history.delete')}
                    onConfirm={(e) => {
                      e?.stopPropagation?.()
                      onDelete?.(item.sessionId)
                    }}
                    onCancel={(e) => e?.stopPropagation?.()}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      aria-label={t('chatbot.history.deleteAria', { title: item.title || '' })}
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<MessageOutlined className="cb-history__icon" />}
                  title={<Text ellipsis>{item.title || t('chatbot.history.unnamed')}</Text>}
                  description={<Text type="secondary" className="cb-history__time">{formatTime(item.updateTime, t)}</Text>}
                />
              </List.Item>
            )}
          />
        )}

        {hasMore && (
          <div className="cb-history__more">
            <Button size="small" type="link" loading={loading} onClick={() => onLoadMore?.()}>
              {t('chatbot.history.loadMore')}
            </Button>
          </div>
        )}
      </Spin>
    </Drawer>
  )
})
