/* =====================================================================
 * 动作展示：图标 / 文案 / 一键指令
 * ===================================================================== */

const ACTION_ICONS = {
    navigate: '🧭', click: '👆', type: '⌨️', search: '🔎', scroll: '📜',
    analyze: '🔍', find: '🔎', hover: '🖱️', select: '📋', check: '✅',
    press: '🔘', wait: '⏳', reload: '🔄', back: '⬅️', forward: '➡️',
    'form-fill': '📝', 'form-submit': '📮', 'form-clear': '🧹', 'form-detect': '🧾',
    unknown: '❓',
}

const SCROLL_DIRECTION_TEXT = { top: '顶部', bottom: '底部', up: '向上', down: '向下' }

export function formatActionIcon(type) {
    return ACTION_ICONS[type] || '⚡'
}

export function formatActionText(action) {
    switch (action.type) {
        case 'navigate': return `跳转到「${action.target}」`
        case 'click': return `点击「${action.target}」`
        case 'type': return `在「${action.target || '输入框'}」输入「${action.value}」`
        case 'search': return `搜索「${action.value}」`
        case 'scroll': return `滚动到${SCROLL_DIRECTION_TEXT[action.direction] || action.direction}`
        case 'analyze': return '分析页面'
        case 'find': return `查找「${action.target}」`
        case 'hover': return `悬停在「${action.target}」`
        case 'select': return `选择「${action.target}」`
        case 'check': return `勾选「${action.target}」`
        case 'press': return `按下 ${action.key}`
        case 'form-fill': {
            const f = action.fields || []
            if (!f.length) return '填写表单（自动检测字段）'
            const names = f.map((x) => x.name || x.raw).filter(Boolean).slice(0, 3).join('、')
            return `填写表单 ${f.length} 个字段${names ? `（${names}…）` : ''}`
        }
        case 'form-submit': return '提交表单'
        case 'form-clear': return '清空表单'
        case 'form-detect': return '检测表单'
        case 'wait': return `等待 ${action.ms || 1000}ms`
        case 'reload': return '刷新页面'
        case 'back': return '后退'
        case 'forward': return '前进'
        default: return action.raw || '未知操作'
    }
}

/** 一键执行的示例指令（也是给用户的语法示例） */
export const SHORTCUTS = [
    { label: '分析页面', emoji: '🔍', tag: 'info', cls: 'tag-info' },
    { label: '向下滚动', emoji: '📜', tag: '操作', cls: 'tag-action' },
    { label: '跳到首页', emoji: '🧭', tag: '导航', cls: 'tag-nav' },
    { label: '填写表单', emoji: '📝', tag: '表单', cls: 'tag-form' },
    { label: '提交表单', emoji: '📮', tag: '表单', cls: 'tag-form' },
    { label: '搜索人工智能', emoji: '🔎', tag: '操作', cls: 'tag-action' },
    { label: '刷新页面', emoji: '🔄', tag: '信息', cls: 'tag-info' },
    { label: '返回上一页', emoji: '⬅️', tag: '导航', cls: 'tag-nav' },
]
