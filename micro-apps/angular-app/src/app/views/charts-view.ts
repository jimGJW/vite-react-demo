import { ChangeDetectionStrategy, Component, type OnDestroy, computed, signal } from '@angular/core'
import { Subscription, interval } from 'rxjs'
import { MiniChartComponent, StatCardComponent } from '../core/components'
import { ProgressRingComponent } from '../core/components/progress-ring.component'
import { formatNumber } from '../../utils'

interface Metric { key: string; label: string; unit: string; color: string }

/**
 * Charts 视图 —— 图表中心（纯 SVG）
 *
 * 本页额外演示：用 RxJS `interval()` 驱动实时数据流，
 * 与「signal + setInterval」形成对照 —— 两者都能做，RxJS 强在可组合的算子链。
 */
@Component({
  selector: 'app-charts-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MiniChartComponent, StatCardComponent, ProgressRingComponent],
  template: `
    <div class="ch">
      <header class="ch__head">
        <h1>图表中心 · Charts</h1>
        <p>手写 SVG 覆盖常见图表 + 维度联动 + RxJS interval 驱动的实时流</p>
      </header>

      <section class="ng-card">
        <h2>选择数据维度</h2>
        <p class="ng-desc">点击切换维度，下方所有图表与派生指标（合计 / 环比 / 峰值）全部联动。</p>
        <div class="ch__row">
          @for (m of metrics; track m.key) {
            <button
              class="ch__metric"
              [class.is-active]="metric() === m.key"
              (click)="metric.set(m.key)"
            >
              <span class="ch__dot" [style.background]="m.color"></span>
              {{ m.label }}
              <b>{{ m.unit }}</b>
            </button>
          }
          <button class="ng-btn" (click)="shuffle()">随机造一批数据</button>
          <button class="ng-btn" (click)="toggleStream()">{{ streaming() ? '停止实时流' : '开启实时流' }}</button>
        </div>
      </section>

      <section class="ng-card">
        <h2>趋势（{{ current().label }}）</h2>
        <ng-mini-chart
          [type]="areaMode() ? 'area' : 'line'"
          [data]="liveData()"
          [labels]="days"
          [height]="180"
          [color]="current().color"
        />
        <div class="ch__row" style="margin-top: 10px">
          <label class="ch__switch">
            <input type="checkbox" [checked]="areaMode()" (change)="areaMode.set(!areaMode())" /> 面积模式
          </label>
          <span class="ng-chip ng-chip--info">合计 {{ totalText() }}{{ current().unit }}</span>
          <span class="ng-chip" [class]="trend() >= 0 ? 'ng-chip ng-chip--danger' : 'ng-chip ng-chip--ok'">
            {{ trend() >= 0 ? '▲' : '▼' }} {{ absTrend() }}% 环比
          </span>
          <span class="ng-chip">峰值 {{ peakText() }}{{ current().unit }}</span>
          @if (streaming()) {
            <span class="ng-chip ng-chip--ok">实时流运行中 · 样本 {{ samples().length }}</span>
          }
        </div>
      </section>

      <section class="ng-card">
        <h2>分布（环形 + 明细表）</h2>
        <div class="ch__grid2">
          <ng-mini-chart type="donut" [data]="donut" centerText="100%" centerSub="占比合计" />
          <table class="ch__table">
            <thead><tr><th>渠道</th><th>数值</th><th>占比</th><th>环形</th></tr></thead>
            <tbody>
              @for (d of donut; track d.label) {
                <tr>
                  <td><i class="ch__pd" [style.background]="d.color"></i>{{ d.label }}</td>
                  <td class="ng-num">{{ d.value }}</td>
                  <td class="ng-num">{{ percentOf(d.value) }}%</td>
                  <td>
                    <ng-progress-ring
                      [percent]="percentOf(d.value)" [size]="40" [stroke]="5"
                      [tone]="d.value > 30 ? 'primary' : 'warn'"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="ng-card">
        <h2>分组柱状 + 排行</h2>
        <div class="ch__grid2">
          <ng-mini-chart type="bar" [data]="groupData" [labels]="groupLabels" [height]="170" color="#8e44ad" />
          <ol class="ch__rank">
            @for (g of ranked(); track g.label) {
              <li>
                <span [class]="'ch__no ch__no--' + ($index + 1)">{{ $index + 1 }}</span>
                <span class="ch__label">{{ g.label }}</span>
                <span class="ch__bar"><i [style.width.%]="(g.value / groupMax()) * 100"></i></span>
                <span class="ng-num">{{ g.value }}</span>
              </li>
            }
          </ol>
        </div>
      </section>

      <section class="ng-card">
        <h2>迷你走势（sparkline）</h2>
        <div class="ch__grid3">
          @for (s of sparkCards; track s.title) {
            <ng-stat-card
              [title]="s.title" [value]="s.value" [unit]="s.unit"
              [trend]="s.trend" [tone]="s.tone" [spark]="s.spark" [digits]="s.digits ?? 0"
            />
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .ch__head { margin-bottom: 16px; }
    .ch__head h1 { margin: 0 0 4px; font-size: 20px; color: #111827; }
    .ch__head p { margin: 0; font-size: 12.5px; color: #9ca3af; }
    .ch__row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .ch__grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 14px; }
    .ch__grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
    .ch__metric {
      display: inline-flex; align-items: center; gap: 6px;
      border: 1px solid #d1d5db; border-radius: 999px; background: #fff;
      padding: 5px 14px; font-size: 12.5px; color: #4b5563; cursor: pointer; transition: all 0.15s;
    }
    .ch__metric.is-active { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
    .ch__metric b { color: #d1d5db; font-weight: 400; }
    .ch__dot { width: 7px; height: 7px; border-radius: 50%; }
    .ch__switch { font-size: 12.5px; color: #4b5563; display: inline-flex; align-items: center; gap: 4px; }
    .ch__table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .ch__table th, .ch__table td { text-align: left; padding: 7px 6px; border-bottom: 1px solid #f3f4f6; }
    .ch__table th { color: #9ca3af; font-weight: 600; font-size: 12px; }
    .ch__pd { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 6px; }
    .ch__rank { list-style: none; margin: 0; padding: 0; }
    .ch__rank li { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 12.5px; color: #4b5563; }
    .ch__no {
      width: 18px; height: 18px; border-radius: 4px; background: #f3f4f6; color: #9ca3af;
      font-size: 11px; display: inline-flex; align-items: center; justify-content: center;
    }
    .ch__no--1 { background: #ef4444; color: #fff; }
    .ch__no--2 { background: #f59e0b; color: #fff; }
    .ch__no--3 { background: #6366f1; color: #fff; }
    .ch__label { width: 48px; }
    .ch__bar { flex: 1; height: 8px; border-radius: 4px; background: #f3f4f6; overflow: hidden; }
    .ch__bar i { display: block; height: 100%; background: linear-gradient(90deg, #6366f1, #8e44ad); transition: width 0.3s; }
  `],
})
export class ChartsView implements OnDestroy {
  readonly metrics: Metric[] = [
    { key: 'pv', label: '页面浏览', unit: '次', color: '#6366f1' },
    { key: 'uv', label: '独立访客', unit: '人', color: '#22c55e' },
    { key: 'api', label: '接口调用', unit: '次', color: '#f59e0b' },
    { key: 'err', label: '错误数', unit: '次', color: '#ef4444' },
  ]
  readonly days = ['08-24', '08-25', '08-26', '08-27', '08-28', '08-29', '08-30']

