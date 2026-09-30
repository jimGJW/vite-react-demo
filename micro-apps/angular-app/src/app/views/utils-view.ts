import { Component, OnDestroy, computed, signal } from '@angular/core'
import {
  addDays, camelize, clamp, countBy, createPriorityQueue, createQueue,
  createRateLimiter, createRingBuffer, debounce, deepClone, diffDays, formatBytes,
  formatDate, formatNumber, formatSigned, hexToRgb, humanDuration,
  isEmail, isIdCardCN, isPhoneCN, isUrl, lighten, darken, mean, median, moveItem,
  partition, passwordStrength, percentile, pipe, randomId, randomInt, readableTextOn,
  rgbToHex, slugify, startOfWeek, stdDev, throttle, times, toNumber, uniqueBy, weekdayCN,
} from '../../utils'

interface DemoItem { id: number; type: string }
interface Swatch { label: string; hex: string; text: string }

/**
 * 工具函数 Utils 视图 —— 纯函数库 + signals 实时 playground
 *
 * 覆盖 utils/index.ts 的全部分组：函数控制 / 集合 / 对象 / 格式化 / 字符串 / 时间 /
 * 浏览器 / 数据结构，以及本轮新增的 函数组合 / 数组进阶 / 数值统计 / 校验 / 颜色 /
 * 数据结构进阶 / 时间进阶 / 导航分组。
 */
