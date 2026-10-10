import { memo } from 'react'
import { formatActionIcon, formatActionText } from '../lib/actionFormat.js'

/** 单条历史：指令 + 每个动作的成功/失败标记 */
const HistoryItem = memo(function HistoryItem({ item, onCopy, onRedo }) {
    const successCount = item.results?.filter((r) => r.result?.ok).length || 0
    const failCount = (item.results?.length || 0) - successCount
    const badgeCls = item.error ? 'all-fail' : failCount === 0 && successCount > 0 ? 'all-ok' : 'partial'
    const badgeText =
        item.error ? '失败' : failCount === 0 && successCount > 0 ? `✓ ${successCount}` : `${successCount}/${successCount + failCount}`

    return (
        <div
            className={`agent-history-item ${item.error ? 'has-error' : ''} ${item.fromVoice ? 'is-voice' : ''}`}
        >
            <div className="agent-history-actions">
                <button type="button" className="agent-history-action-btn" title="复制指令" onClick={() => onCopy(item.task)}>
                    📋
                </button>
                <button type="button" className="agent-history-action-btn" title="重新执行" onClick={() => onRedo(item.task)}>
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
                                    title={item.results[i]?.result?.ok ? '成功' : item.results[i]?.result?.error || '失败'}
                                >
                                    <span className="agent-action-dot" />
                                    <span className="agent-action-icon">{formatActionIcon(a.type)}</span>
                                    <span className="agent-action-text">{formatActionText(a)}</span>
                                    {!item.results[i]?.result?.ok && (
                                        <span className="agent-action-fail-reason">
                                            {item.results[i]?.result?.error || '失败'}
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
    return (
        <div className="agent-history">
            {items.length === 0 && (
                <div className="agent-empty-hint">
                    <div className="agent-empty-icon">🪄</div>
                    <div className="agent-empty-title">开始你的第一条指令</div>
                    <div className="agent-empty-sub">
                        试试「点击登录按钮」「跳转到首页」「向下滚动」<br />
                        或「填写表单：姓名张三，邮箱a@b.com」「提交表单」<br />
                        也可以点击下方的快捷指令，或点 🎤 语音输入
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
