import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1',
    timeout: 15000,
})

const errorMessage = (err) =>
    err.response?.data?.message ||
    (err.request ? 'Cannot reach the server. Is the backend running?' : err.message)

const GlobalContext = createContext(null)

export function GlobalProvider({children}) {
    const [incomes, setIncomes] = useState([])
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [toast, setToast] = useState(null)

    const refresh = useCallback(async () => {
        try {
            const [inc, exp] = await Promise.all([api.get('get-incomes'), api.get('get-expenses')])
            setIncomes(inc.data)
            setExpenses(exp.data)
            setLoadError(null)
        } catch (err) {
            setLoadError(errorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const notify = useCallback((message, kind = 'success') => {
        setToast({message, kind, id: Date.now()})
    }, [])

    // Runs a write request, refreshes data and reports the outcome.
    const mutate = useCallback(async (request) => {
        try {
            const res = await request()
            await refresh()
            notify(res.data.message)
            return {ok: true}
        } catch (err) {
            return {ok: false, message: errorMessage(err)}
        }
    }, [refresh, notify])

    // type is 'income' or 'expense'; passing an id updates instead of creating.
    const saveTransaction = useCallback((type, data, id) =>
        mutate(() => id ? api.put(`update-${type}/${id}`, data) : api.post(`add-${type}`, data)), [mutate])

    const deleteTransaction = useCallback(async (type, id) => {
        const result = await mutate(() => api.delete(`delete-${type}/${id}`))
        if(!result.ok) notify(result.message, 'error')
        return result
    }, [mutate, notify])

    const value = useMemo(() => ({
        incomes,
        expenses,
        loading,
        loadError,
        refresh,
        saveTransaction,
        deleteTransaction,
        toast,
        notify,
        clearToast: () => setToast(null),
    }), [incomes, expenses, loading, loadError, refresh, saveTransaction, deleteTransaction, toast, notify])

    return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
}

export const useGlobalContext = () => useContext(GlobalContext)
