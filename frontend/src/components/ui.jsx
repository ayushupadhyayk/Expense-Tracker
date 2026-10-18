import { useEffect, useRef } from 'react'
import { ICONS } from '../lib/icons'
import { categoryColor, findCategory } from '../lib/categories'
import { change } from '../lib/stats'
import { signedPct } from '../lib/money'

export function Icon({name, size = 18, ...rest}) {
    const Component = ICONS[name] || ICONS.CircleDot
    return <Component size={size} strokeWidth={1.75} aria-hidden="true" {...rest} />
}

export function CategoryIcon({type, category, theme, size = 18}) {
    const cat = findCategory(type, category)
    return (
        <span className="tx-icon" style={{'--dot': categoryColor(type, category, theme)}}>
            <Icon name={cat.icon} size={size} />
        </span>
    )
}

export function PageHead({title, children, actions}) {
    return (
        <header className="page-head">
            <div>
                <h1>{title}</h1>
                {children && <p>{children}</p>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
        </header>
    )
}

/**
 * Change against a previous value. `goodWhen` says which direction is good news.
 */
export function Delta({current, previous, goodWhen = 'up', label = 'vs previous period'}) {
    const c = change(current, previous)
    if(!Number.isFinite(c)) return <span className="delta">No earlier data to compare</span>
    const up = c > 0
    const good = c === 0 ? '' : (up === (goodWhen === 'up') ? 'good' : 'bad')
    return (
        <span className={`delta ${good}`}>
            <Icon name={up ? 'ArrowUpRight' : c < 0 ? 'ArrowDownRight' : 'Minus'} size={14} />
            {signedPct(c)} {label}
        </span>
    )
}

export function Segmented({value, onChange, options, label}) {
    return (
        <div className="segmented" role="group" aria-label={label}>
            {options.map((o) => (
                <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
                    {o.label}
                </button>
            ))}
        </div>
    )
}

export function Drawer({title, onClose, children, footer}) {
    const panel = useRef(null)

    useEffect(() => {
        const previous = document.activeElement
        panel.current?.querySelector('input, select, textarea, button')?.focus()
        const onKey = (e) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
            previous?.focus?.()
        }
    }, [onClose])

    return (
        <div className="drawer">
            <button className="drawer-backdrop" aria-label="Close" tabIndex={-1} onClick={onClose} />
            <div className="drawer-panel" role="dialog" aria-modal="true" aria-label={title} ref={panel}>
                <div className="drawer-head">
                    <h2>{title}</h2>
                    <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="X" /></button>
                </div>
                {children}
                {footer && <div className="drawer-foot">{footer}</div>}
            </div>
        </div>
    )
}

export function Empty({title, children, action}) {
    return (
        <div className="empty">
            <h3>{title}</h3>
            {children && <p>{children}</p>}
            {action}
        </div>
    )
}

export function Swatch({color}) {
    return <i className="swatch" style={{background: color}} aria-hidden="true" />
}
