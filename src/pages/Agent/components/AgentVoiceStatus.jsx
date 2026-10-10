import { memo } from 'react'

/**
 * 语音状态条：录音中 / 本地识别中 / 首次下载模型进度。
 * 三个状态互斥展示，都不活跃时由父级不渲染本组件。
 */
function AgentVoiceStatus({ recording, recognizing, modelState, modelProgress }) {
    return (
        <div className={`agent-voice-status ${recording ? 'recording' : ''} ${recognizing ? 'recognizing' : ''}`}>
            {recording && (
                <>
                    <span className="agent-voice-bars">
                        <span /><span /><span /><span /><span />
                    </span>
                    <span className="agent-voice-status-text">🎙️ 正在录音…说完点 ⏹ 停止</span>
                </>
            )}
            {recognizing && <span className="agent-voice-status-text">⏳ 正在本地识别语音（不出本机）</span>}
            {modelState === 'loading' && (
                <>
                    <span className="agent-voice-status-text">⏬ 首次加载语音模型（仅一次，约 40MB）</span>
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
