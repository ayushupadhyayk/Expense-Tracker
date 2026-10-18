const mongoose = require('mongoose');
const { validateTransaction } = require('./validate');

const pick = ({title, amount, category, description, date}) => ({
    title,
    amount: Number(amount),
    category,
    description,
    date
})

// Builds add/get/update/delete handlers for a transaction model (Income or Expense).
const transactionController = (Model, label) => ({
    add: async (req, res) => {
        const message = validateTransaction(req.body)
        if(message){
            return res.status(400).json({message})
        }
        try {
            const doc = await Model.create(pick(req.body))
            res.status(201).json({message: `${label} Added`, data: doc})
        } catch (error) {
            res.status(500).json({message: 'Server Error'})
        }
    },

    getAll: async (req, res) => {
        try {
            const docs = await Model.find().sort({date: -1, createdAt: -1})
            res.status(200).json(docs)
        } catch (error) {
            res.status(500).json({message: 'Server Error'})
        }
    },

    update: async (req, res) => {
        const {id} = req.params
        if(!mongoose.isValidObjectId(id)){
            return res.status(400).json({message: 'Invalid id'})
        }
        const message = validateTransaction(req.body)
        if(message){
            return res.status(400).json({message})
        }
        try {
            const doc = await Model.findByIdAndUpdate(id, pick(req.body), {returnDocument: 'after', runValidators: true})
            if(!doc){
                return res.status(404).json({message: `${label} not found`})
            }
            res.status(200).json({message: `${label} Updated`, data: doc})
        } catch (error) {
            res.status(500).json({message: 'Server Error'})
        }
    },

    remove: async (req, res) => {
        const {id} = req.params
        if(!mongoose.isValidObjectId(id)){
            return res.status(400).json({message: 'Invalid id'})
        }
        try {
            const doc = await Model.findByIdAndDelete(id)
            if(!doc){
                return res.status(404).json({message: `${label} not found`})
            }
            res.status(200).json({message: `${label} Deleted`})
        } catch (error) {
            res.status(500).json({message: 'Server Error'})
        }
    },
})

module.exports = {transactionController}
