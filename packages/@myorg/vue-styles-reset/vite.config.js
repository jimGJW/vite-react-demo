import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

// 纯样式包：JS 入口 re-export 一份 CSS，使 ESM/CJS 两种方式引入都会附带编译后的 style.css
// Vue 3 版本：用 @vitejs/plugin-vue 编译 .vue SFC
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
      name: 'VueStylesReset',
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
