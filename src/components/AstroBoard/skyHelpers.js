/**
 * 星图辅助工具 —— 从 SkyChart.jsx 拆出来的纯函数。
 *
 * 为什么单独拆：react-refresh/only-export-components 规则不允许组件文件
 * 同时导出工具函数（热更新会失效）。项目里 mapProjection.js 也是同一个原因拆的。
 */

import { useMemo } from 'react'
import { equatorialToHorizontal } from '@lib/astro/skyProjection.js'

/** 方位角 → 中文方位名（16 方位罗盘） */
const AZ_16 = ['北', '北北东', '东北', '东北东', '东', '东南东', '东南', '南南东',
  '南', '南南西', '西南', '西南西', '西', '西北西', '西北', '北北西']

/** 方位角（度）→ 中文方位名。0=北，顺时针。 */
export function azToCompass(az) {
  return AZ_16[Math.round(((((az % 360) + 360) % 360) / 22.5) % 16)]
}

/** 黄道十二宫（按赤经每 30° 一宫划分） */
export const ZODIAC = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '室女座',
  '天秤座', '天蝎座', '人马座', '摩羯座', '宝瓶座', '双鱼座']

/**
 * 赤经 → 星座名。
 *
 * 近似说明：严格做法是先把赤经转成黄经（要减黄赤交角 23.44° 并处理岁差），
 * 这里直接按赤经每 30° 分宫。对「这颗星属于哪个星座」的科普用途够用，
 * 边界附近可能差一宫，但不影响观星判断。
 */
export function raToConstellation(ra) {
  return ZODIAC[Math.floor(((((ra % 360) + 360) % 360) / 30)) % 12]
}

/** 高度角 → 可观测性分级（决定标记配色与文案） */
export function observability(alt) {
  if (alt > 45) return { level: 'good', zh: '最佳观测', color: '#52c41a' }
  if (alt > 20) return { level: 'ok', zh: '可观测', color: '#a0d911' }
  if (alt > 5) return { level: 'low', zh: '低空', color: '#faad14' }
  if (alt > -0.6) return { level: 'edge', zh: '贴近地平', color: '#fa8c16' }
  return { level: 'down', zh: '地平线下', color: '#8c8c8c' }
}

/**
 * 统计「今晚哪些星座升起来了」。
 *
 * 判据用星座连线上的**最高点**：只要有一颗星高出地平 minAlt 度，
 * 这个星座就有一半左右露在外面了。取最高点而不是平均点，
 * 是因为「刚升起」的星座平均高度很低，会被误判成看不到。
 *
 * @returns {{abbr:string,en:string,zh:string,rank:number,maxAlt:number}[]}
 */
export function useVisibleConstellations(catalog, lat, lon, now, minAlt = 15) {
  return useMemo(() => {
    if (!catalog) return []
    // 先按星座聚合连线，避免对每颗星遍历全部连线（150 段 × 88 宫 = 1.3 万次）
    const linesByConst = new Map()
    for (const [cid, flat] of catalog.lines || []) {
      if (!linesByConst.has(cid)) linesByConst.set(cid, [])
      linesByConst.get(cid).push(flat)
    }
    const out = []
    for (const [abbr, en, zh, rank] of catalog.constellations) {
      const flats = linesByConst.get(abbr)
      if (!flats) continue
      let best = -90
      for (const flat of flats) {
        for (let i = 0; i < flat.length; i += 2) {
          const { alt } = equatorialToHorizontal(flat[i], flat[i + 1], lat, lon, now)
          if (alt > best) best = alt
        }
      }
      if (best >= minAlt) out.push({ abbr, en, zh, rank, maxAlt: best })
    }
    return out.sort((a, b) => b.maxAlt - a.maxAlt)
  }, [catalog, lat, lon, now, minAlt])
}
