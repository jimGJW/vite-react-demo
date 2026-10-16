import { GALAXY } from "../../../lib/astro/orbital.js"
import { zhGalaxyType } from "../../../lib/astro/glossary"
import { useI18n } from '../../../i18n/index.js'

/* ---------- 银河系数据表 ---------- */

export function GalaxyFacts() {
  const { t } = useI18n()
  const gType = zhGalaxyType(GALAXY.type)
  const rows = [
    [t('astro.gfGalaxyType'), `${gType.zh}（${gType.en}）`],
    [t('astro.gfDiskDiameter'), `${GALAXY.diameter.toLocaleString()} 光年`],
    [t('astro.gfDiskThickness'), `约 ${GALAXY.diskThickness.toLocaleString()} 光年`],
    [t('astro.gfStarTotal'), '约 1000 亿 ~ 1 万亿颗（1e11 ~ 1e12）'],
    [t('astro.gfGaiaStars'), `${(GALAXY.gaiaStars / 1e9).toFixed(1)} 十亿颗`],
    [t('astro.gfMajorArms'), `${GALAXY.armCount} 条（英仙臂 / 人马臂 / 盾牌臂 / 矩尺臂）`],
    [t('astro.gfCenterBody'), GALAXY.center],
    [t('astro.gfSunToCenter'), `${GALAXY.sunDistance.toLocaleString()} 光年`],
    [t('astro.gfSunSpeed'), `${GALAXY.sunOrbitalSpeed} km/s`],
    [t('astro.gfSunPeriod'), `约 ${GALAXY.sunOrbitalPeriod.toLocaleString()} 年`],
    [t('astro.gfBrightest'), GALAXY.brightest],
  ]
  return (
    <>
      <div className="astro-galaxy-facts">
        {rows.map(([k, v], i) => (
          <div key={i} className="astro-fact">
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
