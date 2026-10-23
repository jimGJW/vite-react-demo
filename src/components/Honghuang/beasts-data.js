/* =====================================================================
   妖兽总表：365 条，与 365 周天星位 1:1 对位
   ---------------------------------------------------------------------
   构成（可核程度分三档，UI 必须显示，不可让用户误读为全是《山海经》）：
     from='shanhaijing'  323 条 —— 《五藏山经》+《海内经》《海外经》《大荒经》，
                          rank 1 原文可核 / rank 2 字句待核（含缺字、异写）
     from='later'         25 条 —— 《庄子》《淮南子》《楚辞》《神异经》等后世名兽
     from='star'          17 条 —— 《史记·天官书》《晋书·天文志》等星官实名
   《山海经》全文没有 365（「三百六十五」0 见），也没有星辰体系（「星辰」仅 2 见），
   所以「每颗星配一兽」是本项目演绎；兽本身却尽量逐条回到原文。
   ===================================================================== */

import { BEASTS_SHAN_XI } from './beasts/shan-xi.js'
import { BEASTS_BEI_DONG } from './beasts/bei-dong.js'
import { BEASTS_ZHONG } from './beasts/zhong.js'
import { BEASTS_HAIHUANG } from './beasts/haihuang.js'
import { BEASTS_LEGACY } from './beasts/legacy.js'

const SHAN_JING = [...BEASTS_SHAN_XI, ...BEASTS_BEI_DONG, ...BEASTS_ZHONG, ...BEASTS_HAIHUANG].map(
  (b) => ({ from: 'shanhaijing', ...b }),
)

/** 三档来源的展示语（组件与单测共用，避免各处硬编码） */
export const PROVENANCE = {
  shanhaijing: { label: '《山海经》原文', hint: '条目出自《山海经》本文，rank 标注字句可核程度。' },
  later: { label: '后世典籍', hint: '名号出自《庄子》《淮南子》《楚辞》《神异经》等，不是《山海经》。' },
  star: { label: '星官实名', hint: '本就是《史记·天官书》《晋书·天文志》等星图上的名字。' },
}

export const RANK_LABEL = {
  1: '原文可核',
  2: '字句待核',
  3: '后世演绎',
}

/** 全表：365 条 */
export const BEASTS = [...SHAN_JING, ...BEASTS_LEGACY]

export const BEAST_COUNT = BEASTS.length

/** 按来源分组计数，供 HUD「原典/后世/星官」三档占比使用 */
export const BEAST_ORIGIN_COUNT = BEASTS.reduce((acc, b) => {
  acc[b.from] = (acc[b.from] || 0) + 1
  return acc
}, {})

/** 名字唯一性自检结果（构建期即可发现；单测再断言一次） */
export const BEAST_NAME_DUPLICATES = (() => {
  const seen = new Set()
  const dup = new Set()
  BEASTS.forEach((b) => {
    if (seen.has(b.name)) dup.add(b.name)
    seen.add(b.name)
  })
  return [...dup]
})()
