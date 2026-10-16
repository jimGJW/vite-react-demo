import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import http from 'http'
import https from 'https'
import fs from 'node:fs'
import path from 'node:path'
import { serveAstroData } from './vite-astro-proxy.mjs'
import { serveGeoData } from './vite-geo-proxy.mjs'
import { serveOceanData } from './vite-ocean-proxy.mjs'
import { serveLocalMedia } from './vite-local-media.mjs'

/**
 * dev 环境下直接返回 public/ort/ 下的 onnxruntime wasm 运行时文件。
 * 原因：transformers.js 会动态 import /ort/xxx.mjs，而 Vite 禁止 import public 目录文件（会报 500）。
 * 生产构建时 public/ 会被原样复制到 dist/，由静态服务器直接服务，无需本插件。
 */
function serveOrtAssets() {
  return {
    name: 'serve-ort-assets',
    configureServer(server) {
      // 用 Vite 的 root 而不是 process.cwd()：以 `--root` 或从其它目录启动时仍能定位 public/ort
      const ortDir = path.resolve(server.config.root, 'public/ort')
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
          if ([301, 302, 303, 307, 308].includes(status) && res.headers.location && redirects < 3) {
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

        // 安全：本接口会代表调用方发起服务端请求（SSRF 面）。dev server 配置了 host: true
        // （监听 0.0.0.0），若不限制来源，同一局域网内任何人都可以把开发机当作盲请求代理，
        // 去探测内网服务或云元数据地址（如 169.254.169.254）。因此仅允许本机回环访问。
        const remote = req.socket?.remoteAddress || ''
        const isLoopback =
          remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1'
        if (!isLoopback) {
          return json(403, { ok: false, error: '该接口仅允许本机访问' })
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
          // 不回显 e.message：其内容形如 "connect ECONNREFUSED 127.0.0.1:5432"，
          // 等于把本接口变成一个有可读结果的端口扫描器。详情只写进 dev server 日志。
          console.error('[__frame-check] 探测失败:', e?.message || e)
          json(502, { ok: false, error: '探测请求失败（详情见 dev server 日志）', code: e?.code || null })
        }
      })
    },
  }
}

/**
 * 消除 onnxruntime wasm 的重复打包（约 21MB）。
 * onnxruntime-web 里有这么一行兜底逻辑：
 *   new URL("ort-wasm-simd-threaded.jsep.wasm", import.meta.url).href
 * 只有调用方【没有】配置 wasmPaths 时才会走到；本项目在 useWhisperRecorder 中
 * 已显式指向 public/ort/，这份兜底 URL 运行时永远不会被请求。
 * 但 Vite 会静态分析该 new URL 并把 wasm 当 asset 打进 dist/assets —— 与
 * public/ort/ 里那一份内容完全相同，白白多出 21MB。
 * 这里把它改写为指向 public 下已存在的同一文件：产物瘦身，且行为不变。
 */
function dedupeOrtWasm() {
  return {
    name: 'dedupe-ort-wasm',
    // 写盘前剔除：比改写源码里的 new URL 更稳（不依赖上游写法，上游改版也不会失效）
    generateBundle(_opts, bundle) {
      for (const [key, item] of Object.entries(bundle)) {
        if (item.type !== 'asset') continue
        if (!/^ort-wasm-.*\.wasm$/.test(path.basename(item.fileName || key))) continue
        delete bundle[key]
        console.log(
          `[dedupe-ort-wasm] 移除未使用的重复 wasm：${item.fileName}（运行时从 /ort/ 加载，省约 21MB）`,
        )
      }
    },
  }
}

/**
 * 首屏瘦身：把 vendor-ai 从 index.html 的 modulepreload 里摘掉。
 *
 * 背景：vendor-ai（@huggingface/transformers + onnxruntime-web，构建后 828K /
 * gzip 约 217K）只服务于语音转写，由 useWhisperRecorder 在用户按下麦克风时才
 * 动态 import。但 rolldown 会把「入口 chunk 静态链可达」的 chunk 全部写进
 * modulepreload，而 vendor-react 里恰有共享模块静态引用了它——于是每个访客
 * 首屏都要为一个可能永远不会用的功能多下载 217K。
 *
 * 这里只删 <link rel="modulepreload">，不删 chunk 本身：
 * 动态 import 时会按需拉取，功能不受影响。vendor-antd / vendor-react /
 * 入口自身与样式表一律保留（那些是首屏真要用的）。
 */
