const currency = import.meta.env?.VITE_CURRENCY || 'USD'

const full = new Intl.NumberFormat(undefined, {style: 'currency', currency})
const whole = new Intl.NumberFormat(undefined, {style: 'currency', currency, maximumFractionDigits: 0})
const compact = new Intl.NumberFormat(undefined, {style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1})
const pct = new Intl.NumberFormat(undefined, {style: 'percent', maximumFractionDigits: 0})

export const CURRENCY = currency
export const formatMoney = (v) => full.format(Number(v) || 0)
export const formatMoneyWhole = (v) => whole.format(Math.round(Number(v) || 0))
export const formatMoneyCompact = (v) => Math.abs(v) < 10000 ? formatMoneyWhole(v) : compact.format(v)
export const formatPct = (v) => Number.isFinite(v) ? pct.format(v) : '—'
export const signedPct = (v) => !Number.isFinite(v) ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${pct.format(Math.abs(v))}`

// Currency symbol for Excel number formats, e.g. '$' or '£'.
export const currencySymbol = () =>
    full.formatToParts(0).find((p) => p.type === 'currency')?.value || '$'
