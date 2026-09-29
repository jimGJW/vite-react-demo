import { Button, Dropdown } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { RELEASES, TOTAL_CHANGES } from './releases.js'
import { useChangelog } from '../../contexts/ChangelogContext.jsx'
import './Changelog.scss'

/**
 * Header 时间轴下拉菜单。
 * 列出每个批次的 icon（着色点 + 日期 + 标题 + 改动数），外加「全部版本」选项。
 * 选中任一项 → 打开时间轴抽屉并筛选到对应批次；「全部版本」= 默认全选。
 */
export function ChangelogMenu() {
  const { openChangelog, selected } = useChangelog()

  const items = [
    {
      key: 'all',
      label: (
        <span className="cl-menu-item">
          <span className="cl-menu-item__dot cl-menu-item__dot--all" />
          <span className="cl-menu-item__title">全部版本</span>
          <span className="cl-menu-item__count">{TOTAL_CHANGES} 项改动</span>
        </span>
      ),
    },
    { type: 'divider' },
    ...RELEASES.map((r) => ({
      key: r.id,
      label: (
        <span className="cl-menu-item">
          <span className="cl-menu-item__dot" style={{ background: r.color }} />
          <span className="cl-menu-item__title">{r.label}</span>
          <span className="cl-menu-item__sub">{r.title}</span>
          <span className="cl-menu-item__count">{r.changes.length}</span>
        </span>
      ),
    })),
  ]

  return (
    <Dropdown
      menu={{ items, selectedKeys: [selected], onClick: ({ key }) => openChangelog(key) }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button
        type="text"
        className="changelog-trigger"
        icon={<HistoryOutlined />}
        aria-label="功能版本时间轴"
      />
    </Dropdown>
  )
}
