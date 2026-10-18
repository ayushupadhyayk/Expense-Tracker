// Restores the bundled sample data. Usage: npm run reset-data
require('dotenv').config({quiet: true})
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const run = async () => {
    if(!process.env.MONGO_URL){
        // Built-in local database: delete its folder; the next start recreates it with sample data.
        const dataDir = path.join(__dirname, '.data')
        if(fs.existsSync(path.join(dataDir, 'mongod.lock')) && fs.statSync(path.join(dataDir, 'mongod.lock')).size > 0){
            console.error('The app seems to be running. Stop it first (Ctrl+C), then run this again.')
            process.exit(1)
        }
        fs.rmSync(dataDir, {recursive: true, force: true})
        console.log('Local data cleared. Sample data will load the next time you start the app.')
        return
    }
    const { resetToSample } = require('./db/seed')
    await mongoose.connect(process.env.MONGO_URL)
    const result = await resetToSample()
    console.log(`Database reset with sample data (${result.incomes} incomes, ${result.expenses} expenses, ${result.goals} goals)`)
    await mongoose.disconnect()
}

run().catch((error) => {
    console.error('Reset failed:', error.message)
    process.exit(1)
})
