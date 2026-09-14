/**
 * ChatBot 默认配置
 * ===============================================================
 * 这里只保留「通用能力」所需的配置：
 *   - 接口路径（相对路径，部署时用 baseURL 前缀指向真实网关）
 *   - 卡片内容类型
 *   - 表格字段 → 中文列名映射（未命中的字段会按 key 自动生成列）
 *
 * 说明：原实现里与具体业务/内部系统强绑定的部分（内部网关地址、站点标识、
 * 权限站点判断、水印、微信 JS-SDK 等）均已剔除，改为可注入 / 可配置。
 */

/** 接口路径（全部为相对路径，配合 baseURL 使用） */
export const DEFAULT_ENDPOINTS = {
  /** 发消息（流式） */
  generation: '/aigc/generation',
  /** 停止生成 */
  stopGenerating: '/aigc/stopGenerating',
  /** 历史会话列表（分页） */
  historyList: '/aigc/historyList',
  /** 历史会话详情（分页） */
  detailList: '/aigc/detailList',
  /** 删除历史会话 */
  deleteHistory: '/aigc/deleteHistory',
  /** 赞 / 踩 */
  commentStatus: '/aigc/commentStatus',
  /** 生成分享 */
  share: '/aigc/share',
  /** 读取分享 */
  shareMessage: '/aigc/shareMessage',
  /** 推荐问题 */
  recommend: '/ai/recommend',
  /** 批量打包导出（提交任务） */
  batchExport: '/batch/export',
  /** 批量打包结果（轮询） */
  batchExportResult: '/batch/export/result',
}

/** 卡片内容类型：message.contentType → 渲染组件 */
export const CONTENT_TYPE = {
  TEXT: null,
  LIST: 'list',
  TABLE: 'table',
  TASK_TABLE: 'taskTable',
  CHART: 'echart',
}

/** 表格字段 → 列标题（命中即用，未命中按 key 生成） */
export const FIELD_LABELS = {
  time: '时间',
  name: '名称',
  type: '类型',
  status: '状态',
  value: '数值',
  temperature: '温度(℃)',
  humidity: '湿度(%)',
  pressure: '压力(kPa)',
  flow: '流量(m³/h)',
  current: '电流(A)',
  voltage: '电压(V)',
  report: '报告',
  note: '备注',
}

/** 历史列表分页大小 */
export const PAGE_SIZE = 10

/** 轮询批量打包结果的间隔与超时 */
export const POLL_INTERVAL = 1200
export const POLL_TIMEOUT = 60_000

/** 默认输入框引导文案与推荐问题（可被 props 覆盖） */
export const DEFAULT_PLACEHOLDER = '输入你的问题，Enter 发送 / Shift+Enter 换行'

export const DEFAULT_RECOMMEND = [
  '用表格展示最近 7 天的监测数据',
  '画一张趋势折线图',
  '给我一份资源清单',
  '列一个任务列表并支持批量导出',
]
