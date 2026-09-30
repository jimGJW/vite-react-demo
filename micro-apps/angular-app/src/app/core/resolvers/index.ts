import { inject } from '@angular/core'
import { type ResolveFn } from '@angular/router'
import { MockApiService, type CityRow } from '../services/mock-api.service'

export interface MonitorSnapshot {
  cities: CityRow[]
  total: number
  alarms: number
  fetchedAt: string
}

/**
 * 函数式解析器（`ResolveFn`）
 *
 * 与守卫的区别：
 * - **守卫**回答"能不能进"（返回 true/false/UrlTree）
 * - **解析器**回答"进去之前先把数据准备好"——路由激活前 push 数据，组件创建时数据已在手
 *
 * 好处：组件里不再有 `loading` 首屏白屏，模板可以直接渲染；
 * 拿到数据的方式是 `withComponentInputBinding()` 把它绑成组件 `input()`。
 */
export const monitorResolver: ResolveFn<MonitorSnapshot> = async () => {
  const api = inject(MockApiService)
  const cities = await api.getCities({ latency: 600 })
  return {
    cities,
    total: cities.length,
    alarms: cities.reduce((s, c) => s + c.alarms, 0),
    fetchedAt: new Date().toISOString(),
  }
}
