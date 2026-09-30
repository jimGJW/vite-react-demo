import { Injectable, signal } from '@angular/core'
import { sleep } from '../../../utils'

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  finished: boolean
}

export interface CityRow {
  id: number
  name: string
  rooms: number
  alarms: number
  owner: string
  status: 'ok' | 'alarm' | 'offline'
  updatedAt: string
}

/**
 * MockApiService —— 模拟后端 HTTP 层
 *
 * 真项目里这里会是 HttpClient：`this.http.get<CityRow[]>('/api/cities')`。
 * 本子应用不引入 @angular/common/http 的真实后端，改用 Promise + 随机延迟，
 * 但**接口形态（Promise / 分页 / 取消 / 错误率）与真实 HttpClient 保持一致**，
 * 这样 UI 层的 loading / error / 空态逻辑将来可以原样迁移。
 */
@Injectable({ providedIn: 'root' })
export class MockApiService {
  /** 请求日志：演示层用它展示"接口调用轨迹" */
  readonly requestLog = signal<{ method: string; url: string; ms: number; ok: boolean }[]>([])
  /** 全局 loading 计数（并发请求时只有归零才算结束） */
  readonly pending = signal(0)

  private log(method: string, url: string, ms: number, ok: boolean) {
    this.requestLog.update((l) => [{ method, url, ms, ok }, ...l].slice(0, 16))
  }

  /** 统一的请求包装：延迟 + pending 计数 + 日志 */
  private async request<T>(method: string, url: string, data: T, latency = 400, failRate = 0): Promise<T> {
    this.pending.update((n) => n + 1)
    const started = Date.now()
    try {
      await sleep(latency)
      if (failRate > 0 && Math.random() < failRate) {
        throw new Error(`${method} ${url} → 500 Internal Server Error`)
      }
      this.log(method, url, Date.now() - started, true)
      return data
    } catch (e) {
      this.log(method, url, Date.now() - started, false)
      throw e
    } finally {
      this.pending.update((n) => n - 1)
    }
  }

  /* —— 城市监控列表 —— */
  private readonly CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州', '天津', '重庆']
  private readonly OWNERS = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵磊']
  private readonly STATUSES: CityRow['status'][] = ['ok', 'alarm', 'offline']

  /** 造一批稳定的伪随机数据（同一 id 每次结果一致，避免 UI 抖动） */
  private makeCities(): CityRow[] {
    return this.CITIES.map((name, i) => ({
      id: i + 1,
      name,
      rooms: 40 + ((i * 17) % 260),
      alarms: (i * 7) % 14,
      owner: this.OWNERS[i % this.OWNERS.length],
      status: this.STATUSES[i % this.STATUSES.length],
      updatedAt: new Date(Date.now() - i * 3600_000).toISOString(),
    }))
  }

  getCities({ latency = 500, failRate = 0 } = {}) {
    return this.request('GET', '/api/cities', this.makeCities(), latency, failRate)
  }

  /** 分页拉取（触底加载 / 表格分页共用） */
  async getCitiesPage(page: number, pageSize = 6, { latency = 450 } = {}): Promise<Paginated<CityRow>> {
    const all = this.makeCities()
    const start = (page - 1) * pageSize
    const items = all.slice(start, start + pageSize)
    const result = await this.request('GET', `/api/cities?page=${page}&size=${pageSize}`, {
      items, total: all.length, page, pageSize, finished: start + items.length >= all.length,
    }, latency)
    return result
  }

  /** 保存（POST）：回传服务端补全后的实体 */
  async saveCity(payload: Partial<CityRow>) {
    const saved: CityRow = {
      id: payload.id ?? Date.now(),
      name: payload.name ?? '未命名',
      rooms: payload.rooms ?? 0,
      alarms: payload.alarms ?? 0,
      owner: payload.owner ?? '-',
      status: payload.status ?? 'ok',
      updatedAt: new Date().toISOString(),
    }
    return this.request('POST', '/api/cities', saved, 520)
  }

  /** 删除（DELETE） */
  async deleteCity(id: number) {
    return this.request('DELETE', `/api/cities/${id}`, { ok: true })
  }

  /** 模拟"不稳定的接口"，用于演示 retry() 与错误态 UI */
  async flaky<T>(payload: T, failRate = 0.6) {
    return this.request('GET', '/api/flaky', payload, 300, failRate)
  }

  get totalPending() { return this.pending() }
}
