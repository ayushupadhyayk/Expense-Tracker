import { useState } from 'react'
import { useData } from '../context/DataContext'
import { Empty, Icon, PageHead } from '../components/ui'
import GoalPath from '../components/GoalPath'
import { ContributionDrawer, GoalDrawer } from '../components/GoalDrawers'
import { formatDate, formatMonth, formatShortMonth, todayKey, daysBetween } from '../lib/dates'
import { formatMoney, formatMoneyWhole, formatPct } from '../lib/money'
import { allocation, planGoal } from '../lib/goals'
import { discretionaryAverages, monthlySurplus } from '../lib/stats'

const statusText = {
    'on-track': 'On track',
    behind: 'Behind',
    done: 'Reached',
    overdue: 'Past deadline',
    open: 'No deadline',
    stalled: 'Not started',
}

const weeksLabel = (w) => w >= 8 ? `${Math.round(w / 4.345)} months sooner` : `${Math.max(1, Math.round(w))} ${Math.round(w) <= 1 ? 'week' : 'weeks'} sooner`

// One plain sentence on where the goal stands and what would fix it.
const verdict = (plan) => {
    const pace = plan.paceSource === 'contributions' ? 'your recent pace' : 'your spare money each month'
    switch(plan.status){
        case 'done': return 'You’ve reached this goal. Withdraw it when you’re ready, or raise the target.'
        case 'overdue': return `The deadline has passed with ${formatMoneyWhole(plan.remaining)} to go. Set a new date to get a fresh plan.`
        case 'stalled': return plan.deadline
            ? `Put away ${formatMoney(plan.requiredWeekly)} a week to make your deadline. Add your first contribution to start tracking pace.`
            : `Add money to this goal, or give it a deadline, and we’ll plan the path.`
        case 'open': return `At ${pace} of ${formatMoneyWhole(plan.pace)} a month, you’ll get there around ${formatMonth(plan.projected)}.`
        case 'on-track': {
            const weeks = Math.round(daysBetween(plan.projected, plan.deadline) / 7)
            return `At ${pace} of ${formatMoneyWhole(plan.pace)} a month you’ll finish around ${formatMonth(plan.projected)}${weeks >= 2 ? `, about ${weeks} weeks early` : ', right on time'}.`
        }
        case 'behind': {
            const gap = plan.requiredMonthly - plan.pace
            return plan.pace > 0
                ? `At ${pace} of ${formatMoneyWhole(plan.pace)} a month you’d finish ${formatMonth(plan.projected)}, after your deadline. Add ${formatMoneyWhole(gap)} more a month to finish on time.`
                : `You need ${formatMoneyWhole(plan.requiredMonthly)} a month to finish on time.`
        }
        default: return ''
    }
}

