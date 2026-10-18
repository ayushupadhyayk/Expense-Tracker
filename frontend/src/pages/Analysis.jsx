import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useChartTheme, Breakdown, FlowChart, WeekdayChart } from '../components/charts'
import { Icon, PageHead, Swatch } from '../components/ui'
import { addDays, addMonths, formatDate, previousRange, rangeLength, startOfMonth, toKey } from '../lib/dates'
import { buckets, byCategory, hasHistoryBefore, insights, recurring, summarize, weekdaySpend } from '../lib/stats'
import { formatMoney, formatMoneyWhole, formatPct, signedPct } from '../lib/money'
import { categoryColor, findCategory } from '../lib/categories'

const toneIcon = {good: 'TrendingUp', warn: 'TriangleAlert', bad: 'TrendingDown', info: 'Info'}
const weekdays = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']

const windows = (today, earliest) => [
    {id: '30d', label: '30 days', range: {start: addDays(today, -29), end: today}},
    {id: '3m', label: '3 months', range: {start: addMonths(startOfMonth(today), -2), end: today}},
    {id: '6m', label: '6 months', range: {start: addMonths(startOfMonth(today), -5), end: today}},
    {id: '12m', label: '12 months', range: {start: addMonths(startOfMonth(today), -11), end: today}},
    {id: 'all', label: 'All time', range: {start: earliest < today ? earliest : addDays(today, -29), end: today}},
]

