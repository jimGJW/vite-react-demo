import { memo } from 'react'

/**
 * 顶部标题栏：显示当前模式并可切换。
 * 直接模式操作当前页 DOM，iframe 模式通过 postMessage 操作内嵌页。
 */
function AgentHeader({ mode, onToggleMode }) {
    return (
        <div className="agent-header">
            <div className="agent-title">
                <span>🤖 AI Agent 控制台</span>
                <span className="agent-title-pulse" title="在线" />
            </div>
            <div className="agent-header-actions">
                <span className={`agent-mode-badge ${mode}`}>{mode === 'direct' ? '直接模式' : 'iframe 模式'}</span>
                <button type="button" className="agent-mode-toggle" onClick={onToggleMode}>
                    切换模式
                </button>
            </div>
        </div>
    )
}

export default memo(AgentHeader)
