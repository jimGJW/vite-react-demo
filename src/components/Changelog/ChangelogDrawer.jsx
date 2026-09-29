import { Drawer, Segmented, Timeline, Tag } from 'antd'
import { RELEASES, getRelease } from './releases.js'
import { useChangelog } from '../../contexts/ChangelogContext.jsx'
import { PeriodTag } from './PeriodTag.jsx'
import './Changelog.scss'

/**
 * 功能版本时间轴抽屉。
 * - 顶部 Segmented 切换批次 / 全部（与 header 下拉联动，默认全选）。
 * - 按批次分组，每组用 antd Timeline 列出该批次的全部改动及其改动时间。
 */
export function ChangelogDrawer() {
  const { open, closeChangelog, selected, setSelected } = useChangelog()
  const list = selected === 'all' ? RELEASES : [getRelease(selected)].filter(Boolean)

  return (
    <Drawer
      open={open}
      onClose={closeChangelog}
      title="功能版本时间轴"
      width={460}
      destroyOnClose
    >
      <Segmented
        block
        value={selected}
        onChange={setSelected}
        options={[
          { label: '全部', value: 'all' },
          ...RELEASES.map((r) => ({ label: r.short, value: r.id })),
        ]}
      />

      <div className="changelog-body">
        {list.map((r) => (
          <section key={r.id} className="changelog-release">
            <div className="changelog-release__head">
              <span className="changelog-release__dot" style={{ background: r.color }} />
              <span className="changelog-release__date">{r.label}</span>
              <span className="changelog-release__title">{r.title}</span>
              <Tag
                bordered={false}
                style={{ marginLeft: 'auto', color: r.color, background: `${r.color}1a` }}
              >
                {r.changes.length} 项
              </Tag>
            </div>

            <Timeline
              items={r.changes.map((c) => ({
                color: r.color,
                children: (
                  <div className="changelog-change">
                    <div className="changelog-change__title">
                      {c.title}
                      {typeof c.route === 'string' && c.route.startsWith('/') && (
                        <PeriodTag route={c.route} showLabel={false} as="inline" />
                      )}
                    </div>
                    <div className="changelog-change__desc">{c.desc}</div>
                    <div className="changelog-change__time">{c.changedAt} 改动</div>
                  </div>
                ),
              }))}
            />
          </section>
        ))}
      </div>
    </Drawer>
  )
}
