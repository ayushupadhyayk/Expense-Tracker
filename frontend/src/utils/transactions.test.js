import { describe, expect, it } from 'vitest'
import { availableMonths, dailySeries, filterTransactions, minMax, sum, toCSV } from './transactions'

const list = [
    {_id: '1', type: 'income', title: 'Salary', category: 'salary', description: 'Oct pay', amount: 3000, date: '2026-10-01T00:00:00Z'},
    {_id: '2', type: 'expense', title: 'Groceries', category: 'groceries', description: 'Weekly, "big" shop', amount: 120.5, date: '2026-10-03T00:00:00Z'},
    {_id: '3', type: 'expense', title: 'Netflix', category: 'subscriptions', description: 'Plan', amount: 15, date: '2026-09-20T00:00:00Z'},
]

describe('transactions utils', () => {
    it('sums amounts', () => {
        expect(sum(list)).toBe(3135.5)
        expect(sum([])).toBe(0)
    })

    it('lists months newest first', () => {
        expect(availableMonths(list)).toEqual(['2026-10', '2026-09'])
    })

    it('filters by month, category, type and search', () => {
        expect(filterTransactions(list, {month: '2026-10'}).map((t) => t._id)).toEqual(['1', '2'])
        expect(filterTransactions(list, {category: 'subscriptions'}).map((t) => t._id)).toEqual(['3'])
        expect(filterTransactions(list, {type: 'expense', month: '2026-10'}).map((t) => t._id)).toEqual(['2'])
        expect(filterTransactions(list, {search: 'PAY'}).map((t) => t._id)).toEqual(['1'])
    })

    it('exports CSV with escaping, newest first', () => {
        const lines = toCSV(list).split('\n')
        expect(lines[0]).toBe('Date,Type,Title,Category,Description,Amount')
        expect(lines[1]).toBe('2026-10-03,expense,Groceries,groceries,"Weekly, ""big"" shop",120.50')
        expect(lines).toHaveLength(4)
    })

    it('builds daily series on a shared axis', () => {
        const s = dailySeries(list.filter((t) => t.type === 'income'), list.filter((t) => t.type === 'expense'))
        expect(s.labels).toEqual(['2026-09-20', '2026-10-01', '2026-10-03'])
        expect(s.income).toEqual([0, 3000, 0])
        expect(s.expense).toEqual([15, 0, 120.5])
    })

    it('handles min/max of empty lists', () => {
        expect(minMax([])).toEqual({min: 0, max: 0})
        expect(minMax(list)).toEqual({min: 15, max: 3000})
    })
})
