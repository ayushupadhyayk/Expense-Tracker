import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1',
    timeout: 15000,
})

const errorMessage = (err) =>
    err.response?.data?.message ||
    (err.request ? 'Can’t reach the server. Start the backend and try again.' : err.message)

const DataContext = createContext(null)

export function DataProvider({children}) {
    const [incomes, setIncomes] = useState([])
    const [expenses, setExpenses] = useState([])
    const [goals, setGoals] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [toast, setToast] = useState(null)

    const refresh = useCallback(async () => {
        try {
            const [inc, exp, gls] = await Promise.all([api.get('get-incomes'), api.get('get-expenses'), api.get('goals')])
            setIncomes(inc.data)
            setExpenses(exp.data)
            setGoals(gls.data)
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

    const notify = useCallback((message, kind = 'success') => setToast({message, kind, id: Date.now()}), [])

    // Runs a write, refreshes everything and reports the outcome to the caller.
    const mutate = useCallback(async (request, {silent = false} = {}) => {
        try {
            const res = await request()
            await refresh()
            if(!silent) notify(res.data.message)
            return {ok: true, data: res.data.data}
        } catch (err) {
            return {ok: false, message: errorMessage(err)}
        }
    }, [refresh, notify])

    const withErrorToast = useCallback(async (promise) => {
        const result = await promise
        if(!result.ok) notify(result.message, 'error')
        return result
    }, [notify])

    const actions = useMemo(() => ({
        // type is 'income' or 'expense'; an id updates instead of creating.
        saveTransaction: (type, data, id) =>
            mutate(() => id ? api.put(`update-${type}/${id}`, data) : api.post(`add-${type}`, data)),
        deleteTransaction: (type, id) => withErrorToast(mutate(() => api.delete(`delete-${type}/${id}`))),
        saveGoal: (data, id) => mutate(() => id ? api.put(`goals/${id}`, data) : api.post('goals', data)),
        deleteGoal: (id) => withErrorToast(mutate(() => api.delete(`goals/${id}`))),
        addContribution: (id, data) => mutate(() => api.post(`goals/${id}/contributions`, data)),
        deleteContribution: (id, contributionId) =>
            withErrorToast(mutate(() => api.delete(`goals/${id}/contributions/${contributionId}`))),
    }), [mutate, withErrorToast])

    const value = useMemo(() => ({
        incomes,
        expenses,
        goals,
        loading,
        loadError,
        refresh,
        toast,
        notify,
        clearToast: () => setToast(null),
        ...actions,
    }), [incomes, expenses, goals, loading, loadError, refresh, toast, notify, actions])

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
