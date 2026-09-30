import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import {
  COMPONENT_REGISTRY, CountdownComponent, EllipsisComponent, MarqueeComponent,
  MiniChartComponent, StatCardComponent, TagInputComponent, TimelineComponent,
  VirtualListComponent, type TimelineNode,
} from '../core/components'
import { ToastService } from '../core/services/toast.service'
import { formatDate, range } from '../../utils'

/**
 * Kit 视图 —— 自有组件库总览（ng- 前缀，10 个组件）
 *
 * 与 vue-app 的 KitPage 结构一致，方便对照：
 *   Vue     `<MStatCard :value="..." />`（props）
 *   Angular `<ng-stat-card [value]="..." />`（input 信号）
 *   双向绑定：Vue `v-model` / Angular `[(value)]`（model() 信号）
 */
@Component({
  selector: 'app-kit-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MiniChartComponent, StatCardComponent, CountdownComponent, MarqueeComponent,
    EllipsisComponent, TimelineComponent, TagInputComponent, VirtualListComponent,
  ],
  template: `
    <div class="kit">
      <header class="kit__head">
        <h1>自有组件库 · Kit</h1>
        <p>
          {{ registry.length }} 个零依赖组件（ng- 前缀）——信号 input/output/model 驱动，
          与 vue-app 的 m-* 组件一一对应
        </p>
      </header>

      <section class="ng-card">
        <h2>组件目录</h2>
        <p class="ng-desc">全部 standalone，在 imports 数组里声明即可用；无任何第三方 UI 依赖。</p>
        <div class="kit__registry">
          @for (c of registry; track c.name) {
            <div class="kit__reg-item">
              <code class="kit__reg-name">&lt;{{ c.name }} /&gt;</code>
              <span class="kit__reg-label">{{ c.label }}</span>
              <span class="kit__reg-desc">{{ c.desc }}</span>
            </div>
          }
        </div>
      </section>

      <section class="ng-card">
        <h2>ng-stat-card 指标卡</h2>
        <p class="ng-desc">input() 声明式输入 + 内部组合 ng-mini-chart；涨红跌绿遵循国内市场约定。</p>
        <div class="kit__grid3">
          <ng-stat-card
            title="今日活跃用户" [value]="12840" unit="人" badge="实时"
            [trend]="8.6" tone="primary" [spark]="sparkA"
          />
          <ng-stat-card
            title="接口平均耗时" [value]="186" unit="ms"
            [trend]="-12.4" tone="ok" [spark]="sparkB"
          />
          <ng-stat-card
            title="待处理告警" [value]="7" unit="条" badge="P1"
            [trend]="3.1" tone="danger" [spark]="sparkC"
          />
        </div>
      </section>

      <section class="ng-card">
        <h2>ng-mini-chart 纯 SVG 图表</h2>
        <p class="ng-desc">computed 派生几何数据，模板只负责画 —— 几何逻辑可以脱离 DOM 单测。</p>
        <div class="kit__grid2">
          <div class="kit__panel">
            <div class="kit__panel-title">面积图 · 7 日请求量</div>
            <ng-mini-chart type="area" [data]="week" [labels]="weekLabels" [height]="130" color="#6366f1" />
          </div>
          <div class="kit__panel">
            <div class="kit__panel-title">柱状图 · 各框架占比</div>
            <ng-mini-chart type="bar" [data]="[38, 32, 18, 12]" [labels]="['Vue', 'React', 'Angular', '其它']" [height]="130" color="#22c55e" />
          </div>
          <div class="kit__panel">
            <div class="kit__panel-title">环形图 · 流量来源</div>
            <ng-mini-chart type="donut" [data]="donut" centerText="46%" centerSub="自然搜索" />
          </div>
          <div class="kit__panel">
            <div class="kit__panel-title">迷你走势（sparkline）</div>
            <ng-mini-chart type="sparkline" [data]="sparkA" [height]="60" color="#ef4444" [showGrid]="false" />
            <ng-mini-chart type="sparkline" [data]="sparkB" [height]="60" color="#22c55e" [showGrid]="false" />
          </div>
        </div>
      </section>

      <section class="ng-card">
        <h2>ng-progress-ring / ng-countdown</h2>
        <p class="ng-desc">Countdown 用 linkedSignal 从输入派生可写状态，用 output() 抛事件。</p>
        <div class="kit__grid2">
          <div class="kit__panel">
            <div class="kit__panel-title">倒计时（点击开始）</div>
            <ng-countdown [seconds]="45" (finish)="onCountdownEnd()" />
          </div>
          <div class="kit__panel">
            <div class="kit__panel-title">时间轴</div>
            <ng-timeline [nodes]="tlNodes" />
          </div>
        </div>
      </section>

      <section class="ng-card">
        <h2>ng-marquee / ng-ellipsis</h2>
        <div class="kit__grid2">
          <div class="kit__panel">
            <div class="kit__panel-title">跑马灯（hover 暂停）</div>
            <ng-marquee [items]="noticeList" [speed]="26" />
            <div class="kit__panel-title" style="margin-top: 12px">竖向跑马灯</div>
            <ng-marquee [items]="noticeList" [speed]="16" [vertical]="true" />
          </div>
          <div class="kit__panel">
            <div class="kit__panel-title">多行省略（viewChild 真实测量）</div>
            <ng-ellipsis [text]="longText" [lines]="2" />
          </div>
        </div>
      </section>

      <section class="ng-card">
        <h2>ng-tag-input（model() 双向绑定）</h2>
        <p class="ng-desc">父组件写 <code>[(value)]="tags"</code> —— 这是 Angular 官方双向绑定语法。</p>
        <ng-tag-input [(value)]="tags" [max]="6" placeholder="回车 / 逗号生成标签" />
        <p class="ng-desc" style="margin-top: 10px">父组件实时读到的值：{{ tags().join(' / ') || '（空）' }}</p>
      </section>

      <section class="ng-card">
        <h2>ng-virtual-list 虚拟滚动</h2>
        <p class="ng-desc">10000 行数据只渲染可视窗口；滚动时仅重算 computed 派生区间。</p>
        <ng-virtual-list [items]="bigList" [height]="240" />
      </section>

      <section class="ng-card">
        <h2>ToastService 全局提示</h2>
        <p class="ng-desc">
          服务（DI 单例）+ 单一宿主组件：任意组件 <code>inject(ToastService)</code> 就能弹提示，
          对比 React 的 Portal / Vue 的 Teleport。
        </p>
        <div class="kit__row">
          <button class="ng-btn" (click)="toast.info('这是一条普通提示')">info</button>
          <button class="ng-btn ng-btn--primary" (click)="toast.success('操作成功')">success</button>
          <button class="ng-btn" (click)="toast.warn('请注意检查输入')">warn</button>
          <button class="ng-btn ng-btn--danger" (click)="toast.error('请求失败，请重试')">error</button>
        </div>
        <div class="kit__row" style="margin-top: 10px">
          <span class="ng-chip ng-chip--info">队列中 {{ toast.items().length }} 条</span>
          <span class="ng-chip">最近一条：{{ lastToast() }}</span>
        </div>
        <div class="kit__panel" style="margin-top: 12px">
          <div class="kit__panel-title">不引 UI 库的分页表格（原生 table + computed 切片）</div>
          <table class="kit__table">
            <thead><tr><th>城市</th><th>房间数</th><th>告警</th><th>状态</th></tr></thead>
            <tbody>
              @for (row of nativePaged().rows; track row.name) {
                <tr>
                  <td>{{ row.name }}</td>
                  <td class="kit__num">{{ row.rooms }}</td>
                  <td class="kit__num">{{ row.alarms }}</td>
                  <td><span [class]="'ng-chip ng-chip--' + row.tone">{{ row.status }}</span></td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="kit__empty">本页无数据</td></tr>
              }
            </tbody>
          </table>
          <div class="kit__row">
            <button class="ng-btn" [disabled]="nativePaged().page <= 1" (click)="nativePage.update(v => v - 1)">上一页</button>
            <span class="ng-chip ng-chip--ok">第 {{ nativePaged().page }} / {{ nativePaged().pageCount }} 页</span>
            <button class="ng-btn" [disabled]="!nativePaged().hasNext" (click)="nativePage.update(v => v + 1)">下一页</button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .kit__head { margin-bottom: 16px; }
    .kit__head h1 { margin: 0 0 4px; font-size: 20px; color: #111827; }
    .kit__head p { margin: 0; font-size: 12.5px; color: #9ca3af; line-height: 1.8; }
    .kit__grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
    .kit__grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
    .kit__panel { border: 1px solid #f3f4f6; border-radius: 8px; padding: 12px; background: #fcfdff; }
    .kit__panel-title { font-size: 12.5px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }
    .kit__row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .kit__registry { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px; }
    .kit__reg-item {
      display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
      border: 1px solid #f3f4f6; border-radius: 7px; padding: 7px 10px; background: #fcfdff;
    }
    .kit__reg-name { font-size: 12px; color: #6366f1; font-family: 'SF Mono', Monaco, monospace; }
    .kit__reg-label { font-size: 12.5px; color: #111827; font-weight: 600; }
    .kit__reg-desc { font-size: 11.5px; color: #9ca3af; flex-basis: 100%; }
    .kit__table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .kit__table th, .kit__table td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #f3f4f6; }
    .kit__table th { color: #9ca3af; font-weight: 600; font-size: 12px; }
    .kit__num { font-variant-numeric: tabular-nums; }
    .kit__empty { text-align: center; color: #d1d5db; }
    code { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; color: #6366f1; background: #eef2ff; padding: 1px 5px; border-radius: 3px; }
  `],
})
export class KitView {
  readonly toast = inject(ToastService)
  readonly registry = COMPONENT_REGISTRY

