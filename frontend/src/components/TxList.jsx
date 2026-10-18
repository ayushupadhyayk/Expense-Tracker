import { useData } from '../context/DataContext'
import { findCategory } from '../lib/categories'
import { formatDate, toKey } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { byDateDesc } from '../lib/stats'
import { CategoryIcon, Icon } from './ui'

export function TxRow({t, theme, onEdit, showDate = false}) {
    const {deleteTransaction} = useData()
    const out = t.type === 'expense'
    const cat = findCategory(t.type, t.category)
    return (
        <div className="tx-row">
            <CategoryIcon type={t.type} category={t.category} theme={theme} />
            <div className="tx-main">
                <strong>{t.title}</strong>
                <span>{cat.label}{showDate ? `, ${formatDate(t.date)}` : ''}{t.description ? ` – ${t.description}` : ''}</span>
            </div>
            <div className={`tx-amount ${out ? 'neg' : 'pos'}`}>
                <span className="sr-only">{out ? 'Expense' : 'Income'} </span>
                {out ? '−' : '+'}{formatMoney(t.amount)}
            </div>
            {onEdit && (
                <div className="tx-actions">
                    <button className="icon-btn" onClick={() => onEdit(t)} aria-label={`Edit ${t.title}`}><Icon name="Pencil" size={16} /></button>
                    <button
                        className="icon-btn danger"
                        onClick={() => window.confirm(`Delete “${t.title}”? This can’t be undone.`) && deleteTransaction(t.type, t._id)}
                        aria-label={`Delete ${t.title}`}
                    >
                        <Icon name="Trash2" size={16} />
                    </button>
                </div>
            )}
        </div>
    )
}

/** Transactions grouped under day headings with the day's net. */
export default function TxList({list, theme, onEdit}) {
    const groups = new Map()
    for(const t of [...list].sort(byDateDesc)){
        const key = toKey(t.date)
        groups.set(key, [...(groups.get(key) || []), t])
    }
    return (
        <div>
            {[...groups].map(([day, items]) => {
                const net = items.reduce((s, t) => s + (t.type === 'expense' ? -t.amount : Number(t.amount)), 0)
                return (
                    <section className="day-group" key={day} aria-label={formatDate(day)}>
                        <div className="day-head">
                            <strong>{formatDate(day)}</strong>
                            <span className={`num ${net < 0 ? 'neg' : 'pos'}`}>{net < 0 ? '−' : '+'}{formatMoney(Math.abs(net))}</span>
                        </div>
                        {items.map((t) => <TxRow key={t._id} t={t} theme={theme} onEdit={onEdit} />)}
                    </section>
                )
            })}
        </div>
    )
}