function trimAiVendorPreload() {
  return {
    name: 'trim-ai-vendor-preload',
    transformIndexHtml: {
      // 必须 post：赶在内置 preload 注入之后再改，enforce 之前会被覆盖
      order: 'post',
      handler(html) {
        const before = (html.match(/rel="modulepreload"/g) || []).length
        const out = html.replace(/\s*<link[^>]*rel="modulepreload"[^>]*vendor-ai[^>]*>/g, '')
        const after = (out.match(/rel="modulepreload"/g) || []).length
        if (before !== after) {
          console.log(
            `[trim-ai-vendor-preload] 移除 vendor-ai 首屏预加载（modulepreload ${before} → ${after}，省约 217K gzip）`,
          )
        }
        return out
      },
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
        import.meta.dirname,
        'packages/@myorg/react-svg-charts/src/index.js',
      ),
      '@myorg/react-svg-charts/style.css': path.resolve(
        import.meta.dirname,
        'packages/@myorg/react-svg-charts/src/Charts.scss',
      ),
    },
  },
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
      // 排除预构建依赖和 node_modules（已编译，Babel 处理大文件会超时导致 ERR_EMPTY_RESPONSE）
      // src/creative/ 是纯 canvas 算法模块：无 React / 无 JSX / 无 hooks，
      // 过 React Compiler 属于纯开销（构建期 babel transform 调用里它独占 94 次）
      exclude: [/node_modules/, /[\\/]src[\\/]creative[\\/]/],
    }),
    embedHelpers(),
    serveOrtAssets(),
    serveLocalMedia(),
    serveAstroData(),
    serveGeoData(),
    serveOceanData(),
    dedupeOrtWasm(),
    trimAiVendorPreload(),
  ],
  server: {
    host: true,
    /**
     * dev 模式预热：server 启动后在空闲线程里预 transform 重页面源码。
     * 痛点：Astro/Geo 看板一个页面要拉起几百个模块，首次点 menu 才现场编译，
     * 表现为「点击后卡 1~3 秒才跳转」。warmup 提前把这段编译做掉，跳转即时。
     */
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/layouts/*.jsx',
        './src/pages/AstroBoard/*.{jsx,scss}',
        './src/pages/GeoBoard/*.{jsx,scss}',
        './src/pages/OceanBoard/*.{jsx,scss}',
      ],
    },
  },
  // 预构建 qiankun（MicroFrontendDemo 点击加载子应用时才动态 import，
  // 不预构建的话首次点击会触发按需优化，dev server 卡住数十秒甚至整页刷新）
  /**
   * worker 打包格式。
   *
   * satellite.js（SGP4 轨道计算，见 src/lib/astro/orbital.js）的 WASM 线程版
   * 内部用了 top-level await（`await import('node:worker_threads')` 判 Node 环境）。
   * Vite 默认把 worker 打成 iife，而 iife 不支持 top-level await，
   * 构建会直接失败：UNSUPPORTED_FEATURE: Top-level await is currently not
   * supported with the 'iife' output format。
   *
   * 'es' 是唯一支持 top-level await 的格式，现代浏览器已全面支持。
   * 注意这是**顶层** WorkerOptions，不在 build 里（放 build.worker 不生效）。
   */
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: [
      'qiankun',
      // antd 生态 + echarts + 路由：不预声明的话，首次访问对应页面才会被发现，
      // 触发「二次预构建 + 整页 reload」——症状就是点 menu 后卡住很久再闪一下重载
      'antd',
      '@ant-design/icons',
      'dayjs',
      'react-router-dom',
      'echarts/core',
      'echarts/charts',
      'echarts/components',
      'echarts/renderers',
    ],
  },
  build: {
    // 关闭 sourcemap 减小产物体积（排查问题时可临时打开）
    sourcemap: false,
    // 单 chunk 超过该值才告警，避免巨型依赖触发噪音
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        /**
         * 构建优化：把体量大、更新频率低的第三方依赖拆成独立 vendor chunk。
         * 好处：① 主业务 chunk 体积大幅下降；② 依赖命中浏览器长效缓存，
         * 业务代码发版时无需重新下载 React/antd/echarts 等；③ 并行下载更快。
         * 仅影响客户端构建（SSR 冒烟走 ssrLoadModule，不经过此分包逻辑）。
         * 注：Vue/Angular 演示已迁至 qiankun 子应用（micro-apps/），主应用不再打包其运行时。
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          // workspace 包（@myorg/*）虽经 node_modules 里的 symlink 解析，但它们是本项目源码。
          // 必须排除：react-core-hooks 里的 useWhisperRecorder 动态依赖 @huggingface/transformers，
          // 一旦这些源码被路径里的 'react' 字样归进 vendor-react，rolldown 就会在
          // vendor-react 与 vendor-ai 之间拉一条静态依赖——首屏平白多下载 828K
          //（gzip 约 217K）为一个「按麦克风才用」的功能。
          if (id.includes('@myorg')) return undefined
          if (id.includes('@ant-design') || id.includes('/antd/') || id.includes('/rc-')) return 'vendor-antd'
          if (id.includes('echarts') || id.includes('zrender')) return 'vendor-echarts'
          if (id.includes('onnxruntime') || id.includes('@huggingface')) return 'vendor-ai'
          if (
            id.includes('react') ||
            id.includes('scheduler') ||
            id.includes('react-dom') ||
            id.includes('react-router')
          ) {
            return 'vendor-react'
          }
          return 'vendor'
        },
      },
    },
  },
})
