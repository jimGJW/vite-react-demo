/**
 * mountAngularBridge · React→Angular 挂载桥（HOC）
 *
 * 在 React 组件树中挂载 Angular 22 standalone component。
 *
 * 用法一：接收已 resolve 的 Angular 组件（推荐与 React.lazy + import().then 搭配）
 *   const AngularPage = lazy(() =>
 *     import('./AngularComponents.ts').then(m => ({ default: mountAngularBridge(m.default) }))
 *   )
 *
 * 用法二：传入动态 import 函数（懒加载）
 *   const Page = mountAngularBridge(() => import('./Page.ts'))
 *
 * 原理：
 *   1. React useEffect 中调用 createApplication() 创建 Angular ApplicationRef
 *   2. 用 createComponent() 创建组件实例，挂载到 React 提供的 DOM 容器
 *   3. 通过 componentRef.setInput() 把 React props 传入 Angular 组件 @Input()
 *   4. 卸载时 componentRef.destroy() + appRef.destroy()，防止内存泄漏
 */
import { useEffect, useRef, useState } from 'react'
// 必须先 import @angular/compiler，否则 @angular/platform-browser 的
// PlatformLocation 等 injectable 会报 JIT compilation failed
import '@angular/compiler'
import { createApplication } from '@angular/platform-browser'
import { createComponent } from '@angular/core'

export function mountAngularBridge(loaderOrComponent) {
  return function AngularBridge(props) {
    const refEl = useRef(null)
    const appRef = useRef(null)
    const componentRef = useRef(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
      let cancelled = false

      // 判断输入类型：
      // 1) 函数 → 作为动态 import loader 调用
      // 2) 有 .then 的对象 → 已 resolve 或 Promise 包装的组件
      // 3) 普通对象 → 直接使用（Angular standalone component）
      const resolveComponent = () => {
        if (typeof loaderOrComponent === 'function' && !loaderOrComponent.ɵcmp) {
          return Promise.resolve(loaderOrComponent()).then((mod) => {
            if (mod && typeof mod === 'object' && mod.default) {
              return mod.default
            }
            return mod
          })
        }
        if (loaderOrComponent && typeof loaderOrComponent === 'object' && typeof loaderOrComponent.then === 'function') {
          return Promise.resolve(loaderOrComponent).then((mod) => {
            if (mod && typeof mod === 'object' && mod.default) {
              return mod.default
            }
            return mod
          })
        }
        return Promise.resolve(loaderOrComponent)
      }

      const mount = async () => {
        try {
          const AngularComponent = await resolveComponent()
          if (cancelled || !refEl.current || !AngularComponent) return

          const app = await createApplication({
            providers: [],
          })
          if (cancelled) {
            app.destroy()
            return
          }
          appRef.current = app

          const host = document.createElement('div')
          host.className = 'angular-host'
          refEl.current.appendChild(host)

          const ref = createComponent(AngularComponent, {
            environmentInjector: app.injector,
            hostElement: host,
          })
          app.attachView(ref.hostView)
          componentRef.current = ref

          // 把 React props 注入 Angular 组件 @Input()
          if (props) {
            for (const [key, val] of Object.entries(props)) {
              try {
                ref.setInput(key, val)
              } catch {
                /* 该 prop 不是 @Input，忽略 */
              }
            }
          }
          setLoading(false)
        } catch (err) {
          console.error('[mountAngularBridge] 加载/挂载 Angular 组件失败:', err)
          setError(err)
          setLoading(false)
        }
      }

      mount()

      return () => {
        cancelled = true
        try { componentRef.current?.destroy() } catch { /* noop */ }
        try { appRef.current?.destroy() } catch { /* noop */ }
        componentRef.current = null
        appRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (error) {
      return (
        <div className="angular-bridge-root angular-bridge-error" style={{ width: '100%', padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
          <p>Angular 组件加载失败</p>
          <pre style={{ fontSize: '0.75rem', textAlign: 'left', background: '#fef2f2', padding: '0.75rem', borderRadius: '6px', overflow: 'auto' }}>
            {String(error?.message || error)}
          </pre>
        </div>
      )
    }

    return (
      <div ref={refEl} className="angular-bridge-root" style={{ width: '100%' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'ng-spin 0.6s linear infinite' }} />
            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>正在加载 Angular 组件…</span>
            <style>{`@keyframes ng-spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
      </div>
    )
  }
}
