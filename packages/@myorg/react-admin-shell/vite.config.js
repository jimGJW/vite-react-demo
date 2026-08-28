import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const BASE_EXTERNALS = [
  'react', 'react-dom',
  'react/jsx-runtime', 'react/jsx-dev-runtime',
  'react-router-dom',
  'antd',
  'antd/es',
  '@ant-design/icons',
  '@ant-design/v5-patch-for-react-19',
  '@myorg/react-core-hooks',
  'antd-form-builder',
  'lodash',
  'onnxruntime-web',
  'prop-types',
]
const EXTERNAL_PREFIXES = ['@huggingface/']

function isExternal(id) {
  if (BASE_EXTERNALS.includes(id)) return true
  for (const p of EXTERNAL_PREFIXES) if (id.startsWith(p)) return true
  if (id.startsWith('antd/')) return true
  if (id.startsWith('@ant-design/')) return true
  return false
}

const BASE_GLOBALS = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react/jsx-runtime': 'jsxRuntime',
  'react/jsx-dev-runtime': 'jsxRuntime',
  'react-router-dom': 'ReactRouterDOM',
  antd: 'antd',
  'antd/es': 'antd',
  '@ant-design/icons': 'AntDesignIcons',
  '@ant-design/v5-patch-for-react-19': 'AntdPatchReact19',
  '@huggingface/transformers': 'Transformers',
  '@myorg/react-core-hooks': 'ReactCoreHooks',
  'antd-form-builder': 'AntdFormBuilder',
  lodash: '_',
  'onnxruntime-web': 'ort',
  'prop-types': 'PropTypes',
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
      name: 'ReactAdminShell',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: isExternal,
      output: {
        hoistTransitiveImports: false,
        inlineDynamicImports: false,
        globals: BASE_GLOBALS,
        assetFileNames: (info) => {
          if (info.name && /\.css$/i.test(info.name)) return 'style.css'
          return 'assets/[name][extname]'
        },
      },
    },
  },
})
