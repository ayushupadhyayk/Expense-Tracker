import { useState } from 'react'
import { useData } from '../context/DataContext'
import { addMonths, todayKey, toKey } from '../lib/dates'
import { currencySymbol, formatMoneyWhole } from '../lib/money'
import { Drawer, Icon } from './ui'

const ideas = [
    {name: 'Emergency fund', target: 1500, months: 6},
    {name: 'New laptop', target: 1200, months: 5},
    {name: 'Summer trip', target: 900, months: 8},
    {name: 'Course fees', target: 2500, months: 10},
]

export function GoalDrawer({goal, onClose, onSaved}) {
    const {saveGoal} = useData()
    const [input, setInput] = useState(() => goal
        ? {name: goal.name, target: String(goal.target), deadline: goal.deadline ? toKey(goal.deadline) : '', startingAmount: ''}
        : {name: '', target: '', deadline: addMonths(todayKey(), 6), startingAmount: ''})
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const set = (name) => (e) => { setInput({...input, [name]: e.target.value}); setError('') }

    const submit = async (e) => {
        e.preventDefault()
        if(input.deadline && input.deadline <= todayKey()){
            setError('Pick a deadline in the future, or leave it empty.')
            return
        }
        setSaving(true)
        const result = await saveGoal(input, goal?._id)
        setSaving(false)
        if(result.ok){
            onSaved?.(result.data)
            onClose()
        } else setError(result.message)
    }

    return (
        <Drawer
            title={goal ? 'Edit goal' : 'New goal'}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
                    <button type="submit" form="goal-form" className="btn btn-brass" disabled={saving}>{saving ? 'Saving…' : goal ? 'Save changes' : 'Create goal'}</button>
                </>
            }
        >
            <form id="goal-form" className="drawer-body" onSubmit={submit} noValidate>
                {!goal && (
                    <div className="presets" role="group" aria-label="Ideas">
                        {ideas.map((i) => (
                            <button type="button" key={i.name} className="chip"
                                onClick={() => setInput({...input, name: i.name, target: String(i.target), deadline: addMonths(todayKey(), i.months)})}>
                                {i.name}
                            </button>
                        ))}
                    </div>
                )}
                {error && <p className="form-error" role="alert">{error}</p>}
                <label className="field">
                    <span>What are you saving for?</span>
                    <input className="input" value={input.name} maxLength={60} onChange={set('name')} placeholder="e.g. New laptop" />
                </label>
                <label className="field">
                    <span>Target</span>
                    <div className="input-money" data-symbol={currencySymbol()}>
                        <input className="input num" type="number" min="1" step="1" inputMode="decimal" value={input.target} onChange={set('target')} placeholder="0" />
                    </div>
                </label>
                <label className="field">
                    <span>Deadline</span>
                    <input className="input" type="date" value={input.deadline} min={todayKey()} onChange={set('deadline')} />
                    <small>Optional. With a deadline we work out what to save each week; without one we plan from your current pace.</small>
                </label>
                {!goal && (
                    <label className="field">
                        <span>Already saved</span>
                        <div className="input-money" data-symbol={currencySymbol()}>
                            <input className="input num" type="number" min="0" step="0.01" inputMode="decimal" value={input.startingAmount} onChange={set('startingAmount')} placeholder="0" />
                        </div>
                    </label>
                )}
            </form>
        </Drawer>
    )
}

export function ContributionDrawer({goal, plan, onClose}) {
    const {addContribution} = useData()
    const [direction, setDirection] = useState('in')
    const [input, setInput] = useState({amount: plan.planWeekly > 0 ? String(Math.ceil(plan.planWeekly)) : '', date: todayKey(), note: ''})
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const set = (name) => (e) => { setInput({...input, [name]: e.target.value}); setError('') }
    const suggestions = [
        plan.planWeekly > 0 && {label: `Weekly plan, ${formatMoneyWhole(Math.ceil(plan.planWeekly))}`, value: Math.ceil(plan.planWeekly)},
        plan.planMonthly > 0 && {label: `Monthly plan, ${formatMoneyWhole(Math.ceil(plan.planMonthly))}`, value: Math.ceil(plan.planMonthly)},
        plan.remaining > 0 && {label: `Finish it, ${formatMoneyWhole(Math.ceil(plan.remaining))}`, value: Math.ceil(plan.remaining * 100) / 100},
    ].filter(Boolean)

    const submit = async (e) => {
        e.preventDefault()
        const amount = Number(input.amount)
        if(!(amount > 0)){
            setError('Enter an amount above zero.')
            return
        }
        if(direction === 'out' && amount > plan.saved){
            setError(`You can withdraw up to ${formatMoneyWhole(plan.saved)}.`)
            return
        }
        setSaving(true)
        const result = await addContribution(goal._id, {...input, amount: direction === 'out' ? -amount : amount})
        setSaving(false)
        if(result.ok) onClose()
        else setError(result.message)
    }

    return (
        <Drawer
            title={goal.name}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn-quiet" onClick={onClose}>Cancel</button>
                    <button type="submit" form="contribution-form" className="btn btn-brass" disabled={saving}>
                        {saving ? 'Saving…' : direction === 'in' ? 'Add money' : 'Withdraw'}
                    </button>
                </>
            }
        >
            <form id="contribution-form" className="drawer-body" onSubmit={submit} noValidate>
                <div className="type-switch" role="group" aria-label="Direction">
                    <button type="button" className="income" aria-pressed={direction === 'in'} onClick={() => setDirection('in')}><Icon name="Plus" size={16} /> Add money</button>
                    <button type="button" className="expense" aria-pressed={direction === 'out'} onClick={() => setDirection('out')}><Icon name="Minus" size={16} /> Withdraw</button>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <label className="field">
                    <span>Amount</span>
                    <div className="input-money" data-symbol={currencySymbol()}>
                        <input className="input num" type="number" min="0.01" step="0.01" inputMode="decimal" value={input.amount} onChange={set('amount')} />
                    </div>
                </label>
                {direction === 'in' && suggestions.length > 0 && (
                    <div className="presets" role="group" aria-label="Suggested amounts">
                        {suggestions.map((s) => (
                            <button type="button" key={s.label} className="chip" aria-pressed={Number(input.amount) === s.value} onClick={() => setInput({...input, amount: String(s.value)})}>{s.label}</button>
                        ))}
                    </div>
                )}
                <label className="field">
                    <span>Date</span>
                    <input className="input" type="date" value={input.date} max={todayKey()} onChange={set('date')} />
                </label>
                <label className="field">
                    <span>Note</span>
                    <input className="input" value={input.note} maxLength={100} onChange={set('note')} placeholder="Optional" />
                </label>
            </form>
        </Drawer>
    )
}
