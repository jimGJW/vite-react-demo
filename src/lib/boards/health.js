/**
 * 看板健康度统计 —— 三块看板（深空 / 地球 / 海洋）共用。
 *
 * 每个数据源 hook 返回 { data, error, loading } 这样的状态对象；这里把它们收成一
 * 个 { ok, total }，供「关联数据」模块底部的三方监控条显示「当前看板有多少源是活的」。
 *
 * 判定口径与 TimelineBoard 的时间档案表保持一致：
 *   有数据、没报错、且未被服务端标记为 stale，才算「正常」。
 * 刚发起请求还没回来的（无 data 也无 error）不算正常，也不算故障——那是「等待」。
 */

export function healthOf(states) {
  const total = states.length
  const ok = states.filter((s) => s && s.data && !s.error && !s.data.stale).length
  return { ok, total }
}
