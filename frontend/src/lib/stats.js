import {
    addDays, addMonths, daysBetween, eachDay, endOfMonth, formatDate, formatDay, formatShortMonth, inRange,
    previousRange, rangeLength, startOfMonth, startOfWeek, toKey, todayKey,
} from './dates'
import { chartGroup, expenseCategories, findCategory, isDiscretionary } from './categories'
import { formatMoney, formatMoneyWhole, formatPct } from './money'

export const sum = (list) => list.reduce((total, t) => total + (Number(t.amount) || 0), 0)

export const byDateDesc = (a, b) =>
    new Date(b.date) - new Date(a.date) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0)

export const within = (list, range) => list.filter((t) => inRange(t.date, range))

export const summarize = (incomes, expenses, range) => {
    const inc = within(incomes, range)
    const exp = within(expenses, range)
    const income = sum(inc)
    const expense = sum(exp)
    const days = rangeLength(range)
    return {
        income,
        expense,
        net: income - expense,
        savingsRate: income > 0 ? (income - expense) / income : NaN,
        incomeCount: inc.length,
        expenseCount: exp.length,
        days,
        dailySpend: expense / days,
        incomes: inc,
        expenses: exp,
    }
}

// Relative change; NaN when there is nothing to compare against.
export const change = (current, previous) => previous ? (current - previous) / Math.abs(previous) : NaN

// Per-category totals, largest first. `group` folds unslotted categories into "Other" for charts.
export const byCategory = (list, type, {group = false} = {}) => {
    const total = sum(list)
    const map = new Map()
    for(const t of list){
        const key = group ? chartGroup(type, t.category) : t.category
        const row = map.get(key) || {key, amount: 0, count: 0, members: new Set()}
        row.amount += Number(t.amount) || 0
        row.count += 1
        row.members.add(t.category)
        map.set(key, row)
    }
    return [...map.values()]
        .map((row) => {
            const isOther = row.key === '__other'
            const cat = isOther ? {value: 'other', label: 'Other', icon: 'CircleDot'} : findCategory(type, row.key)
            return {
                ...row,
                category: isOther ? 'other' : row.key,
                label: isOther && row.members.size === 1 ? findCategory(type, [...row.members][0]).label : cat.label,
                icon: cat.icon,
                share: total ? row.amount / total : 0,
                members: [...row.members],
            }
        })
        // Largest first, with the folded "Other" slice always last.
        .sort((a, b) => (a.key === '__other') - (b.key === '__other') || b.amount - a.amount)
}

// Picks a bucket size that keeps charts readable for the range length.
export const bucketUnit = (range) => {
    const days = rangeLength(range)
    return days <= 31 ? 'day' : days <= 120 ? 'week' : 'month'
}

const bucketStart = (key, unit) =>
    unit === 'day' ? key : unit === 'week' ? startOfWeek(key) : startOfMonth(key)

export const buckets = (incomes, expenses, range, unit = bucketUnit(range)) => {
    const keys = []
    for(let k = bucketStart(range.start, unit); k <= range.end;
        k = unit === 'day' ? addDays(k, 1) : unit === 'week' ? addDays(k, 7) : addMonths(k, 1)){
        keys.push(k)
    }
    const rows = new Map(keys.map((key) => [key, {key, income: 0, expense: 0}]))
    const add = (list, field) => {
        for(const t of within(list, range)){
            const row = rows.get(bucketStart(toKey(t.date), unit))
            if(row) row[field] += Number(t.amount) || 0
        }
    }
    add(incomes, 'income')
    add(expenses, 'expense')
    const multiYear = range.start.slice(0, 4) !== range.end.slice(0, 4)
    return [...rows.values()].map((row) => ({
        ...row,
        net: row.income - row.expense,
        label: unit === 'month' ? formatShortMonth(row.key, multiYear) : unit === 'week' ? `Wk of ${formatDay(row.key)}` : formatDay(row.key),
        unit,
    }))
}

// Running balance across the range, starting from everything before it.
export const balanceSeries = (incomes, expenses, range) => {
    const before = sum(incomes.filter((t) => toKey(t.date) < range.start)) - sum(expenses.filter((t) => toKey(t.date) < range.start))
    let balance = before
    return buckets(incomes, expenses, range).map((row) => {
        balance += row.net
        return {...row, balance}
    })
}

