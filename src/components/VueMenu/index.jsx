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

// 懒加载真实 Vue SFC（.vue）组件。
// mountVueBridge 必须在回调内动态 import：它会连带引入 vue + element-plus（约 755KB），
// 而 VueMenu 位于首屏 Layout 中，静态引入会把整个 Vue 运行时塞进入口 chunk。
const VueMenuVueImpl = lazy(async () => {
  const [{ mountVueBridge }, mod] = await Promise.all([
    import('../../utils/mountVueBridge.jsx'),
    import('./VueMenu.vue'),
  ])
  return { default: mountVueBridge(mod.default) }
})

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
