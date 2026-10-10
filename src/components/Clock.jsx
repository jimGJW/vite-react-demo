import { memo, useEffect, useState } from 'react'

const pad = (n) => String(n).padStart(2, '0')

function fmtClock(d) {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '--:--:--'
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/**
 * 自包含时钟组件：内部每秒自更新，包裹它的看板因此无需为时钟而整页重渲染。
 *
 * 三块看板（geo / ocean / astro）原本把 `now` 放在顶层 state，每秒 setNow 触发
 * 整个看板（含当前激活 Tab）重渲染。把时钟下沉到本组件后，父级只在数据/主题变化
 * 时才重渲染，秒级跳动被隔离在组件内部。
 *
 * prefix 用于匹配各看板既有的 SCSS 类名（geo-clock / o-clock / astro-clock）。
 */
function Clock({ prefix = 'geo' }) {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(t)
    }, [])
    return (
        <>
            <div className={`${prefix}-clock`}>
                <span className={`${prefix}-clock__label`}>UTC</span>
                <span className={`${prefix}-clock__val`}>{fmtClock(now)}</span>
            </div>
            <div className={`${prefix}-clock`}>
                <span className={`${prefix}-clock__label`}>北京</span>
                <span className={`${prefix}-clock__val`}>
                    {fmtClock(new Date(now.getTime() + 8 * 3600 * 1000))}
                </span>
            </div>
        </>
    )
}

export default memo(Clock)
