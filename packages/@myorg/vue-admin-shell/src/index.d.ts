import type { DefineComponent } from 'vue'

/** 测试用例：run 返回是否通过与可选详情 */
export interface TestCase {
  id: string
  name: string
  group: string
  run: () => Promise<{ pass: boolean; detail?: string }>
}

/** 后台管理 Layout：侧边/顶部导航（需要 vue-router 与 @myorg/vue-core-composables 的 useAuth） */
export declare const AdminLayout: DefineComponent<Record<string, never>, Record<string, never>, any>

/** 可拖拽 AI 气泡 + 快捷键面板，内部挂载 UniversalPageAgent（需要 vue-router） */
export declare const GlobalAgent: DefineComponent<Record<string, never>, Record<string, never>, any>

/** 测试中心：批量运行测试用例 + 展示 Python E2E 脚本 */
export declare const TestCenter: DefineComponent<
  {
    /** 测试用例数组 */
    cases?: TestCase[]
    /** 配套 Python 脚本原文 */
    pythonScript?: string
    /** 终端运行命令 */
    runCommand?: string
    /** 附加类名 */
    className?: string
  },
  Record<string, never>,
  any
>

/** 自然语言操控页面的 AI 控制台（直接模式操作当前 DOM / iframe 模式桥接） */
export declare const UniversalPageAgent: DefineComponent<
  {
    /** 每次执行后回调 */
    onExecute?: (task: string, info: { actions: unknown[]; results: unknown[]; successCount: number; failCount: number }) => void
    /** 同 onExecute（语义别名） */
    onAgentExecute?: (task: string, info: { actions: unknown[]; results: unknown[]; successCount: number; failCount: number }) => void
    /** 系统提示词 */
    systemPrompt?: string
    /** 附加类名 */
    className?: string
    /** 外部 iframe 元素（iframe 模式下桥接目标） */
    iframeRef?: unknown
    /** 初始模式：direct | iframe */
    mode?: 'direct' | 'iframe'
    /** 路由适配器：{ navigate: (to) => void }，用于站内跳转 */
    router?: { navigate: (to: string) => void }
  },
  Record<string, never>,
  any
>
