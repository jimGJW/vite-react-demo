import { Tag } from 'antd'

/** 能力探测表格列：文案走 t()，随语言切换（表头 + 支持/不支持徽标） */
export function makeCapabilityColumns(t) {
  return [
    { title: t('webApi.colCapability'), dataIndex: 'name', key: 'name', width: 150 },
    { title: t('webApi.colDesc'), dataIndex: 'desc', key: 'desc' },
    {
      title: t('webApi.colSupported'),
      dataIndex: 'supported',
      key: 'supported',
      width: 78,
      render: (v) => (v ? <Tag color="green">{t('webApi.supportedYes')}</Tag> : <Tag color="default">{t('webApi.supportedNo')}</Tag>),
    },
  ]
}

/* 环境快照：一次性读取，不随渲染变化 */
export function readEnv() {
  const hasNav = typeof navigator !== 'undefined'
  const hasDoc = typeof document !== 'undefined'
  return {
    fullscreenEnabled: hasDoc && typeof document.documentElement.requestFullscreen === 'function',
    wakeLock: hasNav && 'wakeLock' in navigator,
    geolocation: hasNav && 'geolocation' in navigator,
    Notification: typeof Notification !== 'undefined',
    share: hasNav && typeof navigator.share === 'function',
    connection: hasNav && Boolean(navigator.connection),
    clipboard: hasNav && Boolean(navigator.clipboard),
    vibrate: hasNav && typeof navigator.vibrate === 'function',
  }
}

/**
 * 浏览器原生能力实验室。
 * 每个能力都给出 supported 状态 —— 不支持时明确告知，而不是点了没反应。
 */
