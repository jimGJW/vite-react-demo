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

/**
 * 表格字段 → 列标题（命中即用，未命中按 key 生成）。
 * 数据字典：值为 { '<lang>': text }，消费方用 pickLang() 取当前语种，避免写死的列名。
 */
export const FIELD_LABELS = {
  time: { 'zh-CN': '时间', 'zh-TW': '時間', en: 'Time', ja: '時間', ko: '시간', de: 'Zeit', fr: 'Temps', th: 'เวลา', mn: 'Хугацаа', bo: 'དུས་ཚོད།' },
  name: { 'zh-CN': '名称', 'zh-TW': '名稱', en: 'Name', ja: '名前', ko: '이름', de: 'Name', fr: 'Nom', th: 'ชื่อ', mn: 'Нэр', bo: 'མིང་།' },
  type: { 'zh-CN': '类型', 'zh-TW': '類型', en: 'Type', ja: '種類', ko: '유형', de: 'Typ', fr: 'Type', th: 'ประเภท', mn: 'Төрөл', bo: 'འདྲ་བ།' },
  status: { 'zh-CN': '状态', 'zh-TW': '狀態', en: 'Status', ja: 'ステータス', ko: '상태', de: 'Status', fr: 'Statut', th: 'สถานะ', mn: 'Төлөв', bo: 'གནས་ཚུལ།' },
  value: { 'zh-CN': '数值', 'zh-TW': '數值', en: 'Value', ja: '値', ko: '값', de: 'Wert', fr: 'Valeur', th: 'ค่า', mn: 'Утга', bo: 'རིན་ཐང་།' },
  temperature: { 'zh-CN': '温度(℃)', 'zh-TW': '溫度(℃)', en: 'Temperature(℃)', ja: '温度(℃)', ko: '온도(℃)', de: 'Temperatur(℃)', fr: 'Température(℃)', th: 'อุณหภูมิ(℃)', mn: 'Температур(℃)', bo: 'དྲོད་ཚད།(℃)' },
  humidity: { 'zh-CN': '湿度(%)', 'zh-TW': '濕度(%)', en: 'Humidity(%)', ja: '湿度(%)', ko: '습도(%)', de: 'Luftfeuchtigkeit(%)', fr: 'Humidité(%)', th: 'ความชื้น(%)', mn: 'Чийгшил(%)', bo: 'རླན་པ།(%)' },
  pressure: { 'zh-CN': '压力(kPa)', 'zh-TW': '壓力(kPa)', en: 'Pressure(kPa)', ja: '圧力(kPa)', ko: '압력(kPa)', de: 'Druck(kPa)', fr: 'Pression(kPa)', th: 'ความดัน(kPa)', mn: 'Даралт(kPa)', bo: 'ཁམས་གནོན།(kPa)' },
  flow: { 'zh-CN': '流量(m³/h)', 'zh-TW': '流量(m³/h)', en: 'Flow(m³/h)', ja: '流量(m³/h)', ko: '유량(m³/h)', de: 'Durchfluss(m³/h)', fr: 'Débit(m³/h)', th: 'อัตราการไหล(m³/h)', mn: 'Урсгал(m³/h)', bo: 'འགྲོ་ཚད།(m³/h)' },
  current: { 'zh-CN': '电流(A)', 'zh-TW': '電流(A)', en: 'Current(A)', ja: '電流(A)', ko: '전류(A)', de: 'Strom(A)', fr: 'Courant(A)', th: 'กระแส(A)', mn: 'Гүйдэл(A)', bo: 'གློག་རྒྱུན།(A)' },
  voltage: { 'zh-CN': '电压(V)', 'zh-TW': '電壓(V)', en: 'Voltage(V)', ja: '電圧(V)', ko: '전압(V)', de: 'Spannung(V)', fr: 'Tension(V)', th: 'แรงดัน(V)', mn: 'Хүчдэл(V)', bo: 'གློག་ཤུགས།(V)' },
  report: { 'zh-CN': '报告', 'zh-TW': '報告', en: 'Report', ja: 'レポート', ko: '보고', de: 'Bericht', fr: 'Rapport', th: 'รายงาน', mn: 'Тайлан', bo: 'སྙན་ཞུ།' },
  note: { 'zh-CN': '备注', 'zh-TW': '備註', en: 'Note', ja: '備考', ko: '비고', de: 'Notiz', fr: 'Note', th: 'หมายเหตุ', mn: 'Тэмдэглэл', bo: 'དྲན་གསོ།' },
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
