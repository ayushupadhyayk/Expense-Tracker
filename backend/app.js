const express = require('express')
const cors = require('cors');
const transactions = require('./routes/transactions');

const createApp = () => {
    const app = express()

    //middlewares
    app.use(express.json())
    // CORS_ORIGIN can be a comma-separated list; unset allows any origin.
    const origins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean)
    app.use(cors(origins?.length ? {origin: origins} : undefined))

    //routes
    app.get('/api/v1/health', (req, res) => res.json({status: 'ok'}))
    app.use('/api/v1', transactions)

    app.use((req, res) => res.status(404).json({message: 'Not Found'}))
    // Malformed JSON bodies and anything else unexpected.
    app.use((err, req, res, next) => {
        const status = err.status || err.statusCode || 500
        res.status(status).json({message: status === 500 ? 'Server Error' : err.message})
    })

    return app
}

module.exports = {createApp}
