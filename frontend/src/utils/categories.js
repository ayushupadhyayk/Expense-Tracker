export const incomeCategories = [
    {value: 'salary', label: 'Salary', icon: 'fa-money-bill'},
    {value: 'freelancing', label: 'Freelancing', icon: 'fa-earth-americas'},
    {value: 'investments', label: 'Investments', icon: 'fa-arrow-trend-up'},
    {value: 'stocks', label: 'Stocks', icon: 'fa-chart-line'},
    {value: 'bitcoin', label: 'Bitcoin', icon: 'fa-bitcoin', brand: true},
    {value: 'bank', label: 'Bank Transfer', icon: 'fa-building-columns'},
    {value: 'youtube', label: 'YouTube', icon: 'fa-youtube', brand: true},
    {value: 'other', label: 'Other', icon: 'fa-piggy-bank'},
]

export const expenseCategories = [
    {value: 'education', label: 'Education', icon: 'fa-book-open'},
    {value: 'groceries', label: 'Groceries', icon: 'fa-basket-shopping'},
    {value: 'health', label: 'Health', icon: 'fa-briefcase-medical'},
    {value: 'subscriptions', label: 'Subscriptions', icon: 'fa-tv'},
    {value: 'takeaways', label: 'Takeaways', icon: 'fa-utensils'},
    {value: 'clothing', label: 'Clothing', icon: 'fa-shirt'},
    {value: 'travelling', label: 'Travelling', icon: 'fa-plane'},
    {value: 'other', label: 'Other', icon: 'fa-circle-dot'},
]

export const categoriesFor = (type) => type === 'expense' ? expenseCategories : incomeCategories

export const findCategory = (type, value) =>
    categoriesFor(type).find((c) => c.value === value) || {value, label: value, icon: 'fa-circle-dot'}
