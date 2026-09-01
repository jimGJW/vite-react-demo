import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 忽略根目录与各子包的构建产物（dist / dist-local 不参与 lint）
  // 同时忽略 .vue 文件（由 Vite + Vue SFC 编译器处理，eslint 原生不支持 SFC 语法）
  globalIgnores(['dist', 'dist-local', 'packages/**/dist', 'packages/**/dist-local', '**/*.vue']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // vite.config.js 运行在 Node 环境（__dirname 等）
  {
    files: ['**/vite.config.js', 'eslint.config.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  // 图表共享层：刻意的「工具函数 + 通用组件」混合模块（src 与包双副本维护，
  // 拆分会导致两份代码长期不同步），此处豁免 fast refresh 单文件导出限制
  {
    files: [
      'src/components/Charts/shared.jsx',
      'packages/@myorg/react-svg-charts/src/shared.jsx',
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  // 跨框架桥接 / 上下文等「组件 + Hook/函数」混合模块，豁免 fast refresh 单文件导出限制
  {
    files: [
      'src/utils/mountVueBridge.jsx',
      'src/contexts/StyleModeContext.jsx',
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
