export const devicePresets = [
  { label: '手机', labelKey: 'embed.deviceMobile', icon: '📱', key: 'mobile', width: 375, height: 667 },
  { label: '大屏手机', labelKey: 'embed.deviceMobileLg', icon: '📱', key: 'mobile-lg', width: 414, height: 896 },
  { label: '平板', labelKey: 'embed.devicePad', icon: '📱', key: 'pad', width: 768, height: 1024 },
  { label: '平板横屏', labelKey: 'embed.devicePadLs', icon: '📲', key: 'pad-ls', width: 1024, height: 768 },
  { label: '桌面', labelKey: 'embed.devicePc', icon: '💻', key: 'pc', width: 1280, height: 800 },
  { label: '大屏桌面', labelKey: 'embed.devicePcLg', icon: '🖥️', key: 'pc-lg', width: 1920, height: 1080 },
]

export const MODES = [
  { key: 'window', label: '新窗口预览', labelKey: 'embed.modeWindow', icon: '🪟', desc: '真实浏览器窗口，兼容所有项目', descKey: 'embed.modeWindowDesc' },
  { key: 'embed', label: '内嵌预览', labelKey: 'embed.modeEmbed', icon: '🖼️', desc: '页面内 iframe，仅限允许嵌套的站点', descKey: 'embed.modeEmbedDesc' },
]

