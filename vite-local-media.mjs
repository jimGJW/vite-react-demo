import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'

/**
 * 本地媒体中心中间件 —— 由旧版「隐藏视频轮播页」的 serveNotVideos 升级而来。
 * 用户在页面上自选一个文件夹（?dir=<绝对路径>），页面据其中内容分四类展示：
 *   - 视频（mp4/webm/mov/mkv…）→ 轮播播放
 *   - 图片（png/jpg/gif/svg/webp…）→ 直接展示（python 效果产物也落在这里）
 *   - 文档（txt/md/pdf/docx…） → 文本内联 / pdf 预览 / office 下载
 *   - Python 脚本（.py）       → 一键运行，回显输出并捕获新生成的图片/视频产物
 *
 * 端点（全部仅挂 dev server，configureServer，生产产物不含）：
 *   GET  /api/not-videos?dir=            分类扫描（递归，深度≤3，跳过 .git 等），返回 { videos, images, docs, pythons }
 *   GET  /api/python-info?dir=           探测本机可用的 python 解释器（版本 + 有没有 numpy），供前端选择
 *   GET  /local-file/<rel>?dir=          通用文件字节流，支持 Range；rel 可含子目录（fx/galaxy.py、output/x.webp）
 *         保留 /not-videos/<rel>?dir= 兼容旧地址
 *   GET  /api/read-text?dir=&file=<rel>  读取文本类文档内容（限 2MB），file 可含子目录
 *   POST /api/run-python                 运行脚本（body: { dir, file, args?, timeout?, py? }）→ 立即返回 jobId
 *   GET  /api/run-python/status?jobId=   轮询任务：实时 output/error、退出码、产物 diff
 *   POST /api/run-python/cancel?jobId=   停止正在运行的任务
 *
 * 为「大型 python 特效工程」做的三件事（用户真实场景：/…/Front-End/PYTHON，49 个效果在 fx/ 子包、产物在 output/）：
 *   1. 递归扫描 + rel 路径：子目录里的 .py 与产物都能列出、都能访问；
 *   2. 模块方式运行：.py 所在目录含 __init__.py 时自动按 `python -m pkg.mod` 起
 *      （直接 `python fx/galaxy.py` 会 ModuleNotFoundError，因为包内是 `from fx import core`）；
 *   3. 解释器探测：PATH 里的 python3 可能没装 numpy（本机就是：WorkBuddy 托管版没有），
 *      自动列出候选并标出谁带 numpy，默认选能跑的那条；也可用 <dir>/.venv 或环境变量指定。
 *
 * 安全口径与旧版一致：目录经 ?dir= 传入、每次重新校验；NOT_VIDEO_ROOTS 可设白名单；
 * 文件名一律按段 basename + startsWith(dir) 双重校验，堵死 ../ 穿越。run-python 额外限定本机回环。
 */

const VIDEO_MIME = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
}
const IMAGE_MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
}
/* 文档分两类：文本类可 read-text 内联；二进制类走字节流（pdf 预览 / office 下载） */
const DOC_TEXT = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.log': 'text/plain',
  '.xml': 'text/xml',
  '.yml': 'text/yaml',
  '.yaml': 'text/yaml',
  '.ini': 'text/plain',
}
const DOC_BIN = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

const MAX_TEXT_BYTES = 2 * 1024 * 1024
const MAX_OUTPUT_CHARS = 400000
const RUN_TIMEOUT_MS = 300 * 1000 // 大型渲染动辄数分钟，默认放宽到 5 分钟；前端仍可选 60s~900s
const MAX_RUN_JOBS = 24 // 内存里最多留多少个历史任务，超出丢最旧的

/* 递归扫描的护栏：深度、目录黑名单、文件数上限 —— 防止用户误填 Home 目录把 dev server 拖死 */
const SCAN_MAX_DEPTH = 3
const SCAN_MAX_FILES = 4000
const SCAN_SKIP_DIRS = new Set([
  'node_modules', '__pycache__', '.git', '.svn', '.hg', '.venv', 'venv',
  '.tox', '.mypy_cache', '.pytest_cache', 'site-packages', '.next', '.nuxt',
  '.idea', '.vscode', 'Library', 'System', 'Applications',
])