@Component({
  selector: 'app-utils-view',
  standalone: true,
  imports: [],
  template: `
    <div class="page">
      <header>
        <h1>工具函数 Utils</h1>
        <p>纯函数工具库 + signals 实时 playground（Angular 官方 signals 方案）</p>
      </header>

      <section class="card">
        <h3>debounce / throttle</h3>
        <p class="desc">输入防抖 400ms、点击节流 300ms——对比「原始事件数」与「实际执行数」。</p>
        <input class="ipt" placeholder="快速输入试试" [value]="rawInput()" (input)="onInput($event)" />
        <div class="metrics">
          <span class="tag">input 事件：{{ rawCount() }}</span>
          <span class="tag ok">防抖执行：{{ debouncedCount() }}</span>
          <button class="btn" (click)="onSpam()">疯狂点我</button>
          <span class="tag">点击：{{ clickCount() }}</span>
          <span class="tag ok">节流执行：{{ throttledCount() }}</span>
        </div>
      </section>

      <section class="card">
        <h3>deepClone 深拷贝</h3>
        <p class="desc">structuredClone：克隆后修改副本，原对象保持不变。</p>
        <button class="btn" (click)="runClone()">克隆并修改副本</button>
        <div class="metrics"><span class="tag info">原对象：{{ cloneResult() }}</span></div>
      </section>

      <section class="card">
        <h3>字符串与格式化</h3>
        <p class="desc">camelize / slugify / formatBytes / formatDate（signals computed 实时派生）。</p>
        <input class="ipt" [value]="strSrc()" (input)="onStr($event)" placeholder="输入 kebab-case，如 user-name-list" />
        <div class="metrics">
          <span class="tag">camelize → {{ camelOut() }}</span>
          <span class="tag warn">slugify → {{ slugOut() }}</span>
        </div>
        <div class="metrics">
          <span class="tag info">formatBytes(1536000) → {{ bytesOut() }}</span>
          <span class="tag danger">现在 → {{ nowText() }}</span>
        </div>
      </section>

      <section class="card">
        <h3>clamp · randomId · uniqueBy</h3>
        <div class="metrics">
          <input type="range" min="0" max="100" [value]="clampSrc()" (input)="onRange($event)" />
          <span class="tag">clamp({{ clampSrc() }}, 20, 80) → {{ clampedOut() }}</span>
          <button class="btn" (click)="genId()">生成 randomId</button>
          @if (lastId()) { <span class="tag ok">{{ lastId() }}</span> }
        </div>
        <div class="metrics">
          <span class="tag">uniqueBy 去重：{{ rawList().length }} 条 → {{ uniqueOut().length }} 条</span>
        </div>
      </section>

      <section class="card">
        <h3>函数组合 <span class="new">new</span></h3>
        <p class="desc">pipe 从左到右串成流水线：去分隔符 → toNumber → 千分位格式化。</p>
        <input class="ipt" [value]="pipeSrc()" (input)="onPipe($event)" placeholder="输入 12_345.6" />
        <div class="metrics">
          <span class="tag info">pipe(...) → {{ pipeOut() }}</span>
          <span class="tag ok">times(6, i =&gt; i * i) → {{ squares }}</span>
        </div>
      </section>

      <section class="card">
        <h3>数组进阶 <span class="new">new</span></h3>
        <p class="desc">partition / countBy / moveItem —— 列表页与拖拽排序的高频需求。</p>
        <div class="metrics">
          @for (row of orderRows(); track row) {
            <span class="tag">{{ row }}</span>
          }
          <button class="btn" (click)="rotateOrder()">moveItem(0 → 尾)</button>
        </div>
        <div class="metrics">
          <span class="tag">partition 偶 | 奇：{{ partitionText() }}</span>
          <span class="tag warn">countBy → {{ countByText() }}</span>
        </div>
      </section>

      <section class="card">
        <h3>数值统计 <span class="new">new</span></h3>
        <p class="desc">均值 / 中位数 / 标准差 / 百分位，以及带正负号的 formatSigned。</p>
        <div class="metrics"><span class="tag">样本：{{ SAMPLE.join(', ') }}</span></div>
        <div class="metrics">
          <span class="tag info">mean = {{ stats().mean }}</span>
          <span class="tag info">median = {{ stats().median }}</span>
          <span class="tag info">stdDev = {{ stats().stdDev }}</span>
          <span class="tag info">p90 = {{ stats().p90 }}</span>
        </div>
        <div class="metrics">
          <input type="range" min="-9999" max="9999" step="137" [value]="delta()" (input)="onDelta($event)" />
          <span class="tag" [class.danger]="delta() >= 0" [class.ok]="delta() < 0">formatSigned → {{ signedOut() }}</span>
        </div>
      </section>

      <section class="card">
        <h3>校验器 <span class="new">new</span></h3>
        <p class="desc">isEmail / isPhoneCN / isUrl / isIdCardCN（含 MOD 11-2 校验位）/ passwordStrength。</p>
        <input class="ipt wide" [value]="validSrc()" (input)="onValid($event)" placeholder="输入邮箱 / 手机号 / 身份证 / 网址" />
        <div class="metrics">
          <span class="tag" [class.ok]="checks().email">邮箱 {{ checks().email ? '✓' : '✗' }}</span>
          <span class="tag" [class.ok]="checks().phone">手机号 {{ checks().phone ? '✓' : '✗' }}</span>
          <span class="tag" [class.ok]="checks().idCard">身份证 {{ checks().idCard ? '✓' : '✗' }}</span>
          <span class="tag" [class.ok]="checks().url">网址 {{ checks().url ? '✓' : '✗' }}</span>
        </div>
        <div class="metrics">
          <span class="tag warn">口令强度：{{ strength().label }}（{{ strength().score }}/4）</span>
        </div>
      </section>

      <section class="card">
        <h3>颜色工具 <span class="new">new</span></h3>
        <p class="desc">hexToRgb / rgbToHex / lighten / darken / readableTextOn —— 主题色派生与自适应文字色。</p>
        <div class="swatch-row">
          @for (s of colorScale(); track s.label) {
            <div class="swatch" [style.background]="s.hex" [style.color]="s.text">
              <b>{{ s.label }}</b>
              <em>{{ s.hex }}</em>
            </div>
          }
        </div>
        <div class="metrics"><span class="tag info">{{ rgbText() }}</span></div>
      </section>

      <section class="card">
        <h3>数据结构 <span class="new">new</span></h3>
        <p class="desc">队列 / 栈 / 优先队列（二叉堆）/ 令牌桶限流 / 环形缓冲区，都是零依赖实现。</p>
        <div class="metrics">
          <button class="btn" (click)="pushQueue()">入队</button>
          <button class="btn" (click)="popQueue()">出队</button>
          <span class="tag info">队列 size = {{ queueSize() }}：{{ queueText() }}</span>
        </div>
        <div class="metrics">
          <button class="btn" (click)="pushHeap()">push 随机数</button>
          <button class="btn" (click)="popHeap()">pop 最小值</button>
          @if (heapOut() !== null) { <span class="tag ok">优先队列出队：{{ heapOut() }}</span> }
        </div>
        <div class="metrics">
          <button class="btn" (click)="tryTake()">tick 限流（3 次/秒）</button>
          <span class="tag" [class.ok]="limitOk()" [class.danger]="!limitOk()">
            {{ limitOk() ? '放行' : '被限流' }} · 剩余额度 {{ limitLeft() }}
          </span>
          <span class="tag warn">环形缓冲（容量 5）：{{ ringText() }}</span>
        </div>
      </section>

      <section class="card">
        <h3>时间与人话 <span class="new">new</span></h3>
        <p class="desc">addDays / diffDays / startOfWeek / humanDuration / weekdayCN。</p>
        <div class="metrics">
          <span class="tag">今天 {{ todayText() }} {{ todayWeekday() }}</span>
          <span class="tag info">本周起始 {{ weekStartText() }}</span>
          <span class="tag ok">+30 天 {{ plus30Text() }}（相对明天差 {{ dayDiff() }} 天）</span>
        </div>
        <div class="metrics">
          <input type="range" min="0" max="90000000" step="60000" [value]="durationMs()" (input)="onDuration($event)" />
          <span class="tag warn">humanDuration → {{ humanText() }}</span>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { padding: 18px 22px 36px; }
    h1 { margin: 0 0 4px; font-size: 20px; }
    header p { margin: 0 0 14px; color: #8a929f; font-size: 12.5px; }
    .card { border: 1px solid #e3e6eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; background: #fff; }
    .card h3 { margin: 0 0 4px; font-size: 15px; }
    .desc { margin: 0 0 10px; color: #8a929f; font-size: 12.5px; }
    .new { margin-left: 6px; font-size: 10px; font-weight: 600; color: #4f46e5; background: #eef2ff; border-radius: 999px; padding: 1px 7px; vertical-align: 1px; }
    .ipt { border: 1px solid #d4d7de; border-radius: 6px; padding: 7px 10px; font-size: 13px; width: 280px; outline-color: #4f46e5; }
    .ipt.wide { width: 380px; }
    .btn { border: 1px solid #d4d7de; border-radius: 6px; background: #fff; padding: 6px 12px; cursor: pointer; font-size: 12.5px; }
    .btn:hover { border-color: #4f46e5; color: #4f46e5; }
    .metrics { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .tag { padding: 3px 8px; border-radius: 4px; background: #f0f2f5; color: #444; font-size: 12px; font-variant-numeric: tabular-nums; }
    .tag.ok { background: #eef2ff; color: #4f46e5; }
    .tag.info { background: #eef3fd; color: #2b5db8; }
    .tag.warn { background: #fdf3e6; color: #a16114; }
    .tag.danger { background: #fdecec; color: #b71c1c; }
    .swatch-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .swatch { flex: 1 1 120px; border-radius: 10px; padding: 14px 12px; display: flex; flex-direction: column; gap: 3px; }
    .swatch b { font-size: 13px; }
    .swatch em { font-style: normal; font-size: 11px; font-family: 'SF Mono', Monaco, ui-monospace, monospace; opacity: 0.85; }
  `],
})
export class UtilsView implements OnDestroy {
  /* —— debounce —— */
  readonly rawInput = signal('')
  readonly rawCount = signal(0)
  readonly debouncedCount = signal(0)
  private readonly debouncedLog = debounce(() => this.debouncedCount.update((n) => n + 1), 400)
  onInput(e: Event) {
    this.rawInput.set((e.target as HTMLInputElement).value)
    this.rawCount.update((n) => n + 1)
    this.debouncedLog()
  }

