const path = require('path');
const IncomeModel = require('../models/IncomeModel');
const ExpenseModel = require('../models/ExpenseModel');
const Goal = require('../models/GoalModel');

const SAMPLE_FILE = path.join(__dirname, '..', 'seed', 'sample-data.json')

const loadSample = () => require(SAMPLE_FILE)

const counts = async () => ({
    incomes: await IncomeModel.countDocuments(),
    expenses: await ExpenseModel.countDocuments(),
    goals: await Goal.countDocuments(),
})

// Inserts the bundled sample data (backend/seed/sample-data.json).
const insertSample = async () => {
    const {incomes, expenses, goals} = loadSample()
    await IncomeModel.insertMany(incomes)
    await ExpenseModel.insertMany(expenses)
    // Keep each goal's original start date; it is used to measure saving pace.
    await Goal.insertMany(goals, {timestamps: false})
    return {incomes: incomes.length, expenses: expenses.length, goals: goals.length}
}

// Loads the sample data only into a completely empty database, so real data is never touched.
const seedIfEmpty = async () => {
    if(process.env.SEED_SAMPLE_DATA === 'false') return null
    const c = await counts()
    if(c.incomes || c.expenses || c.goals) return null
    return insertSample()
}

// Deletes everything and loads the sample data again.
const resetToSample = async () => {
    await Promise.all([IncomeModel.deleteMany({}), ExpenseModel.deleteMany({}), Goal.deleteMany({})])
    return insertSample()
}

module.exports = {seedIfEmpty, resetToSample, counts}