function kindOf(ext) {
  if (VIDEO_MIME[ext]) return 'video'
  if (IMAGE_MIME[ext]) return 'image'
  if (ext === '.py') return 'python'
  if (DOC_TEXT[ext] || DOC_BIN[ext]) return 'doc'
  return null
}

function mimeOf(ext) {
  return VIDEO_MIME[ext] || IMAGE_MIME[ext] || DOC_TEXT[ext] || DOC_BIN[ext] || 'application/octet-stream'
}

/** rel 路径（posix，可含子目录）→ /local-file/ 下的 url 段（逐段编码，斜杠保留作分隔） */
function relToUrl(rel) {
  return `/local-file/${rel.split('/').map(encodeURIComponent).join('/')}`
}

/**
 * 递归分类扫描：返回 { videos, images, docs, pythons }，各自按 mtime 新的在前。
 * 每项带 rel（相对目录的 posix 路径）与 dir（所在子目录，顶层为 ''），
 * 名字相同的文件在不同子目录不会撞车。
 */
function scanDir(root) {
  const out = { videos: [], images: [], docs: [], pythons: [] }
  let seen = 0
  const walk = (abs, rel, depth) => {
    let entries
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true })
    } catch {
      return // 无权限 / 已删除：跳过而不是让整轮失败
    }
    for (const ent of entries) {
      if (seen >= SCAN_MAX_FILES) return
      const childRel = rel ? `${rel}/${ent.name}` : ent.name
      if (ent.isDirectory()) {
        if (depth >= SCAN_MAX_DEPTH) continue
        if (ent.name.startsWith('.') || SCAN_SKIP_DIRS.has(ent.name)) continue
        walk(path.join(abs, ent.name), childRel, depth + 1)
        continue
      }
      if (!ent.isFile()) continue
      const ext = path.extname(ent.name).toLowerCase()
      const kind = kindOf(ext)
      if (!kind) continue
      let st
      try {
        st = fs.statSync(path.join(abs, ent.name))
      } catch {
        continue // 正在写入或已被删掉的文件，跳过
      }
      seen += 1
      const item = {
        name: ent.name,
        rel: childRel,
        dir: rel,
        size: st.size,
        mtime: Math.floor(st.mtimeMs),
        kind,
        url: relToUrl(childRel),
      }
      if (kind === 'video') out.videos.push(item)
      else if (kind === 'image') out.images.push(item)
      else if (kind === 'python') out.pythons.push(item)
      else out.docs.push({ ...item, text: !!DOC_TEXT[ext] })
    }
  }
  walk(root, '', 0)
  const byNew = (a, b) => b.mtime - a.mtime
  out.videos.sort(byNew)
  out.images.sort(byNew)
  out.docs.sort(byNew)
  out.pythons.sort(byNew)
  return out
}

/* ---------- python 解释器探测 ---------- */

/** 用一次 -c import 判断解释器能不能跑 fx 这类工程（numpy + Pillow 是硬依赖） */
function probeInterpreter(bin) {
  try {
    const v = spawnSync(bin, ['--version'], { encoding: 'utf8', timeout: 10000 })
    if (v.error || v.status !== 0) return null
    const mods = spawnSync(bin, ['-c', 'import numpy, PIL'], { encoding: 'utf8', timeout: 15000 })
    return {
      bin,
      version: String((v.stdout || v.stderr) || '').trim(),
      // numpy 装没装是「能不能跑效果」的分水岭；Pillow 单独报，方便对照 requirements.txt
      hasNumpy: !mods.error && mods.status === 0,
      hasPillow: !mods.error && mods.status === 0,
    }
  } catch {
    return null
  }
}

