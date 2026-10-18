const currency = import.meta.env.VITE_CURRENCY || 'USD'

const money = new Intl.NumberFormat(undefined, {style: 'currency', currency})

export const formatMoney = (value) => money.format(Number(value) || 0)

// Dates are stored as UTC midnight, so format in UTC to avoid off-by-one days.
const dateFmt = new Intl.DateTimeFormat(undefined, {day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'})
const monthFmt = new Intl.DateTimeFormat(undefined, {month: 'long', year: 'numeric', timeZone: 'UTC'})

export const formatDate = (date) => dateFmt.format(new Date(date))

// 'YYYY-MM' -> 'October 2026'
export const formatMonth = (key) => monthFmt.format(new Date(`${key}-01T00:00:00Z`))

// Value for <input type="date">
export const toInputDate = (date) => date ? new Date(date).toISOString().slice(0, 10) : ''

export const todayInputDate = () => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
