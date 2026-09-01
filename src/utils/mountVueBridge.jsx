import { useEffect, useRef } from 'react'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElIcons from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'

/**
 * React → Vue 挂载桥（HOC）
 *
 * 用法一：接收已 resolve 的 Vue 组件（推荐与 React.lazy + import().then 搭配）
 *   const VueComponentsPage = lazy(() =>
 *     import('./VueComponents.vue').then(m => ({ default: mountVueBridge(m.default) }))
 *   )
 *
 * 用法二：传入动态 import 函数（懒加载）
 *   const Page = mountVueBridge(() => import('./Page.vue'))
 *
 * - 注入 Element Plus（中文 locale + 全部图标全局注册）
 * - 卸载时调用 app.unmount() 正确销毁
 * - props 会透传给 Vue 组件
 */
export function mountVueBridge(loaderOrComponent) {
  return function VueBridge(props) {
    const refEl = useRef(null)
    const appRef = useRef(null)

    useEffect(() => {
      let cancelled = false

      // 判断输入类型：
      // 1) 函数 → 作为动态 import loader 调用
      // 2) 有 .then 的对象 → 已 resolve 或 Promise 包装的组件
      // 3) 普通对象 / 函数（组件） → 直接使用
      const resolveComponent = () => {
        if (typeof loaderOrComponent === 'function' && !loaderOrComponent.render && !loaderOrComponent.setup) {
          // 视为 import 加载器函数
          return Promise.resolve(loaderOrComponent()).then((mod) => {
            // 兼容动态 import 返回的 ESM module
            if (mod && typeof mod === 'object' && (mod.default || mod.__esModule)) {
              return mod.default || mod
            }
            return mod
          })
        }
        if (loaderOrComponent && typeof loaderOrComponent === 'object' && typeof loaderOrComponent.then === 'function') {
          // Promise 包装的组件
          return Promise.resolve(loaderOrComponent).then((mod) => {
            if (mod && typeof mod === 'object' && (mod.default || mod.__esModule)) {
              return mod.default || mod
            }
            return mod
          })
        }
        // 直接就是 Vue 组件对象
        return Promise.resolve(loaderOrComponent)
      }

      resolveComponent().then((VueComponent) => {
        if (cancelled || !refEl.current) return
        if (!VueComponent) {
          console.error('[mountVueBridge] 无法解析 Vue 组件:', loaderOrComponent)
          return
        }
        const app = createApp(VueComponent, { ...props })
        app.use(ElementPlus, { locale: zhCn })
        Object.keys(ElIcons).forEach((k) => app.component(k, ElIcons[k]))
        app.mount(refEl.current)
        appRef.current = app
      }).catch((err) => {
        console.error('[mountVueBridge] 加载 Vue 组件失败:', err)
      })

      return () => {
        cancelled = true
        if (appRef.current) {
          try { appRef.current.unmount() } catch { /* ignore */ }
          appRef.current = null
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // props 更新时同步
    useEffect(() => {
      const app = appRef.current
      if (!app) return
      const root = app._instance?.proxy
      if (!root) return
      try {
        Object.assign(root.$.attrs || {}, props)
        const ctxProps = root.$.props
        Object.keys(props).forEach((k) => {
          if (k in ctxProps) ctxProps[k] = props[k]
        })
      } catch { /* ignore */ }
    }, [props])

    return <div className="vue-bridge-root" ref={refEl} />
  }
}

/**
 * 非懒加载版本（直接同步挂载）
 */
export function VueBridgeWrapper({ component: VueComponent, ...props }) {
  const refEl = useRef(null)
  const appRef = useRef(null)

  useEffect(() => {
    if (!refEl.current) return
    const app = createApp(VueComponent, { ...props })
    app.use(ElementPlus, { locale: zhCn })
    Object.keys(ElIcons).forEach((k) => app.component(k, ElIcons[k]))
    app.mount(refEl.current)
    appRef.current = app
    return () => {
      if (appRef.current) {
        try { appRef.current.unmount() } catch { /* ignore */ }
        appRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [VueComponent])

  return <div className="vue-bridge-root" ref={refEl} />
}
