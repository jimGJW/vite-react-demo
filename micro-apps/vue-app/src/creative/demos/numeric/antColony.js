/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/**
 * 数值与优化 · 蚁群算法解 TSP —— 信息素 + 启发式的正反馈
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */
import { TAU, rand } from '../../utils/math.js'

const antColony = {
  id: 'ant-colony',
  title: '蚁群算法解 TSP',
  tag: '信息素 + 启发式的正反馈',
  desc: '蚂蚁选下一座城靠两样东西：这条路上留了多少信息素（τ^α），以及距离倒数的先验偏好（1/d^β）。每只蚂蚁都走完一圈之后，所有边上的信息素先按挥发率 ρ 统一衰减，再按「路径越短的蚂蚁留下的越多」加回去。短路径被走得更多、信息素更浓、下一轮更可能被选 —— 这就是正反馈。它不保证最优解，但常常在很短的时间里就撞上一个相当好的解，这也是它在实际排程问题里还活着的原因。',
  bg: '#04060d',
  params: [
    { key: 'cities', label: '城市数', min: 8, max: 40, step: 1, value: 22 },
    { key: 'ants', label: '蚂蚁数', min: 4, max: 40, step: 1, value: 18 },
    { key: 'alpha', label: 'α 信息素权重', min: 0, max: 4, step: 0.1, value: 1 },
    { key: 'beta', label: 'β 距离权重', min: 0, max: 6, step: 0.1, value: 3 },
    { key: 'rho', label: 'ρ 挥发率', min: 0.05, max: 0.7, step: 0.01, value: 0.28 },
  ],
  actions: [
    { key: 'newMap', label: '换一张地图' },
    { key: 'resetPhero', label: '清空信息素' },
    { key: 'burst', label: '加速 40 轮' },
  ],
  create(ctx) {
    const MAXC = 40
    const MAXA = 40
    let w = 800
    let h = 360
    let nC = 22
    let nA = 18
    let alpha = 1
    let beta = 3
    let rho = 0.28
    const cx = new Float32Array(MAXC)
    const cy = new Float32Array(MAXC)
    const tau = new Float32Array(MAXC * MAXC)
    const dist = new Float32Array(MAXC * MAXC)
    const tour = new Int32Array(MAXC)
    const visited = new Uint8Array(MAXC)
    const best = new Int32Array(MAXC)
    let bestLen = Infinity
    let greedyRef = 1
    let round = 0
    let acc = 0

    const idx = (i, j) => i * MAXC + j

    const newMap = () => {
      for (let i = 0; i < MAXC; i += 1) {
        /* 边距留够，避免城市贴着画布边缘让短回路看起来像「绕边框」 */
        cx[i] = rand(0.1, 0.9)
        cy[i] = rand(0.1, 0.9)
      }
      resetPhero()
      bestLen = Infinity
      round = 0
      /* 先把 best 重置成恒等排列：换地图后城市坐标全变了，
         留着上一张图的回路顺序会画出一堆横穿画面的乱线 */
      for (let i = 0; i < MAXC; i += 1) best[i] = i
      /* 再用「最近邻贪心」给一个好起点，否则前几十轮画面只有一团乱线 */
      greedyInit()
    }

    const refreshDist = () => {
      for (let i = 0; i < nC; i += 1) {
        for (let j = 0; j < nC; j += 1) {
          const dx = cx[i] - cx[j]
          const dy = cy[i] - cy[j]
          dist[idx(i, j)] = Math.sqrt(dx * dx + dy * dy) + 1e-6
        }
      }
    }

    const resetPhero = () => {
      refreshDist()
      tau.fill(1)
      for (let i = 0; i < nC; i += 1) tau[idx(i, i)] = 0
    }

    const tourLength = (t) => {
      let s = 0
      for (let i = 0; i < nC; i += 1) s += dist[idx(t[i], t[(i + 1) % nC])]
      return s
    }

    const greedyInit = () => {
      visited.fill(0)
      let cur = 0
      let total = 0
      for (let k = 0; k < nC; k += 1) {
        tour[k] = cur
        visited[cur] = 1
        if (k === nC - 1) break
        let nx = -1
        let nd = Infinity
        for (let j = 0; j < nC; j += 1) {
          if (visited[j]) continue
          if (dist[idx(cur, j)] < nd) { nd = dist[idx(cur, j)]; nx = j }
        }
        total += nd
        cur = nx
      }
      total += dist[idx(cur, tour[0])]
      /* 记下贪心基准，用来显示「蚁群到底比贪心好多少」 */
      greedyRef = total
      if (total < bestLen) { bestLen = total; best.set(tour) }
    }

    /** 一只蚂蚁走完一圈：轮盘赌 + 信息素/距离权重 */
    const walkAnt = (start) => {
      visited.fill(0)
      let cur = start
      for (let k = 0; k < nC; k += 1) {
        tour[k] = cur
        visited[cur] = 1
        if (k === nC - 1) break
        let sum = 0
        for (let j = 0; j < nC; j += 1) {
          if (visited[j]) continue
          sum += Math.pow(tau[idx(cur, j)], alpha) * Math.pow(1 / dist[idx(cur, j)], beta)
        }
        if (!(sum > 0)) {
          for (let j = 0; j < nC; j += 1) { if (!visited[j]) { cur = j; break } }
          continue
        }
        let pick = Math.random() * sum
        let chosen = -1
        for (let j = 0; j < nC; j += 1) {
          if (visited[j]) continue
          pick -= Math.pow(tau[idx(cur, j)], alpha) * Math.pow(1 / dist[idx(cur, j)], beta)
          if (pick <= 0) { chosen = j; break }
        }
        cur = chosen < 0 ? start : chosen
      }
      return tourLength(tour)
    }

    const deposit = new Float32Array(MAXC * MAXC)

    const stepRound = () => {
      deposit.fill(0)
      for (let a = 0; a < nA; a += 1) {
        const len = walkAnt(a % nC)
        const add = 1 / len
        for (let i = 0; i < nC; i += 1) {
          const u = tour[i]
          const v2 = tour[(i + 1) % nC]
          deposit[idx(u, v2)] += add
          deposit[idx(v2, u)] += add
        }
        if (len < bestLen) { bestLen = len; best.set(tour) }
      }
      for (let i = 0; i < nC; i += 1) {
        const row = i * MAXC
        for (let j = 0; j < nC; j += 1) {
          if (i === j) { tau[row + j] = 0; continue }
          tau[row + j] = (1 - rho) * tau[row + j] + deposit[row + j]
        }
      }
      round += 1
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        newMap()
      },
      frame(ts, dt) {
        /* 一轮 = nA 只蚂蚁各走一圈，单轮开销不小，用累加器把轮次摊到多帧 */
        acc += dt * 4
        let g = 0
        while (acc >= 1 && g < 3) { acc -= 1; stepRound(); g += 1 }
        if (g >= 3) acc = 0

        ctx.fillStyle = '#04060d'
        ctx.fillRect(0, 0, w, h)

        const pad = 26
        const X = (u) => pad + u * (w - pad * 2)
        const Y = (v) => pad + v * (h - pad * 2)

        let tmax = 1e-9
        for (let i = 0; i < nC; i += 1) {
          for (let j = 0; j < nC; j += 1) tmax = Math.max(tmax, tau[idx(i, j)])
        }

        /* 信息素按浓度分 4 档，每档整批细线一次 beginPath / stroke */
        const buckets = [[], [], [], []]
        for (let i = 0; i < nC; i += 1) {
          for (let j = i + 1; j < nC; j += 1) {
            const t = tau[idx(i, j)] / tmax
            if (t < 0.08) continue
            const b = t > 0.6 ? 3 : t > 0.35 ? 2 : t > 0.18 ? 1 : 0
            buckets[b].push(i, j)
          }
        }
        const PA = [0.10, 0.2, 0.34, 0.5]
        const COL = ['#5ce1e6', '#5ce1e6', '#7fe9ff', '#b8f4ff']
        ctx.lineWidth = 1
        for (let b = 0; b < 4; b += 1) {
          const arr2 = buckets[b]
          if (!arr2.length) continue
          ctx.strokeStyle = COL[b]
          ctx.globalAlpha = PA[b]
          ctx.beginPath()
          for (let k = 0; k < arr2.length; k += 2) {
            const i = arr2[k]
            const j = arr2[k + 1]
            ctx.moveTo(X(cx[i]), Y(cy[i]))
            ctx.lineTo(X(cx[j]), Y(cy[j]))
          }
          ctx.stroke()
        }
        ctx.globalAlpha = 1

        /* 当前最优路线：荧光绿粗线，压在信息素上面 */
        ctx.strokeStyle = '#9dffbe'
        ctx.lineWidth = 2.4
        ctx.beginPath()
        for (let i = 0; i < nC; i += 1) {
          const a = best[i]
          const b = best[(i + 1) % nC]
          ctx.moveTo(X(cx[a]), Y(cy[a]))
          ctx.lineTo(X(cx[b]), Y(cy[b]))
        }
        ctx.stroke()

        /* 城市 */
        ctx.fillStyle = '#fff1c9'
        for (let i = 0; i < nC; i += 1) {
          ctx.beginPath()
          ctx.arc(X(cx[i]), Y(cy[i]), 3.4, 0, TAU)
          ctx.fill()
        }

        ctx.font = '12px ui-monospace, monospace'
        ctx.fillStyle = '#dff6ff'
        ctx.fillText(`第 ${round} 轮 · ${nA} 只蚂蚁 / ${nC} 座城市`, pad, 16)
        ctx.fillStyle = '#9dffbe'
        ctx.fillText(`最优回路长度 ${bestLen.toFixed(3)}`, pad + 240, 16)
        ctx.fillStyle = '#9db4dd'
        ctx.fillText(`贪心初值 ${greedyRef.toFixed(3)} · 改善 ${((1 - bestLen / greedyRef) * 100).toFixed(1)}%（长度已按画布归一化）`, pad + 400, 16)
        ctx.fillText('亮线＝信息素浓度 · 绿线＝当前最优回路', pad, h - 10)
      },
      pointer() {},
      setParam(key, v) {
        if (key === 'cities') { nC = Math.min(MAXC, Math.round(v)); newMap() }
        if (key === 'ants') nA = Math.min(MAXA, Math.round(v))
        if (key === 'alpha') alpha = v
        if (key === 'beta') beta = v
        if (key === 'rho') rho = v
      },
      action(key) {
        if (key === 'newMap') newMap()
        if (key === 'resetPhero') { resetPhero(); round = 0 }
        if (key === 'burst') { for (let i = 0; i < 40; i += 1) stepRound() }
      },
      destroy() {},
    }
  },
}

export default antColony
