import { ChangeDetectionStrategy, Component, type OnDestroy, inject, signal } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import {
  Subject, Subscription, catchError, debounceTime, distinctUntilChanged, filter,
  from, interval, map, of, scan, startWith, switchMap, tap, throttleTime,
} from 'rxjs'
import { ToastService } from '../core/services/toast.service'
import { MockApiService, type CityRow } from '../core/services/mock-api.service'

/**
 * RxJS 视图 —— 「RxJS 流」与「Signal 状态」对照
 *
 * Angular 官方态度：**信号负责状态，RxJS 负责事件流**。
 * 本页把同一批需求用两套写法各实现一遍，直观看出各自擅长什么：
 *   1) 实时搜索：RxJS `debounceTime + distinctUntilChanged + switchMap`（取消前一个请求）
 *      vs Signal：`effect + debounce + 请求序号丢弃过期响应`
 *   2) 高频事件节流：`fromEvent + throttleTime`
 *   3) 累计统计：`scan`（这类"流式聚合"用信号写反而更啰嗦）
 */
@Component({
  selector: 'app-rxjs-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
  template: `
    <div class="rx">
      <header class="rx__head">
        <h1>RxJS 与信号 · 两套写法对照</h1>
        <p>官方建议：状态用 signal，事件流用 RxJS。下面同一批需求各写一遍。</p>
      </header>

      <!-- 1. 实时搜索 -->
      <section class="ng-card">
        <h2>① 实时搜索：debounceTime + switchMap（RxJS）vs 防抖 + 序号丢弃（Signal）</h2>
        <p class="ng-desc">
          共同点：都要防抖、都要处理「旧请求晚到覆盖新结果」。差别：RxJS 靠 <code>switchMap</code>
          自动取消上一个请求；信号写法得自己维护请求序号。
        </p>

        <div class="rx__grid2">
          <div class="rx__panel">
            <div class="rx__panel-title">RxJS 版（switchMap 自动取消）</div>
            <input class="ng-input" placeholder="输入城市名，如 北 / 上 / 杭" (input)="onRxInput($event)" />
            <div class="rx__row">
              <span class="ng-chip ng-chip--info">关键词 {{ rxKeyword() || '（空）' }}</span>
              <span class="ng-chip">请求次数 {{ rxRequests() }}</span>
              <span class="ng-chip ng-chip--ok">返回 {{ rxResults().length }} 条</span>
            </div>
            <ul class="rx__list">
              @for (row of rxResults(); track row.id) {
                <li>{{ row.name }} · 房间 {{ row.rooms }} · 告警 {{ row.alarms }}</li>
              } @empty {
                <li class="rx__empty">暂无结果</li>
              }
            </ul>
          </div>

          <div class="rx__panel">
            <div class="rx__panel-title">Signal 版（防抖 + 请求序号）</div>
            <input class="ng-input" placeholder="输入城市名，如 北 / 上 / 杭" (input)="onSigInput($event)" />
            <div class="rx__row">
              <span class="ng-chip ng-chip--info">关键词 {{ sigKeyword() || '（空）' }}</span>
              <span class="ng-chip">请求次数 {{ sigRequests() }}</span>
              <span class="ng-chip ng-chip--warn">丢弃过期 {{ sigDropped() }} 次</span>
              <span class="ng-chip ng-chip--ok">返回 {{ sigResults().length }} 条</span>
            </div>
            <ul class="rx__list">
              @for (row of sigResults(); track row.id) {
                <li>{{ row.name }} · 房间 {{ row.rooms }} · 告警 {{ row.alarms }}</li>
              } @empty {
                <li class="rx__empty">暂无结果</li>
              }
            </ul>
          </div>
        </div>
      </section>

      <!-- 2. 高频事件节流 + scan 聚合 -->
      <section class="ng-card">
        <h2>② 高频事件：throttleTime + scan 流式聚合</h2>
        <p class="ng-desc">
          在下方区域快速移动鼠标 / 滚动：RxJS 用 <code>throttleTime(120)</code> 限流，用 <code>scan</code> 累计
          事件总数与最近坐标，全程不需要一个 signal 参与运算。
        </p>
        <div class="rx__stage" (mousemove)="onStageMove($event)" (click)="onStageClick()">
          <span>在这里移动鼠标 / 点击</span>
        </div>
        <div class="rx__row" style="margin-top: 10px">
          <span class="ng-chip ng-chip--info">原始事件 {{ rawEvents() }}</span>
          <span class="ng-chip ng-chip--ok">节流后 {{ throttledEvents() }}</span>
          <span class="ng-chip ng-chip--warn">点击累计 {{ clickCount$ | async }}</span>
          <span class="ng-chip">最近坐标 {{ lastPoint() }}</span>
        </div>
        <div class="rx__panel" style="margin-top: 12px">
          <div class="rx__panel-title">最近 8 条节流窗口</div>
          <ul class="rx__log">
            @for (w of windows(); track $index) {
              <li>x={{ w.x }} y={{ w.y }} · {{ w.at }}</li>
            } @empty {
              <li class="rx__empty">在上方区域移动鼠标试试</li>
            }
          </ul>
        </div>
      </section>

      <!-- 3. 算子速查 -->
      <section class="ng-card">
        <h2>③ 常用算子速查（点击算子直接跑一遍）</h2>
        <p class="ng-desc">点任意算子，立刻用一段真实数据流验证它的行为，并把结果打到下面。</p>
        <div class="rx__row">
          @for (op of operators; track op.name) {
            <button class="ng-btn" (click)="runOperator(op.name)">{{ op.name }}</button>
          }
        </div>
        <table class="rx__table">
          <thead><tr><th>算子</th><th>作用</th><th>本次输出</th></tr></thead>
          <tbody>
            @for (r of opResults(); track r.name) {
              <tr>
                <td><code>{{ r.name }}</code></td>
                <td>{{ r.desc }}</td>
                <td class="ng-num">{{ r.output }}</td>
              </tr>
            }
            @empty {
              <tr><td colspan="3" class="rx__empty">还没跑过任何算子</td></tr>
            }
          </tbody>
        </table>
      </section>

      <!-- 4. 接口日志 -->
      <section class="ng-card">
        <h2>④ 接口调用轨迹（MockApiService）</h2>
        <p class="ng-desc">Mock 层保持与真实 HttpClient 一致的 Promise 形态（延迟 / 失败率 / pending 计数）。</p>
        <div class="rx__row">
          <button class="ng-btn ng-btn--primary" (click)="callFlaky()">调用不稳定接口（60% 失败）</button>
          <span class="ng-chip ng-chip--info">进行中 {{ api.pending() }}</span>
          <span class="ng-chip">日志 {{ api.requestLog().length }} 条</span>
        </div>
        <ul class="rx__log">
          @for (l of api.requestLog(); track $index) {
            <li [class.is-fail]="!l.ok">
              {{ l.method }} {{ l.url }} · {{ l.ms }}ms · {{ l.ok ? '200' : 'ERROR' }}
            </li>
          } @empty {
            <li class="rx__empty">暂无请求</li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .rx__head { margin-bottom: 16px; }
    .rx__head h1 { margin: 0 0 4px; font-size: 20px; color: #111827; }
    .rx__head p { margin: 0; font-size: 12.5px; color: #9ca3af; line-height: 1.8; }
    .rx__grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
    .rx__panel { border: 1px solid #f3f4f6; border-radius: 8px; padding: 12px; background: #fcfdff; }
    .rx__panel-title { font-size: 12.5px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
    .rx__row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .rx__list { list-style: none; margin: 10px 0 0; padding: 0; font-size: 12.5px; color: #4b5563; }
    .rx__list li { padding: 4px 0; border-bottom: 1px dashed #f3f4f6; }
    .rx__empty { color: #d1d5db; text-align: center; }
    .rx__stage {
      height: 120px; display: flex; align-items: center; justify-content: center;
      border: 1px dashed #c7d2fe; border-radius: 8px; cursor: crosshair;
      background: repeating-linear-gradient(45deg, #f8faff, #f8faff 10px, #eef2ff 10px, #eef2ff 20px);
      font-size: 12.5px; color: #6366f1;
    }
    .rx__log { list-style: none; margin: 10px 0 0; padding: 0; font-size: 12px; font-family: 'SF Mono', Monaco, monospace; color: #4b5563; max-height: 180px; overflow-y: auto; }
    .rx__log li { padding: 3px 0; border-bottom: 1px dashed #f3f4f6; }
    .rx__log li.is-fail { color: #b91c1c; }
    .rx__table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 12px; }
    .rx__table th, .rx__table td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    .rx__table th { color: #9ca3af; font-weight: 600; font-size: 12px; }
    code { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; color: #6366f1; background: #eef2ff; padding: 1px 5px; border-radius: 3px; }
  `],
})
export class RxjsView implements OnDestroy {
  readonly api = inject(MockApiService)
  private readonly toast = inject(ToastService)

