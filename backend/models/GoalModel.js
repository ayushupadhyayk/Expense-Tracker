const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema({
    amount: {type: Number, required: true},
    date: {type: Date, required: true},
    note: {type: String, trim: true, maxLength: 100, default: ''},
})

const GoalSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true, maxLength: 60},
    target: {type: Number, required: true, min: 1},
    deadline: {type: Date, default: null},
    color: {type: String, default: 'brass'},
    icon: {type: String, default: 'target'},
    contributions: {type: [ContributionSchema], default: []},
}, {timestamps: true})

module.exports = mongoose.model('Goal', GoalSchema)
