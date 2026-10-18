import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Empty, Icon, PageHead, Segmented } from '../components/ui'
import TxList from '../components/TxList'
import { expenseCategories, findCategory, incomeCategories } from '../lib/categories'
import { toKey } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { byDateDesc, sum } from '../lib/stats'

const csvCell = (v) => {
    const s = String(v ?? '')
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const downloadCSV = (list) => {
    const rows = [['Date', 'Type', 'Title', 'Category', 'Reference', 'Amount']]
    for(const t of [...list].sort(byDateDesc)){
        rows.push([toKey(t.date), t.type, t.title, findCategory(t.type, t.category).label, t.description, Number(t.amount).toFixed(2)])
    }
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\n')], {type: 'text/csv;charset=utf-8'}))
    const a = Object.assign(document.createElement('a'), {href: url, download: 'transactions.csv'})
    a.click()
    URL.revokeObjectURL(url)
}

const allCategories = [...expenseCategories, ...incomeCategories].filter((c, i, l) => l.findIndex((x) => x.value === c.value) === i)

export default function Transactions({theme, openTransaction}) {
    const {incomes, expenses} = useData()
    const [type, setType] = useState('all')
    const [filters, setFilters] = useState({search: '', category: '', from: '', to: ''})
    const set = (name) => (e) => setFilters({...filters, [name]: e.target.value})

    const pool = type === 'income' ? incomes : type === 'expense' ? expenses : [...incomes, ...expenses]
    const q = filters.search.trim().toLowerCase()
    const list = pool.filter((t) => {
        const day = toKey(t.date)
        return (!filters.category || t.category === filters.category)
            && (!filters.from || day >= filters.from)
            && (!filters.to || day <= filters.to)
            && (!q || `${t.title} ${t.description}`.toLowerCase().includes(q))
    })
    const categories = type === 'income' ? incomeCategories : type === 'expense' ? expenseCategories : allCategories
    const filtered = Object.values(filters).some(Boolean)
    const moneyIn = sum(list.filter((t) => t.type === 'income'))
    const moneyOut = sum(list.filter((t) => t.type === 'expense'))

    return (
        <div className="page">
            <PageHead
                title="Transactions"
                actions={
                    <>
                        <button className="btn btn-quiet" onClick={() => downloadCSV(list)} disabled={!list.length}><Icon name="Download" size={16} /> Export CSV</button>
                        <button className="btn btn-primary" onClick={() => openTransaction(null, type === 'income' ? 'income' : 'expense')}><Icon name="Plus" size={16} /> Add transaction</button>
                    </>
                }
            >
                Every payment in and out. Select one to edit it.
            </PageHead>

            <dl className="ledger" style={{'--cols': 3}}>
                <div><dt>Money in</dt><dd className="figure pos">{formatMoney(moneyIn)}</dd></div>
                <div><dt>Money out</dt><dd className="figure neg">{formatMoney(moneyOut)}</dd></div>
                <div><dt>Net, {list.length} {list.length === 1 ? 'transaction' : 'transactions'}</dt><dd className={`figure ${moneyIn - moneyOut < 0 ? 'neg' : ''}`}>{formatMoney(moneyIn - moneyOut)}</dd></div>
            </dl>

            <section className="panel">
                <div className="filters" style={{marginBottom: 20}}>
                    <Segmented
                        label="Type"
                        value={type}
                        onChange={(v) => { setType(v); setFilters({...filters, category: ''}) }}
                        options={[{value: 'all', label: 'All'}, {value: 'income', label: 'Money in'}, {value: 'expense', label: 'Money out'}]}
                    />
                    <div className="search">
                        <Icon name="Search" size={16} />
                        <input className="input" type="search" placeholder="Search titles and references" value={filters.search} onChange={set('search')} aria-label="Search" />
                    </div>
                    <select className="input" value={filters.category} onChange={set('category')} aria-label="Category">
                        <option value="">All categories</option>
                        {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <input className="input" type="date" value={filters.from} max={filters.to || undefined} onChange={set('from')} aria-label="From date" />
                    <input className="input" type="date" value={filters.to} min={filters.from || undefined} onChange={set('to')} aria-label="To date" />
                    {filtered && <button className="btn btn-text btn-sm" onClick={() => setFilters({search: '', category: '', from: '', to: ''})}>Clear filters</button>}
                </div>

                {list.length
                    ? <TxList list={list} theme={theme} onEdit={(t) => openTransaction(t)} />
                    : pool.length
                        ? <Empty title="No matches">Nothing fits these filters. Clear them to see everything.</Empty>
                        : <Empty title="Your ledger is empty" action={<button className="btn btn-primary" onClick={() => openTransaction(null, 'expense')}>Add your first transaction</button>}>
                            Record money in and out to start building reports.
                        </Empty>}
            </section>
        </div>
    )
}
