import { useEffect, useState } from 'react'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import TransactionsPage from './components/TransactionsPage'
import AllTransactions from './components/AllTransactions'
import { useGlobalContext } from './context/GlobalContext'
import { useTheme } from './utils/useTheme'

export const pages = [
    {id: 'dashboard', title: 'Dashboard', icon: 'fa-chart-line'},
    {id: 'transactions', title: 'Transactions', icon: 'fa-credit-card'},
    {id: 'incomes', title: 'Incomes', icon: 'fa-money-bill-trend-up'},
    {id: 'expenses', title: 'Expenses', icon: 'fa-money-bill-transfer'},
]

function Toast() {
    const {toast, clearToast} = useGlobalContext()

    useEffect(() => {
        if(!toast) return
        const timer = setTimeout(clearToast, 3000)
        return () => clearTimeout(timer)
    }, [toast, clearToast])

    if(!toast) return null
    return (
        <div className={`toast toast-${toast.kind}`} role="status" key={toast.id}>
            <i className={`fa-solid ${toast.kind === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
            {toast.message}
        </div>
    )
}

function App() {
    const [active, setActive] = useState('dashboard')
    const [theme, toggleTheme] = useTheme()
    const {loading, loadError, refresh} = useGlobalContext()

    const page = () => {
        switch(active){
            case 'transactions':
                return <AllTransactions />
            case 'incomes':
                return <TransactionsPage type="income" />
            case 'expenses':
                return <TransactionsPage type="expense" />
            default:
                return <Dashboard theme={theme} />
        }
    }

    return (
        <div className="app">
            <div className="orb" aria-hidden="true"></div>
            <div className="layout">
                <Navigation pages={pages} active={active} setActive={setActive} theme={theme} toggleTheme={toggleTheme} />
                <main className="panel main">
                    {loadError && (
                        <div className="banner" role="alert">
                            <span><i className="fa-solid fa-triangle-exclamation"></i> {loadError}</span>
                            <button className="btn btn-ghost" onClick={refresh}>Retry</button>
                        </div>
                    )}
                    {loading ? <div className="loading"><i className="fa-solid fa-spinner fa-spin"></i> Loading…</div> : page()}
                </main>
            </div>
            <Toast />
        </div>
    )
}

export default App
