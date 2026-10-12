/**
 * 小功能集 Utils —— React Hooks 出口。
 *
 * 与 utils.js 同样的处理：实现已按职责域拆进同目录子模块
 * （useFreq / useStorage / useBrowser / useDom / useStateKit / useWatermark / useTiming / useEventKit），本文件只做聚合转发。
 * 调用方统一从 ./index.js 导入即可。
 */
export * from './useFreq.js'
export * from './useStorage.js'
export * from './useBrowser.js'
export * from './useDom.js'
export * from './useStateKit.js'
export * from './useWatermark.js'
export * from './useTiming.js'
export * from './useEventKit.js'
