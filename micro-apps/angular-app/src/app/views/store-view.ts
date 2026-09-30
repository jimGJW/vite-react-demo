import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ThemeService } from '../core/services/theme.service'
import { ToastService } from '../core/services/toast.service'
import { UndoRedoService } from '../core/services/undo-redo.service'
import { StorageService } from '../core/services/storage.service'
import { ProgressRingComponent } from '../core/components/progress-ring.component'
import { PIPES } from '../core/pipes'
import { createStore, formatBytes, formatDate } from '../../utils'

interface Card { id: string; col: string; text: string }
interface BoardState { cards: Card[] }

/**
 * Store 视图 —— 状态管理与持久化（全部走官方 DI 服务）
 *
 * 对照 vue-app 的 StorePage（自研 store）、主应用 React（Context + useReducer）：
 *   Angular 的答案就是 **DI 服务 + signal**：不用引任何状态库，
 *   把 signal 放进 `providedIn: 'root'` 的服务里，天然就是全局单例 + 可测试。
 */
@Component({
  selector: 'app-store-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ProgressRingComponent, ...PIPES],
  template: `
    <div class="sv">
      <header class="sv__head">
        <h1>状态管理与持久化 · Store</h1>
        <p>ThemeService / StorageService / UndoRedoService —— 官方 DI 单例 + signal，不引状态库</p>
      </header>

      <!-- 主题 -->
      <section class="ng-card">
        <h2>① ThemeService（signal + effect 自动持久化 + CSS 变量）</h2>
        <p class="ng-desc">
          改主题 → <code>effect()</code> 自动写 localStorage 并同步 <code>--ng-primary</code> / <code>--ng-radius</code>；
          刷新页面（或切到别的路由再回来）配置仍在。
        </p>
        <div class="sv__row">
          <span class="sv__label">主色</span>
          @for (c of theme.presets; track c) {
            <button
              class="sv__swatch"
              [style.background]="c"
              [class.is-active]="theme.primary() === c"
              (click)="theme.setPrimary(c)"
              [attr.title]="c"
            ></button>
          }
        </div>
        <div class="sv__row">
          <span class="sv__label">圆角 {{ theme.radius() }}px</span>
          <input type="range" min="0" max="20" [ngModel]="theme.radius()" (ngModelChange)="theme.setRadius(+$event)" />
          <label class="sv__ck">
            <input type="checkbox" [ngModel]="theme.compact()" (ngModelChange)="theme.toggleCompact()" /> 紧凑模式
          </label>
          <button class="ng-btn" (click)="theme.reset()">恢复默认</button>
          <button class="ng-btn ng-btn--danger" (click)="clearThemeCache()">清空本地缓存</button>
        </div>
        <div class="sv__preview" [style.border-color]="theme.primary()" [style.border-radius.px]="theme.radius()">
          <strong [style.color]="theme.primary()">预览卡片</strong>
          <span class="sv__hint">
            primary {{ theme.primary() }} · radius {{ theme.radius() }}px · compact {{ theme.compact() ? 'on' : 'off' }}
          </span>
        </div>
      </section>

      <!-- 存储用量 -->
      <section class="ng-card">
        <h2>② StorageService（统一前缀 + 异常兜底 + 用量统计）</h2>
        <p class="ng-desc">
          所有键自动带 <code>angular-app:</code> 前缀，避免与主应用 / 其它子应用撞名；
          localStorage 不可用时静默降级到内存 Map。
        </p>
        <div class="sv__row">
          <span class="ng-chip ng-chip--info">已用键 {{ storage.keys().length }} 个</span>
          <span class="ng-chip ng-chip--ok">占用 {{ storageBytes() }}</span>
          <button class="ng-btn" (click)="saveDraft()">写入一份草稿</button>
          <button class="ng-btn" (click)="loadDraft()">读回草稿</button>
          <button class="ng-btn ng-btn--danger" (click)="clearAll()">清空本应用全部键</button>
        </div>
        <ul class="sv__keys">
          @for (k of storage.keys(); track k) {
            <li><code>{{ k }}</code> = {{ previewOf(k) }}</li>
          } @empty {
            <li class="sv__empty">暂无存储键</li>
          }
        </ul>
        <p class="ng-desc" style="margin-top: 10px">最近读取结果：{{ draftRead() }}</p>
      </section>

      <!-- 撤销重做 -->
      <section class="ng-card">
        <h2>③ UndoRedoService（撤销栈，DI 单例）</h2>
        <p class="ng-desc">
          服务内部维护 past/future 两个快照栈；提供 <code>init/commit/undo/redo</code>。
          在组件 <code>providers: [UndoRedoService]</code> 里再 provide 一次就变成组件级私有栈 —— 作用域由 DI 决定。
        </p>
        <div class="sv__row">
          <button class="ng-btn ng-btn--primary" (click)="addCard()">新增卡片</button>
          <button class="ng-btn" (click)="moveCard()">移动首张（待办 → 进行中）</button>
          <button class="ng-btn" (click)="deleteCard()">删除最后一张</button>
          <button class="ng-btn" [disabled]="!undo.canUndo()" (click)="doUndo()">撤销（可退 {{ undo.historyCount() }} 步）</button>
          <button class="ng-btn" [disabled]="!undo.canRedo()" (click)="doRedo()">重做（{{ undo.futureCount() }}）</button>
          <span class="ng-chip ng-chip--info">当前卡片 {{ cards().length }}</span>
        </div>

        <div class="sv__board">
          @for (col of columns; track col.id) {
            <div class="sv__col">
              <div [class]="'sv__col-head sv__col-head--' + col.tone">{{ col.title }} · {{ byCol(col.id).length }}</div>
              @for (card of byCol(col.id); track card.id) {
                <div class="sv__carditem">{{ card.text }}</div>
              } @empty {
                <div class="sv__col-empty">暂无卡片</div>
              }
            </div>
          }
        </div>

        <div class="sv__row" style="margin-top: 12px">
          <span class="sv__label">操作流水</span>
          @for (t of timeline(); track $index) {
            <span class="ng-chip">{{ t.label }} {{ t.at | myDate: 'HH:mm:ss' }}</span>
          } @empty {
            <span class="ng-chip">（暂无）</span>
          }
        </div>
      </section>

      <!-- 纯函数 store -->
      <section class="ng-card">
        <h2>④ createStore（不依赖框架的纯函数 store）</h2>
        <p class="ng-desc">
          与 vue-app 的实现同源：<code>createStore(id, initial)</code> 返回 subscribe/set/reset，
          可在 Node 里直接单测，也能被 Angular/Vue/React 任一端消费。
        </p>
        <div class="sv__row">
          <button class="ng-btn ng-btn--primary" (click)="bump()">+1</button>
          <button class="ng-btn" (click)="pureStore.set({ count: 0, lastAction: 'reset' })">归零</button>
          <span class="ng-chip ng-chip--info">count = {{ pureCount() }}</span>
          <span class="ng-chip">订阅通知 {{ notifyCount() }} 次</span>
          <span class="ng-chip ng-chip--ok">快照 {{ pureSnapshot() }}</span>
        </div>
      </section>

      <!-- 进度环做用量可视化 -->
      <section class="ng-card">
        <h2>⑤ 用量可视化</h2>
        <div class="sv__row">
          <ng-progress-ring [percent]="storagePercent()" [size]="90" [stroke]="9"
            [tone]="storagePercent() > 70 ? 'danger' : 'primary'">
            <span class="sv__ring">{{ storagePercent() }}%</span>
          </ng-progress-ring>
          <div>
            <div class="sv__hint">localStorage 预估占用 {{ storageBytes() }}</div>
            <div class="sv__hint">演示阈值按 5MB 计算占比（浏览器实际配额通常更大）</div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .sv__head { margin-bottom: 16px; }
    .sv__head h1 { margin: 0 0 4px; font-size: 20px; color: #111827; }
    .sv__head p { margin: 0; font-size: 12.5px; color: #9ca3af; line-height: 1.8; }
    .sv__row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
    .sv__label { font-size: 12.5px; color: #6b7280; }
    .sv__swatch {
      width: 24px; height: 24px; border-radius: 6px; border: 2px solid transparent; cursor: pointer;
      box-shadow: 0 0 0 1px #e5e7eb;
    }
    .sv__swatch.is-active { border-color: #111827; }
    .sv__ck { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: #4b5563; }
    .sv__preview {
      margin-top: 12px; padding: 16px; border: 2px solid; background: #fff;
      display: flex; flex-direction: column; gap: 4px; transition: all 0.2s;
    }
    .sv__hint { font-size: 12px; color: #9ca3af; }
    .sv__keys { list-style: none; margin: 10px 0 0; padding: 0; font-size: 12px; max-height: 160px; overflow-y: auto; }
    .sv__keys li { padding: 4px 0; border-bottom: 1px dashed #f3f4f6; color: #4b5563; font-family: 'SF Mono', Monaco, monospace; }
    .sv__empty { color: #d1d5db; }
    .sv__board { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-top: 12px; }
    .sv__col { border: 1px solid #f3f4f6; border-radius: 8px; padding: 10px; background: #fcfdff; min-height: 110px; }
    .sv__col-head { font-size: 12.5px; font-weight: 600; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid #6366f1; }
    .sv__col-head--primary { border-color: #6366f1; color: #6366f1; }
    .sv__col-head--warn { border-color: #f59e0b; color: #b45309; }
    .sv__col-head--ok { border-color: #22c55e; color: #15803d; }
    .sv__carditem {
      padding: 7px 9px; border-radius: 6px; background: #fff; border: 1px solid #e5e7eb;
      font-size: 12.5px; color: #4b5563; margin-bottom: 6px;
    }
    .sv__col-empty { font-size: 12px; color: #d1d5db; text-align: center; padding: 14px 0; }
    .sv__ring { font-size: 16px; font-weight: 700; color: #111827; }
    code { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; color: #6366f1; background: #eef2ff; padding: 1px 5px; border-radius: 3px; }
  `],
})
export class StoreView {
  readonly theme = inject(ThemeService)
  readonly storage = inject(StorageService)
  readonly toast = inject(ToastService)
  readonly undo = inject(UndoRedoService<BoardState>)