  /* —— throttle —— */
  readonly clickCount = signal(0)
  readonly throttledCount = signal(0)
  private readonly throttledLog = throttle(() => this.throttledCount.update((n) => n + 1), 300)
  onSpam() {
    this.clickCount.update((n) => n + 1)
    this.throttledLog()
  }

  /* —— deepClone —— */
  readonly cloneResult = signal('(点击按钮运行)')
  runClone() {
    const origin: { name: string; tags: string[]; meta: { ver: number } } = {
      name: 'angular-app', tags: ['a', 'b'], meta: { ver: 1 },
    }
    const copy = deepClone(origin)
    copy.meta.ver = 999
    copy.tags.push('new')
    this.cloneResult.set(JSON.stringify(origin))
  }

  /* —— 字符串与格式化 —— */
  readonly strSrc = signal('user-name-list')
  readonly camelOut = computed(() => camelize(this.strSrc()))
  readonly slugOut = computed(() => slugify(this.strSrc()))
  readonly bytesOut = computed(() => formatBytes(1536000))
  /** 时钟：持有 Date 本身，格式化交给 computed —— 否则拿着 'HH:mm:ss' 字符串没法再派生日期 */
  private readonly clockTick = signal(new Date())
  readonly nowText = computed(() => formatDate(this.clockTick(), 'HH:mm:ss'))
  private readonly clock = setInterval(() => this.clockTick.set(new Date()), 1000)
  onStr(e: Event) { this.strSrc.set((e.target as HTMLInputElement).value) }