  private readonly SERIES: Record<string, number[]> = {
    pv: [3200, 4520, 3800, 5100, 6100, 7200, 6880],
    uv: [1200, 1450, 1380, 1610, 1820, 2010, 1980],
    api: [8400, 9200, 8800, 10300, 12400, 13800, 12900],
    err: [42, 31, 55, 28, 19, 24, 12],
  }

  readonly metric = signal('pv')
  readonly areaMode = signal(true)
  private readonly seed = signal(0)

  /** 实时流：RxJS interval 推送样本（订阅在 ngOnDestroy 里取消） */
  readonly streaming = signal(false)
  readonly samples = signal<number[]>([])
  private sub: Subscription | null = null

  readonly current = computed(() => this.metrics.find((m) => m.key === this.metric())!)

  private readonly jitter = (i: number) => {
    const s = this.seed()
    if (!s) return 0
    return Math.round((((i * 37 + s * 13) % 17) - 8) * (s / 4))
  }

  readonly liveData = computed(() => {
    const base = this.SERIES[this.metric()].map((v, i) => Math.max(0, v + this.jitter(i)))
    const tail = this.samples()
    return tail.length ? [...base.slice(0, 7 - tail.length), ...tail].slice(-7) : base
  })

  readonly totalText = computed(() => formatNumber(this.liveData().reduce((a, b) => a + b, 0), 0))
  readonly peakText = computed(() => formatNumber(Math.max(...this.liveData()), 0))
  readonly trend = computed(() => {
    const d = this.liveData()
    const first = d[0] || 1
    return ((d[d.length - 1] - first) / first) * 100
  })
  readonly absTrend = computed(() => Math.abs(this.trend()).toFixed(1))

