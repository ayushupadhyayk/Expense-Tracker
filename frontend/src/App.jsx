import { useCallback, useEffect, useState } from 'react'
import avatar from './img/avatar.png'
import { useData } from './context/DataContext'
import { useRoute, useTheme } from './lib/useAppState'
import { Icon } from './components/ui'
import TransactionDrawer from './components/TransactionDrawer'
import Overview from './pages/Overview'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import Analysis from './pages/Analysis'
import Goals from './pages/Goals'

const pages = [
    {id: 'overview', title: 'Overview', icon: 'LayoutDashboard', Page: Overview},
    {id: 'transactions', title: 'Transactions', icon: 'ArrowLeftRight', Page: Transactions},
    {id: 'reports', title: 'Reports', icon: 'FileSpreadsheet', Page: Reports},
    {id: 'analysis', title: 'Analysis', icon: 'ChartPie', Page: Analysis},
    {id: 'goals', title: 'Goals', icon: 'Flag', Page: Goals},
]

function Toast() {
    const {toast, clearToast} = useData()
    useEffect(() => {
        if(!toast) return
        const timer = setTimeout(clearToast, 3200)
        return () => clearTimeout(timer)
    }, [toast, clearToast])
    if(!toast) return null
    return (
        <div className={`toast ${toast.kind === 'error' ? 'error' : ''}`} role="status" key={toast.id}>
            <Icon name={toast.kind === 'error' ? 'CircleAlert' : 'CircleCheck'} size={16} />
            {toast.message}
        </div>
    )
}

export default function App() {
    const [theme, toggleTheme] = useTheme()
    const [route, go] = useRoute(pages.map((p) => p.id), 'overview')
    const {loading, loadError, refresh} = useData()
    // Transaction drawer is shared by every page: {item?, type?} or null.
    const [drawer, setDrawer] = useState(null)
    const closeDrawer = useCallback(() => setDrawer(null), [])

    const {Page} = pages.find((p) => p.id === route)
    const openTransaction = useCallback((item, type) => setDrawer({item, type}), [])

    return (
        <div className="shell">
            <aside className="spine">
                <div className="brand">Expense Tracker</div>
                <nav className="nav" aria-label="Main">
                    {pages.map((p) => (
                        <button key={p.id} aria-current={route === p.id ? 'page' : undefined} onClick={() => go(p.id)}>
                            <Icon name={p.icon} size={20} />
                            <span>{p.title}</span>
                        </button>
                    ))}
                </nav>
                <div className="spine-foot">
                    <button className="theme-switch" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
                        <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} />
                        <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                    </button>
                    <div className="owner">
                        <img src={avatar} alt="" />
                        <span>Ayush</span>
                    </div>
                </div>
            </aside>

            <main className="main">
                {loadError && (
                    <div className="page" style={{marginBottom: 20}}>
                        <div className="banner" role="alert">
                            <span>{loadError}</span>
                            <button className="btn btn-quiet btn-sm" onClick={refresh}>Try again</button>
                        </div>
                    </div>
                )}
                {loading
                    ? <div className="loading">Loading your ledger…</div>
                    : <Page theme={theme} go={go} openTransaction={openTransaction} />}
            </main>

            {drawer && <TransactionDrawer item={drawer.item} defaultType={drawer.type} onClose={closeDrawer} />}
            <Toast />
        </div>
    )
}
