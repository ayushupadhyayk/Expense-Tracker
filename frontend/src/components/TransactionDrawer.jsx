import { useState } from 'react'
import { useData } from '../context/DataContext'
import { categoriesFor } from '../lib/categories'
import { todayKey, toKey } from '../lib/dates'
import { currencySymbol } from '../lib/money'
import { Drawer, Icon } from './ui'

const blank = (type) => ({type, title: '', amount: '', date: todayKey(), category: '', description: ''})

const fromItem = (item) => ({
    type: item.type,
    title: item.title,
    amount: String(item.amount),
    date: toKey(item.date),
    category: item.category,
    description: item.description,
})

/** Add or edit a transaction. `item` set = edit mode (type is fixed). */
export default function TransactionDrawer({item, defaultType = 'expense', onClose}) {
    const {saveTransaction} = useData()
    const [input, setInput] = useState(() => item ? fromItem(item) : blank(defaultType))
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const editing = Boolean(item)
    const noun = input.type === 'expense' ? 'expense' : 'income'

    const set = (name) => (e) => {
        setInput({...input, [name]: e.target.value})
        setError('')
    }

    const setType = (type) => {
        // Categories differ between types, so clear the choice when switching.
        setInput({...input, type, category: ''})
        setError('')
    }

    const submit = async (e) => {
        e.preventDefault()
        setSaving(true)
        const {type, ...data} = input
        const result = await saveTransaction(type, data, item?._id)
        setSaving(false)
        if(result.ok) onClose()
        else setError(result.message)
    }

    return (
        <Drawer
            title={editing ? `Edit ${noun}` : 'Add a transaction'}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
                    <button type="submit" form="tx-form" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : editing ? 'Save changes' : `Add ${noun}`}
                    </button>
                </>
            }
        >
            <form id="tx-form" className="drawer-body" onSubmit={submit} noValidate>
                {!editing && (
                    <div className="type-switch" role="group" aria-label="Transaction type">
                        <button type="button" className="expense" aria-pressed={input.type === 'expense'} onClick={() => setType('expense')}>
                            <Icon name="ArrowUpRight" size={16} /> Money out
                        </button>
                        <button type="button" className="income" aria-pressed={input.type === 'income'} onClick={() => setType('income')}>
                            <Icon name="ArrowDownLeft" size={16} /> Money in
                        </button>
                    </div>
                )}
                {error && <p className="form-error" role="alert">{error}</p>}
                <label className="field">
                    <span>Title</span>
                    <input className="input" value={input.title} maxLength={50} onChange={set('title')}
                        placeholder={input.type === 'expense' ? 'e.g. Weekly shop' : 'e.g. October salary'} />
                </label>
                <div className="form-row">
                    <label className="field">
                        <span>Amount</span>
                        <div className="input-money" data-symbol={currencySymbol()}>
                            <input className="input num" type="number" inputMode="decimal" min="0.01" step="0.01" value={input.amount} onChange={set('amount')} placeholder="0.00" />
                        </div>
                    </label>
                    <label className="field">
                        <span>Date</span>
                        <input className="input" type="date" value={input.date} onChange={set('date')} />
                    </label>
                </div>
                <label className="field">
                    <span>Category</span>
                    <select className="input" value={input.category} onChange={set('category')}>
                        <option value="" disabled>Choose a category</option>
                        {categoriesFor(input.type).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </label>
                <label className="field">
                    <span>Reference</span>
                    <textarea className="input" rows="3" maxLength={100} value={input.description} onChange={set('description')} placeholder="Where, who or why" />
                    <small>{input.description.length}/100</small>
                </label>
            </form>
        </Drawer>
    )
}
