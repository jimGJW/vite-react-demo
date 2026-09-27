/* =====================================================================
   浏览器原生能力：纯函数部分（零依赖，可 node 单测）

   把「能力探测」做成 传入 env、返回结果的纯函数，而不是直接读 navigator ——
   这样在 node 里塞一个假 env 就能断言分支，不用开浏览器。
   ===================================================================== */

/**
 * 能力清单。test 接收一个 env 对象（页面里传 navigator 的特征快照）。
 */
export const API_CATALOG = [
  { key: 'fullscreen', name: 'Fullscreen API', desc: '把任意元素切到全屏', test: (env) => Boolean(env.fullscreenEnabled) },
  { key: 'wakeLock', name: 'Screen Wake Lock', desc: '阻止屏幕自动休眠（演示 / 监控大屏常用）', test: (env) => Boolean(env.wakeLock) },
  { key: 'geolocation', name: 'Geolocation', desc: '获取经纬度，要求安全上下文（HTTPS）', test: (env) => Boolean(env.geolocation) },
  { key: 'notification', name: 'Notifications', desc: '系统级通知，需用户授权', test: (env) => Boolean(env.Notification) },
  { key: 'share', name: 'Web Share', desc: '调起系统分享面板', test: (env) => Boolean(env.share) },
  { key: 'connection', name: 'Network Information', desc: '读取网络档位、下行带宽与往返时延', test: (env) => Boolean(env.connection) },
  { key: 'clipboard', name: 'Async Clipboard', desc: '异步读写剪贴板', test: (env) => Boolean(env.clipboard) },
  { key: 'vibrate', name: 'Vibration', desc: '设备震动，移动端为主', test: (env) => Boolean(env.vibrate) },
]

/**
 * 逐个跑一遍能力检测。
 * @param {object} env 形如 { wakeLock: true, Notification: false, ... }
 * @returns {Array<{key:string,name:string,desc:string,supported:boolean}>}
 */
export function detectCapabilities(env = {}) {
  return API_CATALOG.map((api) => ({
    key: api.key,
    name: api.name,
    desc: api.desc,
    supported: Boolean(api.test(env)),
  }))
}

/** 网络档位翻译成中文描述 */
export function networkTier(effectiveType = '') {
  const map = { 'slow-2g': '极慢', '2g': '慢', '3g': '中等', '4g': '快' }
  return map[effectiveType] || '未知'
}

/** 坐标格式化：保留 5 位小数，附带精度 */
export function formatCoords(coords) {
  if (!coords) return '—'
  const { latitude, longitude, accuracy } = coords
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return '—'
  const base = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
  return typeof accuracy === 'number' ? `${base}（±${Math.round(accuracy)}m）` : base
}

/** 权限状态中文描述 */
export function describePermission(state = '') {
  const map = {
    granted: '已授权',
    denied: '已拒绝',
    prompt: '待询问',
    default: '待询问',
    unsupported: '当前环境不支持',
  }
  return map[state] || state || '未知'
}
