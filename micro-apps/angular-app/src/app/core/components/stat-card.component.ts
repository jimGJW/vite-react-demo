import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { formatNumber } from '../../../utils'
import { MiniChartComponent } from './mini-chart.component'

/**
 * StatCardComponent —— 指标卡（主数值 + 环比 + 迷你走势）
 *
 * 官方用法要点：
 * - `input()` 声明式输入，父组件只传关心的字段
 * - 内部组合 MiniChartComponent（standalone 组件可直接在 imports 里引用）
 * - 中国市场约定：环比上涨用红色、下跌用绿色
 */
@Component({
  selector: 'ng-stat-card',
  standalone: true,
  imports: [MiniChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'ng-stat ng-stat--' + tone()">
      <div class="ng-stat__head">
        <span class="ng-stat__title">{{ title() }}</span>
        @if (badge()) {
          <span class="ng-stat__badge">{{ badge() }}</span>
        }
      </div>

      <div class="ng-stat__value">
        <span class="ng-stat__num">{{ display() }}</span>
        @if (unit()) {
          <span class="ng-stat__unit">{{ unit() }}</span>
        }
      </div>

      @if (trend() !== null) {
        <div class="ng-stat__trend" [class.is-up]="trendUp()" [class.is-down]="!trendUp()">
          <span class="ng-stat__arrow">{{ trendUp() ? '▲' : '▼' }}</span>
          <span>{{ absTrend() }}%</span>
          <span class="ng-stat__vs">较上期</span>
        </div>
      }

      @if ((spark() ?? []).length) {
        <ng-mini-chart
          class="ng-stat__spark"
          type="sparkline"
          [data]="spark() ?? []"
          [color]="sparkColor()"
          [height]="34"
          [showGrid]="false"
        />
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ng-stat {
      position: relative; border: 1px solid #e5e7eb; border-radius: 12px;
      padding: 12px 14px 6px; background: #fff; overflow: hidden;
    }
    .ng-stat::before {
      content: ''; position: absolute; inset: 0 auto 0 0; width: 3px; background: var(--tone, #6366f1);
    }
    .ng-stat--primary { --tone: #6366f1; }
    .ng-stat--ok { --tone: #22c55e; }
    .ng-stat--warn { --tone: #f59e0b; }
    .ng-stat--danger { --tone: #ef4444; }
    .ng-stat__head { display: flex; align-items: center; gap: 6px; }
    .ng-stat__title { font-size: 12.5px; color: #9ca3af; }
    .ng-stat__badge { font-size: 11px; padding: 0 6px; border-radius: 999px; background: #eef2ff; color: #6366f1; }
    .ng-stat__value { display: flex; align-items: baseline; gap: 4px; margin: 4px 0 2px; }
    .ng-stat__num { font-size: 24px; font-weight: 700; color: #111827; font-variant-numeric: tabular-nums; }
    .ng-stat__unit { font-size: 12px; color: #9ca3af; }
    .ng-stat__trend { display: flex; align-items: center; gap: 3px; font-size: 12px; }
    .ng-stat__trend.is-up { color: #ef4444; }
    .ng-stat__trend.is-down { color: #22c55e; }
    .ng-stat__arrow { font-size: 10px; }
    .ng-stat__vs { color: #d1d5db; margin-left: 2px; }
    .ng-stat__spark { display: block; margin-top: 2px; }
  `],
})
export class StatCardComponent {
  readonly title = input.required<string>()
  readonly value = input<number | string>(0)
  readonly unit = input('')
  readonly badge = input('')
  readonly trend = input<number | null>(null)
  readonly tone = input<'primary' | 'ok' | 'warn' | 'danger'>('primary')
  readonly spark = input<number[]>()
  readonly digits = input(0)

  readonly display = computed(() => {
    const v = this.value()
    if (typeof v !== 'number') return v
    return formatNumber(v, this.digits())
  })
  readonly trendUp = computed(() => (this.trend() ?? 0) >= 0)
  readonly absTrend = computed(() => Math.abs(this.trend() ?? 0))
  readonly sparkColor = computed(() => (this.trendUp() ? '#ef4444' : '#22c55e'))
}
