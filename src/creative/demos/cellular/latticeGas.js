/**
 * 元胞自动机与自组织 · 格子气自动机 —— HPP 碰撞规则
 *
 * 契约（三端薄壳唯一依赖的东西）：
 *   create(ctx) → { resize, frame, pointer, setParam, action, destroy }
 * 写法上的四条硬约定见 `src/creative/README.md`；分组归属见 `src/creative/groups.js`。
 */

const latticeGas = {
  id: 'lattice-gas',
  title: '格子气自动机',
  tag: 'HPP 碰撞规则',
  desc: '在算出 Navier-Stokes 之前，人们试过更朴素的办法：把流体当成一堆在方格上走来走去的粒子，每步只做两件事 —— 走到邻格、以及在格点按固定规则碰撞（两个粒子正面相遇就各自转 90°）。就这么几条规则，宏观上能还原出流动。这是「简单微观规则 → 复杂宏观行为」最直白的例子。',
  bg: '#03040b',
  params: [
    { key: 'density', label: '粒子密度', min: 0.08, max: 0.7, step: 0.02, value: 0.34 },
    { key: 'rate', label: '推进/帧', min: 0.5, max: 8, step: 0.5, value: 2 },
    { key: 'size', label: '格子边长', min: 6, max: 22, step: 2, value: 12 },
  ],
  actions: [
    { key: 'reset', label: '重新布气' },
    { key: 'jet', label: '左侧加速' },
  ],
  create(ctx) {
    let w = 800
    let h = 360
    let density = 0.34
    let rate = 2
    let cell = 12
    let acc = 0
    /* 每个格子用 4 个 bit 表示四个方向的粒子（右/下/左/上） */
    let gw = 0
    let gh = 0
    let cur = new Uint8Array(0)
    let nxt = new Uint8Array(0)
    let jetPower = 0

    const alloc = () => {
      gw = Math.max(4, Math.floor(w / cell))
      gh = Math.max(4, Math.floor(h / cell))
      cur = new Uint8Array(gw * gh)
      nxt = new Uint8Array(gw * gh)
      for (let i = 0; i < cur.length; i += 1) {
        let m = 0
        if (Math.random() < density) m |= 1
        if (Math.random() < density) m |= 2
        if (Math.random() < density) m |= 4
        if (Math.random() < density) m |= 8
        cur[i] = m
      }
    }

    /* 方向：0=右 1=下 2=左 3=上；dx/dy 表 */
    const DX = [1, 0, -1, 0]
    const DY = [0, 1, 0, -1]

    const tickOnce = () => {
      nxt.fill(0)
      for (let y = 0; y < gh; y += 1) {
        for (let x = 0; x < gw; x += 1) {
          const i = y * gw + x
          let m = cur[i]
          if (!m) continue
          /* 碰撞：右+左 → 上+下；下+上 → 右+左（HPP 的两条对撞规则） */
          if (m === 0b0101) m = 0b1010
          else if (m === 0b1010) m = 0b0101
          for (let d = 0; d < 4; d += 1) {
            if (!(m & (1 << d))) continue
            let nx = x + DX[d]
            let ny = y + DY[d]
            /* 上下是硬壁（反射），左右是周期边界 */
            if (ny < 0 || ny >= gh) { ny = y; nx = x }
            if (nx < 0) nx += gw
            if (nx >= gw) nx -= gw
            nxt[ny * gw + nx] |= 1 << d
          }
        }
      }
      const t = cur
      cur = nxt
      nxt = t
      if (jetPower > 0) {
        jetPower -= 1
        for (let y = 1; y < gh - 1; y += 1) {
          if (Math.random() < 0.6) cur[y * gw + 1] |= 1
        }
      }
    }

    return {
      resize(nw, nh) {
        w = nw
        h = nh
        alloc()
        ctx.fillStyle = '#03040b'
        ctx.fillRect(0, 0, w, h)
      },
      frame(ts, dt) {
        acc += Math.min(dt, 0.05) * rate * 60
        let guard = 0
        while (acc >= 1 && guard < 12) { acc -= 1; tickOnce(); guard += 1 }
        if (guard >= 12) acc = 0

        ctx.fillStyle = '#03040b'
        ctx.fillRect(0, 0, w, h)
        const half = cell * 0.5
        for (let y = 0; y < gh; y += 1) {
          for (let x = 0; x < gw; x += 1) {
            const m = cur[y * gw + x]
            if (!m) continue
            const cx = x * cell + half
            const cy = y * cell + half
            for (let d = 0; d < 4; d += 1) {
              if (!(m & (1 << d))) continue
              /* 粒子画成一小段「朝向箭头」，一眼看出往哪走 */
              ctx.fillStyle = d === 0 ? '#7fd7ff' : d === 2 ? '#ffb27f' : '#a8ffd0'
              ctx.fillRect(cx + DX[d] * half * 0.5 - 1.5, cy + DY[d] * half * 0.5 - 1.5, 3.2, 3.2)
            }
          }
        }
      },
      pointer(kind, x, y) {
        if (kind !== 'down' && kind !== 'move') return
        const cx = Math.floor(x / cell)
        const cy = Math.floor(y / cell)
        for (let dy = -2; dy <= 2; dy += 1) {
          for (let dx = -2; dx <= 2; dx += 1) {
            const xx = cx + dx
            const yy = cy + dy
            if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue
            /* 往右塞一批 —— 手动造一股射流 */
            cur[yy * gw + xx] = 1
          }
        }
      },
      setParam(key, v) {
        if (key === 'density') { density = v; alloc() }
        if (key === 'rate') rate = v
        if (key === 'size') { cell = v; alloc() }
      },
      action(key) {
        if (key === 'reset') alloc()
        if (key === 'jet') jetPower = 90
      },
      destroy() {},
    }
  },
}

export default latticeGas
