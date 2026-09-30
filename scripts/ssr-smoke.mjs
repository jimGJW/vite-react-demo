/* SSR 渲染冒烟：借 Vite 的 SSR 管线把页面真实渲染一遍，验证「模块能加载 + 组件树能挂 + 关键内容在位」。
   ── 补的正是 vite build 的盲区：build 只做静态编译，跑不出 Hook 误用、Context 缺失、
      SSR 期访问浏览器 API 这类运行时问题。
   跑法：npm run test:ssr
   新增页面时在 targets 里追加一行；仅适合不依赖浏览器专属 API（window / document 直用）的页面。 */
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

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
  /* 创意分组三页：都是 canvas + rAF 的重交互页，SSR 能否安全渲染是首要回归点
     （window / document 只能出现在 effect 或事件回调里）。
     第 4 项 opts.router=true 表示该页内部用了 <Link>/<NavLink>，得套一层 MemoryRouter 才能脱离路由树渲染。 */
  [
    'CreativeLab 创意实验室',
    '/src/pages/CreativeLab/index.jsx',
    ['创意实验室', '粒子星轨', '打字机', '聚光卡片', '3D 翻转卡片', '涟漪按钮', '磁性按钮'],
    { router: true },
  ],
  [
    'DataVizLab 可视化实验室',
    '/src/pages/DataVizLab/index.jsx',
    ['可视化实验室', '力导向关系图', '螺旋词云', '热力矩阵', '拖动任一节点可手动摆位'],
  ],
  [
    'OrbitLab 星际轨道',
    '/src/pages/OrbitLab/index.jsx',
    /* 后三项是把「数据来自 Python 生成器」钉在回归里：一旦哪天把 ORBIT_DATA 换成手写常量就会红 */
    ['星际轨道', '开普勒', '已锁定', '地球', '偏心率', '回到历元', 'orbit-data.py', 'JPL', '日心距'],
  ],
  [
    'Playground 创意 Playground',
    '/src/pages/Playground/index.jsx',
    /* 钉住全部 7 个分组标题 + 每组抽一个 demo、以及数据来源：
       防止「页面还在，但 demo 列表被清空 / 分组表写歪 / 换成占位符」。
       注意不能断言「82 个 · 7 组」这种跨文本节点的串 —— renderToString 会在中间插 <!-- --> */
    ['创意 Playground', '全部 demo', '场与流体', '元胞自动机与自组织', '天体与力学',
      '几何与图案', '粒子与渲染', '分形与数学', '数值与优化',
      '流场丝绸', '鸟群 Boids', '反应扩散图灵斑图', '兰顿蚂蚁', '分形山脉',
      '曼德博集合', '弹簧布料', 'src/creative/', '重播',
      '烟雾平流', '卡门涡街', '极光', '森林火灾', '霍曼转移轨道', '交通流与幽灵堵车',
      '希尔伯特曲线', '莫尔条纹', '光线步进', '半调网点', '牛顿分形', '逻辑斯蒂映射与倍周期',
      '排序算法可视化', '插值 vs 拟合', '幂迭代求主特征值', '蚁群算法解 TSP', '地形剖切'],
  ],
]

let failed = 0
for (const [name, path, expects, opts] of targets) {
  try {
    const mod = await server.ssrLoadModule(path)
    const page = createElement(mod.default)
    const html = renderToString(opts?.router ? createElement(MemoryRouter, null, page) : page)
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
