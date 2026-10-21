// src/controllers/budgetController.js
const budgetService = require('../services/budgetService');

async function list(req, res, next) {
  try {
    const now = new Date();
    const year  = Number(req.query.year)  || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const budgets = await budgetService.listWithSpending(req.user.id, year, month);
    res.json({ budgets });
  } catch (err) { next(err); }
}

async function upsert(req, res, next) {
  try {
    const { category_id, year, month, amount } = req.body;
    if (!category_id || !year || !month || !amount) {
      return res.status(400).json({ error: 'category_id, year, month, and amount are required' });
    }
    const budget = await budgetService.upsert(req.user.id, req.body);
    res.status(200).json({ budget });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const result = await budgetService.remove(req.user.id, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
}

async function dashboard(req, res, next) {
  try {
    const now = new Date();
    const year  = Number(req.query.year)  || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const data = await budgetService.getDashboard(req.user.id, year, month);
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { list, upsert, remove, dashboard };

