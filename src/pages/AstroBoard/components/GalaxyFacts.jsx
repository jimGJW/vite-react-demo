import { GALAXY } from "../../../lib/astro/orbital.js"
import { zhGalaxyType } from "../../../lib/astro/glossary"

/* ---------- 银河系数据表 ---------- */

export function GalaxyFacts() {
  const gType = zhGalaxyType(GALAXY.type)
  const rows = [
    ['星系类型', `${gType.zh}（${gType.en}）`],
    ['盘直径', `${GALAXY.diameter.toLocaleString()} 光年`],
    ['盘厚度', `约 ${GALAXY.diskThickness.toLocaleString()} 光年`],
    ['恒星总数', '约 1000 亿 ~ 1 万亿颗（1e11 ~ 1e12）'],
    ['Gaia DR3 已编目恒星', `${(GALAXY.gaiaStars / 1e9).toFixed(1)} 十亿颗`],
    ['主要旋臂', `${GALAXY.armCount} 条（英仙臂 / 人马臂 / 盾牌臂 / 矩尺臂）`],
    ['银心天体', GALAXY.center],
    ['太阳距银心', `${GALAXY.sunDistance.toLocaleString()} 光年`],
    ['太阳公转速度', `${GALAXY.sunOrbitalSpeed} km/s`],
    ['太阳公转周期', `约 ${GALAXY.sunOrbitalPeriod.toLocaleString()} 年`],
    ['最明亮区域', GALAXY.brightest],
  ]
  return (
    <>
      <div className="astro-galaxy-facts">
        {rows.map(([k, v]) => (
          <div key={k} className="astro-fact">
            <span className="astro-fact__k">{k}</span>
            <span className="astro-fact__v">{v}</span>
          </div>
        ))}
      </div>
      <div className="astro-galaxy-desc">
        <b>{gType.zh}</b>：{gType.desc}
      </div>
    </>
  )
}

export default GalaxyFacts
