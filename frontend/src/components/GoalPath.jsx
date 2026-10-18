import { useLayoutEffect, useRef, useState } from 'react'
import { formatDate, formatMonth } from '../lib/dates'
import { formatMoneyWhole, formatPct } from '../lib/money'

// A winding route from start (left) to the goal (right).
const ROUTE = 'M 24 150 C 140 150, 170 46, 300 56 S 460 176, 590 146 S 790 34, 972 52'

/** The goal drawn as a journey: brass is the distance covered, dots are milestones. */
export default function GoalPath({plan, id}) {
    const ref = useRef(null)
    const [points, setPoints] = useState(null)
    const progress = Math.max(0, Math.min(1, plan.progress))

    useLayoutEffect(() => {
        const path = ref.current
        if(!path?.getTotalLength) return
        const length = path.getTotalLength()
        const at = (f) => path.getPointAtLength(length * f)
        setPoints({start: at(0), you: at(progress), nodes: plan.milestones.map((m) => at(m.pct))})
    }, [progress, plan.milestones])

    return (
        <div className="path">
            <svg viewBox="0 0 1000 200" role="img" aria-label={`${formatPct(progress)} of the way to the goal`}>
                <path ref={ref} d={ROUTE} className="path-base" />
                {progress > 0 && (
                    // Keyed by goal so the draw-in plays once per goal shown.
                    <path
                        key={id}
                        d={ROUTE}
                        pathLength="1"
                        className="path-done path-draw"
                        style={{strokeDasharray: `${progress} 2`, '--from': progress}}
                    />
                )}
                {points && (
                    <>
                        <circle className="path-start" cx={points.start.x} cy={points.start.y} r="6" />
                        {/* Drawn before the milestones so a node label stays readable when you're on it. */}
                        {progress > 0 && progress < 1 && (
                            <g className="path-you">
                                <circle className="halo" cx={points.you.x} cy={points.you.y} r="18" />
                                <circle className="dot" cx={points.you.x} cy={points.you.y} r="8" />
                            </g>
                        )}
                        {plan.milestones.map((m, i) => {
                            const p = points.nodes[i]
                            const reached = Boolean(m.reached)
                            const last = m.pct === 1
                            return (
                                <g key={m.pct} className={`path-node ${reached ? 'reached' : ''}`}>
                                    {last && !reached && (
                                        <path className="path-flag" d={`M ${p.x - 2} ${p.y - 16} v -30 l 22 8 l -20 8`} />
                                    )}
                                    <circle className="ring" cx={p.x} cy={p.y} r="17" />
                                    <text x={p.x} y={p.y}>{Math.round(m.pct * 100)}</text>
                                </g>
                            )
                        })}
                    </>
                )}
            </svg>

            <ol className="milestones">
                {plan.milestones.map((m) => (
                    <li key={m.pct} className={`milestone ${m.reached ? 'reached' : ''}`}>
                        <b>{formatMoneyWhole(m.amount)}</b>
                        <span>{Math.round(m.pct * 100)}% {m.pct === 1 ? 'the goal' : 'milestone'}</span>
                        <span>
                            {m.reached
                                ? `Reached ${formatDate(m.reached)}`
                                : m.eta ? `Expected ${formatMonth(m.eta)}` : 'Add money to set a date'}
                        </span>
                    </li>
                ))}
            </ol>
        </div>
    )
}