  readonly columns = [
    { id: 'todo', title: '待办', tone: 'primary' },
    { id: 'doing', title: '进行中', tone: 'warn' },
    { id: 'done', title: '已完成', tone: 'ok' },
  ]

  readonly cards = signal<Card[]>([
    { id: 'c1', col: 'todo', text: '补齐路由与守卫' },
    { id: 'c2', col: 'doing', text: '接入 @angular/router' },
    { id: 'c3', col: 'done', text: 'qiankun 三项目拆分' },
  ])
  private seq = 0

  readonly draftRead = signal('（尚未读取）')

  /* —— 纯函数 store —— */
  readonly pureStore = createStore<{ count: number; lastAction: string }>('angular-demo', {
    count: 0,
    lastAction: 'init',
  })
  readonly notifyCount = signal(0)
  readonly pureCount = signal(0)
  readonly pureSnapshot = signal('')

  readonly storageBytes = computed(() => formatBytes(this.storage.usageBytes()))
  readonly storagePercent = computed(() => {
    const pct = Math.round((this.storage.usageBytes() / (5 * 1024 * 1024)) * 100)
    return Math.min(100, Math.max(1, pct))
  })

  constructor() {
    // 用 Router/DI 单例服务的快照栈初始化
    this.undo.init({ cards: this.cards() }, '初始状态')

    // 订阅纯函数 store 的变更通知
    this.pureStore.subscribe(() => {
      this.notifyCount.update((n) => n + 1)
      const snap = this.pureStore.getState() as { count: number; lastAction: string }
      this.pureCount.set(snap.count)
      this.pureSnapshot.set(`${snap.lastAction} · ${formatDate(new Date(), 'HH:mm:ss')}`)
    })
  }