function GoalDetail({goal, plan, onAdd, onEdit}) {
    const {deleteGoal, deleteContribution} = useData()
    const history = [...goal.contributions].sort((a, b) => new Date(b.date) - new Date(a.date))

    return (
        <div className="stack">
            <section className="panel">
                <div className="goal-hero">
                    <div>
                        <h2>{goal.name} <span className={`status ${plan.status}`}>{statusText[plan.status]}</span></h2>
                        <p style={{marginTop: 12}}>
                            <span className="figure">{formatMoney(plan.saved)}</span>{' '}
                            <span className="of">of {formatMoney(plan.target)}</span>
                        </p>
                    </div>
                    <div className="goal-hero-actions">
                        <button className="btn btn-quiet" onClick={onEdit}><Icon name="Pencil" size={16} /> Edit</button>
                        <button className="btn btn-brass" onClick={onAdd}><Icon name="Plus" size={16} /> Add money</button>
                    </div>
                </div>

                <GoalPath plan={plan} id={goal._id} />

                <dl className="plan-figures" style={{marginTop: 24}}>
                    <div>
                        <dt>Save each week</dt>
                        <dd className="figure">{plan.planWeekly > 0 ? formatMoney(plan.planWeekly) : '—'}
                            <small>{plan.requiredWeekly !== null ? 'to meet your deadline' : plan.pace > 0 ? 'at your current pace' : 'to finish in 12 months'}</small>
                        </dd>
                    </div>
                    <div>
                        <dt>Save each month</dt>
                        <dd className="figure">{plan.planMonthly > 0 ? formatMoney(plan.planMonthly) : '—'}
                            <small>{formatMoneyWhole(plan.remaining)} left to save</small>
                        </dd>
                    </div>
                    <div>
                        <dt>{plan.deadline ? 'Deadline' : 'Expected finish'}</dt>
                        <dd className="figure">{plan.deadline ? formatDate(plan.deadline) : plan.projected ? formatMonth(plan.projected) : '—'}
                            <small>{plan.deadline && plan.projected ? `At your pace: ${formatMonth(plan.projected)}` : plan.deadline ? 'No pace yet' : 'Based on your pace'}</small>
                        </dd>
                    </div>
                </dl>
                <p style={{marginTop: 18, color: 'var(--ink-2)', maxWidth: '72ch'}}>{verdict(plan)}</p>
            </section>

            {plan.status !== 'done' && (
                <div className="grid-even">
                    <section className="panel">
                        <div className="panel-head">
                            <h2>Get there sooner</h2>
                            <p>Based on your last three months</p>
                        </div>
                        {plan.accelerators.length === 0
                            ? <p className="muted">Record a few months of spending to see where you could save.</p>
                            : (
                                <div className="boosts">
                                    {plan.accelerators.map((a) => (
                                        <div className="boost" key={a.title}>
                                            <div>
                                                <strong>{a.title}</strong>
                                                <span>Frees up {formatMoneyWhole(a.extra)} a month</span>
                                            </div>
                                            <div className="gain">{a.weeks >= 0.5 ? weeksLabel(a.weeks) : 'Small gain'}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </section>

                    <section className="panel">
                        <div className="panel-head">
                            <h2>Month by month</h2>
                            <p>{plan.schedule.length ? `${plan.schedule.length} ${plan.schedule.length === 1 ? 'month' : 'months'} to go` : ''}</p>
                        </div>
                        {plan.schedule.length === 0 ? <p className="muted">Set a deadline or add money to build a schedule.</p> : (
                            <div className="schedule table-wrap">
                                <table className="table">
                                    <thead><tr><th>Month</th><th className="r">Put away</th><th className="r">Total saved</th><th className="r">Progress</th></tr></thead>
                                    <tbody>
                                        {plan.schedule.map((s) => (
                                            <tr key={s.month}>
                                                <td>{formatShortMonth(s.month, true)}</td>
                                                <td className="r num">{formatMoneyWhole(s.amount)}</td>
                                                <td className="r num">{formatMoneyWhole(s.cumulative)}</td>
                                                <td className="r num muted">{formatPct(s.pct)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            )}

            <section className="panel">
                <div className="panel-head">
                    <h2>History</h2>
                    <button className="btn btn-danger btn-sm" onClick={() => window.confirm(`Delete the goal “${goal.name}” and its history?`) && deleteGoal(goal._id)}>
                        <Icon name="Trash2" size={14} /> Delete goal
                    </button>
                </div>
                {history.length === 0 ? <p className="muted">No money added yet.</p> : (
                    <div className="table-wrap">
                        <table className="table">
                            <tbody>
                                {history.map((c) => (
                                    <tr key={c._id}>
                                        <td>{formatDate(c.date)}</td>
                                        <td className="muted">{c.note || (c.amount > 0 ? 'Added' : 'Withdrawn')}</td>
                                        <td className={`r num ${c.amount < 0 ? 'neg' : 'pos'}`}>{c.amount < 0 ? '−' : '+'}{formatMoney(Math.abs(c.amount))}</td>
                                        <td className="r" style={{width: 44}}>
                                            <button className="icon-btn danger" aria-label="Remove entry" onClick={() => window.confirm('Remove this entry?') && deleteContribution(goal._id, c._id)}>
                                                <Icon name="X" size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}

export default function Goals() {
    const {goals, incomes, expenses} = useData()
    const today = todayKey()
    const [selected, setSelected] = useState(null)
    const [drawer, setDrawer] = useState(null) // 'new' | 'edit' | 'add'

    const surplus = monthlySurplus(incomes, expenses, today)
    const discretionary = discretionaryAverages(expenses, today)
    const plans = goals.map((g) => ({goal: g, plan: planGoal(g, {surplus, discretionary, today})}))
    const current = plans.find((p) => p.goal._id === selected) || plans[0]
    const alloc = allocation(plans.map((p) => p.plan), surplus)

    return (
        <div className="page">
            <PageHead
                title="Goals"
                actions={<button className="btn btn-brass" onClick={() => setDrawer('new')}><Icon name="Plus" size={16} /> New goal</button>}
            >
                Set a target and we’ll plan the path to it, track your pace and show what gets you there faster.
            </PageHead>

            {plans.length === 0 ? (
                <section className="panel">
                    <Empty title="What are you saving for?" action={<button className="btn btn-brass" onClick={() => setDrawer('new')}>Create your first goal</button>}>
                        A laptop, a trip, an emergency fund. Give it a target and a date, and you’ll get a weekly amount, milestones and ways to finish sooner.
                    </Empty>
                </section>
            ) : (
                <>
                    <section className="panel allocation">
                        <div>
                            <strong>Your goals need {formatMoneyWhole(alloc.needed)} a month</strong>
                            <p>
                                {surplus > 0
                                    ? `You’ve had ${formatMoneyWhole(surplus)} spare each month on average over the last three months. ${alloc.gap >= 0 ? `That covers every goal with ${formatMoneyWhole(alloc.gap)} to spare.` : `That’s ${formatMoneyWhole(-alloc.gap)} short, so trim spending or push a deadline back.`}`
                                    : 'Spending has matched or beaten income lately, so there’s no spare money to put towards goals yet.'}
                            </p>
                        </div>
                        <span className="figure" style={{fontSize: 'var(--t-xl)'}}>{formatPct(Math.min(alloc.coverage, 9.99))} covered</span>
                        <div className="allocation-bar" role="img" aria-label={`Spare money covers ${formatPct(alloc.coverage)} of what goals need`}>
                            <i className={alloc.coverage < 1 ? 'over' : ''} style={{width: `${Math.min(1, alloc.coverage) * 100}%`}} />
                        </div>
                    </section>

                    <div className="goals-layout">
                        <div className="goal-list" role="list">
                            {plans.map(({goal, plan}) => (
                                <button key={goal._id} role="listitem" className="goal-tab" aria-current={current.goal._id === goal._id} onClick={() => setSelected(goal._id)}>
                                    <div className="goal-tab-top">
                                        <strong>{goal.name}</strong>
                                        <span className={`status ${plan.status}`}>{statusText[plan.status]}</span>
                                    </div>
                                    <div className="progress"><i style={{width: `${plan.progress * 100}%`}} /></div>
                                    <div className="goal-tab-top">
                                        <span className="figure">{formatMoneyWhole(plan.saved)}</span>
                                        <span className="muted" style={{fontSize: 'var(--t-sm)'}}>of {formatMoneyWhole(plan.target)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <GoalDetail
                            key={current.goal._id}
                            goal={current.goal}
                            plan={current.plan}
                            onAdd={() => setDrawer('add')}
                            onEdit={() => setDrawer('edit')}
                        />
                    </div>
                </>
            )}

            {drawer === 'new' && <GoalDrawer onClose={() => setDrawer(null)} onSaved={(g) => g && setSelected(g._id)} />}
            {drawer === 'edit' && current && <GoalDrawer goal={current.goal} onClose={() => setDrawer(null)} />}
            {drawer === 'add' && current && <ContributionDrawer goal={current.goal} plan={current.plan} onClose={() => setDrawer(null)} />}
        </div>
    )
}
