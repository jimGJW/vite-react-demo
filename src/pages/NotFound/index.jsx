import { Link } from 'react-router-dom'
import './index.scss'

function NotFound() {
  return (
    <div className="page-card not-found-card">
      <h1 className="not-found-code">404</h1>
      <h2>页面未找到</h2>
      <p>你访问的页面不存在,请检查 URL 是否正确。</p>
      <Link to="/" className="btn">
        返回首页
      </Link>
    </div>
  )
}

export default NotFound