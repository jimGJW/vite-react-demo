/* SSR 渲染冒烟：借 Vite 的 SSR 管线把页面真实渲染一遍，验证「模块能加载 + 组件树能挂 + 关键内容在位」。
   ── 补的正是 vite build 的盲区：build 只做静态编译，跑不出 Hook 误用、Context 缺失、
      SSR 期访问浏览器 API 这类运行时问题。
   跑法：npm run test:ssr
   新增页面时在 targets 里追加一行；仅适合不依赖浏览器专属 API（window / document 直用）的页面。 */
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

const targets = [
  [
    'ReactHooksDemo 主页',
    '/src/pages/ReactHooksDemo/index.jsx',
    ['React 核心 API 与 19 新特性', 'createContext', 'useContext', 'useMemo', 'useCallback'],
  ],
  [
    'ContextCase 综合案例',
    '/src/pages/ReactHooksDemo/ContextCase.jsx',
    ['第 1 层', '第 2 层', '第 3 层', 'memo 挡得住 props'],
  ],
  [
    'ApiBasics 逐个 API',
    '/src/pages/ReactHooksDemo/ApiBasics.jsx',
    ['createContext 使用方法', 'useContext 使用方法', 'useMemo 使用方法', 'useCallback 使用方法', '已渲染'],
  ],
  [
    'NewFeatures 新特性',
    '/src/pages/ReactHooksDemo/NewFeatures.jsx',
    ['useOptimistic', 'useActionState', 'useDeferredValue', 'useSyncExternalStore', 'useEffectEvent', 'ref 现在就是一个普通 prop'],
  ],
]

let failed = 0
for (const [name, path, expects] of targets) {
  try {
    const mod = await server.ssrLoadModule(path)
    const html = renderToString(createElement(mod.default))
    const missing = expects.filter((token) => !html.includes(token))
    if (missing.length) {
      failed += 1
      console.log(`✗ ${name} — HTML ${html.length} 字符，缺失内容: ${missing.join(' / ')}`)
    } else {
      console.log(`✓ ${name} — HTML ${html.length} 字符，${expects.length} 项内容断言通过`)
    }
  } catch (err) {
    failed += 1
    console.log(`✗ ${name} — ${err.message.split('\n')[0]}`)
  }
}

await server.close()
console.log(failed === 0 ? '\nSSR 冒烟全部通过' : `\n有 ${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
