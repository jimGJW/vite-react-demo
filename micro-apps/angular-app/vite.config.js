import { defineConfig } from 'vite'
import angular from '@analogjs/vite-plugin-angular'
import qiankun from 'vite-plugin-qiankun'

// Angular 子应用（qiankun）。使用 @analogjs/vite-plugin-angular（Angular 官方 build 内核的 Vite 集成）
// 作为独立 dev 服务，端口 7102；被主应用加载时由 qiankun 拉取本服务 HTML 入口。
// 注意：Angular 依赖 zone.js 全局 patch，主应用加载本子应用时须关闭 qiankun JS 沙箱（见主应用 config.js）。
export default defineConfig({
  plugins: [angular({ tsConfig: './tsconfig.app.json' }), qiankun('angular-app', { useDevMode: true })],
  server: {
    port: 7102,
    host: true,
    cors: true,
  },
  base: '/',
})
