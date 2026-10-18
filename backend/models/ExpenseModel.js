const mongoose = require('mongoose');
const { transactionSchema } = require('./transactionSchema');

module.exports = mongoose.model('Expense', transactionSchema('expense'))
