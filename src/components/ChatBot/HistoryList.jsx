/**
 * 历史会话抽屉
 * ===============================================================
 * 列表分页拉取、点击回填会话、单条删除、清空全部。
 * 分页约定：page 从 0 开始，pagetotal 为总页数。
 */

import { memo } from 'react'
import { Button, Drawer, Empty, List, Popconfirm, Space, Spin, Typography } from 'antd'
import { ClearOutlined, DeleteOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons'

const { Text } = Typography

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)} 小时前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
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
  const hasMore = history.length < historyTotal

  return (
    <Drawer
      title="历史会话"
      placement="right"
      width={360}
      open={open}
      onClose={onClose}
      extra={
        <Space size={4}>
          <Button size="small" icon={<PlusOutlined />} onClick={onNewChat}>
            新对话
          </Button>
          <Popconfirm title="确定清空全部历史会话？" onConfirm={onClear} disabled={!history.length}>
            <Button
              size="small"
              danger
              type="text"
              aria-label="清空全部历史会话"
              icon={<ClearOutlined />}
              disabled={!history.length}
            />
          </Popconfirm>
        </Space>
      }
    >
      <Spin spinning={loading}>
        {history.length === 0 && !loading ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无历史会话" />
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
                    title="删除该会话？"
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
                      aria-label={`删除会话 ${item.title || ''}`}
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<MessageOutlined className="cb-history__icon" />}
                  title={<Text ellipsis>{item.title || '未命名会话'}</Text>}
                  description={<Text type="secondary" className="cb-history__time">{formatTime(item.updateTime)}</Text>}
                />
              </List.Item>
            )}
          />
        )}

        {hasMore && (
          <div className="cb-history__more">
            <Button size="small" type="link" loading={loading} onClick={() => onLoadMore?.()}>
              加载更多
            </Button>
          </div>
        )}
      </Spin>
    </Drawer>
  )
})
