import { describe, expect, it } from 'vitest'
import { buckets, byCategory, change, insights, recurring, summarize, weekdaySpend } from './stats'
import { comparisonRange, periodRange, previousRange, shiftRange, startOfWeek, endOfMonth, addMonths } from './dates'
import { planGoal } from './goals'

const inc = (amount, date, category = 'salary') => ({type: 'income', title: 'Pay', category, description: 'x', amount, date: `${date}T00:00:00Z`})
const exp = (amount, date, category = 'groceries', title = 'Shop') => ({type: 'expense', title, category, description: 'x', amount, date: `${date}T00:00:00Z`})

describe('dates', () => {
    it('builds week and month ranges', () => {
        expect(startOfWeek('2026-10-18')).toBe('2026-10-12') // Sunday -> Monday
        expect(periodRange('week', '2026-10-14')).toEqual({start: '2026-10-12', end: '2026-10-18'})
        expect(periodRange('month', '2026-02-10')).toEqual({start: '2026-02-01', end: '2026-02-28'})
        expect(endOfMonth('2028-02-03')).toBe('2028-02-29')
        expect(addMonths('2026-01-31', 1)).toBe('2026-02-01')
    })
    it('shifts ranges by period', () => {
        expect(shiftRange('month', {start: '2026-10-01', end: '2026-10-31'}, -1)).toEqual({start: '2026-09-01', end: '2026-09-30'})
        expect(shiftRange('custom', {start: '2026-10-01', end: '2026-10-10'}, 1)).toEqual({start: '2026-10-11', end: '2026-10-20'})
        expect(previousRange({start: '2026-10-11', end: '2026-10-20'})).toEqual({start: '2026-10-01', end: '2026-10-10'})
        // Months compare with the whole previous calendar month, not "the 30 days before".
        expect(comparisonRange({start: '2023-06-01', end: '2023-06-30'}, 'month')).toEqual({start: '2023-05-01', end: '2023-05-31'})
        expect(comparisonRange({start: '2023-06-05', end: '2023-06-11'}, 'week')).toEqual({start: '2023-05-29', end: '2023-06-04'})
        expect(comparisonRange({start: '2023-06-11', end: '2023-06-20'}, 'custom')).toEqual({start: '2023-06-01', end: '2023-06-10'})
    })
})

describe('stats', () => {
    const incomes = [inc(3000, '2026-09-01'), inc(3000, '2026-10-01'), inc(400, '2026-10-08', 'freelancing')]
    const expenses = [
        exp(1000, '2026-09-03', 'housing', 'Rent'), exp(100, '2026-09-12'),
        exp(1000, '2026-10-03', 'housing', 'Rent'), exp(60, '2026-10-06', 'clothing'), exp(40, '2026-10-11', 'travelling'),
        exp(200, '2026-10-12'),
    ]
    const oct = {start: '2026-10-01', end: '2026-10-31'}

    it('summarizes a period', () => {
        const s = summarize(incomes, expenses, oct)
        expect(s).toMatchObject({income: 3400, expense: 1300, net: 2100, expenseCount: 4, days: 31})
        expect(s.savingsRate).toBeCloseTo(2100 / 3400)
    })

    it('groups categories and folds unslotted ones into Other', () => {
        const s = summarize(incomes, expenses, oct)
        expect(byCategory(s.expenses, 'expense').map((c) => c.category)).toEqual(['housing', 'groceries', 'clothing', 'travelling'])
        const grouped = byCategory(s.expenses, 'expense', {group: true})
        expect(grouped.map((c) => [c.label, c.amount])).toEqual([['Rent & home', 1000], ['Groceries', 200], ['Other', 100]])
        expect(grouped.reduce((t, c) => t + c.share, 0)).toBeCloseTo(1)
    })

    it('buckets by day, week or month depending on range length', () => {
        expect(buckets(incomes, expenses, oct)).toHaveLength(31)
        const weeks = buckets(incomes, expenses, {start: '2026-09-01', end: '2026-10-31'})
        expect(weeks[0].unit).toBe('week')
        expect(weeks.reduce((t, b) => t + b.expense, 0)).toBe(2400)
        const months = buckets(incomes, expenses, {start: '2026-01-01', end: '2026-12-31'})
        expect(months).toHaveLength(12)
        expect(months[9]).toMatchObject({income: 3400, expense: 1300})
    })

    it('finds recurring payments and weekday spend', () => {
        expect(recurring(expenses).map((r) => r.title)).toEqual(['Rent'])
        const wd = weekdaySpend(expenses, oct)
        expect(wd).toHaveLength(7)
        expect(wd.reduce((t, d) => t + d.total, 0)).toBe(1300)
    })

    it('computes change and insights', () => {
        expect(change(120, 100)).toBeCloseTo(0.2)
        expect(Number.isNaN(change(5, 0))).toBe(true)
        const list = insights(incomes, expenses, oct, '2026-10-20')
        expect(list[0].tone).toBe('good')
        expect(list.some((i) => i.title.includes('largest expense'))).toBe(true)
        expect(list.some((i) => i.title.startsWith('On pace'))).toBe(true)
    })
})

describe('goals', () => {
    const goal = {
        name: 'Laptop', target: 1200, deadline: '2027-04-20T00:00:00Z', createdAt: '2026-08-01T00:00:00Z',
        contributions: [
            {amount: 200, date: '2026-08-01T00:00:00Z', note: 'Starting amount'},
            {amount: 100, date: '2026-08-20T00:00:00Z'},
            {amount: 100, date: '2026-09-20T00:00:00Z'},
            {amount: 100, date: '2026-10-10T00:00:00Z'},
        ],
    }

    it('plans required savings, milestones and schedule', () => {
        const p = planGoal(goal, {surplus: 500, discretionary: [{category: 'takeaways', label: 'Eating out', monthly: 120}], today: '2026-10-20'})
        expect(p.saved).toBe(500)
        expect(p.remaining).toBe(700)
        expect(p.requiredMonthly).toBeCloseTo(700 / (182 / 30.4375), 1)
        expect(p.paceSource).toBe('contributions')
        expect(p.milestones[0]).toMatchObject({pct: 0.25, reached: '2026-08-20'})
        expect(p.milestones[3].reached).toBe(null)
        expect(p.schedule.at(-1).cumulative).toBeCloseTo(1200)
        expect(p.accelerators.length).toBeGreaterThan(0)
        expect(p.accelerators.every((a) => a.weeks > 0)).toBe(true)
        expect(['on-track', 'behind']).toContain(p.status)
    })

    it('handles finished and stalled goals', () => {
        expect(planGoal({...goal, target: 400}, {today: '2026-10-20'}).status).toBe('done')
        const stalled = planGoal({...goal, deadline: null, contributions: []}, {today: '2026-10-20'})
        expect(stalled.status).toBe('stalled')
        expect(stalled.schedule).toHaveLength(12)
    })
})
