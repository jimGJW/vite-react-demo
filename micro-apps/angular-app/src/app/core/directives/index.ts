import {
  Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, inject,
} from '@angular/core'
import { copyText, debounce, throttle } from '../../../utils'

/**
 * 自定义指令（Directive）—— Angular 官方最擅长的一层
 *
 * 与 vue-app 的自定义指令一一对应（v-xxx / [appXxx]）：
 *   Vue:     v-copy="'文本'"        Angular: [appCopy]="'文本'"
 *   Vue:     v-debounce:click="fn"  Angular: (appDebounceClick)="fn()"
 *   Angular 用 @HostListener 声明宿主事件，用 @Output 把事件回抛给模板，
 *   比 Vue 直接 addEventListener 更"框架原生"，也自动参与变更检测。
 */

/** [appCopy]：点击宿主元素复制文本（复制成功加 ng-copied 类做反馈） */
@Directive({ selector: '[appCopy]', standalone: true })
export class CopyDirective {
  @Input('appCopy') text = ''
  private readonly host = inject(ElementRef<HTMLElement>)

  @HostListener('click')
  async onClick() {
    const el = this.host.nativeElement
    const payload = this.text || el.textContent || ''
    const ok = await copyText(payload)
    if (!ok) return
    el.classList.add('ng-copied')
    el.setAttribute('data-copy-tip', '已复制')
    setTimeout(() => {
      el.classList.remove('ng-copied')
      el.removeAttribute('data-copy-tip')
    }, 1200)
  }
}

/** (appDebounceClick)：宿主点击防抖（连点只触发一次） */
@Directive({ selector: '[appDebounceClick]', standalone: true })
export class DebounceClickDirective implements OnInit, OnDestroy {
  @Input() debounceWait = 400
  @Output() appDebounceClick = new EventEmitter<MouseEvent>()
  private readonly host = inject(ElementRef<HTMLElement>)
  private handler: ((e: MouseEvent) => void) | null = null

  ngOnInit() {
    this.handler = debounce((e: MouseEvent) => this.appDebounceClick.emit(e), this.debounceWait)
    this.host.nativeElement.addEventListener('click', this.handler)
    this.host.nativeElement.style.cursor = 'pointer'
  }

  ngOnDestroy() {
    if (this.handler) this.host.nativeElement.removeEventListener('click', this.handler)
  }
}

/** (appThrottleScroll)：宿主滚动节流 */
@Directive({ selector: '[appThrottleScroll]', standalone: true })
export class ThrottleScrollDirective implements OnInit, OnDestroy {
  @Input() throttleWait = 200
  @Output() appThrottleScroll = new EventEmitter<Event>()
  private readonly host = inject(ElementRef<HTMLElement>)
  private handler: ((e: Event) => void) | null = null

  ngOnInit() {
    this.handler = throttle((e: Event) => this.appThrottleScroll.emit(e), this.throttleWait)
    this.host.nativeElement.addEventListener('scroll', this.handler)
  }

  ngOnDestroy() {
    if (this.handler) this.host.nativeElement.removeEventListener('scroll', this.handler)
  }
}

/** [appLazy]：宿主进入视口才加 ng-visible 类（IntersectionObserver） */
@Directive({ selector: '[appLazy]', standalone: true })
export class LazyDirective implements OnInit, OnDestroy {
  @Input('appLazy') rootMargin = '40px'
  @Output() appLazyVisible = new EventEmitter<void>()
  private readonly host = inject(ElementRef<HTMLElement>)
  private ob: IntersectionObserver | null = null

  ngOnInit() {
    const el = this.host.nativeElement
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('ng-visible')
      this.appLazyVisible.emit()
      return
    }
    this.ob = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      el.classList.add('ng-visible')
      this.appLazyVisible.emit()
      this.ob?.disconnect()
      this.ob = null
    }, { rootMargin: this.rootMargin })
    this.ob.observe(el)
  }

  ngOnDestroy() { this.ob?.disconnect() }
}

/** (appClickOutside)：点击宿主外部时触发（下拉菜单/弹层收起） */
@Directive({ selector: '[appClickOutside]', standalone: true })
export class ClickOutsideDirective implements OnInit, OnDestroy {
  @Output() appClickOutside = new EventEmitter<MouseEvent>()
  private readonly host = inject(ElementRef<HTMLElement>)

  private readonly onDocClick = (e: MouseEvent) => {
    if (!this.host.nativeElement.contains(e.target as Node)) {
      this.appClickOutside.emit(e)
    }
  }

  ngOnInit() {
    // 延迟一拍注册，避免触发本次展开点击本身
    setTimeout(() => document.addEventListener('click', this.onDocClick), 0)
  }

