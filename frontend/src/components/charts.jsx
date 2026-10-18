import { useMemo } from 'react'
import {
    ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { categoryColor, OTHER_COLOR } from '../lib/categories'
import { formatMoney, formatMoneyCompact, formatPct } from '../lib/money'
import { Swatch } from './ui'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip, Legend)

if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) ChartJS.defaults.animation = false

// Reads the live CSS tokens so charts follow the theme.
export const useChartTheme = (theme) => useMemo(() => {
    const css = getComputedStyle(document.documentElement)
    const v = (name) => css.getPropertyValue(name).trim()
    return {
        theme,
        surface: v('--surface'),
        ink: v('--ink'),
        muted: v('--muted'),
        rule: v('--rule'),
        income: v('--income'),
        expense: v('--expense'),
        brass: v('--brass'),
        font: v('--sans') || 'system-ui',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [theme])

const tooltip = (t) => ({
    backgroundColor: t.ink,
    titleColor: t.surface,
    bodyColor: t.surface,
    padding: 10,
    cornerRadius: 8,
    displayColors: true,
    boxPadding: 4,
    titleFont: {family: t.font, weight: '600'},
    bodyFont: {family: t.font},
})

const axes = (t, {stacked = false} = {}) => ({
    x: {
        stacked,
        grid: {display: false},
        border: {color: t.rule},
        ticks: {color: t.muted, font: {family: t.font, size: 11}, maxRotation: 0, autoSkip: true, autoSkipPadding: 12},
    },
    y: {
        stacked,
        beginAtZero: true,
        grid: {color: t.rule, drawTicks: false},
        border: {display: false},
        ticks: {color: t.muted, font: {family: t.font, size: 11}, padding: 8, maxTicksLimit: 5, callback: (v) => formatMoneyCompact(v)},
    },
})

export function ChartEmpty({children = 'Nothing to chart for this period yet.'}) {
    return <div className="chart-empty">{children}</div>
}

/** Income vs expenses per bucket — one money axis, two series. */
export function FlowChart({rows, t, height = 'tall'}) {
    if(!rows.some((r) => r.income || r.expense)) return <div className={`chart-box ${height}`}><ChartEmpty /></div>
    const data = {
        labels: rows.map((r) => r.label),
        datasets: [
            {label: 'Income', data: rows.map((r) => r.income), backgroundColor: t.income, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22},
            {label: 'Expenses', data: rows.map((r) => r.expense), backgroundColor: t.expense, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22},
        ],
    }
    return (
        <>
            <div className="legend">
                <span><Swatch color={t.income} /> Income</span>
                <span><Swatch color={t.expense} /> Expenses</span>
            </div>
            <div className={`chart-box ${height}`}>
                <Bar
                    data={data}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {mode: 'index', intersect: false},
                        datasets: {bar: {categoryPercentage: .7, barPercentage: .92}},
                        plugins: {legend: {display: false}, tooltip: {...tooltip(t), callbacks: {label: (c) => ` ${c.dataset.label}: ${formatMoney(c.parsed.y)}`}}},
                        scales: axes(t),
                    }}
                />
            </div>
        </>
    )
}

/** Running balance — a single series, so no legend box. */
export function BalanceChart({rows, t}) {
    if(!rows.length) return <div className="chart-box"><ChartEmpty /></div>
    const data = {
        labels: rows.map((r) => r.label),
        datasets: [{
            label: 'Balance',
            data: rows.map((r) => r.balance),
            borderColor: t.ink,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: t.ink,
            pointHoverBorderColor: t.surface,
            pointHoverBorderWidth: 2,
            fill: {target: 'origin', above: `${t.ink}10`, below: `${t.expense}18`},
            tension: .25,
        }],
    }
    return (
        <div className="chart-box short">
            <Line
                data={data}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {mode: 'index', intersect: false},
                    plugins: {legend: {display: false}, tooltip: {...tooltip(t), displayColors: false, callbacks: {label: (c) => `Balance ${formatMoney(c.parsed.y)}`}}},
                    scales: {...axes(t), y: {...axes(t).y, beginAtZero: false}},
                }}
            />
        </div>
    )
}

/** Spending by weekday — single series in ink. */
export function WeekdayChart({rows, t}) {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    if(!rows.some((r) => r.total)) return <div className="chart-box short"><ChartEmpty /></div>
    return (
        <div className="chart-box short">
            <Bar
                data={{labels, datasets: [{label: 'Average spend', data: rows.map((r) => r.average), backgroundColor: t.expense, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 28}]}}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {legend: {display: false}, tooltip: {...tooltip(t), displayColors: false, callbacks: {label: (c) => `Average ${formatMoney(c.parsed.y)} · total ${formatMoney(rows[c.dataIndex].total)}`}}},
                    scales: axes(t),
                }}
            />
        </div>
    )
}

const sliceColor = (type, row, theme) => row.key === '__other' ? OTHER_COLOR[theme] : categoryColor(type, row.category, theme)

/** Donut + labelled table. The table is the direct label for every slice. */
export function Breakdown({rows, type, t, totalLabel = 'spent'}) {
    const total = rows.reduce((s, r) => s + r.amount, 0)
    if(!rows.length) return <ChartEmpty>{type === 'expense' ? 'No spending recorded in this period.' : 'No income recorded in this period.'}</ChartEmpty>
    const colors = rows.map((r) => sliceColor(type, r, t.theme))
    return (
        <div className="breakdown">
            <div className="donut">
                <Doughnut
                    data={{labels: rows.map((r) => r.label), datasets: [{data: rows.map((r) => r.amount), backgroundColor: colors, borderColor: t.surface, borderWidth: 2, hoverOffset: 6}]}}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '68%',
                        plugins: {legend: {display: false}, tooltip: {...tooltip(t), callbacks: {label: (c) => ` ${c.label}: ${formatMoney(c.parsed)} (${formatPct(c.parsed / total)})`}}},
                    }}
                />
                <div className="donut-center">
                    <strong>{formatMoneyCompact(total)}</strong>
                    <span>{totalLabel}</span>
                </div>
            </div>
            <div className="table-wrap">
                <table className="table">
                    <thead>
                        <tr><th>Category</th><th className="r">Amount</th><th className="r">Share</th></tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.key}>
                                <td>
                                    <div className="cat-cell">
                                        <Swatch color={colors[i]} />
                                        <div>
                                            {r.label}
                                            {r.key === '__other' && r.members.length > 1 && <span className="muted"> ({r.members.length} categories)</span>}
                                            <div className="share-bar"><i style={{width: `${r.share * 100}%`, background: colors[i]}} /></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="r num">{formatMoney(r.amount)}</td>
                                <td className="r num muted">{formatPct(r.share)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
