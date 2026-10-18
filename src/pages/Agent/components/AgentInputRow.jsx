import { memo } from 'react'
import { useI18n } from '@i18n/index.js'

/**
 * 指令输入行：麦克风按钮 + 多行输入 + 执行按钮。
 * Enter 执行、Shift+Enter 换行。
 */
function AgentInputRow({ value, onChange, onExecute, onKeyDown, isLoading, whisper }) {
    const { t } = useI18n()
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
                        ? t('agent.input.micUnsupported')
                        : whisper.recording
                          ? t('agent.input.micStopTip')
                          : t('agent.input.micTip')
                }
            >
                {whisper.recognizing ? '⏳' : whisper.recording ? '⏹' : '🎤'}
            </button>
            <textarea
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder={t('agent.input.placeholder')}
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
                        {t('agent.input.executing')}
                    </>
                ) : (
                    <>{t('agent.input.execute')}</>
                )}
            </button>
        </div>
    )
}

export default memo(AgentInputRow)
