import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import { MENU_ITEMS, routeLog } from '../view-state'

/**
 * 404 视图 —— 由路由表 `**` 通配兜底（官方 Router 的 catchAll）
 *
 * 常见踩坑：主应用侧边栏菜单里的 path 写成了宿主页路径（如 /micro-angular），
 * 而子应用内部只认自己的路由（如 /components）。本页把「已注册路由」列出来，
 * 一眼就能看出协议对不上。
 */
@Component({
  selector: 'app-not-found-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf">
      <div class="nf__code">404</div>
      <h1 class="nf__title">页面不存在</h1>
      <p class="nf__desc">
        子应用路由未匹配到 <code>{{ current }}</code>。
        这通常说明主应用侧边栏菜单的 path 与子应用路由不一致（典型：写成
        <code>/micro-angular</code> 而不是子应用内部的 <code>/components</code>）。
      </p>

      <div class="nf__panel">
        <div class="nf__panel-title">已注册路由（{{ menu.length }} 条）</div>
        <div class="nf__chips">
          @for (m of menu; track m.path) {
            <button
              class="nf__chip"
              [class.is-active]="m.path === current"
              (click)="go(m.path)"
            >{{ m.path }}</button>
          }
        </div>
      </div>

      <div class="nf__panel">
        <div class="nf__panel-title">最近路由轨迹（Router 事件记录）</div>
        <ul class="nf__log">
          @for (l of logs; track $index) {
            <li><span>{{ l.url }}</span><em>{{ l.at }}</em></li>
          } @empty {
            <li class="nf__empty">暂无记录</li>
          }
        </ul>
      </div>

      <div class="nf__actions">
        <button class="ng-btn ng-btn--primary" (click)="go('/components')">回到首页（组件与模板）</button>
        <button class="ng-btn" (click)="back()">返回上一页</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .nf { padding: 24px 4px 40px; max-width: 640px; }
    .nf__code {
      font-size: 72px; font-weight: 800; line-height: 1;
      background: linear-gradient(135deg, #6366f1, #ec4899);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .nf__title { margin: 6px 0 8px; font-size: 20px; color: #111827; }
    .nf__desc { margin: 0 0 18px; font-size: 13px; color: #9ca3af; line-height: 1.9; }
    .nf__panel { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; background: #fff; margin-bottom: 14px; }
    .nf__panel-title { font-size: 12.5px; font-weight: 600; color: #4b5563; margin-bottom: 10px; }
    .nf__chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .nf__chip {
      border: 1px solid #d1d5db; border-radius: 999px; background: #fff;
      padding: 3px 12px; font-size: 12px; color: #4b5563; cursor: pointer;
      font-family: 'SF Mono', Monaco, monospace;
    }
    .nf__chip:hover { border-color: #6366f1; color: #6366f1; }
    .nf__chip.is-active { background: #eef2ff; border-color: #6366f1; color: #6366f1; }
    .nf__log { list-style: none; margin: 0; padding: 0; font-size: 12px; }
    .nf__log li { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-bottom: 1px dashed #f3f4f6; font-family: 'SF Mono', Monaco, monospace; color: #4b5563; }
    .nf__log em { font-style: normal; color: #d1d5db; }
    .nf__empty { justify-content: center; color: #d1d5db; }
    .nf__actions { display: flex; gap: 10px; }
  `],
})
export class NotFoundView {
  private readonly router = inject(Router)
  readonly menu = MENU_ITEMS
  readonly current = this.router.url
  readonly logs = routeLog.map((l) => ({ url: l.url, at: l.at.toLocaleTimeString('zh-CN', { hour12: false }) }))

  go(path: string) {
    void this.router.navigateByUrl(path)
  }
  back() {
    history.back()
  }
}
