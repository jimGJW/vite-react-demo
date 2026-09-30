import {
  ChangeDetectionStrategy, Component, computed, input, signal,
} from '@angular/core'

/**
 * VirtualListComponent —— 虚拟滚动（只渲染可视窗口）
 *
 * 官方用法要点：
 * - `signal` 记录 scrollTop，`computed` 派生可见区间 → OnPush 下只有滚动时重算
 * - `track` 用全局行号做 key，保证 DOM 复用正确（列表滚动性能的关键）
 */
@Component({
  selector: 'ng-virtual-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ng-vl" [style.height.px]="height()" (scroll)="onScroll($event)">
      <div class="ng-vl__phantom" [style.height.px]="totalHeight()"></div>
      <div class="ng-vl__window" [style.transform]="'translateY(' + offsetY() + 'px)'">
        @for (row of visible(); track row.index) {
          <div class="ng-vl__row" [style.height.px]="itemSize()">
            <span class="ng-vl__idx">#{{ row.index + 1 }}</span>
            <span>{{ row.text }}</span>
          </div>
        }
      </div>
      <div class="ng-vl__hud">
        <span class="ng-chip ng-chip--info">总数 {{ items().length }}</span>
        <span class="ng-chip ng-chip--ok">已渲染 {{ visible().length }}</span>
        <span class="ng-chip">滚动 {{ scrollTop() }}px</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ng-vl {
      position: relative; overflow-y: auto;
      border: 1px solid #e5e7eb; border-radius: 8px; background: #fff;
    }
    .ng-vl__phantom { width: 1px; opacity: 0; }
    .ng-vl__window { position: absolute; top: 0; left: 0; right: 0; will-change: transform; }
    .ng-vl__row {
      display: flex; align-items: center; gap: 10px;
      padding: 0 12px; font-size: 12.5px; color: #4b5563;
      border-bottom: 1px solid #f9fafb; box-sizing: border-box;
    }
    .ng-vl__idx { color: #d1d5db; font-variant-numeric: tabular-nums; min-width: 48px; }
    .ng-vl__hud {
      position: sticky; bottom: 0; display: flex; gap: 6px;
      padding: 6px 8px; background: rgba(255, 255, 255, 0.92); border-top: 1px solid #f3f4f6;
    }
  `],
})
export class VirtualListComponent {
  /** items 支持 string[] 或 { text }[] */
  readonly items = input<(string | { text: string })[]>([])
  readonly itemSize = input(34)
  readonly height = input(300)
  readonly overscan = input(4)

  readonly scrollTop = signal(0)

  readonly totalHeight = computed(() => this.items().length * this.itemSize())
  readonly startIndex = computed(() => Math.max(0, Math.floor(this.scrollTop() / this.itemSize()) - this.overscan()))
  readonly visibleCount = computed(() => Math.ceil(this.height() / this.itemSize()) + this.overscan() * 2)
  readonly endIndex = computed(() => Math.min(this.items().length, this.startIndex() + this.visibleCount()))
  readonly offsetY = computed(() => this.startIndex() * this.itemSize())

  readonly visible = computed(() => this.items()
    .slice(this.startIndex(), this.endIndex())
    .map((item, i) => ({
      index: this.startIndex() + i,
      text: typeof item === 'string' ? item : item.text,
    })))

  onScroll(e: Event) {
    this.scrollTop.set(Math.round((e.target as HTMLElement).scrollTop))
  }
}
