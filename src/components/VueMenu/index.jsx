/**
 * VueMenu 入口（React Wrapper · 仅保留薄桥）
 *   - 组件本体已迁移为真实 Vue SFC：./VueMenu.vue
 *   - 此文件仅负责：
 *     · 读取 React Router 路由状态（useNavigate / useLocation）
 *     · 通过 mountVueBridge 挂载 VueMenu.vue
 *  保留此文件路径不变：其它地方 import `../components/VueMenu/index.jsx` 仍有效
 */
import { lazy, Suspense, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { mountVueBridge } from '../../utils/mountVueBridge.jsx'

// 懒加载真实 Vue SFC（.vue）组件
const VueMenuVueImpl = lazy(() =>
  import('./VueMenu.vue').then((mod) => ({
    default: mountVueBridge(mod.default),
  })),
)

export default function VueMenu({ items, collapsed, openKeys, onOpenChange }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const onSelect = useCallback(
    (key) => {
      if (typeof key !== 'string') return
      if (key.startsWith('__sep-')) return
      navigate(key)
    },
    [navigate],
  )

  return (
    <Suspense fallback={<div style={{ padding: 12, color: '#909399' }}>Vue 菜单加载中…</div>}>
      <VueMenuVueImpl
        items={items}
        collapsed={collapsed}
        openKeys={openKeys}
        pathname={pathname}
        onSelect={onSelect}
        onOpenChange={onOpenChange}
      />
    </Suspense>
  )
}
