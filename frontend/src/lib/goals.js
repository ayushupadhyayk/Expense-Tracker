import { addMonths, addMonthsFloat, daysBetween, monthsBetween, startOfMonth, toKey, todayKey } from './dates'

const WEEKS_PER_MONTH = 52 / 12

export const savedOf = (goal) => goal.contributions.reduce((t, c) => t + (Number(c.amount) || 0), 0)

// Average monthly contribution over the last 90 days (or since the goal started, if newer).
export const contributionPace = (goal, today = todayKey()) => {
    const since = toKey(goal.createdAt || today)
    const windowDays = Math.min(90, Math.max(30, daysBetween(since, today)))
    const from = daysBetween(today, today) - windowDays
    const recent = goal.contributions.filter((c) => daysBetween(today, toKey(c.date)) > from && c.note !== 'Starting amount')
    const total = recent.reduce((t, c) => t + Number(c.amount), 0)
    return Math.max(0, total / (windowDays / 30.44))
}

// Date each milestone was crossed, replaying contributions in order.
const reachedDates = (goal, thresholds) => {
    const sorted = [...goal.contributions].sort((a, b) => new Date(a.date) - new Date(b.date))
    const result = new Map()
    let running = 0
    for(const c of sorted){
        running += Number(c.amount)
        for(const t of thresholds) if(!result.has(t) && running >= t) result.set(t, toKey(c.date))
    }
    return result
}

/**
 * Builds the plan for one goal.
 * surplus: average monthly income − expenses; discretionary: [{category, label, monthly}]
 */
export const planGoal = (goal, {surplus = 0, discretionary = [], today = todayKey()} = {}) => {
    const target = Number(goal.target)
    const saved = savedOf(goal)
    const remaining = Math.max(0, target - saved)
    const progress = target ? Math.min(1, saved / target) : 0
    const deadline = goal.deadline ? toKey(goal.deadline) : null
    const monthsLeft = deadline ? monthsBetween(today, deadline) : null

    const contributions = contributionPace(goal, today)
    const pace = contributions > 0 ? contributions : Math.max(0, surplus)
    const paceSource = contributions > 0 ? 'contributions' : surplus > 0 ? 'surplus' : 'none'

    const requiredMonthly = deadline && remaining > 0
        ? (monthsLeft > 0 ? remaining / Math.max(monthsLeft, 0.25) : remaining)
        : null

    const monthsAtPace = pace > 0 ? remaining / pace : Infinity
    const projected = remaining === 0 ? today : Number.isFinite(monthsAtPace) ? addMonthsFloat(today, monthsAtPace) : null

    let status
    if(remaining === 0) status = 'done'
    else if(deadline && monthsLeft <= 0) status = 'overdue'
    else if(!projected) status = 'stalled'
    else if(!deadline) status = 'open'
    else status = projected <= deadline ? 'on-track' : 'behind'

    // The monthly amount the path is drawn with: what the deadline needs, else the current pace,
    // else a twelve-month plan.
    const planMonthly = remaining === 0 ? 0 : requiredMonthly ?? (pace > 0 ? pace : remaining / 12)

    const thresholds = [0.25, 0.5, 0.75, 1].map((p) => ({pct: p, amount: target * p}))
    const reached = reachedDates(goal, thresholds.map((t) => t.amount))
    const milestones = thresholds.map(({pct, amount}) => {
        const when = reached.get(amount)
        const eta = when ? null : planMonthly > 0 ? addMonthsFloat(today, (amount - saved) / planMonthly) : null
        return {pct, amount, reached: when || null, eta}
    })

    const schedule = []
    if(planMonthly > 0){
        let cumulative = saved
        for(let i = 0; i < 36 && cumulative < target; i++){
            const amount = Math.min(planMonthly, target - cumulative)
            cumulative += amount
            schedule.push({month: addMonths(startOfMonth(today), i), amount, cumulative, pct: cumulative / target})
        }
    }

    // Ways to reach the goal sooner, measured against the plan's monthly amount.
    const base = planMonthly
    const weeksSaved = (extra) => base > 0 && remaining > 0
        ? (remaining / base - remaining / (base + extra)) * WEEKS_PER_MONTH
        : 0
    const accelerators = []
    for(const d of discretionary.slice(0, 3)){
        const extra = d.monthly * 0.25
        if(extra >= 5){
            accelerators.push({
                kind: 'trim',
                category: d.category,
                title: `Spend 25% less on ${d.label.toLowerCase()}`,
                extra,
                weeks: weeksSaved(extra),
            })
        }
    }
    if(surplus > base * 1.1 && remaining > 0){
        const extra = (surplus - base) * 0.5
        accelerators.push({kind: 'surplus', title: 'Move half your spare monthly money here', extra, weeks: weeksSaved(extra)})
    }
    if(base > 0 && remaining > 0){
        const extra = base * 0.1
        accelerators.push({kind: 'boost', title: 'Add 10% to every contribution', extra, weeks: weeksSaved(extra)})
    }
    accelerators.sort((a, b) => b.weeks - a.weeks)

    return {
        target,
        saved,
        remaining,
        progress,
        deadline,
        monthsLeft,
        pace,
        paceSource,
        requiredMonthly,
        requiredWeekly: requiredMonthly === null ? null : requiredMonthly / WEEKS_PER_MONTH,
        planMonthly,
        planWeekly: planMonthly / WEEKS_PER_MONTH,
        projected,
        status,
        milestones,
        schedule,
        accelerators: accelerators.slice(0, 4),
    }
}

// How much of the monthly surplus the goals need together.
export const allocation = (plans, surplus) => {
    const needed = plans.reduce((t, p) => t + (p.status === 'done' ? 0 : p.planMonthly), 0)
    return {needed, surplus, gap: surplus - needed, coverage: needed ? Math.max(0, surplus) / needed : 1}
}
