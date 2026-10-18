import { formatMonth } from '../utils/format'

function Filters({filters, setFilters, months, categories, showType = false, onExport, exportDisabled}) {
    const set = (name) => (e) => setFilters({...filters, [name]: e.target.value})
    const active = Object.values(filters).some(Boolean)

    return (
        <div className="filters">
            <input className="input" type="search" placeholder="Search…" value={filters.search} onChange={set('search')} aria-label="Search" />
            {showType && (
                <select className="input" value={filters.type} onChange={set('type')} aria-label="Type">
                    <option value="">All types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            )}
            <select className="input" value={filters.month} onChange={set('month')} aria-label="Month">
                <option value="">All months</option>
                {months.map((m) => <option key={m} value={m}>{formatMonth(m)}</option>)}
            </select>
            <select className="input" value={filters.category} onChange={set('category')} aria-label="Category">
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {active && (
                <button className="btn btn-ghost" onClick={() => setFilters({search: '', type: '', month: '', category: ''})}>Clear</button>
            )}
            <button className="btn btn-ghost" onClick={onExport} disabled={exportDisabled} title="Download as CSV">
                <i className="fa-solid fa-file-csv"></i> Export
            </button>
        </div>
    )
}

export default Filters
