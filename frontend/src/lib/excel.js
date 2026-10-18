import { addCharts } from './xlsxCharts'
import { buckets, byCategory, byDateDesc, insights, summarize } from './stats'
import { categoryColor, findCategory, incomeCategories, SLOTS } from './categories'
import { formatDate, formatRange, fromKey, previousRange, todayKey, toKey } from './dates'
import { currencySymbol } from './money'
import { planGoal } from './goals'

const INK = 'FF14232B'
const MUTED = 'FF6B7A80'
const RULE = 'FFDDE3E0'
const BAND = 'FFF4F7F6'
const INCOME = '#1F7A5C'
const EXPENSE = '#B4303F'

const argb = (hex) => `FF${hex.replace('#', '').toUpperCase()}`

const styleHeader = (row) => {
    row.eachCell((cell) => {
        cell.font = {bold: true, color: {argb: 'FFFFFFFF'}, name: 'Calibri', size: 11}
        cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: INK}}
        cell.alignment = {vertical: 'middle'}
        cell.border = {bottom: {style: 'thin', color: {argb: INK}}}
    })
    row.height = 22
}

const sectionTitle = (ws, cell, text) => {
    ws.getCell(cell).value = text
    ws.getCell(cell).font = {name: 'Georgia', size: 13, bold: true, color: {argb: INK}}
}

const bandRows = (ws, from, to, cols) => {
    for(let r = from; r <= to; r++){
        for(let c = 1; c <= cols; c++){
            const cell = ws.getRow(r).getCell(c)
            cell.border = {bottom: {style: 'hair', color: {argb: RULE}}}
            if((r - from) % 2 === 1) cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: BAND}}
        }
    }
}

const date = (key) => fromKey(toKey(key))

/**
 * Builds the report workbook and returns it as a Uint8Array (.xlsx).
 * range: {start, end}; mode: 'week' | 'month' | 'custom'
 */
