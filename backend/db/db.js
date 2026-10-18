const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Without MONGO_URL, start a local MongoDB (dev only) that keeps its data in backend/.data.
const localMongoUrl = async () => {
    const { MongoMemoryServer } = require('mongodb-memory-server')
    const dbPath = path.join(__dirname, '..', '.data')
    fs.mkdirSync(dbPath, {recursive: true})
    const server = await MongoMemoryServer.create({instance: {dbPath, storageEngine: 'wiredTiger'}})
    console.log('MONGO_URL not set - using local MongoDB with data in backend/.data')
    return server.getUri('expense-tracker')
}

const db = async () => {
    const url = process.env.MONGO_URL || await localMongoUrl()
    await mongoose.connect(url)
    console.log('Db Connected')
}

module.exports = {db}
