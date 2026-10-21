// src/controllers/transactionController.js
const transactionService = require('../services/transactionService');

async function list(req, res, next) {
  try {
    // All query params (filters + pagination) come from req.query
    const result = await transactionService.list(req.user.id, req.query);
    res.json(result);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { type, amount, category_id, description, date } = req.body;
    if (!type || !amount || !date) {
      return res.status(400).json({ error: 'type, amount, and date are required' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'type must be income or expense' });
    }
    const transaction = await transactionService.create(req.user.id, req.body);
    res.status(201).json({ transaction });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const transaction = await transactionService.update(req.user.id, req.params.id, req.body);
    res.json({ transaction });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const result = await transactionService.remove(req.user.id, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
}

async function summary(req, res, next) {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const result = await transactionService.getMonthlySummary(
      req.user.id,
      Number(year)  || now.getFullYear(),
      Number(month) || now.getMonth() + 1
    );
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, summary };

