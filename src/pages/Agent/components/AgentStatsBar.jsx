import { memo } from 'react'

/** 执行统计条：成功/失败动作数、语音次数、成功率 */
function AgentStatsBar({ stats, onClear }) {
    return (
        <div className="agent-stats-bar">
            <span className="agent-stat-chip total">
                执行 <strong>{stats.total}</strong> 次
            </span>
            <span className="agent-stat-chip success">
                成功 <strong>{stats.successActions}</strong>
            </span>
            {stats.failActions > 0 && (
                <span className="agent-stat-chip fail">
                    失败 <strong>{stats.failActions}</strong>
                </span>
            )}
            {stats.voiceCount > 0 && (
                <span className="agent-stat-chip voice">
                    语音 <strong>{stats.voiceCount}</strong>
                </span>
            )}
            {stats.successRate != null && (
                <span
                    className="agent-stat-chip"
                    style={{
                        background:
                            stats.successRate >= 90 ? '#ecfdf5' : stats.successRate >= 60 ? '#fffbeb' : '#fef2f2',
                    }}
                >
                    成功率 <strong>{stats.successRate}%</strong>
                </span>
            )}
            <span className="agent-stat-spacer" />
            {stats.total > 0 && (
                <button type="button" className="agent-clear-btn" onClick={onClear} title="清空历史">
                    🗑 清空
                </button>
            )}
        </div>
    )
}

export default memo(AgentStatsBar)