  readonly donut = [
    { label: '自然搜索', value: 46, color: '#6366f1' },
    { label: '直接访问', value: 28, color: '#22c55e' },
    { label: '外部链接', value: 18, color: '#f59e0b' },
    { label: '社交分享', value: 8, color: '#ef4444' },
  ]
  private readonly donutTotal = this.donut.reduce((a, b) => a + b.value, 0)
  percentOf(v: number) { return Number(((v / this.donutTotal) * 100).toFixed(1)) }

  readonly groupLabels = ['周一', '周二', '周三', '周四', '周五']
  readonly groupData = [86, 124, 98, 152, 118]
  readonly groupMax = computed(() => Math.max(...this.groupData))
  readonly ranked = computed(() => this.groupLabels
    .map((label, i) => ({ label, value: this.groupData[i] }))
    .sort((a, b) => b.value - a.value))

  readonly sparkCards = [
    { title: '签到率', value: 92, unit: '%', trend: 2.4, tone: 'ok' as const, spark: [80, 84, 83, 88, 90, 91, 92] },
    { title: '平均停留', value: 186, unit: 's', trend: -6.1, tone: 'warn' as const, spark: [220, 210, 205, 198, 192, 189, 186] },
    { title: '构建耗时', value: 33, unit: 's', trend: -18.9, tone: 'ok' as const, spark: [52, 48, 44, 40, 36, 34, 33] },
    { title: '错误率', value: 0.6, unit: '%', trend: 0.2, tone: 'danger' as const, digits: 1, spark: [0.2, 0.3, 0.35, 0.4, 0.5, 0.55, 0.6] },
  ]

  shuffle() { this.seed.update((s) => (s + 1) % 7) }

  /** RxJS 驱动实时流：interval(1500) → 生成随机样本 → 只保留最近 7 个 */
  toggleStream() {
    if (this.sub) {
      this.sub.unsubscribe()
      this.sub = null
      this.streaming.set(false)
      return
    }
    this.streaming.set(true)
    this.sub = interval(1500).subscribe(() => {
      const base = this.SERIES[this.metric()]
      const avg = base.reduce((a, b) => a + b, 0) / base.length
      const next = Math.max(1, Math.round(avg * (0.7 + Math.random() * 0.6)))
      this.samples.update((s) => [...s, next].slice(-7))
    })
  }

  ngOnDestroy() {
    this.sub?.unsubscribe()
    this.sub = null
  }
}
