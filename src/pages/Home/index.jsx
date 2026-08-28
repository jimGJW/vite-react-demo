import { useState } from 'react'
import { Link } from 'react-router-dom'
import StarArray from '../../components/StarArray/StarArray.jsx'
import './index.scss'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <div className="page-card">
      <h1>欢迎来到首页</h1>
      <p>这是一个使用 Vite + React + React Router 搭建的示例项目。</p>

      <div className="home-counter">
        <button
          type="button"
          className="btn"
          onClick={() => setCount((c) => c + 1)}
        >
          点击计数: {count}
        </button>
      </div>

      <p>
        你可以点击顶部导航切换到 <Link to="/about">关于</Link> 或{' '}
        <Link to="/dashboard">控制台</Link> 页面。
      </p>

      <ul>
        <li>React 19</li>
        <li>React Router 7</li>
        <li>Vite 8</li>
      </ul>

      {/* 周天星辰大阵：365 颗真实恒星 */}
      <StarArray />
    </div>
  )
}

export default Home
