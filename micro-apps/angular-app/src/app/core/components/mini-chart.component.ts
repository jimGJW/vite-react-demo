import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { formatNumber } from '../../../utils'

export type ChartType = 'line' | 'area' | 'bar' | 'donut' | 'sparkline'
export interface DonutDatum { label: string; value: number; color?: string }

/**
 * MiniChartComponent —— 纯 SVG 图表（零依赖）
 *
 * Angular 官方写法要点：
 * - standalone + `input()` 信号输入：父组件传 `[data]="..."` 时自动变成信号，模板里 `data()` 读取
 * - ChangeDetectionStrategy.OnPush + 信号：只有输入信号变化才重渲染
 * - computed 派生几何数据，模板只负责画，逻辑全在 TS 里（便于单测）
 */
@Component({
  selector: 'ng-mini-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (type() !== 'donut') {
      <svg [attr.viewBox]="'0 0 300 ' + height()" preserveAspectRatio="none" class="ng-chart__svg">
        <defs>
          <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.35" />
            <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0" />
          </linearGradient>
        </defs>

        @if (showGrid()) {
          <g class="ng-chart__grid">
            @for (g of grids(); track g) {
              <line x1="0" x2="300" [attr.y1]="g" [attr.y2]="g" />
            }
          </g>
        }

        @if (type() === 'line' || type() === 'area' || type() === 'sparkline') {
          @if (type() === 'area') {
            <path [attr.d]="areaPath()" [attr.fill]="'url(#' + gradId + ')'" stroke="none" />
          }
          <path
            [attr.d]="linePath()" fill="none" [attr.stroke]="color()"
            [attr.stroke-width]="type() === 'sparkline' ? 1.5 : 2"
            stroke-linejoin="round" stroke-linecap="round"
          />
          @for (p of points(); track $index) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="2.5" [attr.fill]="color()" />
          }
        }

        @if (type() === 'bar') {
          @for (b of bars(); track $index) {
            <rect
              [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h"
              [attr.fill]="color()" rx="2" opacity="0.85"
            />
          }
        }
      </svg>
    } @else {
      <svg viewBox="0 0 120 120" class="ng-chart__svg ng-chart__svg--donut">
        <circle cx="60" cy="60" [attr.r]="R" fill="none" stroke="#f0f2f5" stroke-width="16" />
        @for (seg of donutSegments(); track seg.label) {
          <circle
            cx="60" cy="60" [attr.r]="R" fill="none"
            [attr.stroke]="seg.color" stroke-width="16"
            [attr.stroke-dasharray]="seg.len + ' ' + (CIRC - seg.len)"
            [attr.stroke-dashoffset]="-seg.offset"
            transform="rotate(-90 60 60)"
          />
        }
        <text x="60" y="58" text-anchor="middle" class="ng-chart__center">{{ centerText() }}</text>
        <text x="60" y="74" text-anchor="middle" class="ng-chart__center-sub">{{ centerSub() }}</text>
      </svg>

      @if (legend()) {
        <ul class="ng-chart__legend">
          @for (seg of donutSegments(); track seg.label) {
            <li>
              <i [style.background]="seg.color"></i>
              {{ seg.label }}
              <span class="ng-num">{{ seg.value }}</span>
            </li>
          }
        </ul>
      }
    }

    @if (type() !== 'donut' && labels().length) {
      <ul class="ng-chart__axis">
        @for (l of labels(); track $index) {
          <li>{{ l }}</li>
        }
      </ul>
    }
  `,
  styles: [`
    :host { display: block; }
    .ng-chart__svg { width: 100%; display: block; overflow: visible; }
    .ng-chart__svg--donut { max-width: 150px; margin: 0 auto; }
    .ng-chart__grid line { stroke: #f0f2f5; stroke-width: 1; stroke-dasharray: 3 4; }
    .ng-chart__center { font-size: 18px; font-weight: 700; fill: #111827; }
    .ng-chart__center-sub { font-size: 9px; fill: #9ca3af; }
    .ng-chart__axis {
      list-style: none; display: flex; justify-content: space-between;
      margin: 6px 0 0; padding: 0; font-size: 10px; color: #9ca3af;
    }
    .ng-chart__legend { list-style: none; margin: 10px 0 0; padding: 0; font-size: 12px; color: #4b5563; }
    .ng-chart__legend li { display: flex; align-items: center; gap: 6px; padding: 2px 0; }
    .ng-chart__legend i { width: 8px; height: 8px; border-radius: 2px; }
    .ng-chart__legend span { margin-left: auto; }
    .ng-num { font-variant-numeric: tabular-nums; }
  `],
})
export class MiniChartComponent {
  readonly type = input<ChartType>('line')
  readonly data = input<number[] | DonutDatum[]>([])
  readonly labels = input<string[]>([])
  readonly color = input('#6366f1')
  readonly height = input(120)
  readonly showGrid = input(true)
  readonly legend = input(true)
  readonly centerText = input('')
  readonly centerSub = input('')

  readonly W = 300
  readonly R = 46
  readonly CIRC = 2 * Math.PI * 46
  readonly gradId = `ngc-${Math.random().toString(36).slice(2, 8)}`
  /** 4 条水平网格线，跟随高度自适应 */
  readonly grids = computed(() => [1, 2, 3, 4].map((g) => (g * this.height()) / 4))

  /** 归一化数值：number[] 与 DonutDatum[] 都支持 */
  private readonly values = computed<number[]>(() => this.data().map((d) => (
    typeof d === 'number' ? d : Number(d.value) || 0
  )))

  readonly points = computed(() => {
    const vals = this.values()
    const n = vals.length
    const max = Math.max(1, ...vals) * 1.12
    const h = this.height()
    const span = max || 1
    const step = n > 1 ? this.W / (n - 1) : this.W
    return vals.map((v, i) => ({
      x: n > 1 ? i * step : this.W / 2,
      y: h - (v / span) * (h - 8) - 4,
      v,
    }))
  })

  readonly linePath = computed(() => this.points()
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' '))

  readonly areaPath = computed(() => {
    const pts = this.points()
    if (!pts.length) return ''
    const first = pts[0]
    const last = pts[pts.length - 1]
    return `${this.linePath()} L${last.x.toFixed(2)},${this.height()} L${first.x.toFixed(2)},${this.height()} Z`
  })

  readonly bars = computed(() => {
    const vals = this.values()
    const n = vals.length || 1
    const max = Math.max(1, ...vals) * 1.12
    const h = this.height()
    const slot = this.W / n
    const w = Math.max(2, slot * 0.62)
    return vals.map((v, i) => {
      const barH = Math.max(1, (v / max) * (h - 8))
      return { x: i * slot + (slot - w) / 2, y: h - barH - 2, w, h: barH, fmt: formatNumber(v) }
    })
  })

  private readonly palette = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#9ca3af', '#8e44ad']

  readonly donutSegments = computed(() => {
    const list = this.data()
    const vals = this.values()
    const total = vals.reduce((a, b) => a + b, 0) || 1
    let offset = 0
    return list.map((d, i) => {
      const value = vals[i]
      const len = (value / total) * this.CIRC
      const seg = {
        label: (typeof d === 'object' && d.label) || this.labels()[i] || `项 ${i + 1}`,
        value,
        color: (typeof d === 'object' && d.color) || this.palette[i % this.palette.length],
        len,
        offset,
      }
      offset += len
      return seg
    })
  })
}
