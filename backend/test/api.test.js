const { test } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { createApp } = require('../app');
const { validateTransaction } = require('../controllers/validate');

const valid = {title: 'Rent', amount: 500, category: 'other', description: 'Oct', date: '2026-10-01'}

test('validateTransaction accepts a valid body', () => {
    assert.strictEqual(validateTransaction(valid), null)
    assert.strictEqual(validateTransaction({...valid, amount: '12.50'}), null)
})

test('validateTransaction rejects bad amounts', () => {
    for (const amount of [0, -5, 'abc', '', null, undefined]) {
        assert.ok(validateTransaction({...valid, amount}), `amount ${amount} should fail`)
    }
})

test('validateTransaction rejects missing fields and bad dates', () => {
    assert.strictEqual(validateTransaction({...valid, title: ''}), 'All fields are required!')
    assert.strictEqual(validateTransaction({...valid, date: 'not-a-date'}), 'Date is invalid!')
    assert.ok(validateTransaction({...valid, description: 'x'.repeat(101)}))
})

// These requests are rejected before touching the database, so no Mongo is needed.
test('POST /add-expense returns 400 for invalid body', async () => {
    const res = await request(createApp()).post('/api/v1/add-expense').send({...valid, amount: -1})
    assert.strictEqual(res.status, 400)
    assert.strictEqual(res.body.message, 'Amount must be a positive number!')
})

test('PUT /update-income/:id returns 400 for invalid id', async () => {
    const res = await request(createApp()).put('/api/v1/update-income/nope').send(valid)
    assert.strictEqual(res.status, 400)
})

test('DELETE /delete-expense/:id returns 400 for invalid id', async () => {
    const res = await request(createApp()).delete('/api/v1/delete-expense/nope')
    assert.strictEqual(res.status, 400)
})

test('malformed JSON returns 400 and unknown routes 404', async () => {
    const app = createApp()
    const bad = await request(app).post('/api/v1/add-income').set('Content-Type', 'application/json').send('{bad')
    assert.strictEqual(bad.status, 400)
    const missing = await request(app).get('/api/v1/nope')
    assert.strictEqual(missing.status, 404)
    const health = await request(app).get('/api/v1/health')
    assert.strictEqual(health.body.status, 'ok')
})

const { validateGoal, validateContribution } = require('../controllers/goals');

test('validateGoal checks name, target and deadline', () => {
    assert.strictEqual(validateGoal({name: 'Laptop', target: 1200}), null)
    assert.strictEqual(validateGoal({name: 'Laptop', target: 1200, deadline: '2027-03-01'}), null)
    assert.strictEqual(validateGoal({name: '', target: 1200}), 'Goal name is required!')
    assert.strictEqual(validateGoal({name: 'Laptop', target: 0}), 'Target must be at least 1!')
    assert.strictEqual(validateGoal({name: 'Laptop', target: 10, deadline: 'soon'}), 'Deadline is invalid!')
})

test('validateContribution allows withdrawals but not zero', () => {
    assert.strictEqual(validateContribution({amount: 50, date: '2026-10-01'}), null)
    assert.strictEqual(validateContribution({amount: -20, date: '2026-10-01'}), null)
    assert.ok(validateContribution({amount: 0, date: '2026-10-01'}))
    assert.ok(validateContribution({amount: 10, date: ''}))
})

test('goal routes reject invalid input before hitting the database', async () => {
    const app = createApp()
    assert.strictEqual((await request(app).post('/api/v1/goals').send({name: '', target: 5})).status, 400)
    assert.strictEqual((await request(app).put('/api/v1/goals/nope').send({name: 'x', target: 5})).status, 400)
    assert.strictEqual((await request(app).post('/api/v1/goals/nope/contributions').send({amount: 5, date: '2026-10-01'})).status, 400)
})
