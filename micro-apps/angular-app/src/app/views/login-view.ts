import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { AuthService, ToastService } from '../core'
import { GUARD_REGISTRY } from '../core/guards'

/**
 * 登录页 —— 与 `authGuard` 配套
 *
 * `redirect` 这个 `input()` 的值来自 URL 的 `?redirect=`：
 * `withComponentInputBinding()` 会把**路由参数 / query 参数 / data** 一并绑到同名 input 上，
 * 所以不需要手工读 `ActivatedRoute`。
 */
@Component({
  selector: 'ng-login-view',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ng-page">
      <header class="ng-header">
        <h1>登录 / Login</h1>
        <p class="ng-subtitle">
          被 <code>authGuard</code> 拦截后会带 <code>?redirect=</code> 跳到这里，登录成功再跳回原页面。
        </p>
      </header>

      <section class="ng-card">
        <h2>① 会话</h2>
        <div class="ng-row">
          <span class="ng-label">用户名</span>
          <input class="ng-input" [(ngModel)]="name" placeholder="随便填，演示用" style="max-width: 240px" />
        </div>
        <div class="ng-row">
          <span class="ng-label">回跳地址</span>
          <code class="ng-code">{{ redirect() || '（无，登录后回首页）' }}</code>
        </div>
        <div class="ng-row">
          <button class="ng-btn ng-btn--primary" type="button" (click)="submit()">登录并跳回</button>
          <button class="ng-btn" type="button" (click)="fillDemo()">填入示例账号</button>
          <span class="ng-chip ng-chip--info" [class]="auth.isLoggedIn() ? 'ng-chip ng-chip--ok' : 'ng-chip'">
            {{ auth.isLoggedIn() ? '已登录：' + auth.name() : '当前未登录' }}
          </span>
        </div>
      </section>

      <section class="ng-card">
        <h2>② 本应用的路由守卫 / 解析器</h2>
        <table class="ng-table">
          <thead>
            <tr><th>名称</th><th>类型</th><th>作用</th></tr>
          </thead>
          <tbody>
            @for (g of guards; track g.name) {
              <tr>
                <td><code class="ng-code">{{ g.name }}</code></td>
                <td><span class="ng-chip ng-chip--info">{{ g.kind }}</span></td>
                <td>{{ g.desc }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section class="ng-card">
        <h2>③ 守卫工作原理</h2>
        <ol class="ng-notes">
          <li>路由表给 <code>/guarded</code> 加上 <code>canActivate: [authGuard]</code>。</li>
          <li>守卫是普通函数，用 <code>inject(AuthService)</code> 读全局单例登录态（此刻还没有组件实例）。</li>
          <li>未登录 → 返回 <code>UrlTree</code>（<code>router.createUrlTree</code> 指向 <code>/login</code> 并带上 redirect query），导航被改道。</li>
          <li>登录写入 token（localStorage 持久化）→ <code>navigateByUrl(redirect)</code> 放行。</li>
        </ol>
      </section>
    </div>
  `,
  styles: [`
    .ng-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
    .ng-label { font-size: 12.5px; color: #6b7280; width: 76px; }
    .ng-code {
      font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
      color: #4f46e5; background: #eef2ff; padding: 2px 7px; border-radius: 4px;
    }
    .ng-notes { margin: 0; padding-left: 18px; font-size: 12.5px; color: #4b5563; line-height: 1.95; }
    .ng-notes code {
      font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
      color: #4f46e5; background: #eef2ff; padding: 1px 5px; border-radius: 3px;
    }
  `],
})
export class LoginView {
  readonly auth = inject(AuthService)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)

  /** 由 `withComponentInputBinding()` 从 ?redirect= 注入 */
  readonly redirect = input('')
  readonly name = signal('demo-user')
  readonly guards = GUARD_REGISTRY

  fillDemo() { this.name.set('demo-user') }

  submit() {
    const session = this.auth.login(this.name())
    this.toast.success(`已登录为「${session.name}」`)
    this.router.navigateByUrl(this.redirect() || '/components')
  }
}
