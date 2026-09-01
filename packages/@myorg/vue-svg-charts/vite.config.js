import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// 库模式：ESM + CJS 双输出；SCSS 自动编译为 dist/style.css
// 对外 peerDependencies vue 标记为 external，不打进产物
export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: { charset: false },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'VueSvgCharts',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        assetFileNames: (info) => {
          if (info.name && /\.css$/i.test(info.name)) return 'style.css'
          return 'assets/[name][extname]'
        },
      },
    },
  },
})
