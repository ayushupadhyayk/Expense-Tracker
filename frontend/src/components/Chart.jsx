import {
    Chart as ChartJs,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { dailySeries } from '../utils/transactions'
import { formatDate, formatMoney } from '../utils/format'

ChartJs.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const palette = {
    light: {income: '#2f9e44', expense: '#e03131', grid: 'rgba(34, 34, 96, 0.08)', text: 'rgba(34, 34, 96, 0.7)'},
    dark: {income: '#69db7c', expense: '#ff8787', grid: 'rgba(255, 255, 255, 0.08)', text: 'rgba(230, 230, 255, 0.7)'},
}

function Chart({incomes, expenses, theme}) {
    const colors = palette[theme] || palette.light
    const series = dailySeries(incomes, expenses)

    if(!series.labels.length){
        return <div className="card chart empty">Add an income or expense to see your chart.</div>
    }

    const dataset = (label, data, color) => ({
        label,
        data,
        borderColor: color,
        backgroundColor: `${color}22`,
        pointBackgroundColor: color,
        fill: true,
        tension: 0.3,
    })

    const data = {
        labels: series.labels.map(formatDate),
        datasets: [
            dataset('Income', series.income, colors.income),
            dataset('Expenses', series.expense, colors.expense),
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {mode: 'index', intersect: false},
        plugins: {
            legend: {labels: {color: colors.text, usePointStyle: true}},
            tooltip: {callbacks: {label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}`}},
        },
        scales: {
            x: {grid: {color: colors.grid}, ticks: {color: colors.text, maxRotation: 0, autoSkip: true}},
            y: {grid: {color: colors.grid}, ticks: {color: colors.text, callback: (v) => formatMoney(v)}, beginAtZero: true},
        },
    }

    return (
        <div className="card chart">
            <Line data={data} options={options} />
        </div>
    )
}

export default Chart
