/* =====================================================================
 * iframe 模式桥接层：通过 postMessage 操作内嵌页面
 * ---------------------------------------------------------------------
 * 与直接模式同一张动作表（同名同签名），所以上层分派逻辑不需要
 * 关心当前处于哪种模式。
 *
 * 每个动作都包了 try/catch：postMessage 的失败（iframe 未就绪、
 * 5s 超时、跨域）都在这里收敛成 { ok:false, error }，不让异常冒泡。
 * ===================================================================== */

/**
 * @param {(command: string, payload?: object) => Promise<{ok:boolean, data?:any, error?:string}>} send
 */
export function createIframeBridge(send) {
    /** 统一错误收敛：网络/超时异常一律降级为 { ok:false } */
    const guard = async (fn) => {
        try {
            return await fn()
        } catch (e) {
            return { ok: false, error: e.message }
        }
    }

    /** 先 find 拿 elementId，再 act 执行 */
    const viaElement = (label, types, action, extra = {}) => async (target, value) => {
        const res = await guard(() => send('find', types ? { text: target, types } : { text: target }))
        if (!res.ok || !res.data?.length) return { ok: false, error: `未找到${label}「${target}」` }
        return guard(() => send('act', { action, elementId: res.data[0].elementId, ...extra, ...(value !== undefined ? { value } : {}) }))
    }

    /** 单步转发：把 postMessage 的结果原样返回 */
    const forward = (command, payload) => async (...args) =>
        guard(() => send(command, typeof payload === 'function' ? payload(...args) : payload))

    return {
        findAndClick: viaElement('', null, 'click'),
        findAndType: viaElement('输入框', ['input', 'textarea', 'select'], 'type'),
        findAndHover: viaElement('', null, 'hover'),
        scroll: forward('scroll', (direction) => ({ direction })),
        analyze: forward('analyze', {}),
        findElements: (keyword) => forward('find', { text: keyword })(),
        reload: forward('reload', {}),
        goBack: forward('navigate', { direction: 'back' }),
        goForward: forward('navigate', { direction: 'forward' }),
        navigate: forward('navigate', (target) => ({ target })),
        search: forward('search', (value) => ({ value })),
        press: forward('act', (key) => ({ action: 'press', key })),
        select: forward('act', (target) => ({ action: 'select', target })),
        check: forward('act', (target) => ({ action: 'check', target })),
        wait: forward('wait', (ms) => ({ ms })),
        fillForm: forward('form', (fields) => ({ action: 'fill', fields })),
        submitForm: forward('form', { action: 'submit' }),
        clearForm: forward('form', { action: 'clear' }),
        detectForm: forward('form', { action: 'detect' }),
    }
}
