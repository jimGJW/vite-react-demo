import { GALAXY } from "@lib/astro/orbital.js"
import { zhGalaxyType } from "@lib/astro/glossary"
import { useI18n } from '@i18n/index.js'

/* ---------- 银河系数据表 ---------- */

export function GalaxyFacts() {
  const { t, lang } = useI18n()
  const gType = zhGalaxyType(GALAXY.type, lang)
  const uLy = t('astro.unitLy')
  const uBillion = t('astro.unitBillionStars')
  const uYr = t('astro.unitYr')
  const rows = [
    [t('astro.gfGalaxyType'), gType.zh],
    [t('astro.gfDiskDiameter'), `${GALAXY.diameter.toLocaleString()} ${uLy}`],
    [t('astro.gfDiskThickness'), `约 ${GALAXY.diskThickness.toLocaleString()} ${uLy}`],
    [t('astro.gfStarTotal'), t('astro.gfStarTotalVal')],
    [t('astro.gfGaiaStars'), `${(GALAXY.gaiaStars / 1e9).toFixed(1)} ${uBillion}`],
    [t('astro.gfMajorArms'), t('astro.gfArms', { n: GALAXY.armCount })],
    [t('astro.gfCenterBody'), GALAXY.center],
    [t('astro.gfSunToCenter'), `${GALAXY.sunDistance.toLocaleString()} ${uLy}`],
    [t('astro.gfSunSpeed'), `${GALAXY.sunOrbitalSpeed} km/s`],
    [t('astro.gfSunPeriod'), `约 ${GALAXY.sunOrbitalPeriod.toLocaleString()} ${uYr}`],
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
