import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import http from 'http'
import https from 'https'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * dev 环境下直接返回 public/ort/ 下的 onnxruntime wasm 运行时文件。
 * 原因：transformers.js 会动态 import /ort/xxx.mjs，而 Vite 禁止 import public 目录文件（会报 500）。
 * 生产构建时 public/ 会被原样复制到 dist/，由静态服务器直接服务，无需本插件。
 */
function serveOrtAssets() {
  const ortDir = path.resolve(process.cwd(), 'public/ort')
  return {
    name: 'serve-ort-assets',
    configureServer(server) {
      // configureServer 钩子在 Vite 内部中间件（含 transform）安装之前执行，
      // 此时直接 use 即为 pre 中间件，可拦截 /ort/ 请求避免被当作 ESM 转换。
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (url.startsWith('/ort/')) {
          const file = path.join(ortDir, path.basename(url))
          if (fs.existsSync(file)) {
            res.setHeader(
              'Content-Type',
              file.endsWith('.wasm') ? 'application/wasm' : 'text/javascript; charset=utf-8',
            )
            res.setHeader('Cache-Control', 'no-cache')
            res.end(fs.readFileSync(file))
            return
          }
        }
        next()
      })
    },
  }
}

/**
 * 嵌入预览辅助接口（替代旧的 HTML 改写代理方案）：
 * - GET /__frame-check?url=<encoded>
 *   探测目标站点是否允许被 iframe 嵌入。向目标发一次 GET（跟随最多 5 次重定向），
 *   请求头**模拟真实 iframe 场景**（携带本站 Referer）——因为 iframe 加载目标时浏览器
 *   一定会带 Referer，很多后端会做 Referer/防盗链校验（Nginx valid_referers、WAF 等），
 *   裸请求检测会误判"允许内嵌"而实际 iframe 被 403 拒绝。
 *   判定：HTTP 状态码 ≥400（服务器拒绝响应）→ 不允许内嵌；再读取 X-Frame-Options
 *   与 CSP frame-ancestors 响应头判断浏览器是否禁止嵌套。返回 { allowsFrame, status, ... }。
 *   仅做探测，绝不抓取/改写页面内容 —— 复杂项目（SPA、WebSocket、登录态）不再受影响。
 */
function embedHelpers() {
  const fetchTarget = (target, redirects = 0) =>
    new Promise((resolve, reject) => {
      let u
      try {
        u = new URL(target)
        if (!/^https?:$/.test(u.protocol)) throw new Error('仅支持 http/https')
      } catch (e) {
        return reject(e)
      }
      const mod = u.protocol === 'https:' ? https : http
      const req = mod.request(
        u,
        {
          method: 'GET',
          headers: {
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
            accept: 'text/html,application/xhtml+xml,*/*',
            // 模拟 iframe 内嵌场景：目标站点因此能看到"来自本站的 Referer"，
            // 与真实 iframe 加载行为一致，能提前暴露 Referer 校验导致的 403。
            referer: 'http://localhost:5173/',
          },
        },
        (res) => {
          const status = res.statusCode || 0
          if ([301, 302, 303, 307, 308].includes(status) && res.headers.location && redirects < 5) {
            res.resume()
            let nextUrl
            try {
              nextUrl = new URL(res.headers.location, u).href
            } catch {
              return resolve({ status, headers: {} })
            }
            return fetchTarget(nextUrl, redirects + 1).then(resolve, reject)
          }
          const headers = {}
          for (const [k, v] of Object.entries(res.headers)) headers[k.toLowerCase()] = String(v)
          res.resume() // 丢弃响应体，只读头
          resolve({ status, headers })
        },
      )
      req.setTimeout(8000, () => req.destroy(new Error('请求超时')))
      req.on('error', (e) => reject(e))
      req.end()
    })

  return {
    name: 'embed-helpers',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || '').split('?')[0]
        if (pathname !== '/__frame-check' || req.method !== 'GET') return next()

        const q = new URL(req.url, 'http://localhost').searchParams
        const target = (q.get('url') || '').trim()
        const json = (code, obj) => {
          res.statusCode = code
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(obj))
        }

        if (!target) return json(400, { ok: false, error: '缺少 url 参数' })
        try {
          const u = new URL(target)
          if (!/^https?:$/.test(u.protocol)) throw new Error('仅支持 http/https')
        } catch (e) {
          return json(400, { ok: false, error: 'URL 不合法: ' + e.message })
        }

        try {
          const r = await fetchTarget(target)
          const xfo = (r.headers['x-frame-options'] || '').toLowerCase()
          const csp = r.headers['content-security-policy'] || ''
          const m = csp.match(/frame-ancestors\s+([^;]+)/i)
          const frameAncestors = m ? m[1].trim() : ''
          // 1) 服务器拒绝响应（403/401/5xx 等）→ 无论有没有 XFO/CSP，iframe 都拿不到页面
          const statusBlocked = r.status >= 400
          // 2) 浏览器级禁止嵌套：X-Frame-Options 或 CSP frame-ancestors 不含本站
          const frameBlocked = Boolean(xfo) || (frameAncestors && !frameAncestors.includes('*') && !frameAncestors.includes('localhost'))
          const allowsFrame = !statusBlocked && !frameBlocked
          json(200, {
            ok: true,
            status: r.status,
            contentType: r.headers['content-type'] || null,
            xFrameOptions: xfo || null,
            frameAncestors: frameAncestors || null,
            statusBlocked,
            frameBlocked,
            allowsFrame,
          })
        } catch (e) {
          json(502, { ok: false, error: '探测请求失败: ' + e.message })
        }
      })
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      // 其他项目中直接 import '@myorg/react-svg-charts' 时：
      // 1. 本 monorepo 直接指向 workspace 包源码，零构建、HMR 实时生效
      // 2. 对外独立发布时，从 npm install 导入 dist/ 即可
      '@myorg/react-svg-charts': path.resolve(
        __dirname,
        'packages/@myorg/react-svg-charts/src/index.js',
      ),
      '@myorg/react-svg-charts/style.css': path.resolve(
        __dirname,
        'packages/@myorg/react-svg-charts/src/Charts.scss',
      ),
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    embedHelpers(),
    serveOrtAssets(),
  ],
  server: {
    host: true,
  },
})
