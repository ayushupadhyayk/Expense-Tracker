const router = require('express').Router();
const goals = require('../controllers/goals');

router.get('/goals', goals.getGoals)
    .post('/goals', goals.addGoal)
    .put('/goals/:id', goals.updateGoal)
    .delete('/goals/:id', goals.deleteGoal)
    .post('/goals/:id/contributions', goals.addContribution)
    .delete('/goals/:id/contributions/:contributionId', goals.deleteContribution)

module.exports = router
