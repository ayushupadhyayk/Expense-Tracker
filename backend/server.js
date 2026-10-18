require('dotenv').config({quiet: true})
const { createApp } = require('./app');
const { db } = require('./db/db');

const PORT = process.env.PORT || 5050

const start = async () => {
    try {
        await db()
    } catch (error) {
        console.error('DB Connection Error:', error.message)
        process.exit(1)
    }
    createApp().listen(PORT, () => {
        console.log('listening to port:', PORT)
    })
}

start()
