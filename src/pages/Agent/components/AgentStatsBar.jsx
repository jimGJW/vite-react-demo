import { memo } from 'react'
import { useI18n } from '../../../i18n/index.js'

/** 执行统计条：成功/失败动作数、语音次数、成功率 */
function AgentStatsBar({ stats, onClear }) {
    const { t } = useI18n()
    return (
        <div className="agent-stats-bar">
            <span className="agent-stat-chip total">
                {t('agent.stats.execPre')}<strong>{stats.total}</strong>{t('agent.stats.execPost')}
            </span>
            <span className="agent-stat-chip success">
                {t('agent.stats.successPre')}<strong>{stats.successActions}</strong>
            </span>
            {stats.failActions > 0 && (
                <span className="agent-stat-chip fail">
                    {t('agent.stats.failPre')}<strong>{stats.failActions}</strong>
                </span>
            )}
            {stats.voiceCount > 0 && (
                <span className="agent-stat-chip voice">
                    {t('agent.stats.voicePre')}<strong>{stats.voiceCount}</strong>
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
                    {t('agent.stats.ratePre')}<strong>{stats.successRate}{t('agent.stats.ratePost')}</strong>
                </span>
            )}
            <span className="agent-stat-spacer" />
            {stats.total > 0 && (
                <button type="button" className="agent-clear-btn" onClick={onClear} title={t('agent.stats.clearTitle')}>
                    {t('agent.stats.clear')}
                </button>
            )}
        </div>
    )
}

export default memo(AgentStatsBar)
