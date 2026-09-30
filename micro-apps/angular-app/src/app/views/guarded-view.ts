import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService, ToastService } from '../core'
import { GUARD_REGISTRY } from '../core/guards'
import type { MonitorSnapshot } from '../core/resolvers'
import { formatDate } from '../../utils'

/**
 * 受保护页面 —— 同时演示 `canActivate` 守卫 + `ResolveFn` 解析器
 *
 * `snapshot` 这个 input 的值不是父组件传的，而是 `monitorResolver` 在**导航激活前**
 * push 进来的（经 `withComponentInputBinding()` 绑定）。
 * 好处：组件第一帧就有数据，没有"先白屏再 loading"的抖动。
 */
@Component({
  selector: 'ng-guarded-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ng-page">
      <header class="ng-header">
        <h1>受保护页面 / Guarded</h1>
        <p class="ng-subtitle">
          本路由同时挂了 <code>canActivate: [authGuard]</code> 与
          <code>resolve: snapshot → monitorResolver</code>（导航激活前先把数据取回来）。
        </p>
      </header>

      <section class="ng-card">
        <h2>① 当前会话</h2>
        <div class="ng-row">
          <span class="ng-chip ng-chip--ok">已登录：{{ auth.name() }}</span>
          <code class="ng-code">token = {{ auth.token() }}</code>
          <button class="ng-btn ng-btn--danger" type="button" (click)="logout()">
            退出登录（再进来会被拦截）
          </button>
        </div>
        <p class="ng-desc">
          登录态存在 <code>AuthService</code>（<code>providedIn: 'root'</code> 单例 + localStorage 持久化），
          所以守卫在组件创建之前就能读到它。
        </p>
      </section>

      <section class="ng-card">
        <h2>② 解析器预取的数据</h2>
        @if (snapshot(); as snap) {
          <div class="ng-row">
            <span class="ng-chip ng-chip--info">机房总数 {{ snap.total }}</span>
            <span class="ng-chip ng-chip--danger">告警合计 {{ snap.alarms }}</span>
            <span class="ng-chip">预取于 {{ fetchedAtText() }}</span>
          </div>
          <table class="ng-table">
            <thead>
              <tr><th>#</th><th>城市</th><th>机房</th><th>告警</th><th>负责人</th><th>状态</th></tr>
            </thead>
            <tbody>
              @for (row of snap.cities; track row.id) {
                <tr>
                  <td>{{ row.id }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.rooms }}</td>
                  <td>{{ row.alarms }}</td>
                  <td>{{ row.owner }}</td>
                  <td>
                    <span class="ng-chip" [class]="'ng-chip--' + toneOf(row.status)">{{ statusText(row.status) }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="ng-desc">解析器没有返回数据（理论上不会发生，除非你把 resolve 摘掉）。</p>
        }
      </section>

      <section class="ng-card">
        <h2>③ 守卫 / 解析器清单</h2>
        <ul class="ng-list">
          @for (g of guards; track g.name) {
            <li><code class="ng-code">{{ g.name }}</code> · {{ g.kind }} —— {{ g.desc }}</li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .ng-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
    .ng-code {
      font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
      color: #4f46e5; background: #eef2ff; padding: 2px 7px; border-radius: 4px;
    }
    .ng-list { margin: 0; padding-left: 18px; font-size: 12.5px; color: #4b5563; line-height: 2; }
  `],
})
export class GuardedView {
  readonly auth = inject(AuthService)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)

  /** 由 monitorResolver 预取后经 withComponentInputBinding 注入 */
  readonly snapshot = input<MonitorSnapshot | null>(null)
  readonly guards = GUARD_REGISTRY

  readonly fetchedAtText = computed(() => {
    const at = this.snapshot()?.fetchedAt
    return at ? formatDate(new Date(at), 'HH:mm:ss') : '—'
  })

  toneOf(status: string) {
    return status === 'ok' ? 'ok' : status === 'alarm' ? 'danger' : ''
  }
  statusText(status: string) {
    return status === 'ok' ? '正常' : status === 'alarm' ? '告警' : '离线'
  }

  logout() {
    this.auth.logout()
    this.toast.warn('已退出登录。守卫会在下次进入 /guarded 时拦截 → 跳登录页')
    // 直接去登录页并带上回跳地址 —— 这正是 authGuard 拦截时会产生的结果
    this.router.navigate(['/login'], { queryParams: { redirect: '/guarded' } })
  }
}
