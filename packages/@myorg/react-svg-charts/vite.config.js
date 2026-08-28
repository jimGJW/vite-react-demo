import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// 库模式：ESM + CJS 双输出；SCSS 自动编译为 dist/style.css
// 对外 peerDependencies react / react-dom 标记为 external，不打进产物
export default defineConfig({
  plugins: [
    react({
      // 允许 .jsx 被 Babel 处理
      include: '**/*.{jsx,js,tsx,ts}',
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // shared.jsx 里 import  './Charts.scss'，这里不额外配置 charset
        charset: false,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    // 输出到 dist/
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    // 库模式
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'ReactSvgCharts',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      output: {
        // react / react-dom 作为 peerDeps，使用方注入
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'react/jsx-dev-runtime': 'jsxRuntime',
        },
        // 所有非 JS 资源（CSS）合并到 dist/style.css（vite 默认已做）
        assetFileNames: (info) => {
          if (info.name && /\.css$/i.test(info.name)) return 'style.css'
          return 'assets/[name][extname]'
        },
      },
    },
  },
})
