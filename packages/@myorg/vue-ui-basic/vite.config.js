import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// 库模式：ESM + CJS 双输出
// peerDependencies（vue）标记为 external，不打进产物
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
      name: 'VueUiBasic',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        hoistTransitiveImports: false,
        globals: { vue: 'Vue' },
        assetFileNames: (info) => {
          if (info.name && /\.css$/i.test(info.name)) return 'style.css'
          return 'assets/[name][extname]'
        },
      },
    },
  },
})
