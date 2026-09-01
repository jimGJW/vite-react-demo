import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// 库模式：ESM + CJS 双输出
// peerDependencies（vue / qr-scanner）与动态载入的重依赖（@huggingface/*）均标记为 external
const BASE_EXTERNALS = ['vue', 'qr-scanner']
const EXTERNAL_PREFIXES = ['@huggingface/']

function isExternal(id) {
  if (BASE_EXTERNALS.includes(id)) return true
  for (const p of EXTERNAL_PREFIXES) if (id.startsWith(p)) return true
  return false
}

export default defineConfig({
  plugins: [vue()],
  css: { preprocessorOptions: { scss: { charset: false } } },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.js'),
      name: 'VueCoreComposables',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: isExternal,
      output: {
        hoistTransitiveImports: false,
        globals: {
          vue: 'Vue',
          'qr-scanner': 'QrScanner',
          '@huggingface/transformers': 'Transformers',
        },
        assetFileNames: (info) => {
          if (info.name && /\.css$/i.test(info.name)) return 'style.css'
          return 'assets/[name][extname]'
        },
      },
    },
  },
})
