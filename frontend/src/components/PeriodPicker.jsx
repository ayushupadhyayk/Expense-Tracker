import { addDays, addMonths, formatRange, periodRange, shiftRange, startOfMonth, todayKey } from '../lib/dates'
import { Icon, Segmented } from './ui'

export const customPresets = (today = todayKey()) => [
    {id: '7d', label: 'Last 7 days', range: {start: addDays(today, -6), end: today}},
    {id: '30d', label: 'Last 30 days', range: {start: addDays(today, -29), end: today}},
    {id: '90d', label: 'Last 3 months', range: {start: addDays(today, -89), end: today}},
    {id: 'q', label: 'Last full quarter', range: (() => {
        const m = Number(today.slice(5, 7)) - 1
        const qStart = `${today.slice(0, 4)}-${String(Math.floor(m / 3) * 3 + 1).padStart(2, '0')}-01`
        const start = addMonths(qStart, -3)
        return {start, end: addDays(qStart, -1)}
    })()},
    {id: 'ytd', label: 'Year to date', range: {start: `${today.slice(0, 4)}-01-01`, end: today}},
    {id: '12m', label: 'Last 12 months', range: {start: addMonths(startOfMonth(today), -11), end: today}},
]

/**
 * Week / month / custom period control.
 * value: {mode, range}; onChange receives the next {mode, range}.
 */
export default function PeriodPicker({value, onChange}) {
    const {mode, range} = value
    const today = todayKey()
    const presets = customPresets(today)
    const atPresent = range.end >= today
    const activePreset = presets.find((p) => p.range.start === range.start && p.range.end === range.end)?.id

    const setMode = (next) => {
        if(next === mode) return
        onChange({mode: next, range: next === 'custom' ? presets[1].range : periodRange(next, today)})
    }

    const setCustom = (field) => (e) => {
        const next = {...range, [field]: e.target.value}
        if(!next.start || !next.end) return
        // Keep start before end whichever field moved.
        if(next.start > next.end) field === 'start' ? (next.end = next.start) : (next.start = next.end)
        onChange({mode: 'custom', range: next})
    }

    return (
        <div className="period-bar">
            <Segmented
                label="Report period"
                value={mode}
                onChange={setMode}
                options={[{value: 'week', label: 'Weekly'}, {value: 'month', label: 'Monthly'}, {value: 'custom', label: 'Custom range'}]}
            />

            {mode === 'custom' ? (
                <div className="custom-range">
                    <label className="sr-only" htmlFor="range-start">From</label>
                    <input id="range-start" className="input" type="date" value={range.start} max={range.end} onChange={setCustom('start')} />
                    <span className="muted">to</span>
                    <label className="sr-only" htmlFor="range-end">To</label>
                    <input id="range-end" className="input" type="date" value={range.end} min={range.start} onChange={setCustom('end')} />
                </div>
            ) : (
                <div className="period-nav">
                    <button className="icon-btn" onClick={() => onChange({mode, range: shiftRange(mode, range, -1)})} aria-label={`Previous ${mode}`}>
                        <Icon name="ChevronLeft" />
                    </button>
                    <span className="label" aria-live="polite">{formatRange(range, mode)}</span>
                    <button className="icon-btn" onClick={() => onChange({mode, range: shiftRange(mode, range, 1)})} disabled={atPresent} aria-label={`Next ${mode}`}>
                        <Icon name="ChevronRight" />
                    </button>
                    {!atPresent && (
                        <button className="btn btn-text btn-sm" onClick={() => onChange({mode, range: periodRange(mode, today)})}>
                            This {mode}
                        </button>
                    )}
                </div>
            )}

            {mode === 'custom' && (
                <div className="presets" role="group" aria-label="Quick ranges">
                    {presets.map((p) => (
                        <button key={p.id} className="chip" aria-pressed={activePreset === p.id} onClick={() => onChange({mode: 'custom', range: p.range})}>
                            {p.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
