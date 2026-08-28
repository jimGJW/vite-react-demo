import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const BASE_EXTERNALS = [
  'react', 'react-dom',
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
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
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
