export const CAPABILITY_COLUMNS = [
  { title: '能力', dataIndex: 'name', key: 'name', width: 150 },
  { title: '说明', dataIndex: 'desc', key: 'desc' },
  {
    title: '支持',
    dataIndex: 'supported',
    key: 'supported',
    width: 78,
    render: (v) => (v ? <Tag color="green">支持</Tag> : <Tag color="default">不支持</Tag>),
  },
]

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