  ngOnDestroy() { document.removeEventListener('click', this.onDocClick) }
}

/** [appDraggable]：指针拖拽宿主元素（可限制在父容器内） */
@Directive({ selector: '[appDraggable]', standalone: true })
export class DraggableDirective implements OnInit, OnDestroy {
  @Input() bounds = true
  private readonly host = inject(ElementRef<HTMLElement>)
  private dragging = false
  private startX = 0
  private startY = 0
  private baseX = 0
  private baseY = 0

  private readonly onDown = (e: PointerEvent) => {
    const el = this.host.nativeElement
    this.dragging = true
    this.startX = e.clientX
    this.startY = e.clientY
    const m = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform || '')
    this.baseX = m ? Number(m[1]) : 0
    this.baseY = m ? Number(m[2]) : 0
    el.setPointerCapture?.(e.pointerId)
  }

  private readonly onMove = (e: PointerEvent) => {
    if (!this.dragging) return
    const el = this.host.nativeElement
    let x = this.baseX + (e.clientX - this.startX)
    let y = this.baseY + (e.clientY - this.startY)
    if (this.bounds) {
      const parent = el.parentElement
      const pw = parent?.clientWidth ?? 0
      const ph = parent?.clientHeight ?? 0
      x = Math.max(0, Math.min(x, Math.max(0, pw - el.offsetWidth)))
      y = Math.max(0, Math.min(y, Math.max(0, ph - el.offsetHeight)))
    }
    el.style.transform = `translate(${x}px, ${y}px)`
  }

  private readonly onUp = () => { this.dragging = false }

  ngOnInit() {
    const el = this.host.nativeElement
    el.style.touchAction = 'none'
    el.style.cursor = 'grab'
    el.addEventListener('pointerdown', this.onDown)
    el.addEventListener('pointermove', this.onMove)
    el.addEventListener('pointerup', this.onUp)
    el.addEventListener('pointercancel', this.onUp)
  }

  ngOnDestroy() {
    const el = this.host.nativeElement
    el.removeEventListener('pointerdown', this.onDown)
    el.removeEventListener('pointermove', this.onMove)
    el.removeEventListener('pointerup', this.onUp)
    el.removeEventListener('pointercancel', this.onUp)
  }
}

/** [appLongpress]：长按 600ms 触发（移动端长按菜单） */
@Directive({ selector: '[appLongpress]', standalone: true })
export class LongpressDirective implements OnInit, OnDestroy {
  @Input() longpressDelay = 600
  @Output() appLongpress = new EventEmitter<void>()
  private readonly host = inject(ElementRef<HTMLElement>)
  private timer: ReturnType<typeof setTimeout> | null = null

  private readonly start = () => {
    this.timer = setTimeout(() => this.appLongpress.emit(), this.longpressDelay)
  }
  private readonly cancel = () => {
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  ngOnInit() {
    const el = this.host.nativeElement
    el.addEventListener('pointerdown', this.start)
    el.addEventListener('pointerup', this.cancel)
    el.addEventListener('pointerleave', this.cancel)
  }

  ngOnDestroy() {
    const el = this.host.nativeElement
    el.removeEventListener('pointerdown', this.start)
    el.removeEventListener('pointerup', this.cancel)
    el.removeEventListener('pointerleave', this.cancel)
  }
}

/** 指令清单：视图页用它渲染目录表格 */
export const DIRECTIVES = [
  CopyDirective, DebounceClickDirective, ThrottleScrollDirective, LazyDirective,
  ClickOutsideDirective, DraggableDirective, LongpressDirective,
]

export const DIRECTIVE_REGISTRY = [
  { name: 'appCopy', usage: '[appCopy]="\'文本\'"', desc: '点击宿主复制文本，成功后加 ng-copied 类' },
  { name: 'appDebounceClick', usage: '(appDebounceClick)="fn()" [debounceWait]="500"', desc: '@Output 回抛防抖后的点击事件' },
  { name: 'appThrottleScroll', usage: '(appThrottleScroll)="fn($event)"', desc: '滚动节流，适合滚动加载/埋点' },
  { name: 'appLazy', usage: '[appLazy]="\'60px\'" (appLazyVisible)="fn()"', desc: 'IntersectionObserver 进场回调' },
  { name: 'appClickOutside', usage: '(appClickOutside)="close()"', desc: '点击宿主外部触发，用于弹层收起' },
  { name: 'appDraggable', usage: '[appDraggable]="true"', desc: '指针拖拽，可限制父容器边界' },
  { name: 'appLongpress', usage: '(appLongpress)="onLong()"', desc: '长按 600ms 触发' },
]
