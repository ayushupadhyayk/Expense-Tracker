import { useEffect, useState } from 'react'
import { useGlobalContext } from '../context/GlobalContext'
import { categoriesFor } from '../utils/categories'
import { toInputDate, todayInputDate } from '../utils/format'

const empty = () => ({title: '', amount: '', date: todayInputDate(), category: '', description: ''})

const fromItem = (item) => ({
    title: item.title,
    amount: String(item.amount),
    date: toInputDate(item.date),
    category: item.category,
    description: item.description,
})

// Add form; when `editing` is set it edits that transaction instead.
function TransactionForm({type, editing, onDone}) {
    const {saveTransaction} = useGlobalContext()
    const [input, setInput] = useState(empty)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const label = type === 'expense' ? 'Expense' : 'Income'

    useEffect(() => {
        setInput(editing ? fromItem(editing) : empty())
        setError('')
    }, [editing])

    const handleInput = (name) => (e) => {
        setInput({...input, [name]: e.target.value})
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        const result = await saveTransaction(type, input, editing?._id)
        setSaving(false)
        if(!result.ok){
            setError(result.message)
            return
        }
        setInput(empty())
        onDone?.()
    }

    return (
        <form className={`card form ${editing ? 'editing' : ''}`} onSubmit={handleSubmit} noValidate>
            <h2>{editing ? `Edit ${label}` : `Add ${label}`}</h2>
            {error && <p className="error" role="alert">{error}</p>}
            <label>
                <span>Title</span>
                <input className="input" value={input.title} maxLength={50} placeholder={`${label} title`} onChange={handleInput('title')} />
            </label>
            <div className="form-row">
                <label>
                    <span>Amount</span>
                    <input className="input" type="number" inputMode="decimal" min="0.01" step="0.01" value={input.amount} placeholder="0.00" onChange={handleInput('amount')} />
                </label>
                <label>
                    <span>Date</span>
                    <input className="input" type="date" value={input.date} onChange={handleInput('date')} />
                </label>
            </div>
            <label>
                <span>Category</span>
                <select className="input" value={input.category} onChange={handleInput('category')}>
                    <option value="" disabled>Select a category</option>
                    {categoriesFor(type).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
            </label>
            <label>
                <span>Reference</span>
                <textarea className="input" rows="3" maxLength={100} value={input.description} placeholder="Add a reference" onChange={handleInput('description')}></textarea>
            </label>
            <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                    <i className={`fa-solid ${editing ? 'fa-check' : 'fa-plus'}`}></i>
                    {saving ? 'Saving…' : editing ? 'Save changes' : `Add ${label}`}
                </button>
                {editing && <button className="btn btn-ghost" type="button" onClick={onDone}>Cancel</button>}
            </div>
        </form>
    )
}

export default TransactionForm
