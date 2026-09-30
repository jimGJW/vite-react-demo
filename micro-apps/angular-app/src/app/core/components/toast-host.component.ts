import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ToastService } from '../services/toast.service'

/**
 * ToastHostComponent —— 提示队列渲染宿主
 *
 * 官方用法要点：AppComponent 里放一次 `<ng-toast-host />`，
 * 任意组件 inject(ToastService).success('...') 就能弹提示。
 * 这是 Angular「服务 + 单一宿主组件」模式，对比 React 的 Portal / Vue 的 Teleport。
 */
@Component({
  selector: 'ng-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ng-toasts">
      @for (t of toast.items(); track t.id) {
        <div [class]="'ng-toast ng-toast--' + t.type" (click)="toast.dismiss(t.id)">
          <span class="ng-toast__icon">{{ ICONS[t.type] }}</span>
          <span class="ng-toast__text">{{ t.text }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .ng-toasts {
      position: fixed; right: 18px; bottom: 18px; z-index: 9999;
      display: flex; flex-direction: column; gap: 8px; align-items: flex-end;
      pointer-events: none;
    }
    .ng-toast {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 14px; border-radius: 8px; cursor: pointer;
      background: #111827; color: #fff; font-size: 12.5px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
      pointer-events: auto; animation: ng-toast-in 0.22s ease;
    }
    @keyframes ng-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .ng-toast--success { background: #16a34a; }
    .ng-toast--warn { background: #d97706; }
    .ng-toast--error { background: #dc2626; }
    .ng-toast--info { background: #4b5563; }
    .ng-toast__icon { font-size: 12px; }
  `],
})
export class ToastHostComponent {
  readonly toast = inject(ToastService)
  readonly ICONS: Record<string, string> = { info: 'ℹ', success: '✓', warn: '!', error: '✕' }
}
