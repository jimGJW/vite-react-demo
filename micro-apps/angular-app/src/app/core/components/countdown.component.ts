import {
  ChangeDetectionStrategy, Component, computed, effect, input, linkedSignal, output, signal,
} from '@angular/core'
import { formatDuration } from '../../../utils'
import { ProgressRingComponent } from './progress-ring.component'

/**
 * CountdownComponent —— 倒计时（进度环联动）
 *
 * 官方用法要点：
 * - `input()` 声明式输入 + `linkedSignal()` 由输入派生「可写状态」：
 *   秒数输入变化时自动重置剩余时间，同时仍可手动 set（进度环/±10s 都要改写它）
 * - `output()` 声明式输出：宿主写 `(finish)="onFinish()"`
 * - `effect(onCleanup)` 管理 setInterval 生命周期，组件销毁自动清理
 */
@Component({
  selector: 'ng-countdown',
  standalone: true,
  imports: [ProgressRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ng-cd">
      <ng-progress-ring [percent]="percent()" [size]="86" [stroke]="8" [tone]="ringTone()">
        <span class="ng-cd__time">{{ mm() }}</span>
        <span class="ng-cd__sep">:</span>
        <span class="ng-cd__time">{{ ss() }}</span>
      </ng-progress-ring>

      <div class="ng-cd__body">
        <div class="ng-cd__row">
          <button class="ng-btn ng-btn--primary" (click)="toggle()">
            {{ running() ? '暂停' : (remain() === 0 ? '已完成' : '开始') }}
          </button>
          <button class="ng-btn" (click)="reset(seconds())">重置</button>
          <button class="ng-btn" [disabled]="seconds() <= 10" (click)="bump(-10)">-10s</button>
          <button class="ng-btn" (click)="bump(10)">+10s</button>
        </div>
        <ul class="ng-cd__chips">
          <li class="ng-chip" [class.ng-chip--ok]="running()">{{ running() ? '运行中' : '已暂停' }}</li>
          <li class="ng-chip ng-chip--info">总时长 {{ total() }}s</li>
          <li class="ng-chip ng-chip--warn">剩余 {{ remain() }}s</li>
          @if (remain() === 0) {
            <li class="ng-chip ng-chip--danger">已完成</li>
          }
        </ul>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ng-cd { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
    .ng-cd__body { flex: 1; min-width: 220px; }
    .ng-cd__row { display: flex; gap: 8px; flex-wrap: wrap; }
    .ng-cd__time { font-size: 20px; font-weight: 700; color: #111827; font-variant-numeric: tabular-nums; }
    .ng-cd__sep { font-size: 16px; color: #d1d5db; }
    .ng-cd__chips { list-style: none; display: flex; gap: 6px; flex-wrap: wrap; padding: 0; margin: 10px 0 0; }
  `],
})
export class CountdownComponent {
  readonly seconds = input(60)

  /** 由输入派生，但可被 reset()/bump() 改写；输入变化自动回到新值 */
  readonly remain = linkedSignal(() => this.seconds())
  readonly running = signal(false)

  readonly finish = output<void>()

  readonly total = computed(() => Math.max(this.seconds(), this.remain()))
  readonly percent = computed(() => (this.total() ? Math.round((this.remain() / this.total()) * 100) : 0))
  readonly ringTone = computed<'primary' | 'warn' | 'danger'>(() => (
    this.percent() <= 20 ? 'danger' : this.percent() <= 50 ? 'warn' : 'primary'
  ))
  readonly mm = computed(() => String(Math.floor(this.remain() / 60)).padStart(2, '0'))
  readonly ss = computed(() => String(this.remain() % 60).padStart(2, '0'))
  /** 用 formatDuration 做兜底展示（同时也验证工具函数） */
  readonly remainText = computed(() => formatDuration(this.remain()))

  constructor() {
    effect((onCleanup) => {
      if (!this.running()) return
      const timer = setInterval(() => {
        if (this.remain() <= 1) {
          this.remain.set(0)
          this.running.set(false)
          this.finish.emit()
          return
        }
        this.remain.update((v) => v - 1)
      }, 1000)
      onCleanup(() => clearInterval(timer))
    })
  }

  toggle() {
    if (this.remain() === 0) return
    this.running.update((v) => !v)
  }

  reset(s: number) {
    this.running.set(false)
    this.remain.set(Math.max(0, Math.floor(s)))
  }

  bump(delta: number) {
    this.reset(Math.max(10, this.remain() + delta))
  }
}
