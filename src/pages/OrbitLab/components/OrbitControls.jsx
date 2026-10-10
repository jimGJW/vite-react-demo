import { SCALE_MODES } from './orbitCore.js'

/** 控制面板：比例模式 / 视角 / 倍速 / 暂停 / 回到历元 / 三个开关 */
export default function OrbitControls({
  scaleMode, tilt, speedExp, speedLabel, paused,
  showOrbits, showTrails, showLabels,
  onScaleMode, onTilt, onSpeed, togglePause, resetEpoch, toggle,
}) {
  return (
    <div className="ol-controls">
      <span className="ol-label">比例模式</span>
      <span className="ol-tabs">
        {SCALE_MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`ol-tab${m.key === scaleMode ? ' is-on' : ''}`}
            onClick={() => onScaleMode(m.key)}
            title={m.hint}
          >
            {m.label}
          </button>
        ))}
      </span>

      <span className="ol-label">视角</span>
      <input
        className="ol-range ol-range--sm"
        type="range" min="0" max="80" step="1"
        value={tilt} onChange={onTilt} aria-label="视角倾角"
      />
      <span className="ol-tag">{tilt}°</span>

      <span className="ol-label">时间倍速</span>
      <input
        className="ol-range"
        type="range" min="0" max="4" step="0.05"
        value={speedExp} onChange={onSpeed} aria-label="时间倍速"
      />
      <span className="ol-tag">{speedLabel}</span>

      <button type="button" className={`ol-btn${paused ? ' is-on' : ''}`} onClick={togglePause}>
        {paused ? '继续' : '暂停'}
      </button>
      <button type="button" className="ol-btn" onClick={resetEpoch}>回到历元</button>

      <label className="ol-check">
        <input type="checkbox" checked={showOrbits} onChange={() => toggle('orbits')} />轨道线
      </label>
      <label className="ol-check">
        <input type="checkbox" checked={showTrails} onChange={() => toggle('trails')} />轨迹
      </label>
      <label className="ol-check">
        <input type="checkbox" checked={showLabels} onChange={() => toggle('labels')} />名称
      </label>

      <span className="ol-spacer" />
      <span className="ol-tag ol-tag--info">点行星可锁定</span>
      <span className="ol-tag ol-tag--ok" data-live="clock">0.0 天 · </span>
    </div>
  )
}
