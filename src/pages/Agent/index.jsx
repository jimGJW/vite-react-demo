import { useState } from 'react'
import UniversalPageAgent from './UniversalPageAgent'
import './index.scss'

function Agent({ onAgentExecute }) {
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
                <h2>🤖 AI Agent 控制台</h2>
                <p className="agent-page-desc">
                    用自然语言控制当前页面，支持点击、输入、滚动、分析、导航；输入框、快捷指令、麦克风语音三种交互方式。
                </p>
                <div className="agent-execute-count">
                    已执行 <strong>{executeHistory.length}</strong> 次操作
                </div>
            </div>
            <div className="agent-page-body">
                <UniversalPageAgent mode="direct" onAgentExecute={handleAgentExecute} />
            </div>
        </div>
    )
}

export default Agent