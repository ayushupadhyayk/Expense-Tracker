import { useCallback, useEffect, useState } from 'react'

const THEME_KEY = 'expense-tracker-theme'

const readStorage = (key) => {
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

const writeStorage = (key, value) => {
    try {
        localStorage.setItem(key, value)
    } catch {
        // Storage unavailable (private mode); the preference just won't persist.
    }
}

export const useTheme = () => {
    const [theme, setTheme] = useState(() =>
        readStorage(THEME_KEY) || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))

    useEffect(() => {
        document.documentElement.dataset.theme = theme
        writeStorage(THEME_KEY, theme)
    }, [theme])

    return [theme, useCallback(() => setTheme((t) => t === 'dark' ? 'light' : 'dark'), [])]
}

// The current page lives in the URL hash so refreshes and the back button keep your place.
export const useRoute = (pages, fallback) => {
    const read = () => {
        const id = window.location.hash.replace(/^#\/?/, '')
        return pages.includes(id) ? id : fallback
    }
    const [route, setRoute] = useState(read)

    useEffect(() => {
        const onHash = () => setRoute(read())
        window.addEventListener('hashchange', onHash)
        return () => window.removeEventListener('hashchange', onHash)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const go = useCallback((id) => {
        window.location.hash = `/${id}`
        window.scrollTo?.({top: 0})
    }, [])

    return [route, go]
}