  byCol(colId: string) {
    return this.cards().filter((c) => c.col === colId)
  }
  timeline() {
    return this.undo.timeline().slice(-6)
  }

  /* —— 主题 —— */
  clearThemeCache() {
    this.theme.clearPersisted()
    this.theme.reset()
    this.toast.success('已清空主题缓存并恢复默认')
  }

  /* —— 存储 —— */
  saveDraft() {
    this.storage.set('draft', { title: '未命名方案', tags: ['angular', 'signals'], at: new Date().toISOString() })
    this.toast.success('草稿已写入 localStorage')
  }
  loadDraft() {
    const d = this.storage.get<{ title: string }>('draft', { title: '（无）' })
    this.draftRead.set(JSON.stringify(d))
    this.toast.info('已读取草稿')
  }
  previewOf(k: string) {
    const v = this.storage.get<unknown>(k, null)
    return JSON.stringify(v)?.slice(0, 60) ?? 'null'
  }
  clearAll() {
    this.storage.clearAll()
    this.toast.warn('已清空本应用写入的全部键')
  }

  /* —— 撤销重做 —— */
  private commit(next: Card[], label: string) {
    this.undo.commit({ cards: this.cards() }, label)
    this.cards.set(next)
  }
  addCard() {
    this.seq += 1
    this.commit([...this.cards(), { id: `n${this.seq}${Date.now()}`, col: 'todo', text: `新任务 #${this.seq}` }], '新增卡片')
    this.toast.success('已新增卡片')
  }
  moveCard() {
    const first = this.cards().find((c) => c.col === 'todo')
    if (!first) {
      this.toast.warn('待办列没有卡片可移动')
      return
    }
    this.commit(this.cards().map((c) => (c.id === first.id ? { ...c, col: 'doing' } : c)), '移动卡片')
    this.toast.success(`已把「${first.text}」移到进行中`)
  }
  deleteCard() {
    const list = this.cards()
    if (!list.length) {
      this.toast.warn('没有可删除的卡片')
      return
    }
    this.commit(list.slice(0, -1), '删除卡片')
    this.toast.warn(`已删除「${list[list.length - 1].text}」`)
  }
  doUndo() {
    const prev = this.undo.undo('撤销')
    if (prev) {
      this.cards.set(prev.cards)
      this.toast.info('已撤销')
    }
  }
  doRedo() {
    const next = this.undo.redo()
    if (next) {
      this.cards.set(next.cards)
      this.toast.info('已重做')
    }
  }

  /* —— 纯函数 store —— */
  bump() {
    const cur = this.pureStore.getState() as { count: number }
    this.pureStore.set({ count: cur.count + 1, lastAction: 'bump' })
  }
}
