import { Drawer, Segmented, Timeline, Tag } from 'antd'
import { RELEASES, getRelease } from './releases.js'
import { useChangelog } from '@/contexts/ChangelogContext.jsx'
import { PeriodTag } from './PeriodTag.jsx'
import { useI18n, pickText } from '@i18n/index.js'
import './Changelog.scss'

/**
 * 功能版本时间轴抽屉。
 * - 顶部 Segmented 切换批次 / 全部（与 header 下拉联动，默认全选）。
 * - 按批次分组，每组用 antd Timeline 列出该批次的全部改动及其改动时间。
 */
export function ChangelogDrawer() {
  const { open, closeChangelog, selected, setSelected } = useChangelog()
  const { lang, t } = useI18n()
  const list = selected === 'all' ? RELEASES : [getRelease(selected)].filter(Boolean)

  return (
    <Drawer
      open={open}
      onClose={closeChangelog}
      title={t('changelog.title')}
      width={460}
      destroyOnClose
    >
      <Segmented
        block
        value={selected}
        onChange={setSelected}
        options={[
          { label: t('changelog.all'), value: 'all' },
          ...RELEASES.map((r) => ({ label: r.short, value: r.id })),
        ]}
      />

      <div className="changelog-body">
        {list.map((r) => (
          <section key={r.id} className="changelog-release">
            <div className="changelog-release__head">
              <span className="changelog-release__dot" style={{ background: r.color }} />
              <span className="changelog-release__date">{r.label}</span>
              <span className="changelog-release__title">{pickText(r.title, lang)}</span>
              <Tag
                bordered={false}
                style={{ marginLeft: 'auto', color: r.color, background: `${r.color}1a` }}
              >
                {t('changelog.items', { n: r.changes.length })}
              </Tag>
            </div>

            <Timeline
              items={r.changes.map((c) => ({
                color: r.color,
                children: (
                  <div className="changelog-change">
                    <div className="changelog-change__title">
                      {pickText(c.title, lang)}
                      {typeof c.route === 'string' && c.route.startsWith('/') && (
                        <PeriodTag route={c.route} showLabel={false} as="inline" />
                      )}
                    </div>
                    <div className="changelog-change__desc">{pickText(c.desc, lang)}</div>
                    <div className="changelog-change__time">{t('changelog.changedAt', { date: c.changedAt })}</div>
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
