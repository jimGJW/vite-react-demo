import { memo } from 'react'
import { SHORTCUTS } from '../lib/actionFormat.js'

/** 一键执行示例：既是快捷入口，也是给用户看的指令语法示例 */
function AgentShortcuts({ onRun }) {
    return (
        <div className="agent-shortcuts">
            <span className="agent-shortcut-label">⚡ 一键执行</span>
            {SHORTCUTS.map((s) => (
                <button
                    key={s.label}
                    type="button"
                    className="agent-shortcut"
                    onClick={() => onRun(s.label)}
                    title={`直接执行「${s.label}」`}
                >
                    <span className="agent-shortcut-emoji">{s.emoji}</span>
                    <span>{s.label}</span>
                    <span className={`agent-shortcut-tag ${s.cls}`}>{s.tag}</span>
                </button>
            ))}
        </div>
    )
}

export default memo(AgentShortcuts)