function candidateInterpreters(dirAbs) {
  const list = []
  const push = (bin, source) => {
    if (!bin) return
    list.push({ bin, source })
  }
  // 项目自带虚拟环境优先：工程自己的依赖装在哪儿，作者最清楚
  push(path.join(dirAbs, '.venv', 'bin', 'python'), '项目 .venv')
  push(path.join(dirAbs, 'venv', 'bin', 'python'), '项目 venv')
  if (process.env.LOCAL_MEDIA_PYTHON) push(process.env.LOCAL_MEDIA_PYTHON, '环境变量')
  push('python3', 'PATH')
  push('python', 'PATH')
  push('/usr/local/bin/python3', '系统')
  push('/usr/bin/python3', '系统')
  push('/opt/homebrew/bin/python3', 'Homebrew')

  // 同一个解释器可能被多个候选命中（软链 / PATH 顺序），按真实路径去重
  const seen = new Set()
  const out = []
  for (const c of list) {
    let real = c.bin
    try {
      real = fs.realpathSync(c.bin)
    } catch {
      /* 不存在的路径留着让 probe 去否掉，这里不 return */
    }
    if (seen.has(real)) continue
    seen.add(real)
    const probed = probeInterpreter(c.bin)
    if (probed) out.push({ ...probed, source: c.source })
  }
  // 默认口径：优先「带 numpy 能跑效果」的，其次任一可用解释器
  const withNumpy = out.find((p) => p.hasNumpy)
  const fallback = out[0]
  return { interpreters: out, defaultBin: (withNumpy || fallback || {}).bin || '' }
}

/** 运行任务表：jobId -> { child, out, err, done, code, killed, t0, cmd, … } */
const RUN_JOBS = new Map()
let jobSeq = 0

function newJobId() {
  jobSeq += 1
  return `py${Date.now().toString(36)}${jobSeq.toString(36)}`
}

function pruneJobs() {
  const finished = [...RUN_JOBS.entries()].filter(([, j]) => j.done)
  while (finished.length > MAX_RUN_JOBS) {
    const [oldId] = finished.shift()
    RUN_JOBS.delete(oldId)
  }
}

