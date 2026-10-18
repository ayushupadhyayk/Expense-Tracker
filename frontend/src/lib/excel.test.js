// @vitest-environment node
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { writeFileSync } from 'node:fs'
import { buildReport } from './excel'

const t = (type, amount, date, category, title = 'Item') => ({type, title, category, description: 'ref', amount, date: `${date}T00:00:00Z`, createdAt: `${date}T10:00:00Z`})
const incomes = [t('income', 3200, '2026-09-01', 'salary', 'Salary'), t('income', 3200, '2026-10-01', 'salary', 'Salary'), t('income', 450, '2026-10-08', 'freelancing', 'Logo')]
const expenses = [
    t('expense', 1100, '2026-10-03', 'housing', 'Rent'), t('expense', 64, '2026-10-06', 'education', 'Books'),
    t('expense', 32.5, '2026-10-11', 'takeaways', 'Pizza'), t('expense', 48, '2026-10-15', 'travelling', 'Train'),
    t('expense', 20, '2026-10-16', 'clothing', 'Socks & "stuff" <ok>'), t('expense', 1100, '2026-09-03', 'housing', 'Rent'),
]
const goals = [{name: 'Laptop', target: 1200, deadline: '2027-04-01T00:00:00Z', createdAt: '2026-08-01T00:00:00Z', contributions: [{amount: 300, date: '2026-08-01T00:00:00Z', note: 'Starting amount'}]}]

describe('excel report', () => {
    it('builds a workbook with native pie and bar charts', async () => {
        const bytes = await buildReport({range: {start: '2026-10-01', end: '2026-10-31'}, mode: 'month', incomes, expenses, goals})
        if(process.env.XLSX_OUT) writeFileSync(process.env.XLSX_OUT, bytes)
        const zip = await JSZip.loadAsync(bytes)
        const names = Object.keys(zip.files)
        expect(names).toEqual(expect.arrayContaining(['xl/charts/chart1.xml', 'xl/charts/chart2.xml', 'xl/charts/chart3.xml', 'xl/drawings/drawing1.xml', 'xl/drawings/drawing2.xml']))
        const pie = await zip.file('xl/charts/chart1.xml').async('string')
        expect(pie).toContain('<c:pieChart>')
        expect(pie).toContain("'Summary'!$B$13:$B$")
        expect(pie).toContain('Rent &amp; home')
        expect(pie).toContain('<c:showPercent val="1"/>')
        expect(await zip.file('xl/charts/chart2.xml').async('string')).toContain('<c:doughnutChart>')
        expect(await zip.file('xl/charts/chart3.xml').async('string')).toContain('<c:barChart>')
        const types = await zip.file('[Content_Types].xml').async('string')
        expect(types).toContain('/xl/charts/chart3.xml')
        const sheet1 = await zip.file('xl/worksheets/sheet1.xml').async('string')
        expect(sheet1).toMatch(/<drawing r:id="rIdChartDrawing1"\/>/)
    })
})
