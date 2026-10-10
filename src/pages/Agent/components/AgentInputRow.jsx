import { memo } from 'react'

/**
 * 指令输入行：麦克风按钮 + 多行输入 + 执行按钮。
 * Enter 执行、Shift+Enter 换行。
 */
function AgentInputRow({ value, onChange, onExecute, onKeyDown, isLoading, whisper }) {
    const micDisabled = isLoading || !whisper.supported || whisper.recognizing

    return (
        <div className="agent-input-row">
            <button
                type="button"
                className={`agent-mic-btn ${whisper.recording ? 'recording' : ''} ${whisper.recognizing ? 'recognizing' : ''}`}
                onClick={whisper.recording ? whisper.stop : whisper.start}
                disabled={micDisabled}
                title={
                    !whisper.supported
                        ? '当前浏览器不支持麦克风录音'
                        : whisper.recording
                          ? '停止录音并开始识别'
                          : '🎤 语音控制页面：说指令自动执行（点击/跳转/滚动/输入）'
                }
            >
                {whisper.recognizing ? '⏳' : whisper.recording ? '⏹' : '🎤'}
            </button>
            <textarea
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder="输入或粘贴指令…Enter 执行 · Shift+Enter 换行 · 也可点 🎤 语音"
                disabled={isLoading}
                rows={2}
                className="agent-input"
            />
            <button
                type="button"
                onClick={onExecute}
                disabled={isLoading || !value.trim()}
                className="agent-exec-btn"
            >
                {isLoading ? (
                    <>
                        <span className="agent-exec-spinner" />
                        执行中
                    </>
                ) : (
                    <>▶ 执行</>
                )}
            </button>
        </div>
    )
}

export default memo(AgentInputRow)
