import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'

// Vue 3 子应用（qiankun）。独立 dev 用 `npm run dev`（端口 7101）；
// 被主应用加载时由 qiankun 拉取本服务 HTML 入口，sandbox 默认开启即可。
export default defineConfig({
  plugins: [vue(), qiankun('vue-app', { useDevMode: true })],
  server: {
    port: 7101,
    host: true,
    cors: true,
  },
  base: '/',
})
