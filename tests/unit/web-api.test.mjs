/**
 * 浏览器原生能力 · 纯函数单测（零依赖）
 * 覆盖 src/components/WebApi/device.js。
 * 能力探测做成「传 env 进去」的纯函数，就是为了能在 node 里塞假环境断言分支。
 */
import {
  detectCapabilities, networkTier, formatCoords, describePermission, API_CATALOG,
} from '../../src/components/WebApi/device.js'
import { eq, ok, length as len } from './harness.mjs'

const ALL_ON = {
  fullscreenEnabled: true, wakeLock: true, geolocation: true, Notification: true,
  share: true, connection: true, clipboard: true, vibrate: true,
}
const ALL_OFF = {
  fullscreenEnabled: false, wakeLock: false, geolocation: false, Notification: false,
  share: false, connection: false, clipboard: false, vibrate: false,
}

export default [
  /* ---------- detectCapabilities ---------- */
  ['detectCapabilities 全支持环境全部为 true', () => {
    const list = detectCapabilities(ALL_ON)
    len(list, API_CATALOG.length)
    list.forEach((a) => eq(a.supported, true, `${a.key} 应为 true`))
  }],
  ['detectCapabilities 全不支持环境全部为 false', () => {
    const list = detectCapabilities(ALL_OFF)
    list.forEach((a) => eq(a.supported, false, `${a.key} 应为 false`))
  }],
  ['detectCapabilities 空对象不崩且全为 false', () => {
    const list = detectCapabilities()
    len(list, API_CATALOG.length)
    list.forEach((a) => eq(a.supported, false))
  }],
  ['detectCapabilities 只开一项时只有该项为 true', () => {
    const list = detectCapabilities({ ...ALL_OFF, wakeLock: true })
    const wake = list.find((a) => a.key === 'wakeLock')
    eq(wake.supported, true)
    eq(list.filter((a) => a.supported).length, 1, '只应有一项支持')
  }],
  ['detectCapabilities 保留名称与说明', () => {
    const list = detectCapabilities(ALL_ON)
    list.forEach((a) => {
      ok(typeof a.name === 'string' && a.name.length > 0, `${a.key} 缺少名称`)
      ok(typeof a.desc === 'string' && a.desc.length > 0, `${a.key} 缺少说明`)
    })
  }],
  ['API_CATALOG 的 key 不重复', () => {
    const keys = API_CATALOG.map((a) => a.key)
    eq(new Set(keys).size, keys.length, 'key 必须唯一')
  }],

  /* ---------- networkTier ---------- */
  ['networkTier 各档位翻译正确', () => {
    eq(networkTier('slow-2g'), '极慢')
    eq(networkTier('2g'), '慢')
    eq(networkTier('3g'), '中等')
    eq(networkTier('4g'), '快')
  }],
  ['networkTier 未知档位回落', () => {
    eq(networkTier('5g'), '未知')
    eq(networkTier(''), '未知')
    eq(networkTier(), '未知')
  }],

  /* ---------- formatCoords ---------- */
  ['formatCoords 保留 5 位小数并附精度', () => {
    const s = formatCoords({ latitude: 31.230416, longitude: 121.473701, accuracy: 65 })
    eq(s, '31.23042, 121.47370（±65m）')
  }],
  ['formatCoords 缺省精度时不显示括号', () => {
    eq(formatCoords({ latitude: 1, longitude: 2 }), '1.00000, 2.00000')
  }],
  ['formatCoords 非法输入返回占位符', () => {
    eq(formatCoords(null), '—')
    eq(formatCoords(undefined), '—')
    eq(formatCoords({}), '—')
    eq(formatCoords({ latitude: 'x', longitude: 2 }), '—')
  }],

  /* ---------- describePermission ---------- */
  ['describePermission 各状态翻译正确', () => {
    eq(describePermission('granted'), '已授权')
    eq(describePermission('denied'), '已拒绝')
    eq(describePermission('prompt'), '待询问')
    eq(describePermission('default'), '待询问')
    eq(describePermission('unsupported'), '当前环境不支持')
  }],
  ['describePermission 空值回落', () => {
    eq(describePermission(''), '未知')
    eq(describePermission(), '未知')
  }],
]
