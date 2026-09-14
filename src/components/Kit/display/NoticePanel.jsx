import { useState } from 'react'
import { Badge, Button, Empty, Popover, Tabs } from 'antd'
import { BellOutlined, CheckOutlined } from '@ant-design/icons'

/**
 * NoticePanel · 通知面板
 * =====================================================================
 * 合并移植自 旧平板端项目 的 `components/NoticeIcon` 与 `components/Cart`。
 * 原项目里这两个组件 90% 重复（都是「铃铛 + Popover + 多 Tab 列表 + 清空」），
 * 差异只有 Cart 多了二次确认、接了一层 i18n。这里合并成一个：
 *   - 需要二次确认时，把 `onClear` 做成返回 Promise 并自行弹确认框即可
 *   - 文案全部走 props，不绑定 i18n 方案
 *
 * 顺手修掉的几个问题：
 *   - 原实现从 `props.children[0].props.title` 反推初始 Tab，子节点一变就错；
 *     这里改为显式 `tabs[].key`
 *   - 原实现的默认空状态图是阿里 CDN 外链（离线环境裂图），
 *     这里改用 antd 内置的 Empty（纯 SVG，零外链）
 *
 * 用法：
 *   <NoticePanel
 *     tabs={[{ key: 'msg', title: '消息', count: 3, items: [...] }]}
 *     onItemClick={(item) => console.log(item)}
 *     onClear={() => clearAll()}
 *   />
 */

function NoticeList({ items, emptyText, onItemClick }) {
  if (!items?.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
  }
  return (
    <div>
      {items.map((item) => (
        <div
          key={item.id}
          className="kit-notice__item"
          role="button"
          tabIndex={0}
          onClick={() => onItemClick?.(item)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onItemClick?.(item)
          }}
        >
          <span className={`kit-notice__dot ${item.read ? 'is-read' : ''}`} />
          <div className="kit-notice__main">
            <div className="kit-notice__title">{item.title}</div>
            {item.desc != null && <div className="kit-notice__desc">{item.desc}</div>}
          </div>
          {item.time != null && <span className="kit-notice__time">{item.time}</span>}
        </div>
      ))}
    </div>
  )
}

export default function NoticePanel({
  tabs = [],
  count,
  placement = 'bottomRight',
  width = 320,
  listHeight = 300,
  emptyText = '暂无消息',
  clearText = '清空',
  onItemClick,
  onClear,
  children,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [activeKey, setActiveKey] = useState(tabs[0]?.key)

  const total = count ?? tabs.reduce((sum, tab) => sum + (tab.count ?? 0), 0)
  const multiple = tabs.length > 1

  const body = multiple ? (
    <Tabs
      size="small"
      activeKey={activeKey}
      onChange={setActiveKey}
      items={tabs.map((tab) => ({
        key: tab.key,
        label: tab.count ? `${tab.title} (${tab.count})` : tab.title,
        children: (
          <div style={{ maxHeight: listHeight, overflowY: 'auto' }}>
            <NoticeList
              items={tab.items}
              emptyText={tab.emptyText || emptyText}
              onItemClick={onItemClick}
            />
          </div>
        ),
      }))}
    />
  ) : (
    <div style={{ maxHeight: listHeight, overflowY: 'auto' }}>
      <NoticeList
        items={tabs[0]?.items}
        emptyText={tabs[0]?.emptyText || emptyText}
        onItemClick={onItemClick}
      />
    </div>
  )

  const content = (
    <div className="kit-notice__panel" style={{ width }}>
      {body}
      <div className="kit-notice__foot">
        <Button
          type="link"
          size="small"
          icon={<CheckOutlined />}
          onClick={() => onClear?.(multiple ? activeKey : tabs[0]?.key)}
        >
          {clearText}
        </Button>
      </div>
    </div>
  )

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement={placement}
      content={content}
      className={className}
    >
      {children || (
        <button type="button" className="kit-notice__trigger" aria-label="通知">
          <Badge count={total} size="small" offset={[2, -2]}>
            <BellOutlined />
          </Badge>
        </button>
      )}
    </Popover>
  )
}
