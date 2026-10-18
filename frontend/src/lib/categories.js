// Fixed categorical colour slots (validated palette). Colour follows the category, never its rank.
// Expense categories without a slot fold into "Other" on charts; tables still list them.
export const SLOTS = {
    light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
    dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
}
export const OTHER_COLOR = {light: '#9aa3a0', dark: '#5d6a70'}

export const expenseCategories = [
    {value: 'housing', label: 'Rent & home', icon: 'Home', slot: 0, essential: true},
    {value: 'groceries', label: 'Groceries', icon: 'ShoppingBasket', slot: 1, essential: true},
    {value: 'transport', label: 'Transport', icon: 'TrainFront', slot: 2, essential: true},
    {value: 'bills', label: 'Bills & utilities', icon: 'Zap', slot: 3, essential: true},
    {value: 'takeaways', label: 'Eating out', icon: 'UtensilsCrossed', slot: 4},
    {value: 'health', label: 'Health', icon: 'HeartPulse', slot: 5, essential: true},
    {value: 'subscriptions', label: 'Subscriptions', icon: 'Tv', slot: 6},
    {value: 'education', label: 'Education', icon: 'GraduationCap', slot: 7, essential: true},
    {value: 'clothing', label: 'Clothing & shopping', icon: 'Shirt'},
    {value: 'travelling', label: 'Travel', icon: 'Plane'},
    {value: 'entertainment', label: 'Entertainment', icon: 'Ticket'},
    {value: 'other', label: 'Other', icon: 'CircleDot'},
]

export const incomeCategories = [
    {value: 'salary', label: 'Salary', icon: 'Briefcase', slot: 0},
    {value: 'freelancing', label: 'Freelancing', icon: 'PenTool', slot: 1},
    {value: 'investments', label: 'Investments', icon: 'TrendingUp', slot: 2},
    {value: 'stocks', label: 'Stocks', icon: 'ChartCandlestick', slot: 3},
    {value: 'bitcoin', label: 'Crypto', icon: 'Bitcoin', slot: 4},
    {value: 'bank', label: 'Bank transfer', icon: 'Landmark', slot: 5},
    {value: 'youtube', label: 'Content', icon: 'MonitorPlay', slot: 6},
    {value: 'other', label: 'Other', icon: 'CircleDot', slot: 7},
]

export const categoriesFor = (type) => type === 'expense' ? expenseCategories : incomeCategories

export const findCategory = (type, value) =>
    categoriesFor(type).find((c) => c.value === value) || {value, label: value || 'Other', icon: 'CircleDot'}

export const categoryColor = (type, value, theme = 'light') => {
    const cat = findCategory(type, value)
    return cat.slot === undefined ? OTHER_COLOR[theme] : SLOTS[theme][cat.slot]
}

// Chart grouping key: categories without a slot share the "Other" slice.
export const chartGroup = (type, value) => {
    const cat = findCategory(type, value)
    return cat.slot === undefined ? '__other' : cat.value
}

export const isDiscretionary = (value) => {
    const cat = expenseCategories.find((c) => c.value === value)
    return !cat?.essential
}
