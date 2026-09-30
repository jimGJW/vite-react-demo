import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal, viewChild,
} from '@angular/core'
import type { IsActiveMatchOptions } from '@angular/router'
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { filter } from 'rxjs'
import { ToastHostComponent } from './core/components/toast-host.component'
import { MENU_GROUPS, MENU_ITEMS } from './view-state'
import { filterNavGroups } from '../utils'
import { recordRoute } from './app.config'
import { qiankunWindow } from 'vite-plugin-qiankun/es/helper'

/**
 * 应用外壳 —— 官方 Router + Standalone Component
 *
 * - 页内导航**常驻显示**：被 qiankun 融合时，主应用侧边栏的子应用菜单是异步注册的、
 *   且在宿主页之外，子应用内部原本看不到任何路由入口。
 * - 导航条是「顶栏 + 分组行」两段式：顶栏放品牌/当前页/过滤/模式；分组行每行一组，
 *   组名独立成定宽左栏 → 链接从同一条竖线开始，形成对齐网格（这就是"整齐"的来源）。
 * - 订阅 Router 事件做「跳转轨迹记账」，同时把当前路由暴露为只读 signal。
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ng-page">
      <header class="ng-header">
        <h1>Angular 子应用</h1>
        <p class="ng-subtitle">Standalone Component · Signals · DI · RxJS · 官方 Router</p>
        <span class="ng-badge">official · &#64;angular/router</span>
      </header>

      <nav class="ng-tabs">
        <!-- —— 顶栏：信息密度最高的部分固定住，不参与换行 —— -->
        <div class="ng-tabs__bar">
          <span class="ng-tabs__brand">
            <span class="ng-tabs__logo">A</span>
            Angular 子应用
          </span>

          <span class="ng-tabs__current">
            <em>当前页</em>
            <b>{{ currentTitle() }}</b>
          </span>

          <span class="ng-tabs__spacer"></span>

          <!-- 菜单过滤：链接变多后，按名字/路径定位比肉眼扫更快 -->
          <label class="ng-tabs__filter">
            <span class="ng-tabs__filter-icon" aria-hidden="true">⌕</span>
            <input
              #filterInput
              class="ng-tabs__filter-input"
              type="text"
              placeholder="过滤菜单（按 / 聚焦）"
              [value]="keyword()"
              (input)="onFilter($event)"
              (keydown.enter)="gotoFirstMatch()"
              (keydown.escape)="keyword.set('')"
            />
            @if (keyword()) {
              <button class="ng-tabs__filter-clear" type="button" (click)="keyword.set('')">×</button>
            }
          </label>

          <span [class]="standalone ? 'ng-tabs__mode' : 'ng-tabs__mode is-embedded'">
            {{ standalone ? '独立运行' : 'qiankun 融合中' }}
          </span>
          <a class="ng-tab ng-tab--muted" routerLink="/not-exist-demo">404 演示</a>
        </div>

        <!-- —— 分组行：组名是定宽左栏，链接在右栏自动换行 —— -->
        <div class="ng-tabs__rows">
          @for (group of visibleGroups(); track group.name) {
            <div class="ng-tabs__row" [class.is-current]="group.name === activeGroup()">
              <span class="ng-tabs__row-name">{{ group.name }}</span>
              <span class="ng-tabs__row-links">
                @for (item of group.items; track item.path) {
                  <a
                    class="ng-tab"
                    [routerLink]="item.path"
                    routerLinkActive="is-active"
                    [routerLinkActiveOptions]="activeMatchOptions"
                  >{{ item.label }}</a>
                }
              </span>
            </div>
          }
          @if (!visibleGroups().length) {
            <p class="ng-tabs__empty">没有匹配「{{ keyword() }}」的菜单，按 Esc 清空</p>
          }
        </div>
      </nav>

      <!-- 官方 Router 出口：视图组件由 loadComponent 懒加载 -->
      <router-outlet />

      <footer class="ng-footer">
        <p>Angular 22 · Standalone · Signals · &#64;switch/&#64;for/&#64;if · &#64;angular/router（hash 模式）</p>
        <p>当前路由：{{ currentUrl() }} · 独立工程（端口 7102）· 由主应用通过 qiankun 运行时融合</p>
        <p class="ng-footer__log">最近跳转：{{ recentLog() }}</p>
      </footer>
    </div>

    <!-- 全局提示宿主：任意组件 inject(ToastService) 即可弹提示 -->
    <ng-toast-host />
  `,
})
export class AppComponent {
  private readonly router = inject(Router)

  readonly menuGroups = MENU_GROUPS
  readonly standalone = !qiankunWindow.__POWERED_BY_QIANKUN__

  private readonly filterInput = viewChild<ElementRef<HTMLInputElement>>('filterInput')

  /**
   * 页内导航的选中判定。
   * 不用 `{ exact: true }` 简写 —— 那个简写会把 queryParams 也纳入精确比较，
   * 于是 `canActivate` 改道到 `/login?redirect=/guarded` 后，「登录」这一条反而不高亮。
   * 显式声明「路径精确、query 忽略」：路径对得上就算当前页。
   */
  readonly activeMatchOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  }

  private readonly url = signal(this.router.url)
  private readonly logs = signal<string[]>([])

  readonly currentUrl = computed(() => this.url())
  readonly recentLog = computed(() => this.logs().join(' → ') || '（暂无）')

  /* —— 菜单过滤 —— */
  readonly keyword = signal('')
  readonly visibleGroups = computed(() => filterNavGroups(this.menuGroups, this.keyword()))

  onFilter(e: Event) {
    this.keyword.set((e.target as HTMLInputElement).value)
  }

  /** 回车 → 直接跳到第一条匹配项（省掉鼠标移动） */
  gotoFirstMatch() {
    const first = this.visibleGroups()[0]?.items[0]
    if (first) this.router.navigateByUrl(first.path)
  }

  /**
   * 按 `/` 聚焦过滤框（不在输入态时）—— 命令面板式的最低成本键盘可达性。
   * 放在 window 上监听，是因为过滤框本身此时可能还没获得焦点。
   */
  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(e: KeyboardEvent) {
    if (e.key !== '/') return
    const el = document.activeElement as HTMLElement | null
    const tag = el?.tagName
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || Boolean(el?.isContentEditable)
    if (typing) return
    e.preventDefault()
    this.filterInput()?.nativeElement.focus()
  }

  /** 当前路由命中的菜单项（精确优先，其次按最长前缀归属） */
  private readonly currentItem = computed(() => {
    const path = this.url().split('?')[0].split('#')[0]
    return (
      MENU_ITEMS.find((i) => i.path === path) ||
      MENU_ITEMS.filter((i) => path.startsWith(i.path)).sort((a, b) => b.path.length - a.path.length)[0]
    )
  })

  /**
   * 不在菜单里的页面（如 `**` 兜底的 404，其 data.hidden 为 true 故被 MENU_ITEMS 过滤掉）
   * 拿不到菜单文案 —— 退回到 ActivatedRoute 树最深一层的 `data.title`。
   * 不这么兜底的话，404 页的徽标会退化成光秃秃的"当前页 页面"。
   */
  private readonly routedTitle = computed(() => {
    this.url() // 依赖路由变化：NavigationEnd 之后 routerState 才是新状态
    let route = this.router.routerState.root
    while (route.firstChild) route = route.firstChild
    return (route.snapshot.data['title'] as string) || ''
  })

  /** 当前页标题（直接查菜单注册表，保证与页内导航文案一致） */
  readonly currentTitle = computed(() => this.currentItem()?.label || this.routedTitle() || '页面')

  /** 当前路由落在哪个分组 —— 用于把该分组那一行整体点亮 */
  readonly activeGroup = computed(() => this.currentItem()?.group || '')

  constructor() {
    // RxJS 订阅 Router 事件 —— 官方推荐的「路由变化副作用」落点
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.url.set(e.urlAfterRedirects)
        recordRoute(e.urlAfterRedirects)
        this.logs.update((l) => [e.urlAfterRedirects, ...l].slice(0, 6))
      })
  }
}
