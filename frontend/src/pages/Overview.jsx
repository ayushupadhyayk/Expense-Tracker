import { useData } from '../context/DataContext'
import { useChartTheme, BalanceChart, Breakdown } from '../components/charts'
import { Delta, Icon, PageHead } from '../components/ui'
import { TxRow } from '../components/TxList'
import { addDays, formatMonth, periodRange, previousRange, todayKey, daysBetween } from '../lib/dates'
import { balanceSeries, byCategory, byDateDesc, insights, monthlySurplus, summarize } from '../lib/stats'
import { formatMoney, formatMoneyWhole, formatPct } from '../lib/money'
import { planGoal } from '../lib/goals'

const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Overview({theme, go, openTransaction}) {
    const {incomes, expenses, goals} = useData()
    const t = useChartTheme(theme)
    const today = todayKey()
    const month = periodRange('month', today)
    const soFar = {start: month.start, end: today}
    const cur = summarize(incomes, expenses, soFar)
    // Same number of days into last month, for a fair comparison.
    const lastMonth = previousRange(month)
    const prev = summarize(incomes, expenses, {start: lastMonth.start, end: addDays(lastMonth.start, daysBetween(month.start, today))})
    const balance = summarize(incomes, expenses, {start: '1970-01-01', end: today}).net
    const recent = [...incomes, ...expenses].sort(byDateDesc).slice(0, 6)
    const surplus = monthlySurplus(incomes, expenses, today)
    const goalPlans = goals.map((g) => ({goal: g, plan: planGoal(g, {surplus, today})}))
    const tips = insights(incomes, expenses, soFar, today).slice(0, 3)
    const series = balanceSeries(incomes, expenses, {start: addDays(today, -89), end: today})

    return (
        <div className="page">
            <PageHead
                title={`${greeting()}, Ayush`}
                actions={<button className="btn btn-primary" onClick={() => openTransaction(null, 'expense')}><Icon name="Plus" size={16} /> Add transaction</button>}
            >
                {formatMonth(today)} so far, up to today.
            </PageHead>

            <dl className="ledger" style={{'--cols': 4}}>
                <div>
                    <dt>Balance</dt>
                    <dd className={`figure ${balance < 0 ? 'neg' : ''}`}>{formatMoney(balance)}</dd>
                    <span className="delta">All money in minus money out</span>
                </div>
                <div>
                    <dt>Money in</dt>
                    <dd className="figure pos">{formatMoney(cur.income)}</dd>
                    <Delta current={cur.income} previous={prev.income} label="vs last month" />
                </div>
                <div>
                    <dt>Money out</dt>
                    <dd className="figure neg">{formatMoney(cur.expense)}</dd>
                    <Delta current={cur.expense} previous={prev.expense} goodWhen="down" label="vs last month" />
                </div>
                <div>
                    <dt>Kept</dt>
                    <dd className="figure">{formatPct(cur.savingsRate)}</dd>
                    <span className="delta">{cur.net >= 0 ? `${formatMoneyWhole(cur.net)} saved this month` : `${formatMoneyWhole(-cur.net)} overspent`}</span>
                </div>
            </dl>

            <div className="grid-2">
                <div className="stack">
                    <section className="panel">
                        <div className="panel-head">
                            <h2>Balance, last 90 days</h2>
                            <button className="btn btn-text btn-sm" onClick={() => go('analysis')}>Open analysis</button>
                        </div>
                        <BalanceChart rows={series} t={t} />
                    </section>
                    <section className="panel">
                        <div className="panel-head">
                            <h2>Where this month’s money went</h2>
                            <button className="btn btn-text btn-sm" onClick={() => go('reports')}>Full report</button>
                        </div>
                        <Breakdown rows={byCategory(cur.expenses, 'expense', {group: true})} type="expense" t={t} />
                    </section>
                </div>

                <div className="stack">
                    <section className="panel">
                        <div className="panel-head">
                            <h2>Goals</h2>
                            <button className="btn btn-text btn-sm" onClick={() => go('goals')}>{goals.length ? 'View all' : 'Set a goal'}</button>
                        </div>
                        {goalPlans.length === 0 && <p className="muted">Name something you’re saving for and we’ll map the path to it.</p>}
                        <div className="boosts">
                            {goalPlans.slice(0, 3).map(({goal, plan}) => (
                                <div className="boost" key={goal._id}>
                                    <div>
                                        <strong>{goal.name}</strong>
                                        <div className="progress" style={{marginTop: 8}}><i style={{width: `${plan.progress * 100}%`}} /></div>
                                    </div>
                                    <span className="num">{formatPct(plan.progress)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="panel">
                        <div className="panel-head"><h2>This month</h2></div>
                        <div className="insights">
                            {tips.map((tip) => (
                                <div className="insight" key={tip.title}>
                                    <span className={`insight-icon ${tip.tone}`}><Icon name={{good: 'TrendingUp', warn: 'TriangleAlert', bad: 'TrendingDown', info: 'Info'}[tip.tone]} size={15} /></span>
                                    <div><strong>{tip.title}</strong><p>{tip.detail}</p></div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="panel">
                        <div className="panel-head">
                            <h2>Recent</h2>
                            <button className="btn btn-text btn-sm" onClick={() => go('transactions')}>All transactions</button>
                        </div>
                        {recent.length === 0
                            ? <p className="muted">No transactions yet. Add your first one to get started.</p>
                            : recent.map((tx) => <TxRow key={tx._id} t={tx} theme={theme} showDate />)}
                    </section>
                </div>
            </div>
        </div>
    )
}