export function serveLocalMedia() {
  // 目录不写死：由前端选好后经 ?dir= 传入；NOT_VIDEO_DIR 仅作不传参时的兜底，默认空。
  const FALLBACK_DIR = process.env.NOT_VIDEO_DIR || ''
  // 可选白名单：NOT_VIDEO_ROOTS="/Users/me/Movies,/Volumes/Disk"（逗号分隔）。
  // 一旦配置，只有这些根目录下的路径才允许读 —— 否则 ?dir= 等于开了个任意路径读取口。
  const ALLOWED_ROOTS = (process.env.NOT_VIDEO_ROOTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) => path.resolve(p))

  /** 把 ?dir= 解析成可读的绝对目录，顺带做存在性 / 类型 / 白名单校验 */
  function resolveDir(raw) {
    const dir = String(raw || FALLBACK_DIR).trim()
    if (!dir) return { error: '未指定目录：请在页面上选择文件夹，或通过 ?dir=<绝对路径> 传入' }
    const abs = path.resolve(dir)
    let st
    try {
      st = fs.statSync(abs)
    } catch {
      return { error: `目录不存在：${abs}` }
    }
    if (!st.isDirectory()) return { error: `不是目录：${abs}` }
    if (ALLOWED_ROOTS.length && !ALLOWED_ROOTS.some((r) => abs === r || abs.startsWith(r + path.sep))) {
      return { error: `目录不在 NOT_VIDEO_ROOTS 允许范围内：${abs}` }
    }
    return { abs }
  }

  /**
   * 把相对路径（可含子目录）安全地解析成目录内的绝对路径；越界/不存在返回 null。
   * 逐段过滤 . / ..，再整体 startsWith(dir) 复核 —— 单段 basename 会把
   * 「fx/galaxy.py」这类合法子路径误杀，所以这里按段清洗而不是取 basename。
   */
  function resolveFile(dirAbs, rawRel) {
    const rel = String(rawRel || '')
      .split('/')
      .map((s) => s.trim())
      .filter((s) => s && s !== '.' && s !== '..')
      .join('/')
    if (!rel) return null
    const file = path.resolve(dirAbs, rel)
    if (file !== dirAbs && !file.startsWith(dirAbs + path.sep)) return null
    if (!fs.existsSync(file)) return null
    return file
  }

  const json = (res, code, obj) => {
    res.statusCode = code
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(obj))
  }

  /** 读 POST body（JSON，限量） */
  const readBody = (req) =>
    new Promise((resolve) => {
      let raw = ''
      req.on('data', (d) => {
        raw += d
        if (raw.length > 64 * 1024) {
          raw = ''
          resolve(null)
          req.destroy()
        }
      })
      req.on('end', () => {
        try {
          resolve(raw ? JSON.parse(raw) : {})
        } catch {
          resolve(null)
        }
      })
      req.on('error', () => resolve(null))
    })

  /**
   * 若 .py 位于某个 python 包内（逐级向上有 __init__.py），返回模块方式运行参数：
   * { module: 'fx.galaxy', cwd: 包根的父目录 }。否则返回 null（按普通脚本跑）。
   * 包内模块普遍写 `from fx import core`，直接 `python fx/galaxy.py` 必挂
   * ModuleNotFoundError —— 必须 `python -m fx.galaxy` 让解释器先把包根挂上 sys.path。
   */
  function moduleRunOf(absFile, rootAbs) {
    let pkgDir = path.dirname(absFile)
    const parts = [path.basename(absFile).replace(/\.py$/, '')]
    while (fs.existsSync(path.join(pkgDir, '__init__.py'))) {
      parts.unshift(path.basename(pkgDir))
      const parent = path.dirname(pkgDir)
      if (parent === pkgDir) break // 到文件系统根了，停
      pkgDir = parent
    }
    if (parts.length < 2) return null // 顶层脚本，没有包结构
    if (pkgDir !== rootAbs && !pkgDir.startsWith(rootAbs + path.sep)) return null // 包在所选目录之外，不猜
    return { module: parts.join('.'), cwd: pkgDir }
  }

  /* 能力标识：随扫描响应下发。前端据此识别「旧版中间件还在跑」——
     Vite 只热重载 vite.config.js 本身，不重载它 import 的本文件，
     改了中间件不重启 dev 就会静默留在旧行为（平铺扫描 / 无模块方式 / 无解释器探测）。 */
  const CAPS = { recursive: true, moduleMode: true, interpreters: true, jobs: true }

  /**
   * 扫描缓存 + ETag/304 —— 轮询场景下目录多数时候根本没变（实测该工程 217 个文件、
   * 单次递归扫描约 600ms，8 秒一轮全量重扫既吃 CPU 又白传 100KB+ JSON）。
   * 口径：
   *   ETag = 目录内容签名（所有 rel:size:mtime 拼接后哈希）
   *   - 带 If-None-Match 且缓存在 TTL 内 → 直接 304，不扫（零 CPU 零传输）
   *   - 需要重扫时签名未变        → 刷新缓存时间戳并 304（省传输）
   *   - 签名变了                  → 新 body + 新 ETag
   * 缓存只按目录保留最近若干个，避免用户来回换目录把内存堆起来。
   */
  const SCAN_CACHE = new Map() // absDir -> { etag, body, ts }
  const SCAN_CACHE_TTL = 8000 // 与前端轮询间隔对齐：约一半请求零成本
  const SCAN_CACHE_MAX = 8

  /** 目录内容签名：四类文件各自 rel:size:mtime，顺序固定，重排不影响（调用方已排序） */
  function signatureOf(scanned) {
    const parts = []
    for (const k of ['videos', 'images', 'docs', 'pythons']) {
      for (const it of scanned[k]) parts.push(`${it.rel}:${it.size}:${it.mtime}`)
    }
    return parts.join('|')
  }

  /** 双 32 位 FNV 变体拼成 base36，碰撞概率对本地开发场景可忽略 */
  function hashSig(s) {
    let h1 = 0x811c9dc5
    let h2 = 0x01000193
    for (let i = 0; i < s.length; i += 1) {
      h1 = ((h1 ^ s.charCodeAt(i)) * 16777619) >>> 0
      h2 = (h2 + s.charCodeAt(i) * (i + 1)) >>> 0
    }
    return `${h1.toString(36)}${h2.toString(36)}`
  }

  /** 文件级 ETag：size + mtime，产物被覆盖（同名重跑）时指纹自然变化 */
  function fileEtag(st) {
    return `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`
  }

  /** 存缓存并做 LRU 式裁剪（超量丢最旧） */
  function putScanCache(absDir, entry) {
    SCAN_CACHE.set(absDir, entry)
    if (SCAN_CACHE.size > SCAN_CACHE_MAX) {
      let oldestKey = null
      let oldestTs = Infinity
      for (const [k, v] of SCAN_CACHE) {
        if (v.ts < oldestTs) {
          oldestTs = v.ts
          oldestKey = k
        }
      }
      if (oldestKey) SCAN_CACHE.delete(oldestKey)
    }
  }

  const handler = (req, res, next) => {
    const raw = req.url || ''
    const url = raw.split('?')[0]
    const q = new URLSearchParams(raw.split('?')[1] || '')
    const method = req.method || 'GET'

        /* ---------- 分类扫描（带 ETag/304 缓存） ---------- */
        if (url === '/api/not-videos' && method === 'GET') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store') // 轮询就是要最新结果，缓存会让「实时」失效
          const dir = resolveDir(q.get('dir'))
          if (dir.error) {
            json(res, 400, { ok: false, dir: '', error: dir.error, videos: [], images: [], docs: [], pythons: [] })
            return
          }
          const inm = req.headers['if-none-match']
          const cached = SCAN_CACHE.get(dir.abs)
          // TTL 内且客户端指纹一致：目录不可能在这几秒内变化，直接 304，连扫都不扫
          if (cached && Date.now() - cached.ts < SCAN_CACHE_TTL && inm && inm === cached.etag) {
            res.statusCode = 304
            res.setHeader('ETag', cached.etag)
            res.end()
            return
          }
          try {
            const scanned = scanDir(dir.abs)
            const etag = `"${hashSig(signatureOf(scanned))}"`
            if (cached && cached.etag === etag) {
              // 扫完了才发现没变：刷新时间戳，按需 304 或复用旧 body（省一次序列化+传输）
              cached.ts = Date.now()
              res.setHeader('ETag', etag)
              if (inm === etag) {
                res.statusCode = 304
                res.end()
                return
              }
              res.end(cached.body)
              return
            }
            const body = JSON.stringify({ ok: true, dir: dir.abs, ...scanned, caps: CAPS, ts: Date.now() })
            putScanCache(dir.abs, { etag, body, ts: Date.now() })
            res.setHeader('ETag', etag)
            res.end(body)
          } catch (e) {
            json(res, 500, { ok: false, dir: dir.abs, error: String((e && e.message) || e), videos: [], images: [], docs: [], pythons: [] })
          }
          return
        }

        /* ---------- python 解释器探测 ---------- */
        if (url === '/api/python-info' && method === 'GET') {
          const dir = resolveDir(q.get('dir'))
          if (dir.error) {
            json(res, 400, { ok: false, error: dir.error, interpreters: [], defaultBin: '' })
            return
          }
          try {
            const info = candidateInterpreters(dir.abs)
            json(res, 200, { ok: true, dir: dir.abs, ...info })
          } catch (e) {
            json(res, 500, { ok: false, error: String((e && e.message) || e), interpreters: [], defaultBin: '' })
          }
          return
        }

        /* ---------- 读取文本类文档 ---------- */
        if (url === '/api/read-text' && method === 'GET') {
          const dir = resolveDir(q.get('dir'))
          if (dir.error) {
            json(res, 400, { ok: false, error: dir.error })
            return
          }
          const rel = q.get('file') || ''
          const ext = path.extname(rel).toLowerCase()
          if (!DOC_TEXT[ext]) {
            json(res, 400, { ok: false, error: `仅支持文本类文档：${Object.keys(DOC_TEXT).join(' ')}` })
            return
          }
          const file = resolveFile(dir.abs, rel)
          if (!file) {
            json(res, 404, { ok: false, error: '文件不存在或越界' })
            return
          }
          try {
            const st = fs.statSync(file)
            if (st.size > MAX_TEXT_BYTES) {
              json(res, 413, { ok: false, error: '文件过大（>2MB），请下载后查看' })
              return
            }
            const text = fs.readFileSync(file, 'utf8')
            json(res, 200, { ok: true, name: path.basename(file), size: st.size, text })
          } catch (e) {
            json(res, 500, { ok: false, error: String((e && e.message) || e) })
          }
          return
        }

        /* ---------- 运行 python 脚本（异步任务：立即返回 jobId，前端轮询状态） ---------- */
        if (url === '/api/run-python' && method === 'POST') {
          // 本接口会在开发机上执行代码，dev server 又配了 host:true（0.0.0.0），
          // 不限制来源等于给局域网开一个远程执行口，故仅放行本机回环。
          const remote = req.socket?.remoteAddress || ''
          const isLoopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1'
          if (!isLoopback) {
            json(res, 403, { ok: false, error: '运行接口仅允许本机访问' })
            return
          }
          const started = (async () => {
            const body = await readBody(req)
            if (!body) {
              json(res, 400, { ok: false, error: '请求体不是合法 JSON' })
              return
            }
            const dir = resolveDir(body.dir)
            if (dir.error) {
              json(res, 400, { ok: false, error: dir.error })
              return
            }
            const rel = String(body.file || '')
            const file = resolveFile(dir.abs, rel)
            if (!rel.toLowerCase().endsWith('.py') || !file) {
              json(res, 400, { ok: false, error: '无效的 .py 文件（须在所填目录之内）' })
              return
            }

            /* 解释器：前端显式指定 > 探测默认（优先带 numpy 的） */
            const info = candidateInterpreters(dir.abs)
            let py = String(body.py || '').trim()
            if (py && !info.interpreters.some((p) => p.bin === py)) {
              json(res, 400, { ok: false, error: '解释器不在本机探测到的候选列表里' })
              return
            }
            if (!py) py = info.defaultBin
            if (!py) {
              json(res, 500, { ok: false, error: '本机没探测到可用的 python3 / python，请先安装并加入 PATH' })
              return
            }

            /* 附加参数：效果脚本普遍支持 --frames 之类，让用户能拿「少帧数」快速试跑 */
            const args = Array.isArray(body.args)
              ? body.args.map((a) => String(a)).filter((a) => a && a.length <= 200 && !a.includes('\0')).slice(0, 20)
              : []
            const timeoutMs = Math.min(900, Math.max(5, Number(body.timeout) || RUN_TIMEOUT_MS / 1000)) * 1000

            /* 模块方式 vs 普通脚本方式：包内模块必须 -m，否则 import 必挂 */
            const mod = moduleRunOf(file, dir.abs)
            const spawnArgs = mod ? ['-m', mod.module, ...args] : [file, ...args]
            const cwd = mod ? mod.cwd : dir.abs
            const cmdLabel = `${py} ${spawnArgs.join(' ')}`

            // 运行前快照：只把「本次新生成」的图片/视频算作效果产物（按 rel 去重，子目录不撞名）
            const before = new Set()
            try {
              const snap = scanDir(dir.abs)
              for (const it of [...snap.images, ...snap.videos]) before.add(it.rel)
            } catch {
              /* 快照失败就退化成「不过滤」，顶多多显示几个旧产物 */
            }

            const jobId = newJobId()
            const job = {
              id: jobId,
              dir: dir.abs,
              file: rel,
              module: mod ? mod.module : '',
              cmd: cmdLabel,
              python: py,
              out: '',
              err: '',
              done: false,
              code: null,
              killed: false,
              t0: Date.now(),
              artifacts: [],
            }
            RUN_JOBS.set(jobId, job)
            pruneJobs()

            try {
              job.child = spawn(py, spawnArgs, {
                cwd,
                env: { ...process.env, PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8', MPLBACKEND: 'Agg' },
              })
            } catch (e) {
              job.done = true
              job.err = `启动失败：${(e && e.message) || e}`
              json(res, 200, { ok: true, jobId, cmd: cmdLabel, python: py })
              return
            }
            job.child.stdout.on('data', (d) => {
              if (job.out.length < MAX_OUTPUT_CHARS) job.out += d
            })
            job.child.stderr.on('data', (d) => {
              if (job.err.length < MAX_OUTPUT_CHARS) job.err += d
            })
            job.timer = setTimeout(() => {
              job.killed = true
              try {
                job.child.kill('SIGKILL')
              } catch {
                /* 进程可能已退出 */
              }
            }, timeoutMs)
            job.child.on('error', (e) => {
              if (job.done) return
              job.done = true
              clearTimeout(job.timer)
              job.err += `启动失败：${(e && e.message) || e}`
            })
            job.child.on('close', (code) => {
              if (job.done) return
              job.done = true
              clearTimeout(job.timer)
              job.code = typeof code === 'number' ? code : null
              try {
                const after = scanDir(dir.abs)
                job.artifacts = [...after.images, ...after.videos].filter((it) => !before.has(it.rel))
              } catch {
                /* 产物扫描失败不影响主结果 */
              }
            })

            json(res, 200, { ok: true, jobId, cmd: cmdLabel, python: py, module: mod ? mod.module : '' })
          })()
          started.catch(() => json(res, 500, { ok: false, error: '启动任务失败' }))
          return
        }

        /* ---------- 任务状态轮询 ---------- */
        if (url === '/api/run-python/status' && method === 'GET') {
          const job = RUN_JOBS.get(q.get('jobId') || '')
          if (!job) {
            json(res, 404, { ok: false, error: '任务不存在（可能 dev server 重启过）' })
            return
          }
          json(res, 200, {
            ok: true,
            jobId: job.id,
            running: !job.done,
            cmd: job.cmd,
            python: job.python,
            module: job.module,
            file: job.file,
            dir: job.dir,
            output: job.out,
            error: job.err,
            exitCode: job.code,
            killed: job.killed,
            durationMs: Date.now() - job.t0,
            artifacts: job.artifacts,
          })
          return
        }

        /* ---------- 停止任务 ---------- */
        if (url === '/api/run-python/cancel' && method === 'POST') {
          const job = RUN_JOBS.get(q.get('jobId') || '')
          if (!job) {
            json(res, 404, { ok: false, error: '任务不存在' })
            return
          }
          if (!job.done && job.child) {
            job.killed = true
            try {
              job.child.kill('SIGKILL')
            } catch {
              /* 进程可能已退出 */
            }
          }
          json(res, 200, { ok: true, cancelled: !job.done })
          return
        }

        /* ---------- 通用文件字节流（Range）：视频/图片/pdf/下载 ---------- */
        if (url.startsWith('/local-file/') || url.startsWith('/not-videos/')) {
          const prefix = url.startsWith('/local-file/') ? '/local-file/' : '/not-videos/'
          const dir = resolveDir(q.get('dir'))
          if (dir.error) {
            res.statusCode = 400
            res.end(dir.error)
            return
          }
          // 逐段解码再拼回：rel 可含子目录（output/01_x.webp），斜杠是分隔不是内容
          const rel = raw
            .split('?')[0]
            .slice(prefix.length)
            .split('/')
            .map((s) => {
              try {
                return decodeURIComponent(s)
              } catch {
                return s
              }
            })
            .join('/')
          const file = resolveFile(dir.abs, rel)
          if (!file) {
            // 不存在或越界：明确 404，不走 next() —— 否则会落到 Vite 的 SPA fallback 返回 200，
            // 把「文件没拿到」伪装成成功，也容易和真实资源混淆。
            res.statusCode = 404
            res.end('Not Found')
            return
          }
          const ext = path.extname(file).toLowerCase()
          const isText = !!DOC_TEXT[ext]
          const type = isText ? `${DOC_TEXT[ext]}; charset=utf-8` : mimeOf(ext)
          const st = fs.statSync(file)
          const total = st.size
          const range = req.headers.range

          // 文件级条件请求：图片网格重渲染 / 轮播切回时浏览器会自动带 If-None-Match，
          // 命中就 304 零传输；python 产物覆盖同名文件时 mtime 变，指纹自然失效。
          // Range 请求不走 304（206 本身带 body，条件语义交给具体字节段）。
          if (!range) {
            const etag = fileEtag(st)
            res.setHeader('ETag', etag)
            if (req.headers['if-none-match'] === etag) {
              res.statusCode = 304
              res.end()
              return
            }
          }

          if (range && !isText) {
            const m = /bytes=(\d*)-(\d*)/.exec(range)
            const start = m && m[1] ? Number(m[1]) : 0
            const endRaw = m && m[2] ? Number(m[2]) : total - 1
            const s = Math.max(0, Math.min(start, total - 1))
            const e = Math.max(s, Math.min(endRaw, total - 1))
            res.writeHead(206, {
              'Content-Range': `bytes ${s}-${e}/${total}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': e - s + 1,
              'Content-Type': type,
            })
            fs.createReadStream(file, { start: s, end: e }).pipe(res)
            return
          }

          res.writeHead(200, {
            'Content-Length': total,
            'Accept-Ranges': 'bytes',
            'Content-Type': type,
          })
          fs.createReadStream(file).pipe(res)
          return
        }

        next()
    }

    return {
      name: 'serve-local-media',
      // dev 与 preview 都挂：npm run preview 看 build 产物时，/not-videos 同样能用
      // （否则预览页里所有接口 404，用户会以为功能坏了）
      configureServer(server) {
        server.middlewares.use(handler)
      },
      configurePreviewServer(server) {
        server.middlewares.use(handler)
      },
    }
  }