export async function buildReport({range, mode, incomes, expenses, goals = [], owner = ''}) {
    const {default: ExcelJS} = await import('exceljs')
    const money = `"${currencySymbol()}"#,##0.00;[Red]-"${currencySymbol()}"#,##0.00`
    const moneyAxis = `"${currencySymbol()}"#,##0`
    const pct = '0%'

    const cur = summarize(incomes, expenses, range)
    const prevRange = previousRange(range)
    const prev = summarize(incomes, expenses, prevRange)
    const periodLabel = formatRange(range, mode)
    const kind = mode === 'week' ? 'Weekly' : mode === 'month' ? 'Monthly' : 'Custom range'

    const wb = new ExcelJS.Workbook()
    wb.creator = owner || 'Expense Tracker'
    wb.created = new Date()
    wb.title = `${kind} report – ${periodLabel}`

    /* ---------- Summary ---------- */
    const ws = wb.addWorksheet('Summary', {views: [{showGridLines: false}], properties: {defaultRowHeight: 18}})
    ws.columns = [{width: 26}, {width: 16}, {width: 16}, {width: 16}, {width: 14}, {width: 3}, ...Array(9).fill({width: 10})]

    ws.mergeCells('A1:E1')
    ws.getCell('A1').value = `${kind} report`
    ws.getCell('A1').font = {name: 'Georgia', size: 22, bold: true, color: {argb: INK}}
    ws.getRow(1).height = 34
    ws.getCell('A2').value = periodLabel
    ws.getCell('A2').font = {size: 13, color: {argb: INK}}
    ws.getCell('A3').value = `${formatDate(range.start)} to ${formatDate(range.end)}, generated ${formatDate(todayKey())}${owner ? ` for ${owner}` : ''}`
    ws.getCell('A3').font = {size: 10, color: {argb: MUTED}}

    // Headline figures with live formulas.
    const head = ws.getRow(5)
    head.values = ['', 'Income', 'Expenses', 'Net saved', 'Savings rate']
    styleHeader(head)
    ws.getRow(6).values = ['This period', cur.income, cur.expense]
    ws.getRow(7).values = ['Previous period', prev.income, prev.expense]
    for(const r of [6, 7]){
        ws.getCell(`D${r}`).value = {formula: `B${r}-C${r}`}
        ws.getCell(`E${r}`).value = {formula: `IF(B${r}>0,D${r}/B${r},"")`}
    }
    ws.getRow(8).values = ['Change']
    for(const c of ['B', 'C', 'D']) ws.getCell(`${c}8`).value = {formula: `IF(${c}7=0,"",(${c}6-${c}7)/ABS(${c}7))`}
    ws.getCell('E8').value = {formula: 'IF(OR(E6="",E7=""),"",E6-E7)'}
    for(const r of [6, 7]) for(const c of ['B', 'C', 'D']) ws.getCell(`${c}${r}`).numFmt = money
    for(const c of ['E6', 'E7']) ws.getCell(c).numFmt = pct
    for(const c of ['B8', 'C8', 'D8']) ws.getCell(c).numFmt = '+0%;-0%;0%'
    ws.getCell('E8').numFmt = '+0" pts";-0" pts"'
    ws.getCell('E8').value = {formula: 'IF(OR(E6="",E7=""),"",(E6-E7)*100)'}
    ws.getRow(6).font = {bold: true, size: 12, color: {argb: INK}}
    ws.getRow(7).font = {color: {argb: MUTED}}
    ws.getRow(8).font = {italic: true, color: {argb: MUTED}}
    ws.getCell('A9').value = `Previous period: ${formatDate(prevRange.start)} to ${formatDate(prevRange.end)}`
    ws.getCell('A9').font = {size: 9, color: {argb: MUTED}}
    bandRows(ws, 6, 8, 5)

    // Category tables feeding the pie charts. Categories beyond the 8 colour slots fold into "Other".
    const charts = []
    const categoryTable = (startRow, titleText, list, type) => {
        sectionTitle(ws, `A${startRow}`, titleText)
        const header = ws.getRow(startRow + 1)
        header.values = ['Category', 'Amount', 'Share', 'Payments']
        styleHeader(header)
        const rows = byCategory(list, type, {group: true})
        const first = startRow + 2
        const last = first + Math.max(rows.length, 1) - 1
        if(!rows.length){
            ws.getCell(`A${first}`).value = 'Nothing recorded in this period'
            ws.getCell(`A${first}`).font = {italic: true, color: {argb: MUTED}}
            return {next: first + 3, rows}
        }
        rows.forEach((row, i) => {
            const r = first + i
            ws.getRow(r).values = [row.label, row.amount, {formula: `B${r}/SUM($B$${first}:$B$${last})`}, row.count]
            ws.getCell(`B${r}`).numFmt = money
            ws.getCell(`C${r}`).numFmt = '0.0%'
            // Colour key that matches the chart slice.
            ws.getCell(`A${r}`).border = {left: {style: 'thick', color: {argb: argb(row.key === '__other' ? '#9AA3A0' : categoryColor(type, row.category))}}}
        })
        bandRows(ws, first, last, 4)
        rows.forEach((row, i) => {
            ws.getCell(`A${first + i}`).border = {
                left: {style: 'thick', color: {argb: argb(row.key === '__other' ? '#9AA3A0' : categoryColor(type, row.category))}},
                bottom: {style: 'hair', color: {argb: RULE}},
            }
        })
        const total = last + 1
        ws.getRow(total).values = ['Total', {formula: `SUM(B${first}:B${last})`}, {formula: `SUM(C${first}:C${last})`}, {formula: `SUM(D${first}:D${last})`}]
        ws.getCell(`B${total}`).numFmt = money
        ws.getCell(`C${total}`).numFmt = '0%'
        ws.getRow(total).font = {bold: true, color: {argb: INK}}
        for(let c = 1; c <= 4; c++) ws.getRow(total).getCell(c).border = {top: {style: 'thin', color: {argb: INK}}}

        const folded = rows.find((r) => r.key === '__other' && r.members.length > 1)
        if(folded){
            ws.getCell(`A${total + 1}`).value = `Other includes: ${folded.members.map((m) => findCategory(type, m).label).join(', ')}`
            ws.getCell(`A${total + 1}`).font = {size: 9, italic: true, color: {argb: MUTED}}
        }

        const height = Math.max(16, rows.length + 6)
        charts.push({
            sheet: 'Summary',
            type: type === 'expense' ? 'pie' : 'doughnut',
            title: type === 'expense' ? 'Where your money went' : 'Where your money came from',
            anchor: {from: {col: 6, row: startRow - 1}, to: {col: 14, row: startRow - 1 + height}},
            categoryRef: `'Summary'!$A$${first}:$A$${last}`,
            categories: rows.map((r) => r.label),
            series: [{name: 'Amount', ref: `'Summary'!$B$${first}:$B$${last}`, values: rows.map((r) => r.amount)}],
            pointColors: rows.map((r) => r.key === '__other' ? '#9AA3A0' : categoryColor(type, r.category)),
            numFormat: money,
        })
        return {next: Math.max(total + 3, startRow + height + 2), rows}
    }

    const spend = categoryTable(11, 'Spending by category', cur.expenses, 'expense')
    const earn = categoryTable(spend.next, 'Income by source', cur.incomes, 'income')

    // Largest payments.
    let r = earn.next
    sectionTitle(ws, `A${r}`, 'Largest payments')
    const topHead = ws.getRow(r + 1)
    topHead.values = ['Title', 'Date', 'Category', 'Amount']
    styleHeader(topHead)
    const top = [...cur.expenses].sort((a, b) => b.amount - a.amount).slice(0, 5)
    top.forEach((t, i) => {
        const row = ws.getRow(r + 2 + i)
        row.values = [t.title, date(t.date), findCategory('expense', t.category).label, Number(t.amount)]
        row.getCell(2).numFmt = 'dd mmm yyyy'
        row.getCell(4).numFmt = money
    })
    if(top.length) bandRows(ws, r + 2, r + 1 + top.length, 4)

    /* ---------- Trend ---------- */
    const trend = wb.addWorksheet('Trend', {views: [{showGridLines: false, state: 'frozen', ySplit: 3}]})
    trend.columns = [{width: 22}, {width: 15}, {width: 15}, {width: 15}, {width: 3}]
    const rows = buckets(incomes, expenses, range)
    const unitName = {day: 'Day', week: 'Week starting', month: 'Month'}[rows[0]?.unit || 'day']
    trend.getCell('A1').value = `Income and expenses by ${rows[0]?.unit || 'day'}`
    trend.getCell('A1').font = {name: 'Georgia', size: 16, bold: true, color: {argb: INK}}
    trend.getRow(3).values = [unitName, 'Income', 'Expenses', 'Net']
    styleHeader(trend.getRow(3))
    rows.forEach((b, i) => {
        const n = 4 + i
        trend.getRow(n).values = [b.label, b.income, b.expense, {formula: `B${n}-C${n}`}]
        for(const c of ['B', 'C', 'D']) trend.getCell(`${c}${n}`).numFmt = money
    })
    const lastTrend = 3 + rows.length
    bandRows(trend, 4, lastTrend, 4)
    trend.getRow(lastTrend + 1).values = ['Total', {formula: `SUM(B4:B${lastTrend})`}, {formula: `SUM(C4:C${lastTrend})`}, {formula: `SUM(D4:D${lastTrend})`}]
    trend.getRow(lastTrend + 1).font = {bold: true, color: {argb: INK}}
    for(const c of ['B', 'C', 'D']) trend.getCell(`${c}${lastTrend + 1}`).numFmt = money
    charts.push({
        sheet: 'Trend',
        type: 'bar',
        title: 'Income vs expenses',
        anchor: {from: {col: 5, row: 2}, to: {col: 17, row: 24}},
        categoryRef: `'Trend'!$A$4:$A$${lastTrend}`,
        categories: rows.map((b) => b.label),
        series: [
            {name: 'Income', nameRef: `'Trend'!$B$3`, ref: `'Trend'!$B$4:$B$${lastTrend}`, values: rows.map((b) => b.income), color: INCOME},
            {name: 'Expenses', nameRef: `'Trend'!$C$3`, ref: `'Trend'!$C$4:$C$${lastTrend}`, values: rows.map((b) => b.expense), color: EXPENSE},
        ],
        numFormat: money,
        axisFormat: moneyAxis,
    })

    /* ---------- Transactions ---------- */
    const tx = wb.addWorksheet('Transactions', {views: [{state: 'frozen', ySplit: 1}]})
    tx.columns = [
        {header: 'Date', key: 'date', width: 14},
        {header: 'Type', key: 'type', width: 10},
        {header: 'Title', key: 'title', width: 28},
        {header: 'Category', key: 'category', width: 20},
        {header: 'Reference', key: 'description', width: 34},
        {header: 'Amount', key: 'amount', width: 14},
        {header: 'Signed', key: 'signed', width: 14},
    ]
    styleHeader(tx.getRow(1))
    const all = [...cur.incomes, ...cur.expenses].sort(byDateDesc)
    all.forEach((t) => {
        const row = tx.addRow({
            date: date(t.date),
            type: t.type === 'expense' ? 'Expense' : 'Income',
            title: t.title,
            category: findCategory(t.type, t.category).label,
            description: t.description,
            amount: Number(t.amount),
            signed: t.type === 'expense' ? -Number(t.amount) : Number(t.amount),
        })
        row.getCell('date').numFmt = 'dd mmm yyyy'
        row.getCell('amount').numFmt = money
        row.getCell('signed').numFmt = money
        row.getCell('signed').font = {color: {argb: t.type === 'expense' ? argb(EXPENSE) : argb(INCOME)}}
    })
    const lastTx = all.length + 1
    if(all.length){
        tx.autoFilter = {from: 'A1', to: `G${lastTx}`}
        bandRows(tx, 2, lastTx, 7)
        // SUBTOTAL ignores rows hidden by the filter, so the total follows whatever is filtered.
        const totalRow = tx.getRow(lastTx + 2)
        totalRow.getCell(5).value = 'Net of visible rows'
        totalRow.getCell(7).value = {formula: `SUBTOTAL(109,G2:G${lastTx})`}
        totalRow.getCell(7).numFmt = money
        totalRow.font = {bold: true, color: {argb: INK}}
    }

    /* ---------- Goals ---------- */
    if(goals.length){
        const gs = wb.addWorksheet('Goals', {views: [{showGridLines: false}]})
        gs.columns = [{width: 26}, {width: 14}, {width: 14}, {width: 12}, {width: 16}, {width: 16}, {width: 18}]
        gs.getCell('A1').value = 'Goals'
        gs.getCell('A1').font = {name: 'Georgia', size: 16, bold: true, color: {argb: INK}}
        gs.getRow(3).values = ['Goal', 'Target', 'Saved', 'Progress', 'Monthly plan', 'Deadline', 'Projected finish']
        styleHeader(gs.getRow(3))
        goals.forEach((g, i) => {
            const p = planGoal(g)
            const n = 4 + i
            gs.getRow(n).values = [g.name, p.target, p.saved, {formula: `IF(B${n}=0,0,MIN(1,C${n}/B${n}))`}, p.planMonthly,
                p.deadline ? date(p.deadline) : 'None', p.projected ? date(p.projected) : 'Not enough data']
            for(const c of ['B', 'C', 'E']) gs.getCell(`${c}${n}`).numFmt = money
            gs.getCell(`D${n}`).numFmt = pct
            for(const c of ['F', 'G']) gs.getCell(`${c}${n}`).numFmt = 'dd mmm yyyy'
        })
        bandRows(gs, 4, 3 + goals.length, 7)
        gs.addConditionalFormatting({
            ref: `D4:D${3 + goals.length}`,
            rules: [{type: 'dataBar', priority: 1, cfvo: [{type: 'num', value: 0}, {type: 'num', value: 1}], color: {argb: 'FFB88A3E'}, gradient: false}],
        })
    }

    /* ---------- Insights ---------- */
    const ins = wb.addWorksheet('Insights', {views: [{showGridLines: false}]})
    ins.columns = [{width: 4}, {width: 60}, {width: 70}]
    ins.getCell('B1').value = 'What stands out'
    ins.getCell('B1').font = {name: 'Georgia', size: 16, bold: true, color: {argb: INK}}
    const toneColor = {good: argb(INCOME), warn: 'FFB88A3E', bad: argb(EXPENSE), info: MUTED}
    insights(incomes, expenses, range).forEach((item, i) => {
        const row = ins.getRow(3 + i)
        row.values = ['●', item.title, item.detail]
        row.getCell(1).font = {color: {argb: toneColor[item.tone]}}
        row.getCell(2).font = {bold: true, color: {argb: INK}}
        row.getCell(3).font = {color: {argb: MUTED}}
        row.getCell(3).alignment = {wrapText: true, vertical: 'top'}
        row.getCell(2).alignment = {wrapText: true, vertical: 'top'}
    })

    ws.pageSetup = {orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0}
    const buffer = await wb.xlsx.writeBuffer()
    return addCharts(buffer, charts)
}

export const downloadBytes = (bytes, filename, type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') => {
    const url = URL.createObjectURL(new Blob([bytes], {type}))
    const a = Object.assign(document.createElement('a'), {href: url, download: filename})
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const reportFilename = (range, mode) =>
    `expense-report-${mode === 'month' ? range.start.slice(0, 7) : `${range.start}_to_${range.end}`}.xlsx`

export { SLOTS, incomeCategories }
