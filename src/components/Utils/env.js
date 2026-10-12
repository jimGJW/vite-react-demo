/**
 * 环境判断 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   环境判断（UA）
   ===================================================================== */

const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent || '')

export const isMobile = () => /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua())
export const isIOS = () => /iPhone|iPad|iPod/i.test(ua())
export const isAndroid = () => /Android/i.test(ua())
export const isWeixin = () => /MicroMessenger/i.test(ua())