  /* ============ ① 实时搜索 ============ */
  private readonly rxInput$ = new Subject<string>()
  readonly rxKeyword = signal('')
  readonly rxRequests = signal(0)
  readonly rxResults = signal<CityRow[]>([])
  private readonly subs: Subscription[] = []

  /* —— Signal 版 —— */
  readonly sigKeyword = signal('')
  readonly sigRequests = signal(0)
  readonly sigDropped = signal(0)
  readonly sigResults = signal<CityRow[]>([])
  private sigSeq = 0
  private sigTimer: ReturnType<typeof setTimeout> | null = null

  /* ============ ② 高频事件 ============ */
  private readonly move$ = new Subject<{ x: number; y: number }>()
  private readonly click$ = new Subject<void>()
  readonly rawEvents = signal(0)
  readonly throttledEvents = signal(0)
  readonly lastPoint = signal('—')
  readonly windows = signal<{ x: number; y: number; at: string }[]>([])
  /** AsyncPipe 消费的流：点击累计次数 */
  readonly clickCount$ = this.click$.pipe(
    scan((n) => n + 1, 0),
    startWith(0),
  )

  /* ============ ③ 算子速查 ============ */
  readonly operators = [
    { name: 'map', desc: '每个值做映射（1→n）', run: () => from([1, 2, 3]).pipe(map((n) => n * 10)) },
    { name: 'filter', desc: '过滤不满足条件的值', run: () => from([1, 2, 3, 4, 5, 6]).pipe(filter((n) => n % 2 === 0)) },
    { name: 'scan', desc: '流式累计（等价 reduce，但每次 emit）', run: () => from([1, 2, 3, 4]).pipe(scan((a, b) => a + b, 0)) },
    { name: 'debounceTime', desc: '静默 200ms 后才 emit（防抖）', run: () => of('a', 'b', 'c').pipe(debounceTime(200)) },
    { name: 'throttleTime', desc: '200ms 窗口内只 emit 第一个（节流）', run: () => interval(60).pipe(throttleTime(200)) },
    { name: 'distinctUntilChanged', desc: '相邻重复值只留一个', run: () => of(1, 1, 2, 2, 2, 3, 1).pipe(distinctUntilChanged()) },
    { name: 'catchError', desc: '捕获错误并降级（不中断订阅）', run: () => of('ok1').pipe(switchMap(() => from(Promise.reject(new Error('模拟失败'))).pipe(catchError(() => of('降级值'))))) },
    { name: 'tap', desc: '副作用（不改变值，用于埋点/日志）', run: () => of(1, 2).pipe(tap((n) => this.rawEvents.update((v) => v + 0 + n))) },
  ]
  readonly opResults = signal<{ name: string; desc: string; output: string }[]>([])

