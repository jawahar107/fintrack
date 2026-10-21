// src/routes/transactions.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/summary',  ctrl.summary);  // MUST be before /:id
router.get('/',         ctrl.list);
router.post('/',        ctrl.create);
router.put('/:id',      ctrl.update);
router.delete('/:id',   ctrl.remove);

module.exports = router;

