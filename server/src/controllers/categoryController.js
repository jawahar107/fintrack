// src/controllers/categoryController.js
const categoryService = require('../services/categoryService');

async function list(req, res, next) {
  try {
    const categories = await categoryService.list(req.user.id);
    res.json({ categories });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
    if (!['income', 'expense'].includes(type)) return res.status(400).json({ error: 'type must be income or expense' });
    const category = await categoryService.create(req.user.id, { name, type });
    res.status(201).json({ category });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const category = await categoryService.update(req.user.id, req.params.id, req.body);
    res.json({ category });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const result = await categoryService.remove(req.user.id, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };

