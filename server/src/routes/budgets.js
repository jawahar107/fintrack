// src/routes/budgets.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/budgetController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Dashboard is here because it's tightly coupled to budget+spending data
router.get('/dashboard', ctrl.dashboard);

router.get('/',          ctrl.list);
router.post('/',         ctrl.upsert);   // creates OR updates (upsert)
router.delete('/:id',    ctrl.remove);

module.exports = router;

