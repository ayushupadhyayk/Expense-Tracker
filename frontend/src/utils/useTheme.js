import { useEffect, useState } from 'react'

const KEY = 'expense-tracker-theme'

const read = () => {
    try {
        return localStorage.getItem(KEY)
    } catch {
        return null
    }
}

const systemTheme = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const useTheme = () => {
    const [theme, setTheme] = useState(() => read() || systemTheme())

    useEffect(() => {
        document.documentElement.dataset.theme = theme
        try {
            localStorage.setItem(KEY, theme)
        } catch {
            // storage unavailable; theme just won't persist
        }
    }, [theme])

    return [theme, () => setTheme((t) => t === 'dark' ? 'light' : 'dark')]
}
