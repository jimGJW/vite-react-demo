import { Component, OnDestroy, computed, signal } from '@angular/core'
import { NgIf } from '@angular/common'
import {
  camelize, clamp, debounce, deepClone, formatBytes,
  formatDate, randomId, slugify, throttle, uniqueBy,
} from '../../utils'

interface DemoItem { id: number; type: string }

/**
 * 工具函数 Utils 视图 —— 纯函数库 + signals 实时 playground
 * 纯函数零依赖可单测；页面状态全部用 Angular 官方 signals 管理
 */
@Component({
  selector: 'app-utils-view',
  standalone: true,
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
          <span class="tag ok" *ngIf="lastId()">{{ lastId() }}</span>
        </div>
        <div class="metrics">
          <span class="tag">uniqueBy 去重：{{ rawList().length }} 条 → {{ uniqueOut().length }} 条</span>
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
    .ipt { border: 1px solid #d4d7de; border-radius: 6px; padding: 7px 10px; font-size: 13px; width: 280px; outline-color: #dd0031; }
    .btn { border: 1px solid #d4d7de; border-radius: 6px; background: #fff; padding: 6px 12px; cursor: pointer; font-size: 12.5px; }
    .btn:hover { border-color: #dd0031; color: #dd0031; }
    .metrics { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .tag { padding: 3px 8px; border-radius: 4px; background: #f0f2f5; color: #444; font-size: 12px; font-variant-numeric: tabular-nums; }
    .tag.ok { background: #e8f7ee; color: #177a3d; }
    .tag.info { background: #eef3fd; color: #2b5db8; }
    .tag.warn { background: #fdf3e6; color: #a16114; }
    .tag.danger { background: #fdecec; color: #b71c1c; }
  `],
  imports: [NgIf],
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
  readonly nowText = signal(formatDate(new Date()))
  private readonly clock = setInterval(() => this.nowText.set(formatDate(new Date(), 'HH:mm:ss')), 1000)
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

  ngOnDestroy() { clearInterval(this.clock) }
}
