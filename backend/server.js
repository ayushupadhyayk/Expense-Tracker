require('dotenv').config({quiet: true})
const { createApp } = require('./app');
const { db, closeDb } = require('./db/db');
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
    const server = createApp().listen(PORT, () => {
        console.log('listening to port:', PORT)
    })

    // Stop cleanly so the database is released and the next start can use it straight away.
    let closing = false
    const shutdown = async () => {
        if(closing) return
        closing = true
        server.close()
        try {
            await closeDb()
        } finally {
            process.exit(0)
        }
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
}

start()