  readonly sparkA = [12, 18, 15, 22, 26, 24, 31, 36]
  readonly sparkB = [42, 39, 36, 33, 30, 28, 24, 22]
  readonly sparkC = [2, 3, 3, 4, 5, 6, 6, 7]

  readonly weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  readonly week = [320, 452, 380, 510, 610, 720, 688]
  readonly donut = [
    { label: '自然搜索', value: 46, color: '#6366f1' },
    { label: '直接访问', value: 28, color: '#22c55e' },
    { label: '外部链接', value: 18, color: '#f59e0b' },
    { label: '社交分享', value: 8, color: '#ef4444' },
  ]

  readonly noticeList = [
    'Angular 22 默认 Standalone 与 Signals',
    'qiankun 子应用必须导出 bootstrap/mount/unmount',
    'linkedSignal 用于「由输入派生但可写」的状态',
    'ModelSignal 让 [(value)] 双向绑定成为官方语法',
  ]
  readonly longText = '这是一段用来演示多行省略的长文本。组件用 viewChild 拿到真实 DOM，先量截断态高度、再临时放开量完整高度，只有确实溢出才渲染「展开」按钮——避免「文字本来就不长却显示展开」的假交互。'

  readonly tlNodes: TimelineNode[] = [
    { title: '提交申请', time: formatDate(Date.now() - 86400000 * 2, 'MM-DD HH:mm'), desc: '由 gujiawei 发起', tone: 'ok' },
    { title: '部门审批', time: formatDate(Date.now() - 86400000, 'MM-DD HH:mm'), desc: '审批通过，进入风控复核', tone: 'ok' },
    { title: '风控复核', time: formatDate(Date.now() - 3600000, 'MM-DD HH:mm'), desc: '发现 1 项资料缺失，已退回补充', tone: 'warn' },
    { title: '待处理', desc: '等待申请人重新提交', tone: 'danger' },
  ]

  readonly tags = signal(['前端', '微前端'])
  readonly bigList = range(10000).map((i) => `虚拟行数据 #${i + 1} · ${['高优先级', '普通', '低优先级'][i % 3]}`)

  /** 原生分页表格（不引 UI 库） */
  readonly nativePage = signal(1)
  private readonly nativeRows = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州']
    .map((name, i) => ({
      name,
      rooms: 40 + ((i * 17) % 260),
      alarms: (i * 7) % 14,
      status: ['正常', '告警', '离线'][i % 3],
      tone: ['ok', 'danger', 'info'][i % 3],
    }))
  readonly nativePaged = computed(() => {
    const size = 4
    const pageCount = Math.max(1, Math.ceil(this.nativeRows.length / size))
    const page = Math.min(Math.max(1, this.nativePage()), pageCount)
    const start = (page - 1) * size
    return {
      rows: this.nativeRows.slice(start, start + size),
      page, pageCount,
      hasNext: page < pageCount,
    }
  })

  readonly lastToast = computed(() => {
    const list = this.toast.items()
    return list.length ? list[list.length - 1].text : '（暂无）'
  })

  onCountdownEnd() {
    this.toast.success('倒计时结束！')
  }
}
