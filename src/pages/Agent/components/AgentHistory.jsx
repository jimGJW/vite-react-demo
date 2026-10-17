import { memo } from 'react'
import { formatActionIcon, formatActionText } from '../lib/actionFormat.js'
import { useI18n } from '../../../i18n/index.js'

/** 单条历史：指令 + 每个动作的成功/失败标记 */
const HistoryItem = memo(function HistoryItem({ item, onCopy, onRedo }) {
    const { t } = useI18n()
    const successCount = item.results?.filter((r) => r.result?.ok).length || 0
    const failCount = (item.results?.length || 0) - successCount
    const badgeCls = item.error ? 'all-fail' : failCount === 0 && successCount > 0 ? 'all-ok' : 'partial'
    const badgeText =
        item.error ? t('agent.history.failBadge') : failCount === 0 && successCount > 0 ? `✓ ${successCount}` : `${successCount}/${successCount + failCount}`

    return (
        <div
            className={`agent-history-item ${item.error ? 'has-error' : ''} ${item.fromVoice ? 'is-voice' : ''}`}
        >
            <div className="agent-history-actions">
                <button type="button" className="agent-history-action-btn" title={t('agent.history.copyTitle')} onClick={() => onCopy(item.task)}>
                    📋
                </button>
                <button type="button" className="agent-history-action-btn" title={t('agent.history.redoTitle')} onClick={() => onRedo(item.task)}>
                    🔁
                </button>
            </div>
            <div className="agent-history-head">
                <span className="agent-history-task">📝 {item.task}</span>
                <div className="agent-history-meta">
                    <span className={`agent-history-badge ${badgeCls}`}>{badgeText}</span>
                    <span className="agent-history-time">{item.timestamp}</span>
                </div>
            </div>
            {item.error ? (
                <div className="agent-error-msg">⚠️ {item.error}</div>
            ) : (
                <>
                    <div className="agent-history-summary">{item.summary}</div>
                    <div className="agent-action-list">
                        {item.actions?.map((a, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span
                                    className={`agent-action ${item.results[i]?.result?.ok ? 'ok' : 'fail'}`}
                                    title={item.results[i]?.result?.ok ? t('agent.history.success') : item.results[i]?.result?.error || t('agent.history.failBadge')}
                                >
                                    <span className="agent-action-dot" />
                                    <span className="agent-action-icon">{formatActionIcon(a.type)}</span>
                                    <span className="agent-action-text">{formatActionText(a)}</span>
                                    {!item.results[i]?.result?.ok && (
                                        <span className="agent-action-fail-reason">
                                            {item.results[i]?.result?.error || t('agent.history.failBadge')}
                                        </span>
                                    )}
                                </span>
                                {i < item.actions.length - 1 && <span className="agent-action-arrow">→</span>}
                            </span>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
})

/** 历史记录列表（新在前） */
function AgentHistory({ items, onCopy, onRedo }) {
    const { t } = useI18n()
    return (
        <div className="agent-history">
            {items.length === 0 && (
                <div className="agent-empty-hint">
                    <div className="agent-empty-icon">🪄</div>
                    <div className="agent-empty-title">{t('agent.history.emptyTitle')}</div>
                    <div className="agent-empty-sub">
                        {t('agent.history.emptyLine1')}<br />
                        {t('agent.history.emptyLine2')}<br />
                        {t('agent.history.emptyLine3')}
                    </div>
                </div>
            )}
            {items.map((item) => (
                <HistoryItem key={item.id || item.timestamp} item={item} onCopy={onCopy} onRedo={onRedo} />
            ))}
        </div>
    )
}

export default memo(AgentHistory)
