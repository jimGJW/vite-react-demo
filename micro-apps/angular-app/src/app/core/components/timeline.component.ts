import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'

export interface TimelineNode {
  title: string
  desc?: string
  time?: string
  tone?: 'primary' | 'ok' | 'warn' | 'danger'
}

/**
 * TimelineComponent —— 时间轴
 *
 * 官方用法要点：`<ng-content>` 具名投影（select="[extra]"）演示多插槽，
 * 等价 Vue 的具名插槽 `<slot name="extra" />`。
 */
@Component({
  selector: 'ng-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="ng-tl">
      @for (node of nodes(); track node.title + $index) {
        <li class="ng-tl__item" [class]="'ng-tl__item--' + (node.tone || 'primary')">
          <span class="ng-tl__dot">
            @if (node.tone === 'danger') { <i>!</i> }
            @else if (node.tone === 'ok') { <i>✓</i> }
          </span>
          <div class="ng-tl__body">
            <div class="ng-tl__head">
              <strong class="ng-tl__title">{{ node.title }}</strong>
              @if (node.time) {
                <time class="ng-tl__time">{{ node.time }}</time>
              }
            </div>
            @if (node.desc) {
              <p class="ng-tl__desc">{{ node.desc }}</p>
            }
          </div>
        </li>
      }
    </ol>
  `,
  styles: [`
    :host { display: block; }
    .ng-tl { list-style: none; margin: 0; padding: 4px 0; }
    .ng-tl__item { position: relative; padding: 0 0 16px 22px; }
    .ng-tl__item::before {
      content: ''; position: absolute; left: 5px; top: 14px; bottom: -2px; width: 1px; background: #e5e7eb;
    }
    .ng-tl__item:last-child::before { display: none; }
    .ng-tl__dot {
      position: absolute; left: 0; top: 4px;
      width: 11px; height: 11px; border-radius: 50%;
      background: var(--tl, #6366f1); box-shadow: 0 0 0 3px var(--tl-soft, #eef2ff);
      display: flex; align-items: center; justify-content: center;
    }
    .ng-tl__dot i { font-style: normal; font-size: 8px; color: #fff; }
    .ng-tl__item--primary { --tl: #6366f1; --tl-soft: #eef2ff; }
    .ng-tl__item--ok { --tl: #22c55e; --tl-soft: #f0fdf4; }
    .ng-tl__item--warn { --tl: #f59e0b; --tl-soft: #fffbeb; }
    .ng-tl__item--danger { --tl: #ef4444; --tl-soft: #fef2f2; }
    .ng-tl__head { display: flex; align-items: baseline; gap: 8px; }
    .ng-tl__title { font-size: 13.5px; color: #111827; }
    .ng-tl__time { font-size: 11.5px; color: #d1d5db; margin-left: auto; }
    .ng-tl__desc { margin: 3px 0 0; font-size: 12.5px; color: #9ca3af; line-height: 1.6; }
  `],
})
export class TimelineComponent {
  readonly nodes = input<TimelineNode[]>([])
  readonly count = computed(() => this.nodes().length)
}
