import { useState } from 'react'
import { useGlobalContext } from '../context/GlobalContext'
import { availableMonths, downloadCSV, filterTransactions, sum } from '../utils/transactions'
import { categoriesFor } from '../utils/categories'
import { formatMoney } from '../utils/format'
import TransactionForm from './TransactionForm'
import TransactionItem from './TransactionItem'
import Filters from './Filters'

// Incomes or Expenses page: form on the left, filterable list on the right.
function TransactionsPage({type}) {
    const {incomes, expenses, deleteTransaction} = useGlobalContext()
    const [editing, setEditing] = useState(null)
    const [filters, setFilters] = useState({search: '', type: '', month: '', category: ''})

    const all = type === 'expense' ? expenses : incomes
    const visible = filterTransactions(all, filters)
    const label = type === 'expense' ? 'Expense' : 'Income'

    const handleDelete = async (item) => {
        const result = await deleteTransaction(type, item._id)
        if(result.ok && editing?._id === item._id) setEditing(null)
    }

    return (
        <div className="page">
            <header className="page-header">
                <h1>{label === 'Income' ? 'Incomes' : 'Expenses'}</h1>
            </header>
            <div className="card total">
                Total {label}{visible.length !== all.length && ' (filtered)'}:
                <span className={type === 'expense' ? 'negative' : 'positive'}>{formatMoney(sum(visible))}</span>
            </div>
            <div className="split">
                <div className="split-form">
                    <TransactionForm type={type} editing={editing} onDone={() => setEditing(null)} />
                </div>
                <div className="split-list">
                    <Filters
                        filters={filters}
                        setFilters={setFilters}
                        months={availableMonths(all)}
                        categories={categoriesFor(type)}
                        onExport={() => downloadCSV(visible, `${type}s.csv`)}
                        exportDisabled={!visible.length}
                    />
                    {visible.length === 0 && (
                        <p className="muted empty-list">{all.length ? 'No transactions match these filters.' : `No ${label.toLowerCase()}s yet. Add one with the form.`}</p>
                    )}
                    {visible.map((item) => (
                        <TransactionItem
                            key={item._id}
                            item={item}
                            isEditing={editing?._id === item._id}
                            onEdit={(t) => {
                                setEditing(t)
                                window.scrollTo?.({top: 0, behavior: 'smooth'})
                            }}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default TransactionsPage
