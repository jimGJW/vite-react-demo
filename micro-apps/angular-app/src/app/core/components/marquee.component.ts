import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core'

/**
 * MarqueeComponent —— 跑马灯（CSS 无缝滚动）
 *
 * 官方用法要点：内容复制一份 + translateX(-50%) 实现无缝；hover 暂停用 CSS 即可，
 * 但这里用 signal 演示「模板驱动 class」的写法。
 */
@Component({
  selector: 'ng-marquee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-vertical]': 'vertical()',
    '(mouseenter)': 'paused.set(true)',
    '(mouseleave)': 'paused.set(false)',
  },
  template: `
    <div class="ng-marquee__track" [class.is-paused]="paused()" [style.--dur]="speed() + 's'" [style.--gap.px]="gap()">
      @for (item of loopItems(); track $index) {
        <span class="ng-marquee__item">{{ item }}</span>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block; overflow: hidden;
      border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; padding: 7px 0;
    }
    .ng-marquee__track { display: flex; gap: var(--gap); width: max-content; animation: ng-scroll-x var(--dur) linear infinite; }
    .ng-marquee__track.is-paused { animation-play-state: paused; }
    .ng-marquee__item { font-size: 12.5px; color: #4b5563; white-space: nowrap; }
    @keyframes ng-scroll-x { from { transform: translateX(0); } to { transform: translateX(-50%); } }

    :host(.is-vertical) { height: 96px; }
    :host(.is-vertical) .ng-marquee__track { flex-direction: column; animation-name: ng-scroll-y; }
    @keyframes ng-scroll-y { from { transform: translateY(0); } to { transform: translateY(-50%); } }
  `],
})
export class MarqueeComponent {
  readonly items = input<string[]>([])
  readonly speed = input(40)
  readonly vertical = input(false)
  readonly gap = input(32)

  readonly paused = signal(false)
  /** 内容复制一份，配合 -50% 位移实现无缝衔接 */
  readonly loopItems = computed(() => [...this.items(), ...this.items()])
}
