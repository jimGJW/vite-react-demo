import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'

/**
 * ProgressRingComponent —— 环形进度（SVG 描边 + ng-content 浮层）
 *
 * 官方用法要点：投影内容用 `<ng-content>`（等价 Vue 的 `<slot />`）。
 */
@Component({
  selector: 'ng-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ng-ring" [style.width.px]="size()" [style.height.px]="size()">
      <svg [attr.viewBox]="'0 0 ' + size() + ' ' + size()" class="ng-ring__svg">
        <circle
          [attr.cx]="half()" [attr.cy]="half()" [attr.r]="radius()"
          fill="none" [attr.stroke]="trackColor" [attr.stroke-width]="stroke()"
        />
        <circle
          [attr.cx]="half()" [attr.cy]="half()" [attr.r]="radius()"
          fill="none" [attr.stroke]="strokeColor()" [attr.stroke-width]="stroke()"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="dashOffset()"
          [attr.transform]="'rotate(-90 ' + half() + ' ' + half() + ')'"
          class="ng-ring__bar"
        />
      </svg>
      <div class="ng-ring__overlay">
        <ng-content>
          <span class="ng-ring__value">{{ percent() }}%</span>
        </ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }
    .ng-ring { position: relative; display: inline-flex; }
    .ng-ring__svg { width: 100%; height: 100%; display: block; }
    .ng-ring__bar { transition: stroke-dashoffset 0.45s ease; }
    .ng-ring__overlay {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center; gap: 1px;
    }
    .ng-ring__value { font-size: 16px; font-weight: 700; color: #111827; font-variant-numeric: tabular-nums; }
  `],
})
export class ProgressRingComponent {
  readonly percent = input(0)
  readonly size = input(96)
  readonly stroke = input(8)
  readonly tone = input<'primary' | 'ok' | 'warn' | 'danger'>('primary')

  private readonly TONES: Record<string, string> = {
    primary: '#6366f1', ok: '#22c55e', warn: '#f59e0b', danger: '#ef4444',
  }
  readonly trackColor = '#f0f2f5'

  readonly half = computed(() => this.size() / 2)
  readonly radius = computed(() => this.size() / 2 - this.stroke() / 2 - 1)
  readonly circumference = computed(() => 2 * Math.PI * this.radius())
  readonly ratio = computed(() => Math.min(100, Math.max(0, this.percent())) / 100)
  readonly dashOffset = computed(() => this.circumference() * (1 - this.ratio()))
  readonly strokeColor = computed(() => this.TONES[this.tone()] ?? this.TONES.primary)
}
