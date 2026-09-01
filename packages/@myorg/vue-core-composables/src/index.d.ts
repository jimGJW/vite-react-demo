import type { App, ComputedRef, InjectionKey, Ref, DefineComponent } from 'vue'

/* ================================ Auth ================================ */

/** localStorage 存储键 */
export declare const STORAGE_KEY: string
/** provide/inject 注入键 */
export declare const AUTH_KEY: InjectionKey<AuthContext>

export interface AuthUser {
  name: string
  loginAt: number
}

export interface AuthContext {
  /** 当前登录用户（只读 ref；未登录为 null） */
  user: Ref<AuthUser | null>
  /** 会话是否就绪（恒为 true：会话在模块加载时同步恢复） */
  ready: Ref<boolean>
  /** 是否已登录 */
  isLogin: ComputedRef<boolean>
  /** 登录并写入会话 */
  login: (name?: string) => void
  /** 登出并清除会话 */
  logout: () => void
}

export declare function createAuth(): AuthContext
export declare function getDefaultAuth(): AuthContext
/** 读取会话：优先使用注入的实例，否则回退到模块级共享单例 */
export declare function useAuth(): AuthContext

export declare const AuthPlugin: {
  install(app: App): void
}

export declare const AuthProvider: DefineComponent<{ scoped?: boolean }, {}, any>

/* ========================== 语音识别（Whisper） ========================== */

export interface WhisperRecorderOptions {
  onResult?: (text: string) => void
  onError?: (e: unknown) => void
}

export interface WhisperRecorder {
  /** 当前环境是否支持录音 */
  supported: Ref<boolean>
  recording: Ref<boolean>
  recognizing: Ref<boolean>
  /** 模型状态：idle | loading | ready | error */
  modelState: Ref<string>
  /** 模型加载进度 0-100，未加载时为 null */
  modelProgress: Ref<number | null>
  error: Ref<string | null>
  /** 开始录音 */
  start: () => Promise<void>
  /** 停止录音并触发本地识别 */
  stop: () => void
  /** 更新回调（父组件传入新函数时调用） */
  setCallbacks: (opts: WhisperRecorderOptions) => void
}

export declare function useWhisperRecorder(options?: WhisperRecorderOptions): WhisperRecorder

/* ============================ 扫码 / Toast ============================ */

export interface QrScannerHandlers {
  onSuccess?: (data: string) => void
  onCancel?: () => void
  onError?: (e: unknown) => void
}

/** 拉起全屏扫码弹窗；返回清理函数（调用即关闭） */
export declare function openQrScanner(handlers?: QrScannerHandlers): () => void

/** 轻提示：页面顶部显示一条 2.2s 后自动消失的 Toast */
export declare function showToast(type: 'info' | 'warn' | 'error', message: string): void

export declare const QrScannerOverlay: DefineComponent<
  { videoId: string; uploadId: string; loadingId: string },
  {},
  any
>
export declare const Toast: DefineComponent<{ type?: string; message?: string }, {}, any>
