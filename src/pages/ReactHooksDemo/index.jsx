import { Tabs } from 'antd'
import ContextCase from './ContextCase.jsx'
import ApiBasics from './ApiBasics.jsx'
import NewFeatures from './NewFeatures.jsx'
import './index.scss'

const CORE_APIS = [
  { name: 'createContext', desc: '创建跨层数据通道' },
  { name: 'useContext', desc: '订阅并读取上下文' },
  { name: 'useMemo', desc: '缓存计算结果与引用' },
  { name: 'useCallback', desc: '稳定函数引用' },
]

export default function ReactHooksDemo() {
  const items = [
    { key: 'case', label: '① 四件套综合案例', children: <ContextCase /> },
    { key: 'basics', label: '② 逐个 API 讲解', children: <ApiBasics /> },
    { key: 'features', label: '③ React 19 新特性', children: <NewFeatures /> },
  ]

  return (
    <div className="rh-page">
      <header className="rh-page__header">
        <h1>React 核心 API 与 19 新特性</h1>
        <p className="rh-page__lead">
          一页跑通 <b>Context 跨层传值</b> 与 <b>渲染性能</b> 的关键组合，再跟进 React 19 的新玩具。
          所有演示都带「渲染计数」徽标与「使用方法」代码，结论可以自己动手复现，而不是背文档。
        </p>

        <div className="rh-page__apis">
          {CORE_APIS.map((api) => (
            <span key={api.name} className="rh-api-pill">
              <code>{api.name}</code>
              <em>{api.desc}</em>
            </span>
          ))}
        </div>
      </header>

      <Tabs className="rh-page__tabs" items={items} />
    </div>
  )
}
