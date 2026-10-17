import { useState } from 'react'
import UniversalPageAgent from './UniversalPageAgent'
import { useI18n } from '../../i18n/index.js'
import './index.scss'

function Agent({ onAgentExecute }) {
    const { t } = useI18n()
    const [executeHistory, setExecuteHistory] = useState([])

    const handleAgentExecute = (task, result) => {
        setExecuteHistory((prev) => [
            { task, result, timestamp: new Date().toLocaleTimeString() },
            ...prev,
        ])
        onAgentExecute?.(task, result)
    }

    return (
        <div className="agent-container">
            <div className="agent-page-header">
                <h2>{t('agent.console.title')}</h2>
                <p className="agent-page-desc">
                    {t('agent.page.desc')}
                </p>
                <div className="agent-execute-count">
                    {t('agent.page.execPre')}<strong>{executeHistory.length}</strong>{t('agent.page.execPost')}
                </div>
            </div>
            <div className="agent-page-body">
                <UniversalPageAgent mode="direct" onAgentExecute={handleAgentExecute} />
            </div>
        </div>
    )
}

export default Agent