const mongoose = require('mongoose');
const Goal = require('../models/GoalModel');

const validateGoal = ({name, target, deadline} = {}) => {
    if(!name || !String(name).trim()){
        return 'Goal name is required!'
    }
    if(String(name).trim().length > 60){
        return 'Goal name must be 60 characters or fewer!'
    }
    const value = Number(target)
    if(target === '' || target === null || !Number.isFinite(value) || value < 1){
        return 'Target must be at least 1!'
    }
    if(deadline && Number.isNaN(new Date(deadline).getTime())){
        return 'Deadline is invalid!'
    }
    return null
}

// Contributions can be negative (a withdrawal) but never zero.
const validateContribution = ({amount, date} = {}) => {
    const value = Number(amount)
    if(amount === '' || amount === null || !Number.isFinite(value) || value === 0){
        return 'Amount must be a non-zero number!'
    }
    if(!date || Number.isNaN(new Date(date).getTime())){
        return 'Date is invalid!'
    }
    return null
}

const pickGoal = ({name, target, deadline, color, icon}) => ({
    name,
    target: Number(target),
    deadline: deadline || null,
    ...(color && {color}),
    ...(icon && {icon}),
})

const withGoal = (handler) => async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)){
        return res.status(400).json({message: 'Invalid id'})
    }
    try {
        const goal = await Goal.findById(req.params.id)
        if(!goal){
            return res.status(404).json({message: 'Goal not found'})
        }
        await handler(goal, req, res)
    } catch (error) {
        res.status(500).json({message: 'Server Error'})
    }
}

exports.getGoals = async (req, res) => {
    try {
        res.status(200).json(await Goal.find().sort({createdAt: 1}))
    } catch (error) {
        res.status(500).json({message: 'Server Error'})
    }
}

exports.addGoal = async (req, res) => {
    const message = validateGoal(req.body)
    if(message){
        return res.status(400).json({message})
    }
    try {
        const {startingAmount} = req.body
        const contributions = Number(startingAmount) > 0
            ? [{amount: Number(startingAmount), date: new Date(), note: 'Starting amount'}]
            : []
        const goal = await Goal.create({...pickGoal(req.body), contributions})
        res.status(201).json({message: 'Goal created', data: goal})
    } catch (error) {
        res.status(500).json({message: 'Server Error'})
    }
}

exports.updateGoal = withGoal(async (goal, req, res) => {
    const message = validateGoal(req.body)
    if(message){
        return res.status(400).json({message})
    }
    goal.set(pickGoal(req.body))
    await goal.save()
    res.status(200).json({message: 'Goal updated', data: goal})
})

exports.deleteGoal = withGoal(async (goal, req, res) => {
    await goal.deleteOne()
    res.status(200).json({message: 'Goal deleted'})
})

exports.addContribution = withGoal(async (goal, req, res) => {
    const message = validateContribution(req.body)
    if(message){
        return res.status(400).json({message})
    }
    const {amount, date, note} = req.body
    goal.contributions.push({amount: Number(amount), date, note})
    await goal.save()
    res.status(201).json({message: Number(amount) > 0 ? 'Money added to goal' : 'Withdrawal recorded', data: goal})
})

exports.deleteContribution = withGoal(async (goal, req, res) => {
    const contribution = goal.contributions.id(req.params.contributionId)
    if(!contribution){
        return res.status(404).json({message: 'Contribution not found'})
    }
    contribution.deleteOne()
    await goal.save()
    res.status(200).json({message: 'Contribution removed', data: goal})
})

exports.validateGoal = validateGoal
exports.validateContribution = validateContribution
