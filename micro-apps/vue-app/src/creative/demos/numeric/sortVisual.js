/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 数值与优化 · 排序算法可视化 —— 比较 / 交换逐步展示
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */

const sortVisual = {
  id: 'sort-visual',
  title: '排序算法可视化',
  tag: '比较 / 交换逐步展示',
  desc: '同一组乱序的柱子，换个算法看它怎么收拾：冒泡相邻比对、一路把大的顶到右边；快排选一个基准，把小的扔左边大的扔右边，然后递归；插入排序则像理牌，把每张牌插到前面已经有序的位置。柱子高度就是值，染色标出「正在比较」「已经归位」的位置。',
  bg: '#04060d',
  params: [
    { key: 'n', label: '柱子数量', min: 12, max: 160, step: 4, value: 60 },
    { key: 'steps', label: '每帧步数', min: 1, max: 200, step: 1, value: 10 },
    { key: 'algo', label: '算法(0冒泡1插入2快排)', min: 0, max: 2, step: 1, value: 2 },
  ],
  actions: [
    { key: 'shuffle', label: '重新打乱' },
    { key: 'next', label: '换算法' },
  ],
  create(ctx) {
    const MAXN = 160
    let w = 800
    let h = 360
    let n = 60
    let stepsPer = 10
    let algo = 2
    let arr = new Float32Array(MAXN)
    let state = null
    let done = false
    let comparisons = 0
    let swaps = 0

    const shuffle = () => {
      for (let i = 0; i < n; i += 1) arr[i] = (i + 1) / n
      for (let i = n - 1; i > 0; i -= 1) {
        const j = (Math.random() * (i + 1)) | 0
        const t = arr[i]
        arr[i] = arr[j]
        arr[j] = t
      }
      comparisons = 0
      swaps = 0
      done = false
      /* 每个算法用一个小的显式状态机：这样「一步」就是可数的，能逐步播放 */
      if (algo === 2) state = { stack: [[0, n - 1]], i: 0, j: -1, pivot: 0, phase: 'pick' }
      else state = { i: 0, j: 0, key: 0 }
    }

    /** 推进一步，返回本步涉及的下标（用于染色） */
    const stepOnce = () => {
      if (done || !state) return null
      if (algo === 0) {
        /* 冒泡 */
        if (state.i >= n - 1) { done = true; return null }
        if (state.j >= n - 1 - state.i) { state.i += 1; state.j = 0; return null }
        comparisons += 1
        const a = state.j
        const b = state.j + 1
        if (arr[a] > arr[b]) {
          const t = arr[a]
          arr[a] = arr[b]
          arr[b] = t
          swaps += 1
        }
        state.j += 1
        return [a, b]
      }
      if (algo === 1) {
        /* 插入 */
        if (state.i >= n) { done = true; return null }
        if (state.j < 0 || arr[state.j] <= state.key) {
          arr[state.j + 1] = state.key
          state.i += 1
          state.j = state.i - 1
          if (state.i < n) state.key = arr[state.i]
          return null
        }
        comparisons += 1
        swaps += 1
        arr[state.j + 1] = arr[state.j]
        const k = state.j
        state.j -= 1
        return [k, k + 1]
      }
      /* 快排（显式栈 + Hoare 分区） */
      if (state.phase === 'pick') {
        if (!state.stack.length) { done = true; return null }
        const seg = state.stack.pop()
        if (seg[0] >= seg[1]) return null
        state.lo = seg[0]
        state.hi = seg[1]
        state.pivot = arr[(seg[0] + seg[1]) >> 1]
        state.i = seg[0] - 1
        state.j = seg[1] + 1
        state.phase = 'part'
        return null
      }
      if (state.phase === 'part') {
        let i = state.i
        let j = state.j
        do {
          i += 1
          comparisons += 1
        } while (arr[i] < state.pivot)
        do {
          j -= 1
          comparisons += 1
        } while (arr[j] > state.pivot)
        state.i = i
        state.j = j
        if (i >= j) {
          state.phase = 'pick'
          state.stack.push([state.lo, j])
          state.stack.push([j + 1, state.hi])
          return null
        }
        const t = arr[i]
        arr[i] = arr[j]
        arr[j] = t
        swaps += 1
        return [i, j]
      }
      return null
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        shuffle()
        ctx.fillStyle = '#04060d'
        ctx.fillRect(0, 0, w, h)
      },
      frame() {
        let mark = null
        for (let k = 0; k < stepsPer && !done; k += 1) {
          const m = stepOnce()
          if (m) mark = m
        }

        const bw = w / n
        const baseY = h - 16
        const scale = (h - 60) / 1

        /* 分色桶画柱子：同一种颜色的一批一次 fill，省掉逐柱换颜色 */
        const buckets = [[], [], []]
        for (let i = 0; i < n; i += 1) {
          const hgt = arr[i] * scale
          const hot = mark && (i === mark[0] || i === mark[1])
          const bi = hot ? 0 : done ? 2 : 1
          buckets[bi].push(i, baseY - hgt, hgt)
        }
        const COLORS = ['#ffd166', '#6ea8ff', '#9dffbe']
        ctx.fillStyle = '#1a2036'
        ctx.fillRect(0, baseY, w, 1)
        for (let b = 0; b < 3; b += 1) {
          const arr2 = buckets[b]
          if (!arr2.length) continue
          ctx.fillStyle = COLORS[b]
          for (let k = 0; k < arr2.length; k += 3) {
            ctx.fillRect(arr2[k] * bw + 0.5, arr2[k + 1], Math.max(1, bw - 1), arr2[k + 2])
          }
        }

        const NAMES = ['冒泡排序', '插入排序', '快速排序']
        ctx.fillStyle = '#dff6ff'
        ctx.font = '13px ui-monospace, monospace'
        ctx.fillText(`${NAMES[algo]}${done ? ' · 已完成' : ''}`, 12, 22)
        ctx.fillText(`比较 ${comparisons} · 移动 ${swaps}`, 12, 40)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'n') { n = Math.min(MAXN, v); shuffle() }
        if (key === 'steps') stepsPer = v
        if (key === 'algo') { algo = v; shuffle() }
      },
      action(key) {
        if (key === 'shuffle') shuffle()
        if (key === 'next') { algo = (algo + 1) % 3; shuffle() }
      },
      destroy() {},
    }
  },
}

export default sortVisual