  /* —— clamp / randomId / uniqueBy —— */
  readonly clampSrc = signal(50)
  readonly clampedOut = computed(() => clamp(this.clampSrc(), 20, 80))
  readonly lastId = signal('')
  readonly rawList = signal<DemoItem[]>([
    { id: 1, type: 'a' }, { id: 2, type: 'b' }, { id: 3, type: 'a' },
  ])
  readonly uniqueOut = computed(() => uniqueBy(this.rawList(), (x) => x.type))
  onRange(e: Event) { this.clampSrc.set(Number((e.target as HTMLInputElement).value)) }
  genId() { this.lastId.set(randomId('ng')) }

  /* —— 函数组合 —— */
  readonly pipeSrc = signal('12_345.6')
  readonly pipeOut = computed(() => pipe(
    (s: string) => s.replace(/[,_\s]/g, ''),
    (s: string) => toNumber(s, 0),
    (n: number) => formatNumber(n, 1),
  )(this.pipeSrc()))
  readonly squares = times(6, (i) => i * i).join(', ')
  onPipe(e: Event) { this.pipeSrc.set((e.target as HTMLInputElement).value) }

  /* —— 数组进阶 —— */
  readonly orderRows = signal(['设计', '开发', '测试', '发布'])
  rotateOrder() {
    this.orderRows.update((rows) => moveItem(rows, 0, rows.length - 1))
  }
  readonly partitionText = computed(() => {
    const [even, odd] = partition([1, 2, 3, 4, 5, 6, 7, 8], (n) => n % 2 === 0)
    return `${even.join(',')} | ${odd.join(',')}`
  })
  readonly countByText = computed(() => JSON.stringify(countBy(this.rawList(), 'type')))

  /* —— 数值统计 —— */
  readonly SAMPLE = [88, 92, 79, 95, 61, 84, 90, 73, 99, 68]
  readonly stats = computed(() => ({
    mean: formatNumber(mean(this.SAMPLE), 1),
    median: median(this.SAMPLE),
    stdDev: formatNumber(stdDev(this.SAMPLE), 2),
    p90: percentile(this.SAMPLE, 90),
  }))
  readonly delta = signal(1234)
  readonly signedOut = computed(() => formatSigned(this.delta()))
  onDelta(e: Event) { this.delta.set(Number((e.target as HTMLInputElement).value)) }

