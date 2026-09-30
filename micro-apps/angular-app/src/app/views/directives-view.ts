import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common'
import { DIRECTIVE_REGISTRY, PIPES } from '../core'
import { ToastService } from '../core/services/toast.service'
import {
  ClickOutsideDirective, CopyDirective, DebounceClickDirective, DraggableDirective,
  LazyDirective, LongpressDirective, ThrottleScrollDirective,
} from '../core/directives'
import { randomId } from '../../utils'

/**
 * Directives 视图 —— 自定义指令 + 自定义管道
 *
 * 官方用法要点：
 * - 指令在 `imports: [...]` 里声明后即可在模板当属性使用：`[appCopy]="..."`、`(appDebounceClick)="..."`
 * - `@HostListener` 声明宿主事件，`@Output()` 把事件回抛给模板（比在指令里直接 addEventListener 更"框架原生"）
 * - `@Input('appXxx')` 别名让指令既能传值又能配对使用
 */
@Component({
  selector: 'app-directives-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CopyDirective, LongpressDirective, DebounceClickDirective, ThrottleScrollDirective,
    LazyDirective, ClickOutsideDirective, DraggableDirective,
    DatePipe, DecimalPipe, CurrencyPipe, TitleCasePipe,
    ...PIPES,
  ],
  template: `
    <div class="dv">
      <header class="dv__head">
        <h1>自定义指令与管道</h1>
        <p>
          {{ registry.length }} 个指令 + {{ pipeCount }} 个管道（src/app/core/directives & pipes），
          全部 standalone，imports 即可用
        </p>
      </header>

      <!-- 目录 -->
      <section class="ng-card">
        <h2>指令目录</h2>
        <table class="dv__table">
          <thead><tr><th>指令</th><th>用法</th><th>说明</th></tr></thead>
          <tbody>
            @for (d of registry; track d.name) {
              <tr>
                <td><code>{{ d.name }}</code></td>
                <td><code class="dv__usage">{{ d.usage }}</code></td>
                <td>{{ d.desc }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <!-- appCopy / appLongpress -->
      <section class="ng-card">
        <h2>appCopy / appLongpress</h2>
        <p class="ng-desc">appCopy 点击即复制（成功后加 ng-copied 类显示「已复制」气泡）；appLongpress 长按 600ms 触发。</p>
        <div class="dv__row">
          <span [appCopy]="inviteCode" class="dv__code">{{ inviteCode }}</span>
          <span appCopy="https://angular.dev/guide/directives" class="dv__code">复制官方文档链接</span>
          <button class="ng-btn" (click)="inviteCode.set(randomId('INV'))">换一个邀请码</button>
        </div>
        <div class="dv__row">
          <button class="ng-btn ng-btn--primary" (appLongpress)="onLongpress()" (click)="onShortClick()">
            长按我 600ms（点击算短按）
          </button>
          <span class="ng-chip ng-chip--info">{{ pressTip() }}</span>
        </div>
      </section>

      <!-- appDebounceClick / appThrottleScroll -->
      <section class="ng-card">
        <h2>appDebounceClick / appThrottleScroll</h2>
        <p class="ng-desc">
          指令用 <code>@Output()</code> 把「处理后的高频事件」回抛给模板 —— 业务组件不用自己引 debounce/throttle。
        </p>
        <div class="dv__row">
          <button class="ng-btn ng-btn--primary" (appDebounceClick)="onDebounced()" (click)="clickRaw.update(v => v + 1)">
            防抖按钮（{{ hit() }} 次生效 / {{ clickRaw() }} 次点击）
          </button>
        </div>
        <div class="dv__scroll" (appThrottleScroll)="onScrolled()">
          @for (i of scrollRows; track i) {
            <div class="dv__scroll-row">滚动行 {{ i }} · 节流回调已触发 {{ scrollHits() }} 次</div>
          }
        </div>
      </section>

      <!-- appLazy -->
      <section class="ng-card">
        <h2>appLazy（IntersectionObserver）</h2>
        <p class="ng-desc">元素进入视口才加 ng-visible 类，可同时用 (appLazyVisible) 拿到首次可见时机。</p>
        <div class="dv__lazy-wrap">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div [appLazy]="'20px'" (appLazyVisible)="onLazyVisible()" class="dv__lazy-box">
              <span class="dv__lazy-no">{{ i }}</span>
              <span>滚动到此处才渐显（第 {{ i }} 块）</span>
            </div>
          }
        </div>
        <span class="ng-chip ng-chip--ok">已进入视口回调触发 {{ lazyHits() }} 次（共 6 块）</span>
      </section>

      <!-- appClickOutside / appDraggable -->
      <section class="ng-card">
        <h2>appClickOutside / appDraggable</h2>
        <div class="dv__grid2">
          <div class="dv__panel">
            <div class="dv__panel-title">appClickOutside（点击外部收起）</div>
            <button class="ng-btn" (click)="menuOpen.set(!menuOpen())">切换下拉面板</button>
            @if (menuOpen()) {
              <div class="dv__menu" (appClickOutside)="closeMenu()">
                <div class="dv__menu-item">配置中心</div>
                <div class="dv__menu-item">报表中心</div>
                <div class="dv__menu-item">监控大盘</div>
                <div class="dv__menu-hint">点击面板外部任意处收起（{{ outsideHits() }}）</div>
              </div>
            }
          </div>
          <div class="dv__panel">
            <div class="dv__panel-title">appDraggable（限制父容器内）</div>
            <div class="dv__stage">
              <div appDraggable class="dv__dragbox">拖我 🖱️</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 管道 -->
      <section class="ng-card">
        <h2>自定义管道（{{ pipeCount }} 个）</h2>
        <p class="ng-desc">纯管道会按输入缓存；模板里可以放心用，不会每次变更检测都重算。</p>
        <div class="dv__row">
          <input class="ng-input" [value]="keyword()" (input)="keyword.set($any($event.target).value)" placeholder="输入关键字试试 highlight 管道" />
        </div>
        <table class="dv__table">
          <thead><tr><th>管道</th><th>输入</th><th>输出</th></tr></thead>
          <tbody>
            <tr>
              <td><code>highlight</code></td>
              <td>{{ longText | truncate: 26 }}</td>
              <td><span [innerHTML]="longText | truncate: 40 | highlight: keyword()"></span></td>
            </tr>
            <tr><td><code>fileSize</code></td><td>1536000</td><td>{{ 1536000 | fileSize }}</td></tr>
            <tr><td><code>relativeTime</code></td><td>1 小时前的时间戳</td><td>{{ oneHourAgo | relativeTime }}</td></tr>
            <tr><td><code>truncate</code></td><td>{{ longText.slice(0, 18) }}…</td><td>{{ longText | truncate: 18 }}</td></tr>
            <tr><td><code>thousands</code></td><td>1234567.891</td><td>{{ 1234567.891 | thousands: 2 }}</td></tr>
            <tr><td><code>abbrev</code></td><td>123456789</td><td>{{ 123456789 | abbrev }}</td></tr>
            <tr><td><code>statusText</code></td><td>alarm</td><td>{{ 'alarm' | statusText }}</td></tr>
            <tr><td><code>myDate</code></td><td>now</td><td>{{ now | myDate: 'YYYY-MM-DD HH:mm' }}</td></tr>
          </tbody>
        </table>
      </section>

      <!-- 内置管道对照 -->
      <section class="ng-card">
        <h2>内置管道对照（date / number / currency）</h2>
        <table class="dv__table">
          <thead><tr><th>表达式</th><th>输出</th></tr></thead>
          <tbody>
            <tr><td><code>now | date: 'yyyy-MM-dd HH:mm:ss'</code></td><td>{{ now | date: 'yyyy-MM-dd HH:mm:ss' }}</td></tr>
            <tr><td><code>1280.5 | number: '1.2-2'</code></td><td>{{ 1280.5 | number: '1.2-2' }}</td></tr>
            <tr><td><code>1280.5 | currency: 'CNY'</code></td><td>{{ 1280.5 | currency: 'CNY' }}</td></tr>
            <tr><td><code>'angular' | titlecase</code></td><td>{{ 'angular app' | titlecase }}</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: [`
    .dv__head { margin-bottom: 16px; }
    .dv__head h1 { margin: 0 0 4px; font-size: 20px; color: #111827; }
    .dv__head p { margin: 0; font-size: 12.5px; color: #9ca3af; line-height: 1.8; }
    .dv__row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
    .dv__grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
    .dv__panel { border: 1px solid #f3f4f6; border-radius: 8px; padding: 12px; background: #fcfdff; }
    .dv__panel-title { font-size: 12.5px; font-weight: 600; color: #4b5563; margin-bottom: 10px; }
    .dv__table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .dv__table th, .dv__table td { text-align: left; padding: 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    .dv__table th { color: #9ca3af; font-weight: 600; font-size: 12px; }
    .dv__code {
      display: inline-block; padding: 6px 12px; border-radius: 6px;
      border: 1px dashed #c7d2fe; background: #f8faff; color: #6366f1;
      font-family: 'SF Mono', Monaco, monospace; font-size: 12.5px; position: relative; cursor: pointer;
    }
    .dv__scroll { height: 150px; overflow-y: auto; margin-top: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafcff; }
    .dv__scroll-row { padding: 6px 12px; font-size: 12.5px; color: #4b5563; border-bottom: 1px solid #f9fafb; }
    .dv__lazy-wrap { display: grid; gap: 8px; margin-bottom: 10px; }
    .dv__lazy-box { display: flex; align-items: center; gap: 10px; padding: 14px; }
    .dv__lazy-no {
      width: 22px; height: 22px; border-radius: 50%; background: #6366f1; color: #fff; font-size: 11px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .dv__menu {
      position: absolute; z-index: 5; margin-top: 6px; min-width: 150px;
      border: 1px solid #e5e7eb; border-radius: 8px; background: #fff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); overflow: hidden;
    }
    .dv__menu-item { padding: 8px 12px; font-size: 12.5px; color: #4b5563; cursor: pointer; }
    .dv__menu-item:hover { background: #f8faff; color: #6366f1; }
    .dv__menu-hint { padding: 6px 12px; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
    .dv__stage {
      position: relative; height: 150px; border-radius: 10px; overflow: hidden;
      border: 1px dashed #c7d2fe;
      background: repeating-linear-gradient(45deg, #f8faff, #f8faff 10px, #eef2ff 10px, #eef2ff 20px);
    }
    .dv__dragbox {
      position: absolute; top: 12px; left: 12px; padding: 14px 20px; border-radius: 10px;
      background: #6366f1; color: #fff; font-size: 13px; font-weight: 600;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }
    code { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; color: #6366f1; background: #eef2ff; padding: 1px 5px; border-radius: 3px; }
    .dv__usage { color: #8e44ad; background: #faf5ff; }
  `],
})
export class DirectivesView {
  private readonly toast = inject(ToastService)

  readonly registry = DIRECTIVE_REGISTRY
  readonly pipeCount = PIPES.length

  readonly inviteCode = signal(randomId('INV'))
  readonly pressTip = signal('等待操作…')
  readonly randomId = randomId

  readonly clickRaw = signal(0)
  readonly hit = signal(0)
  readonly scrollHits = signal(0)
  readonly scrollRows = Array.from({ length: 40 }, (_, i) => i + 1)

  readonly lazyHits = signal(0)

  readonly menuOpen = signal(false)
  readonly outsideHits = signal(0)

  readonly keyword = signal('Angular')
  readonly longText = 'Angular 的自定义指令用 @HostListener 声明宿主事件、用 @Output 把处理后的结果回抛给模板，比在指令里直接 addEventListener 更符合框架约定，也天然参与变更检测。'
  readonly oneHourAgo = Date.now() - 3600_000
  readonly now = new Date()

  onLongpress() {
    this.pressTip.set('触发长按！')
    this.toast.success('长按生效（600ms）')
  }

  onShortClick() {
    this.pressTip.set('触发短按')
    this.toast.info('短按：执行普通点击逻辑')
  }

  onDebounced() {
    this.hit.update((v) => v + 1)
    this.toast.success(`防抖回调执行第 ${this.hit()} 次`)
  }

  onScrolled() {
    this.scrollHits.update((v) => v + 1)
  }

  onLazyVisible() {
    this.lazyHits.update((v) => v + 1)
  }

  closeMenu() {
    this.menuOpen.set(false)
    this.outsideHits.update((v) => v + 1)
  }
}
