const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

let localServer = null

// Without MONGO_URL, start a local MongoDB (dev only) that keeps its data in backend/.data.
const localMongoUrl = async () => {
    const { MongoMemoryServer } = require('mongodb-memory-server')
    const dbPath = path.join(__dirname, '..', '.data')
    fs.mkdirSync(dbPath, {recursive: true})
    localServer = await MongoMemoryServer.create({instance: {dbPath, storageEngine: 'wiredTiger'}})
    console.log('No MONGO_URL set: using the built-in local database (backend/.data)')
    return localServer.getUri('expense-tracker')
}

const db = async () => {
    const url = process.env.MONGO_URL || await localMongoUrl()
    await mongoose.connect(url)
    console.log('Db Connected')
}

// Disconnects and, for the built-in database, stops MongoDB while keeping its data.
const closeDb = async () => {
    await mongoose.disconnect()
    if(localServer){
        await localServer.stop({doCleanup: false})
        localServer = null
    }
}

module.exports = {db, closeDb}
