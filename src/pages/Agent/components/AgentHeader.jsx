import { memo } from 'react'
import { useI18n } from '../../../i18n/index.js'

/**
 * 顶部标题栏：显示当前模式并可切换。
 * 直接模式操作当前页 DOM，iframe 模式通过 postMessage 操作内嵌页。
 */
function AgentHeader({ mode, onToggleMode }) {
    const { t } = useI18n()
    return (
        <div className="agent-header">
            <div className="agent-title">
                <span>{t('agent.console.title')}</span>
                <span className="agent-title-pulse" title={t('agent.console.online')} />
            </div>
            <div className="agent-header-actions">
                <span className={`agent-mode-badge ${mode}`}>{mode === 'direct' ? t('agent.console.modeDirect') : t('agent.console.modeIframe')}</span>
                <button type="button" className="agent-mode-toggle" onClick={onToggleMode}>
                    {t('agent.console.toggleMode')}
                </button>
            </div>
        </div>
    )
}

export default memo(AgentHeader)
