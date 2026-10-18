import { memo } from 'react'
import { useI18n } from '@i18n/index.js'

/**
 * 语音状态条：录音中 / 本地识别中 / 首次下载模型进度。
 * 三个状态互斥展示，都不活跃时由父级不渲染本组件。
 */
function AgentVoiceStatus({ recording, recognizing, modelState, modelProgress }) {
    const { t } = useI18n()
    return (
        <div className={`agent-voice-status ${recording ? 'recording' : ''} ${recognizing ? 'recognizing' : ''}`}>
            {recording && (
                <>
                    <span className="agent-voice-bars">
                        <span /><span /><span /><span /><span />
                    </span>
                    <span className="agent-voice-status-text">{t('agent.voice.recording')}</span>
                </>
            )}
            {recognizing && <span className="agent-voice-status-text">{t('agent.voice.recognizing')}</span>}
            {modelState === 'loading' && (
                <>
                    <span className="agent-voice-status-text">{t('agent.voice.loadingModel')}</span>
                    <span className="agent-voice-status-progress">
                        <span className="agent-voice-status-progress-bar" style={{ width: `${modelProgress ?? 0}%` }} />
                    </span>
                    <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{modelProgress ?? 0}%</span>
                </>
            )}
        </div>
    )
}

export default memo(AgentVoiceStatus)
