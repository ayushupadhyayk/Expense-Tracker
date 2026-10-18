const router = require('express').Router();
const { transactionController } = require('../controllers/transactions');
const IncomeModel = require('../models/IncomeModel');
const ExpenseModel = require('../models/ExpenseModel');

const income = transactionController(IncomeModel, 'Income')
const expense = transactionController(ExpenseModel, 'Expense')

router.post('/add-income', income.add)
    .get('/get-incomes', income.getAll)
    .put('/update-income/:id', income.update)
    .delete('/delete-income/:id', income.remove)
    .post('/add-expense', expense.add)
    .get('/get-expenses', expense.getAll)
    .put('/update-expense/:id', expense.update)
    .delete('/delete-expense/:id', expense.remove)

module.exports = router
