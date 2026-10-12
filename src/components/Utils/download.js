/**
 * 下载与剪贴板 —— 通用工具子集。
 *
 * 本文件由 utils.js 按职责域拆分而来，函数实现逐字保留、未做改写。
 * 对外统一出口见 ./index.js，调用方不需要关心内部如何分文件。
 */

/* =====================================================================
   下载 / 剪贴板 / 导出
   ===================================================================== */

/** 触发 Blob 下载 */
export function downloadBlob(blob, filename = 'download') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 交给下一帧再释放，避免部分浏览器下载被中断
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** 按 URL 下载（同源或允许跨域时） */
export function downloadUrl(url, filename = 'download') {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const csvEscape = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * 导出 CSV（带 BOM，Excel 打开中文不乱码）
 * @param {{columns: Array<{key:string,title?:string,value?:Function}>, rows: Array, filename?: string}} options
 */
export function exportCsv({ columns = [], rows = [], filename = 'export.csv' } = {}) {
  const header = columns.map((c) => csvEscape(c.title ?? c.key)).join(',')
  const body = rows
    .map((row) => columns.map((c) => csvEscape(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','))
    .join('\r\n')
  // \uFEFF = BOM，保证 Excel 打开中文不乱码（此处用转义写法，避免源码里出现不可见字符）
  const csv = `\uFEFF${header}\r\n${body}`
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
  return csv
}

/** 复制文本（优先 Clipboard API，降级 textarea + execCommand） */
export async function copyText(text) {
  const s = text == null ? '' : String(text)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(s)
      return true
    }
  } catch { /* 继续走降级 */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = s
    ta.setAttribute('readonly', 'readonly')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