// Spending per weekday (Mon..Sun), as totals and per-occurrence averages.
export const weekdaySpend = (expenses, range) => {
    const totals = Array(7).fill(0)
    const occurrences = Array(7).fill(0)
    for(const day of eachDay(range)) occurrences[(new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7] += 1
    for(const t of within(expenses, range)) totals[(new Date(t.date).getUTCDay() + 6) % 7] += Number(t.amount) || 0
    return totals.map((total, i) => ({day: i, total, average: occurrences[i] ? total / occurrences[i] : 0}))
}

// Same title (case-insensitive) in two or more distinct months, at a similar amount
// (largest within 25% of smallest), looks like a recurring payment.
export const recurring = (expenses) => {
    const map = new Map()
    for(const t of expenses){
        const key = t.title.trim().toLowerCase()
        const row = map.get(key) || {title: t.title.trim(), category: t.category, months: new Set(), amounts: [], last: t.date}
        row.months.add(toKey(t.date).slice(0, 7))
        row.amounts.push(Number(t.amount))
        if(new Date(t.date) > new Date(row.last)) row.last = t.date
        map.set(key, row)
    }
    return [...map.values()]
        .filter((r) => r.months.size >= 2 && Math.max(...r.amounts) <= Math.min(...r.amounts) * 1.25)
        .map((r) => ({...r, months: r.months.size, average: r.amounts.reduce((a, b) => a + b, 0) / r.amounts.length}))
        .sort((a, b) => b.average - a.average)
}

// Average monthly spend per discretionary category over the last `months` full months.
export const discretionaryAverages = (expenses, today = todayKey(), months = 3) => {
    const range = {start: addMonths(startOfMonth(today), -months), end: addDays(startOfMonth(today), -1)}
    const span = Math.max(1, Math.min(months, (daysBetween(range.start, today)) / 30.44))
    return byCategory(within(expenses, range).filter((t) => isDiscretionary(t.category)), 'expense')
        .map((row) => ({category: row.category, label: row.label, monthly: row.amount / span}))
}

// Average monthly surplus (income − expenses) over the last few full months that have data.
export const monthlySurplus = (incomes, expenses, today = todayKey(), months = 3) => {
    const rows = []
    for(let i = 1; i <= months; i++){
        const start = addMonths(startOfMonth(today), -i)
        const range = {start, end: addDays(addMonths(start, 1), -1)}
        const s = summarize(incomes, expenses, range)
        if(s.incomeCount || s.expenseCount) rows.push(s.net)
    }
    return rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : 0
}

// True when records go back far enough to cover the whole period before `range`,
// so comparisons with it are meaningful.
export const hasHistoryBefore = (incomes, expenses, range) => {
    const all = [...incomes, ...expenses]
    if(!all.length) return false
    const earliest = all.reduce((min, t) => (toKey(t.date) < min ? toKey(t.date) : min), toKey(all[0].date))
    return earliest <= previousRange(range).start
}

// Plain-language observations about a period, most useful first.
export const insights = (incomes, expenses, range, today = todayKey()) => {
    const cur = summarize(incomes, expenses, range)
    const prevRange = previousRange(range)
    const prev = summarize(incomes, expenses, prevRange)
    const out = []

    if(!cur.incomeCount && !cur.expenseCount){
        return [{tone: 'info', title: 'Nothing recorded in this period', detail: 'Add transactions or widen the date range to see analysis.'}]
    }

    if(Number.isFinite(cur.savingsRate)){
        const r = cur.savingsRate
        out.push(r >= 0.2
            ? {tone: 'good', title: `You kept ${formatPct(r)} of your income`, detail: 'That beats the common 20% savings guideline.'}
            : r >= 0
                ? {tone: 'warn', title: `You kept ${formatPct(r)} of your income`, detail: `Saving 20% would mean ${formatMoneyWhole(cur.income * 0.2 - cur.net)} more set aside this period.`}
                : {tone: 'bad', title: `You spent ${formatMoneyWhole(-cur.net)} more than you earned`, detail: 'Expenses ran ahead of income. Check the biggest categories below.'})
    }

    const comparable = hasHistoryBefore(incomes, expenses, range)
    const spendChange = comparable ? change(cur.expense, prev.expense) : NaN
    if(Number.isFinite(spendChange) && Math.abs(spendChange) >= 0.1){
        out.push({
            tone: spendChange > 0 ? 'warn' : 'good',
            title: `Spending ${spendChange > 0 ? 'up' : 'down'} ${formatPct(Math.abs(spendChange))} on the previous period`,
            detail: `${formatMoneyWhole(cur.expense)} against ${formatMoneyWhole(prev.expense)} for ${formatDate(prevRange.start)} – ${formatDate(prevRange.end)}.`,
        })
    }

    const curCats = byCategory(cur.expenses, 'expense')
    const prevCats = new Map(byCategory(prev.expenses, 'expense').map((c) => [c.category, c.amount]))
    const movers = !comparable ? [] : curCats
        .map((c) => ({...c, prev: prevCats.get(c.category) || 0}))
        .filter((c) => c.prev > 0 && c.amount - c.prev >= 20 && (c.amount - c.prev) / c.prev >= 0.25)
        .sort((a, b) => (b.amount - b.prev) - (a.amount - a.prev))
    if(movers[0]){
        const m = movers[0]
        out.push({tone: 'warn', title: `${m.label} rose ${formatPct((m.amount - m.prev) / m.prev)}`, detail: `${formatMoneyWhole(m.amount)} this period, up from ${formatMoneyWhole(m.prev)}.`})
    }

    if(curCats[0]){
        out.push({tone: 'info', title: `${curCats[0].label} is your largest expense`, detail: `${formatPct(curCats[0].share)} of spending, ${formatMoneyWhole(curCats[0].amount)} across ${curCats[0].count} ${curCats[0].count === 1 ? 'payment' : 'payments'}.`})
    }

    const biggest = [...cur.expenses].sort((a, b) => b.amount - a.amount)[0]
    if(biggest){
        out.push({tone: 'info', title: `Biggest single payment: ${biggest.title}`, detail: `${formatMoney(biggest.amount)} on ${formatDate(biggest.date)}.`})
    }

    // Month-end projection when the range covers the current month up to today.
    const monthEnd = endOfMonth(today)
    if(range.start === startOfMonth(today) && range.end >= today && today < monthEnd){
        const elapsed = daysBetween(range.start, today) + 1
        const projected = sum(within(expenses, {start: range.start, end: today})) / elapsed * rangeLength({start: range.start, end: monthEnd})
        out.push({tone: 'info', title: `On pace to spend ${formatMoneyWhole(projected)} this month`, detail: `Based on ${formatMoneyWhole(cur.expense / elapsed)} a day over the first ${elapsed} days.`})
    }

    const subs = cur.expenses.filter((t) => t.category === 'subscriptions')
    if(subs.length){
        const s = sum(subs)
        out.push({tone: 'info', title: `${formatMoneyWhole(s)} went to subscriptions`, detail: `About ${formatMoneyWhole(s / cur.days * 365)} a year at this rate. Cancel anything you no longer use.`})
    }

    return out
}

export const allExpenseCategories = expenseCategories
