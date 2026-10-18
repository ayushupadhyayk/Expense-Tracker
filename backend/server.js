require('dotenv').config({quiet: true})
const { createApp } = require('./app');
const { db } = require('./db/db');
const { seedIfEmpty } = require('./db/seed');

const PORT = process.env.PORT || 5050

const start = async () => {
    try {
        await db()
        const seeded = await seedIfEmpty()
        if(seeded) console.log(`Empty database: loaded sample data (${seeded.incomes} incomes, ${seeded.expenses} expenses, ${seeded.goals} goals)`)
    } catch (error) {
        console.error('DB Connection Error:', error.message)
        process.exit(1)
    }
    createApp().listen(PORT, () => {
        console.log('listening to port:', PORT)
    })
}

start()
