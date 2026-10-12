export const POLL_MS = 8000
export const LS_DIR_KEY = 'app.not-videos.dir.v1'
export const VIDEO_RE = /\.(mp4|m4v|webm|mov|mkv)$/i
export const IMAGE_RE = /\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i
export const PY_RE = /\.py$/i
/* 文本类文档：可经 /api/read-text 内联查看；其余（pdf/office）走字节流预览或下载 */
export const DOC_TEXT_RE = /\.(txt|md|json|csv|log|xml|yml|yaml|ini)$/i

/* 能力检测放在模块级：整个会话里不会变，没必要每次渲染再测一遍 */
export const CAN_PICK_DIR = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'

export const readSavedDir = () => {
  try {
    return localStorage.getItem(LS_DIR_KEY) || ''
  } catch {
    return '' // 隐私模式下 localStorage 可能直接抛
  }
}

export const saveDir = (p) => {
  try {
    localStorage.setItem(LS_DIR_KEY, p)
  } catch {
    /* 存不下就算了，本次会话仍能用 */
  }
}

export const fmtSize = (n) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`

/** rel 路径 → /local-file/ url（逐段编码，子目录斜杠保留） */
export const fileUrl = (rel, dir) =>
  `/local-file/${rel.split('/').map(encodeURIComponent).join('/')}?dir=${encodeURIComponent(dir)}`

/**
 * 把参数输入框的文本切成 argv 数组：支持单/双引号包裹含空格的参数
 * （如 --title "螺旋星系"），引号本身不作为值的一部分。
 */
export const splitArgs = (text) => {
  const out = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  const s = text || ''
  let m = re.exec(s)
  while (m) {
    out.push(m[1] ?? m[2] ?? m[3])
    m = re.exec(s)
  }
  return out
}

export const fmtTime = (ms) => {
  const d = new Date(ms)
  const p = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
