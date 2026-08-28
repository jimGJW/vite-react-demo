import './index.scss'

function About() {
  return (
    <div className="page-card">
      <h1>关于页面</h1>
      <p>
        这是一个标准的 React 项目脚手架示例,集成了路由、布局和多页面结构,可以作为你后续开发的起点。
      </p>

      <h2>技术栈</h2>
      <ul>
        <li><strong>React 19</strong> - 核心 UI 库</li>
        <li><strong>React Router 7</strong> - 前端路由</li>
        <li><strong>Vite 8</strong> - 构建工具</li>
        <li><strong>ESLint</strong> - 代码规范</li>
      </ul>

      <h2>目录结构</h2>
      <pre className="about-structure">
{`src/
├── layouts/     # 布局组件
├── pages/       # 页面组件（每个页面独立文件夹）
├── App.jsx      # 路由入口
├── main.jsx     # 应用入口
└── index.scss    # 全局样式`}
      </pre>
    </div>
  )
}

export default About