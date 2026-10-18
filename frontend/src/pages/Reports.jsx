import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useChartTheme, Breakdown, FlowChart } from '../components/charts'
import { Delta, Empty, Icon, PageHead } from '../components/ui'
import PeriodPicker from '../components/PeriodPicker'
import TxList from '../components/TxList'
import { comparisonRange, formatDate, formatRange, periodRange } from '../lib/dates'
import { buckets, byCategory, summarize } from '../lib/stats'
import { formatMoney, formatPct } from '../lib/money'
import { findCategory } from '../lib/categories'

const titles = {week: 'Weekly report', month: 'Monthly report', custom: 'Report'}

export default function Reports({theme, openTransaction}) {
    const {incomes, expenses, goals, notify, asOf, historic} = useData()
    const t = useChartTheme(theme)
    const [period, setPeriod] = useState(() => ({mode: 'month', range: periodRange('month', asOf)}))
    const [exporting, setExporting] = useState(false)
    const {mode, range} = period

    const cur = summarize(incomes, expenses, range)
    const prevRange = comparisonRange(range, mode)
    const prev = summarize(incomes, expenses, prevRange)
    const rows = buckets(incomes, expenses, range)
    const spend = byCategory(cur.expenses, 'expense', {group: true})
    const earn = byCategory(cur.incomes, 'income', {group: true})
    const detail = byCategory(cur.expenses, 'expense')
    const prevByCat = new Map(byCategory(prev.expenses, 'expense').map((c) => [c.category, c.amount]))
    const largest = [...cur.expenses].sort((a, b) => b.amount - a.amount).slice(0, 5)
    const empty = !cur.incomeCount && !cur.expenseCount

    const exportExcel = async () => {
        setExporting(true)
        try {
            // Loaded on demand: the spreadsheet library is large and only needed here.
            const {buildReport, downloadBytes, reportFilename} = await import('../lib/excel')
            const bytes = await buildReport({range, mode, incomes, expenses, goals, owner: 'Ayush'})
            downloadBytes(bytes, reportFilename(range, mode))
            notify('Excel report downloaded')
        } catch (err) {
            console.error(err)
            notify('Couldn’t build the Excel file. Try again.', 'error')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="page">
            <PageHead
                title="Reports"
                actions={
                    <>
                        <button className="btn btn-quiet" onClick={() => window.print()} disabled={empty}><Icon name="Printer" size={16} /> Print</button>
                        <button className="btn btn-primary" onClick={exportExcel} disabled={exporting || empty}>
                            <Icon name="FileSpreadsheet" size={16} /> {exporting ? 'Building…' : 'Download Excel'}
                        </button>
                    </>
                }
            >
                Pick a week, a month or any range. The Excel file includes pie charts, a trend chart and every transaction.
            </PageHead>

            <PeriodPicker value={period} onChange={setPeriod} today={asOf} historic={historic} />

            <article className="statement">
                <header className="statement-head">
                    <div>
                        <h2>{titles[mode]}: {formatRange(range, mode)}</h2>
                        <p>{formatDate(range.start)} to {formatDate(range.end)}, {cur.days} {cur.days === 1 ? 'day' : 'days'}. Compared with {formatDate(prevRange.start)} to {formatDate(prevRange.end)}.</p>
                    </div>
                </header>

                <dl className="ledger" style={{'--cols': 4}}>
                    <div>
                        <dt>Money in</dt>
                        <dd className="figure pos">{formatMoney(cur.income)}</dd>
                        <Delta current={cur.income} previous={prev.income} />
                    </div>
                    <div>
                        <dt>Money out</dt>
                        <dd className="figure neg">{formatMoney(cur.expense)}</dd>
                        <Delta current={cur.expense} previous={prev.expense} goodWhen="down" />
                    </div>
                    <div>
                        <dt>Net saved</dt>
                        <dd className={`figure ${cur.net < 0 ? 'neg' : ''}`}>{formatMoney(cur.net)}</dd>
                        <span className="delta">{formatPct(cur.savingsRate)} of income kept</span>
                    </div>
                    <div>
                        <dt>Daily spend</dt>
                        <dd className="figure">{formatMoney(cur.dailySpend)}</dd>
                        <Delta current={cur.dailySpend} previous={prev.dailySpend} goodWhen="down" />
                    </div>
                </dl>

                {empty ? (
                    <Empty title="Nothing recorded in this period">Move to another period or add transactions for these dates.</Empty>
                ) : (
                    <>
                        <section className="statement-section">
                            <h3>Money in and out by {rows[0]?.unit}</h3>
                            <FlowChart rows={rows} t={t} />
                        </section>

                        <div className="statement-cols">
                            <section className="statement-section">
                                <h3>Where your money went</h3>
                                <Breakdown rows={spend} type="expense" t={t} />
                            </section>
                            <section className="statement-section">
                                <h3>Where it came from</h3>
                                <Breakdown rows={earn} type="income" t={t} totalLabel="earned" />
                            </section>
                        </div>

                        <section className="statement-section">
                            <h3>Every category against the previous period</h3>
                            <div className="table-wrap">
                                <table className="table">
                                    <thead>
                                        <tr><th>Category</th><th className="r">This period</th><th className="r">Previous</th><th className="r">Change</th><th className="r">Payments</th></tr>
                                    </thead>
                                    <tbody>
                                        {detail.map((c) => {
                                            const before = prevByCat.get(c.category) || 0
                                            const diff = c.amount - before
                                            return (
                                                <tr key={c.category}>
                                                    <td>{c.label}</td>
                                                    <td className="r num">{formatMoney(c.amount)}</td>
                                                    <td className="r num muted">{before ? formatMoney(before) : 'None'}</td>
                                                    <td className={`r num ${diff > 0 ? 'neg' : diff < 0 ? 'pos' : 'muted'}`}>
                                                        {before ? `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${formatMoney(Math.abs(diff))}` : 'New'}
                                                    </td>
                                                    <td className="r num">{c.count}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr><td>Total</td><td className="r num">{formatMoney(cur.expense)}</td><td className="r num">{formatMoney(prev.expense)}</td><td className="r num">{formatMoney(cur.expense - prev.expense)}</td><td className="r num">{cur.expenseCount}</td></tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>

                        {largest.length > 0 && (
                            <section className="statement-section">
                                <h3>Largest payments</h3>
                                <div className="table-wrap">
                                    <table className="table">
                                        <tbody>
                                            {largest.map((x) => (
                                                <tr key={x._id}>
                                                    <td>{x.title}</td>
                                                    <td className="muted">{findCategory('expense', x.category).label}</td>
                                                    <td className="muted">{formatDate(x.date)}</td>
                                                    <td className="r num neg">{formatMoney(x.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        <section className="statement-section">
                            <h3>All transactions</h3>
                            <TxList list={[...cur.incomes, ...cur.expenses]} theme={theme} onEdit={(x) => openTransaction(x)} />
                        </section>
                    </>
                )}
            </article>
        </div>
    )
}
