// Calendar days are handled as 'YYYY-MM-DD' keys in UTC, matching how the API stores dates.
export const DAY = 86400000
const AVG_MONTH_DAYS = 30.4375

export const toKey = (date) => new Date(date).toISOString().slice(0, 10)
export const fromKey = (key) => new Date(`${key}T00:00:00Z`)

export const todayKey = () => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export const addDays = (key, n) => toKey(fromKey(key).getTime() + n * DAY)
export const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / DAY)
export const monthsBetween = (a, b) => daysBetween(a, b) / AVG_MONTH_DAYS
export const addMonthsFloat = (key, months) => addDays(key, Math.round(months * AVG_MONTH_DAYS))

// Weeks start on Monday.
export const startOfWeek = (key) => addDays(key, -((fromKey(key).getUTCDay() + 6) % 7))
export const startOfMonth = (key) => `${key.slice(0, 7)}-01`
export const addMonths = (key, n) => {
    const d = fromKey(startOfMonth(key))
    d.setUTCMonth(d.getUTCMonth() + n)
    return toKey(d)
}
export const endOfMonth = (key) => addDays(addMonths(key, 1), -1)

export const rangeLength = ({start, end}) => daysBetween(start, end) + 1
export const inRange = (date, {start, end}) => {
    const key = toKey(date)
    return key >= start && key <= end
}

export const periodRange = (mode, anchor) => {
    if(mode === 'week'){
        const start = startOfWeek(anchor)
        return {start, end: addDays(start, 6)}
    }
    const start = startOfMonth(anchor)
    return {start, end: endOfMonth(start)}
}

// Move a range one period back (-1) or forward (+1).
export const shiftRange = (mode, range, dir) => {
    if(mode === 'week') return periodRange('week', addDays(range.start, 7 * dir))
    if(mode === 'month') return periodRange('month', addMonths(range.start, dir))
    const len = rangeLength(range)
    return {start: addDays(range.start, len * dir), end: addDays(range.end, len * dir)}
}

// The equal-length period immediately before `range`.
export const previousRange = (range) => {
    const len = rangeLength(range)
    return {start: addDays(range.start, -len), end: addDays(range.start, -1)}
}

// What a report compares against: the previous calendar month or week, or the
// equal-length period before a custom range.
export const comparisonRange = (range, mode) =>
    mode === 'month' || mode === 'week' ? shiftRange(mode, range, -1) : previousRange(range)

export const eachDay = ({start, end}) => {
    const days = []
    for(let k = start; k <= end; k = addDays(k, 1)) days.push(k)
    return days
}

const fmt = (opts) => new Intl.DateTimeFormat(undefined, {timeZone: 'UTC', ...opts})
const dayFmt = fmt({day: 'numeric', month: 'short'})
const fullFmt = fmt({day: 'numeric', month: 'short', year: 'numeric'})
const monthFmt = fmt({month: 'long', year: 'numeric'})
const shortMonthFmt = fmt({month: 'short'})
const shortMonthYearFmt = fmt({month: 'short', year: '2-digit'})
const weekdayFmt = fmt({weekday: 'short'})

export const formatDay = (key) => dayFmt.format(fromKey(toKey(key)))
export const formatDate = (key) => fullFmt.format(fromKey(toKey(key)))
export const formatMonth = (key) => monthFmt.format(fromKey(startOfMonth(toKey(key))))
export const formatShortMonth = (key, withYear = false) =>
    (withYear ? shortMonthYearFmt : shortMonthFmt).format(fromKey(startOfMonth(key)))
export const formatWeekday = (key) => weekdayFmt.format(fromKey(key))

export const formatRange = (range, mode) => {
    if(mode === 'month') return formatMonth(range.start)
    const sameYear = range.start.slice(0, 4) === range.end.slice(0, 4)
    return `${sameYear ? formatDay(range.start) : formatDate(range.start)} – ${formatDate(range.end)}`
}
