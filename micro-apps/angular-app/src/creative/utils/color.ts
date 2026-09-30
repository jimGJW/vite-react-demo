/**
 * ⚠️ 自动生成，请勿手改。
 *
 * 源目录：src/creative/
 * 生成器：scripts/sync-creative-demos.mjs
 *
 * 改 demo 逻辑请改源目录里的文件，然后跑 `npm run sync:demos`。
 */
/* eslint-disable */
/**
 * 创意 demo 的公共颜色工具。
 *
 * 关键约束：**逐像素算法里的颜色必须是数值**。
 * 把 `hsla(...)` 字符串往 `ImageData` 里写只会得到全黑，且不报任何错 ——
 * 字符串索引出来的 `col[0]` 是字符 `'h'`，写进 Uint8ClampedArray 直接变 0。
 * 所以这里提供 HSL→RGB 和预生成查色表这两件东西。
 */

/**
 * HSL → RGB，返回 `[r, g, b]`（各 0..255，已四舍五入到整数，可直接写进 ImageData）。
 *
 * @param h 色相，任意实数（内部会自动取模到 [0, 360)）
 * @param s 饱和度 0..1
 * @param l 亮度 0..1
 */
export const hsl2rgb = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (hp < 1) { r = c; g = x } else if (hp < 2) { r = x; g = c } else if (hp < 3) { g = c; b = x } else if (hp < 4) { g = x; b = c } else if (hp < 5) { r = x; b = c } else { r = c; b = x }
  const m = l - c / 2
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

/**
 * 预生成 RGB 查色表（长度 `n * 3` 的 Uint8Array），`fn` 接收 0..1 返回 `[r, g, b]`。
 *
 * 逐像素算法每帧要索引上千次颜色，查表比每次现算 HSL 便宜得多；
 * 而且做成连续内存后，内层循环里只剩一次整数乘法和三次数组读。
 */
export const makeRgbLut = (n, fn) => {
  const lut = new Uint8Array(n * 3)
  for (let i = 0; i < n; i += 1) {
    const c = fn(n === 1 ? 0 : i / (n - 1))
    lut[i * 3] = c[0]
    lut[i * 3 + 1] = c[1]
    lut[i * 3 + 2] = c[2]
  }
  return lut
}