  /* —— 校验 —— */
  readonly validSrc = signal('zhang.san@example.com')
  readonly checks = computed(() => ({
    email: isEmail(this.validSrc()),
    phone: isPhoneCN(this.validSrc()),
    idCard: isIdCardCN(this.validSrc()),
    url: isUrl(this.validSrc()),
  }))
  readonly strength = computed(() => passwordStrength(this.validSrc()))
  onValid(e: Event) { this.validSrc.set((e.target as HTMLInputElement).value) }

  /* —— 颜色 —— */
  private readonly BASE_HEX = '#6366f1'
  readonly colorScale = computed<Swatch[]>(() => {
    const dark = darken(this.BASE_HEX, 0.24)
    const lite = lighten(this.BASE_HEX, 0.3)
    const pale = lighten(this.BASE_HEX, 0.66)
    return [
      { label: 'darken 24%', hex: dark, text: readableTextOn(dark) },
      { label: '主色', hex: this.BASE_HEX, text: readableTextOn(this.BASE_HEX) },
      { label: 'lighten 30%', hex: lite, text: readableTextOn(lite) },
      { label: 'lighten 66%', hex: pale, text: readableTextOn(pale) },
    ].map((s) => ({ ...s, hex: s.hex.toUpperCase() }))
  })
  readonly rgbText = computed(() => {
    const c = hexToRgb(this.BASE_HEX)
    return c ? `hexToRgb('${this.BASE_HEX}') → rgb(${c.r}, ${c.g}, ${c.b}) = ${rgbToHex(c)}` : ''
  })

  /* —— 数据结构 —— */
  private readonly queue = createQueue<string>()
  readonly queueSize = signal(0)
  readonly queueText = signal('（空）')
  private seq = 0
  private syncQueue() {
    this.queueSize.set(this.queue.size)
    this.queueText.set(this.queue.toArray().join(' → ') || '（空）')
  }
  pushQueue() { this.queue.enqueue(`T${++this.seq}`); this.syncQueue() }
  popQueue() { this.queue.dequeue(); this.syncQueue() }

  private readonly heap = createPriorityQueue<number>((a, b) => a - b)
  readonly heapOut = signal<number | null>(null)
  pushHeap() { this.heap.push(randomInt(1, 99)); this.heapOut.set(null) }
  popHeap() { this.heapOut.set(this.heap.pop() ?? null) }

  private readonly limiter = createRateLimiter({ limit: 3, interval: 1000 })
  readonly limitOk = signal(false)
  readonly limitLeft = signal(3)
  tryTake() {
    this.limitOk.set(this.limiter.tryTake())
    this.limitLeft.set(this.limiter.remaining)
  }

  private readonly ringBuf = createRingBuffer<number>(5)
  readonly ringText = signal('')
  private readonly ringTimer = setInterval(() => {
    this.ringBuf.push(randomInt(10, 99))
    this.ringText.set(this.ringBuf.toArray().join(', '))
  }, 1200)

  /* —— 时间 —— */
  readonly todayText = computed(() => formatDate(this.clockTick(), 'YYYY-MM-DD'))
  readonly todayWeekday = computed(() => weekdayCN(this.clockTick()))
  readonly weekStartText = computed(() => formatDate(startOfWeek(this.clockTick()), 'YYYY-MM-DD'))
  readonly plus30Text = computed(() => formatDate(addDays(this.clockTick(), 30), 'YYYY-MM-DD'))
  readonly dayDiff = computed(() => diffDays(addDays(this.clockTick(), 1), this.clockTick()))
  readonly durationMs = signal(5430000)
  readonly humanText = computed(() => humanDuration(this.durationMs()))
  onDuration(e: Event) { this.durationMs.set(Number((e.target as HTMLInputElement).value)) }

  ngOnDestroy() {
    clearInterval(this.clock)
    clearInterval(this.ringTimer)
  }
}
