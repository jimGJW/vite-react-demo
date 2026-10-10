import { positionAt, radiusOf, instantSpeed } from './orbitCore.js'

/** 锁定/悬停星体的参数面板（真实量，由 rAF 直写 data-live 节点） */
export default function OrbitInfoPanel({ focused, pinned }) {
  return (
    <div className="ol-panel">
      <div className="ol-panel__title">
        <span className="ol-panel__dot" style={{ background: focused.color }} />
        <b>{focused.name}</b>
        <em>{focused.en}</em>
        {pinned && <i className="ol-panel__pin">已锁定</i>}
      </div>
      <dl className="ol-panel__grid">
        <div><dt>日心距 r</dt><dd data-live="radius">{radiusOf(positionAt(focused, 0)).toFixed(3)} AU</dd></div>
        <div><dt>瞬时速度</dt><dd data-live="speed">{instantSpeed(focused, 0).toFixed(2)} km/s</dd></div>
        <div><dt>半长轴 a</dt><dd>{focused.a.toFixed(4)} AU</dd></div>
        <div><dt>偏心率 e</dt><dd>{focused.e.toFixed(4)}</dd></div>
        <div><dt>轨道倾角 i</dt><dd>{focused.incl.toFixed(2)}°</dd></div>
        <div><dt>公转周期 P</dt><dd>{focused.periodYears >= 1 ? `${focused.periodYears.toFixed(2)} 年` : `${focused.periodDays.toFixed(2)} 天`}</dd></div>
        <div><dt>近日点</dt><dd>{focused.perihelionAU.toFixed(4)} AU</dd></div>
        <div><dt>远日点</dt><dd>{focused.aphelionAU.toFixed(4)} AU</dd></div>
        <div><dt>速度区间</dt><dd>{focused.speed.perihelion.toFixed(2)} ~ {focused.speed.aphelion.toFixed(2)}</dd></div>
        <div><dt>所处区段</dt><dd data-live="phase">近日点附近（最快）</dd></div>
      </dl>
      <p className="ol-panel__note">
        {focused.note}
        <br />
        平均半径 {focused.radiusKm.toLocaleString()} km · 质量 {focused.massEarth} 地球
        {focused.moons > 0 && <> · 已知卫星 {focused.moons} 颗（画布上示意 {Math.min(focused.moons, 4)} 颗）</>}
      </p>
    </div>
  )
}
