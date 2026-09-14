import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const BASE_EXTERNALS = [
  'react', 'react-dom',
  // react-dom 的子路径必须单独列出：isExternal 用精确匹配（BASE_EXTERNALS.includes），
  // 只写 'react-dom' 不会命中 'react-dom/client'，会导致把整份 React DOM 打进 dist
  // （曾使 dist/index.js 膨胀到 ~805KB，使用方还会出现双 React 副本）。
  'react-dom/client', 'react-dom/server',
  'react/jsx-runtime', 'react/jsx-dev-runtime',
  'qr-scanner',
]
const EXTERNAL_PREFIXES = ['@huggingface/']

function isExternal(id) {
  if (BASE_EXTERNALS.includes(id)) return true
  for (const p of EXTERNAL_PREFIXES) if (id.startsWith(p)) return true
  return false
}

const BASE_GLOBALS = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOMClient',
  'react-dom/server': 'ReactDOMServer',
  'react/jsx-runtime': 'jsxRuntime',
  'react/jsx-dev-runtime': 'jsxRuntime',
  'qr-scanner': 'QrScanner',
  '@huggingface/transformers': 'Transformers',
}

function baseOutput(extraGlobals = {}) {
  return {
    hoistTransitiveImports: false,
    inlineDynamicImports: false,
    globals: { ...BASE_GLOBALS, ...extraGlobals },
    assetFileNames: (info) => {
      if (info.name && /\.css$/i.test(info.name)) return 'style.css'
      return 'assets/[name][extname]'
    },
    // 手动分 chunk：不要把 @huggingface 这种 peer 的动态 import 打进 dist（外部使用方自己解析）
    manualChunks(id) {
      if (id.includes('@huggingface')) return false  // external（isExternal 会处理，但显式阻止打 chunk）
      return undefined
    },
  }
}

export default defineConfig({
  plugins: [react({ include: '**/*.{jsx,js,tsx,ts}' })],
  css: { preprocessorOptions: { scss: { charset: false } } },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.js'),
      name: 'ReactCoreHooks',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: isExternal,
      output: baseOutput(),
    },
  },
})
