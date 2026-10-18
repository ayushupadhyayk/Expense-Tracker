import { useState } from 'react'
import { useGlobalContext } from '../context/GlobalContext'
import { availableMonths, byDateDesc, downloadCSV, filterTransactions, sum } from '../utils/transactions'
import { expenseCategories, incomeCategories } from '../utils/categories'
import { formatMoney } from '../utils/format'
import TransactionItem from './TransactionItem'
import Filters from './Filters'

const allCategories = [...incomeCategories, ...expenseCategories]
    .filter((c, i, list) => list.findIndex((x) => x.value === c.value) === i)

function AllTransactions() {
    const {incomes, expenses, deleteTransaction} = useGlobalContext()
    const [filters, setFilters] = useState({search: '', type: '', month: '', category: ''})

    const all = [...incomes, ...expenses].sort(byDateDesc)
    const visible = filterTransactions(all, filters)
    const income = sum(visible.filter((t) => t.type === 'income'))
    const expense = sum(visible.filter((t) => t.type === 'expense'))

    return (
        <div className="page">
            <header className="page-header">
                <h1>Transactions</h1>
            </header>
            <div className="stats">
                <div className="card stat"><h2>Income</h2><p className="positive">{formatMoney(income)}</p></div>
                <div className="card stat"><h2>Expenses</h2><p className="negative">{formatMoney(expense)}</p></div>
                <div className="card stat"><h2>Net</h2><p className={income - expense < 0 ? 'negative' : 'positive'}>{formatMoney(income - expense)}</p></div>
            </div>
            <Filters
                filters={filters}
                setFilters={setFilters}
                months={availableMonths(all)}
                categories={allCategories}
                showType
                onExport={() => downloadCSV(visible, 'transactions.csv')}
                exportDisabled={!visible.length}
            />
            {visible.length === 0 && <p className="muted empty-list">{all.length ? 'No transactions match these filters.' : 'No transactions yet.'}</p>}
            {visible.map((item) => (
                <TransactionItem key={item._id} item={item} onDelete={(t) => deleteTransaction(t.type, t._id)} />
            ))}
        </div>
    )
}

export default AllTransactions
