const mongoose = require('mongoose');

// Income and Expense share the same shape; only the `type` default differs.
const transactionSchema = (type) => new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    type: {
        type: String,
        default: type
    },
    date: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        maxLength: 100,
        trim: true
    },
}, {timestamps: true})

module.exports = {transactionSchema}