export default function Analysis({theme}) {
    const {incomes, expenses, asOf} = useData()
    const t = useChartTheme(theme)
    const today = asOf
    const all = [...incomes, ...expenses]
    const earliest = all.length ? all.map((x) => toKey(x.date)).sort()[0] : today
    const options = windows(today, earliest)
    const [win, setWin] = useState('3m')
    const range = options.find((o) => o.id === win).range

    const cur = summarize(incomes, expenses, range)
    const prev = summarize(incomes, expenses, previousRange(range))
    const months = rangeLength(range) / 30.44
    const flow = buckets(incomes, expenses, range, rangeLength(range) > 45 ? 'month' : 'week')
    const spend = byCategory(cur.expenses, 'expense', {group: true})
    const cats = byCategory(cur.expenses, 'expense')
    const prevCats = new Map(byCategory(prev.expenses, 'expense').map((c) => [c.category, c.amount]))
    const movers = cats
        .map((c) => ({...c, before: prevCats.get(c.category) || 0}))
        .map((c) => ({...c, diff: c.amount - c.before}))
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
        .slice(0, 6)
    const weekday = weekdaySpend(expenses, range)
    const peak = weekday.reduce((best, d) => d.average > best.average ? d : best, weekday[0])
    const repeats = recurring(expenses.filter((x) => toKey(x.date) >= addMonths(startOfMonth(today), -12)))
    const notes = insights(incomes, expenses, range, today)
    const rate = cur.savingsRate
    const comparable = hasHistoryBefore(incomes, expenses, range)
    const pointDiff = Math.abs(Math.round((rate - prev.savingsRate) * 100))

    return (
        <div className="page">
            <PageHead title="Analysis">
                How your money moves over time, what’s changing and where you can save.
            </PageHead>

            <div className="presets" role="group" aria-label="Time window">
                {options.map((o) => (
                    <button key={o.id} className="chip" aria-pressed={win === o.id} onClick={() => setWin(o.id)}>{o.label}</button>
                ))}
                <span className="muted" style={{fontSize: 'var(--t-sm)', alignSelf: 'center', marginLeft: 6}}>
                    {formatDate(range.start)} to {formatDate(range.end)}
                </span>
            </div>

            <dl className="ledger" style={{'--cols': 4}}>
                <div><dt>Average monthly income</dt><dd className="figure pos">{formatMoneyWhole(cur.income / Math.max(months, 1))}</dd></div>
                <div><dt>Average monthly spending</dt><dd className="figure neg">{formatMoneyWhole(cur.expense / Math.max(months, 1))}</dd></div>
                <div><dt>Average daily spending</dt><dd className="figure">{formatMoney(cur.dailySpend)}</dd></div>
                <div><dt>Transactions</dt><dd className="figure">{cur.incomeCount + cur.expenseCount}</dd></div>
            </dl>

            <div className="grid-2">
                <section className="panel">
                    <div className="panel-head"><h2>What stands out</h2></div>
                    <div className="insights">
                        {notes.map((n) => (
                            <div className="insight" key={n.title}>
                                <span className={`insight-icon ${n.tone}`}><Icon name={toneIcon[n.tone]} size={15} /></span>
                                <div><strong>{n.title}</strong><p>{n.detail}</p></div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="panel rate">
                    <div className="panel-head" style={{marginBottom: 0}}><h2>Savings rate</h2></div>
                    <div className={`rate-figure figure ${rate < 0 ? 'neg' : ''}`}>{formatPct(rate)}</div>
                    <div>
                        <div className="rate-track" role="img" aria-label={`Savings rate ${formatPct(rate)}, target 20%`}>
                            <i className={rate < 0.2 ? 'low' : ''} style={{width: `${Math.max(0, Math.min(1, Number.isFinite(rate) ? rate : 0)) * 100}%`}} />
                            <b title="20% target" />
                        </div>
                        <div className="rate-scale" style={{marginTop: 6}}><span>0%</span><span>20% target</span><span>100%</span></div>
                    </div>
                    <p className="muted" style={{fontSize: 'var(--t-sm)'}}>
                        {Number.isFinite(rate)
                            ? rate >= 0.2
                                ? `You kept ${formatMoneyWhole(cur.net)} of ${formatMoneyWhole(cur.income)} earned. Point the extra at a goal to get there sooner.`
                                : `Keeping 20% would mean spending ${formatMoneyWhole(Math.max(0, cur.expense - cur.income * 0.8))} less over this window.`
                            : 'Record some income to see how much you keep.'}
                    </p>
                    <p className="muted" style={{fontSize: 'var(--t-sm)'}}>
                        {comparable && Number.isFinite(rate) && Number.isFinite(prev.savingsRate)
                            ? `Previous window: ${formatPct(prev.savingsRate)}, ${rate >= prev.savingsRate ? 'up' : 'down'} ${pointDiff} ${pointDiff === 1 ? 'point' : 'points'}.`
                            : 'Not enough history before this window to compare.'}
                    </p>
                </section>
            </div>

            <section className="panel">
                <div className="panel-head">
                    <h2>Money in and out by {flow[0]?.unit}</h2>
                    <p>Net over the window: <span className={cur.net < 0 ? 'neg' : 'pos'}>{formatMoney(cur.net)}</span></p>
                </div>
                <FlowChart rows={flow} t={t} />
            </section>

            <div className="grid-even">
                <section className="panel">
                    <div className="panel-head"><h2>Spending by category</h2></div>
                    <Breakdown rows={spend} type="expense" t={t} />
                </section>

                <section className="panel">
                    <div className="panel-head">
                        <h2>Biggest changes</h2>
                        <p>Against the previous {options.find((o) => o.id === win).label.toLowerCase()}</p>
                    </div>
                    {!comparable ? <p className="muted">Your records don’t go back far enough to compare with the previous {options.find((o) => o.id === win).label.toLowerCase()}. Try a shorter window.</p> : movers.length === 0 ? <p className="muted">No spending to compare yet.</p> : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead><tr><th>Category</th><th className="r">Now</th><th className="r">Before</th><th className="r">Change</th></tr></thead>
                                <tbody>
                                    {movers.map((m) => (
                                        <tr key={m.category}>
                                            <td><div className="cat-cell"><Swatch color={categoryColor('expense', m.category, theme)} />{m.label}</div></td>
                                            <td className="r num">{formatMoneyWhole(m.amount)}</td>
                                            <td className="r num muted">{m.before ? formatMoneyWhole(m.before) : 'None'}</td>
                                            <td className={`r num ${m.diff > 0 ? 'neg' : 'pos'}`}>{m.before ? signedPct(m.diff / m.before) : 'New'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            <div className="grid-even">
                <section className="panel">
                    <div className="panel-head">
                        <h2>Spending by day of the week</h2>
                        {peak?.average > 0 && <p>Most on {weekdays[peak.day]}, {formatMoneyWhole(peak.average)} on average</p>}
                    </div>
                    <WeekdayChart rows={weekday} t={t} />
                </section>

                <section className="panel">
                    <div className="panel-head">
                        <h2>Regular payments</h2>
                        <p>Same payment in two or more months</p>
                    </div>
                    {repeats.length === 0 ? <p className="muted">No repeating payments found in the last 12 months.</p> : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead><tr><th>Payment</th><th className="r">Typical</th><th className="r">Per year</th></tr></thead>
                                <tbody>
                                    {repeats.slice(0, 8).map((r) => (
                                        <tr key={r.title}>
                                            <td>
                                                {r.title}
                                                <div className="muted" style={{fontSize: 'var(--t-xs)'}}>{findCategory('expense', r.category).label}, seen in {r.months} months</div>
                                            </td>
                                            <td className="r num">{formatMoney(r.average)}</td>
                                            <td className="r num">{formatMoneyWhole(r.average * 12)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr><td>Total</td><td className="r num">{formatMoney(repeats.reduce((s, r) => s + r.average, 0))}</td><td className="r num">{formatMoneyWhole(repeats.reduce((s, r) => s + r.average * 12, 0))}</td></tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
