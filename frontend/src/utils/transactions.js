export const sum = (list) => list.reduce((total, item) => total + (Number(item.amount) || 0), 0)

export const monthKey = (date) => new Date(date).toISOString().slice(0, 7)

export const byDateDesc = (a, b) =>
    new Date(b.date) - new Date(a.date) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0)

// Distinct 'YYYY-MM' keys, newest first.
export const availableMonths = (list) =>
    [...new Set(list.map((t) => monthKey(t.date)))].sort().reverse()

export const filterTransactions = (list, {month = '', category = '', type = '', search = ''} = {}) => {
    const q = search.trim().toLowerCase()
    return list.filter((t) =>
        (!month || monthKey(t.date) === month) &&
        (!category || t.category === category) &&
        (!type || t.type === type) &&
        (!q || `${t.title} ${t.description}`.toLowerCase().includes(q))
    )
}

const csvCell = (value) => {
    const s = String(value ?? '')
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const toCSV = (list) => {
    const header = ['Date', 'Type', 'Title', 'Category', 'Description', 'Amount']
    const rows = [...list].sort(byDateDesc).map((t) => [
        new Date(t.date).toISOString().slice(0, 10),
        t.type,
        t.title,
        t.category,
        t.description,
        Number(t.amount).toFixed(2),
    ])
    return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
}

export const downloadCSV = (list, filename) => {
    const blob = new Blob([toCSV(list)], {type: 'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), {href: url, download: filename})
    a.click()
    URL.revokeObjectURL(url)
}

// Daily income/expense totals on a shared, sorted date axis.
export const dailySeries = (incomes, expenses) => {
    const day = (t) => new Date(t.date).toISOString().slice(0, 10)
    const totals = (list) => list.reduce((acc, t) => {
        acc[day(t)] = (acc[day(t)] || 0) + Number(t.amount)
        return acc
    }, {})
    const inc = totals(incomes)
    const exp = totals(expenses)
    const labels = [...new Set([...Object.keys(inc), ...Object.keys(exp)])].sort()
    return {
        labels,
        income: labels.map((d) => inc[d] || 0),
        expense: labels.map((d) => exp[d] || 0),
    }
}

export const minMax = (list) => {
    if(!list.length) return {min: 0, max: 0}
    const amounts = list.map((t) => Number(t.amount))
    return {min: Math.min(...amounts), max: Math.max(...amounts)}
}
