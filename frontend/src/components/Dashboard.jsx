import { useState } from 'react'
import { useGlobalContext } from '../context/GlobalContext'
import { availableMonths, byDateDesc, filterTransactions, minMax, sum } from '../utils/transactions'
import { formatMoney, formatMonth } from '../utils/format'
import Chart from './Chart'

function Dashboard({theme}) {
    const {incomes, expenses} = useGlobalContext()
    const [month, setMonth] = useState('')

    const months = availableMonths([...incomes, ...expenses])
    const inc = filterTransactions(incomes, {month})
    const exp = filterTransactions(expenses, {month})
    const totalIncome = sum(inc)
    const totalExpense = sum(exp)
    const balance = totalIncome - totalExpense
    const recent = [...inc, ...exp].sort(byDateDesc).slice(0, 5)
    const incRange = minMax(inc)
    const expRange = minMax(exp)

    return (
        <div className="page">
            <header className="page-header">
                <h1>Dashboard</h1>
                <select className="input select-sm" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Period">
                    <option value="">All time</option>
                    {months.map((m) => <option key={m} value={m}>{formatMonth(m)}</option>)}
                </select>
            </header>

            <div className="stats">
                <div className="card stat">
                    <h2>Total Income</h2>
                    <p className="positive">{formatMoney(totalIncome)}</p>
                </div>
                <div className="card stat">
                    <h2>Total Expense</h2>
                    <p className="negative">{formatMoney(totalExpense)}</p>
                </div>
                <div className="card stat">
                    <h2>Balance</h2>
                    <p className={balance < 0 ? 'negative' : 'positive'}>{formatMoney(balance)}</p>
                </div>
            </div>

            <div className="dashboard-grid">
                <Chart incomes={inc} expenses={exp} theme={theme} />

                <aside className="side">
                    <h2>Recent History</h2>
                    {recent.length === 0 && <p className="muted">No transactions yet.</p>}
                    {recent.map((t) => (
                        <div key={t._id} className="card history-item">
                            <span>{t.title}</span>
                            <span className={t.type === 'expense' ? 'negative' : 'positive'}>
                                {t.type === 'expense' ? '−' : '+'}{formatMoney(t.amount)}
                            </span>
                        </div>
                    ))}

                    <h3 className="range-title">Min <span>Income</span> Max</h3>
                    <div className="card range">
                        <span>{formatMoney(incRange.min)}</span>
                        <span>{formatMoney(incRange.max)}</span>
                    </div>
                    <h3 className="range-title">Min <span>Expense</span> Max</h3>
                    <div className="card range">
                        <span>{formatMoney(expRange.min)}</span>
                        <span>{formatMoney(expRange.max)}</span>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default Dashboard
