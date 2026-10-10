import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import useWhisperRecorder from '../../hooks/useWhisperRecorder'
import { AGENT_PROTOCOL, executeActions, normalizeVoiceText, parseToActions } from './lib/nlp.js'
import { createDirectBridge } from './lib/directBridge.js'
import { createIframeBridge } from './lib/iframeBridge.js'
import AgentHeader from './components/AgentHeader.jsx'
import AgentStatsBar from './components/AgentStatsBar.jsx'
import AgentHistory from './components/AgentHistory.jsx'
import AgentVoiceStatus from './components/AgentVoiceStatus.jsx'
import AgentInputRow from './components/AgentInputRow.jsx'
import AgentShortcuts from './components/AgentShortcuts.jsx'
import './index.scss'

/**
 * 通用页面 Agent 控制台。
 *
 * 本文件只做「组装与状态编排」，四类实现各自独立：
 *   · lib/nlp.js          自然语言 → action 列表
 *   · lib/dom.js          浏览器 DOM 操作原语
 *   · lib/directBridge.js 直接模式（操作当前页）
 *   · lib/iframeBridge.js iframe 模式（postMessage）
 * 两种模式暴露同名动作表，因此执行逻辑无需分支。
 */
const UniversalPageAgent = ({
    onExecute,
    onAgentExecute,
    className = '',
    iframeRef: externalIframeRef,
    mode: externalMode,
    router,
    pendingTask,
    onPendingTaskConsumed,
}) => {
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [history, setHistory] = useState([])
    const [mode, setMode] = useState(externalMode || 'direct')
    const [statusMsg, setStatusMsg] = useState(
        (externalMode || 'direct') === 'direct'
            ? '直接模式：操作当前页面 DOM'
            : 'iframe 模式：等待连接...',
    )
    const internalIframeRef = useRef(null)
    const agentIdRef = useRef(0)
    const pendingHandlersRef = useRef(new Map())

    const activeIframeRef = externalIframeRef || internalIframeRef

    // 外部注入的待执行任务（如语音助手送来的文本）：回填输入框并通知消费
    const consumeTaskRef = useRef(onPendingTaskConsumed)
    useEffect(() => { consumeTaskRef.current = onPendingTaskConsumed })
    useEffect(() => {
        if (!pendingTask) return
        const task = pendingTask
        // 延后到微任务再回填，避免在 effect 同步 setState 触发级联渲染
        queueMicrotask(() => {
            setInputValue(task)
            consumeTaskRef.current?.()
        })
    }, [pendingTask])

    const sendBridgeMessage = useCallback((command, payload = {}) => {
        if (!activeIframeRef?.current?.contentWindow) {
            return Promise.reject(new Error('iframe 未就绪'))
        }
        const id = ++agentIdRef.current
        const msg = { protocol: AGENT_PROTOCOL, id, command, payload }
        activeIframeRef.current.contentWindow.postMessage(msg, '*')
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                pendingHandlersRef.current.delete(id)
                resolve({ ok: false, error: '超时（5s）' })
            }, 5000)
            pendingHandlersRef.current.set(id, (result) => {
                clearTimeout(timer)
                pendingHandlersRef.current.delete(id)
                resolve(result)
            })
        })
    }, [activeIframeRef])

    useEffect(() => {
        const handler = (ev) => {
            if (!ev.data || ev.data.protocol !== AGENT_PROTOCOL) return
            if (ev.data.type === 'ready') {
                setStatusMsg('iframe 已连接')
                return
            }
            const resolve = pendingHandlersRef.current.get(ev.data.id)
            if (resolve) resolve(ev.data.result)
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    /** 核心执行逻辑：解析并执行一段指令文本 */
    const runTask = useCallback(async (taskText, source = 'input') => {
        const task = (taskText || '').trim()
        if (!task) return
        // 在执行时才构建桥接层，避免在渲染期把「会读 ref.current 的回调」传入工厂
        const bridge = mode === 'direct' ? createDirectBridge(router) : createIframeBridge(sendBridgeMessage)
        setIsLoading(true)
        setInputValue('')
        setStatusMsg(`🔄 正在解析「${task.length > 20 ? `${task.slice(0, 20)}…` : task}」...`)

        const appendHistory = (item) =>
            setHistory((prev) => [
                { ...item, timestamp: new Date().toLocaleTimeString(), fromVoice: source === 'voice', id: `${Date.now()}-${Math.random()}` },
                ...prev,
            ])

        try {
            const actions = parseToActions(task)
            const { results } = await executeActions(actions, bridge)
            const successCount = results.filter((r) => r.result.ok).length
            const failCount = results.length - successCount

            const summary =
                failCount === 0 && actions.length > 0
                    ? `✓ 全部成功 · ${actions.length} 个动作`
                    : failCount > 0 && successCount === 0
                      ? `✗ 全部失败 · ${actions.length} 个动作`
                      : `部分成功 · ${successCount}/${actions.length}`

            appendHistory({ task, actions, results, summary })
            onExecute?.(task, { actions, results, successCount, failCount })
            onAgentExecute?.(task, { actions, results, successCount, failCount })
            setStatusMsg(
                failCount === 0 && successCount > 0
                    ? `✅ 完成：${summary}`
                    : successCount === 0 && failCount > 0
                      ? `❌ 失败：${summary}`
                      : `⚠️ 完成：${summary}`,
            )
        } catch (error) {
            console.error('执行错误:', error)
            appendHistory({ task, error: error.message })
            setStatusMsg(`❌ 错误：${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }, [onExecute, onAgentExecute, mode, router, sendBridgeMessage])

    const executeTask = useCallback(async () => {
        if (!inputValue.trim()) return
        await runTask(inputValue)
    }, [inputValue, runTask])

    // runTask 每次重建（依赖 bridge / 回调）都会让下面的 whisper 回调失效，
    // 用 ref 收编最新引用，保证 onResult 里拿到的永远是最新的那一份。
    const runTaskRef = useRef(runTask)
    useEffect(() => { runTaskRef.current = runTask }, [runTask])

    /** 语音识别：结果填入输入框并自动执行 */
    const whisper = useWhisperRecorder({
        onResult: (text) => {
            const normalized = normalizeVoiceText(text)
            setInputValue(normalized)
            setStatusMsg(`🎙️ 识别：${normalized}${normalized !== text ? `（已修正：${text}）` : ''}`)
            // 识别完成后自动执行（标记来源为 voice）
            setTimeout(() => runTaskRef.current(normalized, 'voice'), 120)
        },
        onError: (e) => {
            setStatusMsg(`❌ 语音识别失败：${e?.message || e}`)
        },
    })

    // executeTask 随输入变化重建，用 ref 让键盘回调保持稳定引用
    const executeTaskRef = useRef(executeTask)
    useEffect(() => { executeTaskRef.current = executeTask }, [executeTask])

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            executeTaskRef.current()
        }
    }, [])

    const toggleMode = useCallback(() => {
        const next = mode === 'direct' ? 'iframe' : 'direct'
        setMode(next)
        setHistory([])
        setStatusMsg(
            next === 'direct' ? '直接模式：操作当前页面 DOM' : 'iframe 模式：等待连接...',
        )
    }, [mode])

    // —— 统计（成功率、语音次数等）—— //
    const stats = useMemo(() => {
        let totalActions = 0
        let successActions = 0
        let failActions = 0
        let voiceCount = 0
        for (const item of history) {
            if (item.fromVoice) voiceCount += 1
            if (item.results) {
                for (const r of item.results) {
                    totalActions += 1
                    if (r.result?.ok) successActions += 1
                    else failActions += 1
                }
            }
        }
        const successRate = totalActions > 0 ? Math.round((successActions / totalActions) * 100) : null
        return { total: history.length, totalActions, successActions, failActions, voiceCount, successRate }
    }, [history])

    const handleClearHistory = useCallback(() => setHistory([]), [])

    const handleCopy = useCallback((task) => {
        navigator.clipboard?.writeText(task).then(
            () => setStatusMsg(`📋 已复制「${task}」`),
            () => setStatusMsg('❌ 复制失败'),
        )
    }, [])

    const handleRedo = useCallback((task) => {
        runTaskRef.current(task, 'redo')
    }, [])

    const handleRunShortcut = useCallback((label) => {
        runTaskRef.current(label)
    }, [])

    const handleInputChange = useCallback((e) => setInputValue(e.target.value), [])

    return (
        <div className={`universal-page-agent ${className}`}>
            <AgentHeader mode={mode} onToggleMode={toggleMode} />
            <AgentStatsBar stats={stats} onClear={handleClearHistory} />

            <div
                className={`agent-status-msg ${statusMsg.startsWith('✅') ? 'is-success' : statusMsg.startsWith('❌') ? 'is-error' : ''}`}
            >
                {statusMsg}
            </div>

            {mode === 'iframe' && (
                <div className="agent-iframe-config">
                    <input type="text" placeholder="嵌入页面地址（iframe 模式）" className="agent-iframe-input" />
                    <span className="agent-iframe-hint">iframe 模式下需配置目标页面地址</span>
                </div>
            )}

            <AgentHistory items={history} onCopy={handleCopy} onRedo={handleRedo} />

            {(whisper.modelState === 'loading' || whisper.recording || whisper.recognizing) && (
                <AgentVoiceStatus
                    recording={whisper.recording}
                    recognizing={whisper.recognizing}
                    modelState={whisper.modelState}
                    modelProgress={whisper.modelProgress}
                />
            )}

            <AgentInputRow
                value={inputValue}
                onChange={handleInputChange}
                onExecute={executeTask}
                onKeyDown={handleKeyDown}
                isLoading={isLoading}
                whisper={whisper}
            />

            <AgentShortcuts onRun={handleRunShortcut} />
        </div>
    )
}

export default UniversalPageAgent