  /* ============ ④ 接口 ============ */
  callFlaky = async () => {
    try {
      const v = await this.api.flaky({ ok: true }, 0.6)
      this.toast.success(`调用成功：${JSON.stringify(v)}`)
    } catch (e) {
      this.toast.error(`调用失败：${(e as Error).message}`)
    }
  }

  constructor() {
    // ① RxJS 版：输入 → 防抖 400ms → 去重 → switchMap 请求（自动取消上一次）
    this.subs.push(
      this.rxInput$
        .pipe(
          tap((kw) => this.rxKeyword.set(kw)),
          debounceTime(400),
          distinctUntilChanged(),
          switchMap((kw) => {
            this.rxRequests.update((n) => n + 1)
            return from(this.search(kw)).pipe(catchError(() => of<CityRow[]>([])))
          }),
        )
        .subscribe((rows) => this.rxResults.set(rows)),
    )

    // ② 鼠标移动：节流 + 记录窗口
    this.subs.push(
      this.move$
        .pipe(throttleTime(120))
        .subscribe((p) => {
          this.throttledEvents.update((n) => n + 1)
          this.lastPoint.set(`x=${p.x} y=${p.y}`)
          this.windows.update((w) => [
            { ...p, at: new Date().toLocaleTimeString('zh-CN', { hour12: false }) },
            ...w,
          ].slice(0, 8))
        }),
    )

    this.subs.push(this.click$.subscribe())
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe())
    if (this.sigTimer) clearTimeout(this.sigTimer)
  }

  /** 共享数据源：按关键字过滤城市列表 */
  private async search(keyword: string): Promise<CityRow[]> {
    const all = await this.api.getCities({ latency: 260 })
    const kw = keyword.trim()
    if (!kw) return all.slice(0, 4)
    return all.filter((c) => c.name.includes(kw) || c.owner.includes(kw)).slice(0, 6)
  }

  onRxInput(e: Event) {
    this.rxInput$.next((e.target as HTMLInputElement).value)
  }

  /** Signal 版：防抖 + 请求序号，过期响应直接丢弃（RxJS switchMap 的手工等价物） */
  onSigInput(e: Event) {
    const kw = (e.target as HTMLInputElement).value
    this.sigKeyword.set(kw)
    if (this.sigTimer) clearTimeout(this.sigTimer)
    this.sigTimer = setTimeout(async () => {
      const mySeq = ++this.sigSeq
      this.sigRequests.update((n) => n + 1)
      const rows = await this.search(kw)
      if (mySeq !== this.sigSeq) {
        this.sigDropped.update((n) => n + 1)
        return
      }
      this.sigResults.set(rows)
    }, 400)
  }

  onStageMove(e: MouseEvent) {
    this.rawEvents.update((n) => n + 1)
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    this.move$.next({ x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) })
  }

  onStageClick() {
    this.click$.next()
  }

  /** 跑一遍算子：collect 前若干项后结束，把结果打到表格 */
  runOperator(name: string) {
    const op = this.operators.find((o) => o.name === name)
    if (!op) return
    const collected: unknown[] = []
    const sub = (op.run() as never as { subscribe: (o: { next: (v: unknown) => void; complete: () => void }) => Subscription })
      .subscribe({
        next: (v: unknown) => { if (collected.length < 8) collected.push(v) },
        complete: () => {
          this.opResults.update((list) => [
            { name: op.name, desc: op.desc, output: collected.join(', ') || '（无值）' },
            ...list.filter((r) => r.name !== op.name),
          ].slice(0, 8))
        },
      })
    // 兜底：部分流（interval）不会 complete，1.2s 后强制收尾
    setTimeout(() => {
      if (!sub.closed) {
        sub.unsubscribe()
        this.opResults.update((list) => [
          { name: op.name, desc: `${op.desc}（截断展示）`, output: collected.join(', ') || '（无值）' },
          ...list.filter((r) => r.name !== op.name),
        ].slice(0, 8))
      }
    }, 1200)
  }
}
