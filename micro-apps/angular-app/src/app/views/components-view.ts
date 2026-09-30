import { Component, signal, computed } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CommonModule, UpperCasePipe, DatePipe } from '@angular/common'

interface TodoItem {
  id: number
  text: string
  done: boolean
}

/**
 * 组件与模板视图 —— 官方 Standalone Component + Signals
 * 展示：Signal 计数器（signal/computed/update）、ngModel 双向绑定、
 *      列表渲染（@for 新控制流）、条件渲染（@if）+ 管道
 */
@Component({
  selector: 'app-components-view',
  standalone: true,
  imports: [CommonModule, FormsModule, UpperCasePipe, DatePipe],
  template: `
    <!-- Signal 计数器 -->
    <section class="ng-card">
      <h2>Signal 计数器</h2>
      <p class="ng-desc">signal + computed 响应式状态，update 派生修改</p>
      <div class="counter-demo">
        <button class="ng-btn ng-btn--primary" (click)="dec()">-</button>
        <span class="counter-value">{{ count() }}</span>
        <button class="ng-btn ng-btn--primary" (click)="inc()">+</button>
        <span class="counter-double">双倍 = {{ doubled() }}</span>
      </div>
    </section>

    <!-- 双向绑定 -->
    <section class="ng-card">
      <h2>双向绑定 (ngModel)</h2>
      <p class="ng-desc">FormsModule 的 [(ngModel)] 实现双向数据流</p>
      <div class="input-demo">
        <input class="ng-input" [(ngModel)]="name" placeholder="输入你的名字…" />
        <p class="echo">你好，{{ name || '匿名舰长' }}！</p>
        <p class="echo" [style.color]="'#6366f1'" *ngIf="name">大写：{{ name | uppercase }}</p>
      </div>
    </section>

    <!-- 列表渲染：@for 新控制流 -->
    <section class="ng-card">
      <h2>列表渲染 (&#64;for 新控制流)</h2>
      <p class="ng-desc">Angular 17+ 内置控制流 &#64;for 替代 *ngFor，自带 track 与 empty 分支</p>
      <ul class="todo-list">
        @for (item of todos(); track item.id; let i = $index) {
          <li class="todo-item">
            <label class="todo-label">
              <input type="checkbox" [checked]="item.done" (change)="toggle(i)" />
              <span [class.done]="item.done">#{{ i + 1 }} {{ item.text }}</span>
            </label>
            <button class="ng-btn ng-btn--danger" (click)="remove(i)">×</button>
          </li>
        } @empty {
          <li class="todo-item"><span class="ng-desc">待办清空了，添加一条吧</span></li>
        }
      </ul>
      <div class="todo-add">
        <input class="ng-input" [(ngModel)]="newTodo" (keyup.enter)="add()" placeholder="添加一条待办…" />
        <button class="ng-btn ng-btn--primary" (click)="add()">添加</button>
      </div>
      <p class="stat">已完成：{{ doneCount() }} / {{ todos().length }}</p>
    </section>

    <!-- 条件渲染 + 管道 -->
    <section class="ng-card">
      <h2>条件渲染 (&#64;if + Date Pipe)</h2>
      <p class="ng-desc">&#64;if 控制显隐 + date 管道格式化</p>
      <div class="cond-demo">
        <button class="ng-btn" (click)="togglePanel()">{{ showPanel() ? '收起' : '展开' }}面板</button>
        @if (showPanel()) {
          <div class="panel">
            <p>当前时间：{{ now | date: 'yyyy-MM-dd HH:mm:ss' }}</p>
            <p>价格：{{ price | number: '1.2-2' }} 元</p>
          </div>
        }
      </div>
    </section>
  `,
})
export class ComponentsView {
  // —— Signal 响应式状态 ——
  count = signal(0)
  doubled = computed(() => this.count() * 2)
  showPanel = signal(true)
  todos = signal<TodoItem[]>([
    { id: 1, text: '学习 Angular 22 Standalone', done: true },
    { id: 2, text: 'React + Vue + Angular 三框架共存', done: false },
    { id: 3, text: '体验 Signal 响应式', done: false },
  ])
  doneCount = computed(() => this.todos().filter((t) => t.done).length)

  // —— 非信号状态（ngModel 双向绑定）——
  name = ''
  newTodo = ''
  now = new Date()
  price = 1280.5

  inc() {
    this.count.update((v) => v + 1)
  }
  dec() {
    this.count.update((v) => v - 1)
  }
  togglePanel() {
    this.showPanel.update((v) => !v)
  }
  add() {
    const text = this.newTodo.trim()
    if (!text) return
    this.todos.update((list) => [...list, { id: Date.now(), text, done: false }])
    this.newTodo = ''
  }
  remove(index: number) {
    this.todos.update((list) => list.filter((_, i) => i !== index))
  }
  toggle(index: number) {
    this.todos.update((list) => list.map((item, i) => (i === index ? { ...item, done: !item.done } : item)))
  }
}
