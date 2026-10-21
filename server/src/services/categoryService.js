// src/services/categoryService.js
//
// Business rules for categories:
//   - A user can see system defaults (user_id IS NULL) + their own custom ones
//   - A user can only edit/delete their OWN custom categories
//   - System default categories cannot be modified by anyone

const Category = require('../models/Category');

// ─── List ─────────────────────────────────────────────────────────────────────
// Returns: system defaults (user_id IS NULL) + user's own custom categories
async function list(userId) {
  return Category.query()
    .where(function () {
      // Knex grouped WHERE: (user_id IS NULL OR user_id = ?)
      // The function wrapper creates parentheses in SQL — important for OR logic.
      // Without it: WHERE user_id IS NULL OR user_id = 1 AND type = 'expense'
      // With it:    WHERE (user_id IS NULL OR user_id = 1) AND type = 'expense'
      this.whereNull('user_id').orWhere('user_id', userId);
    })
    .orderBy('type')
    .orderBy('name');
}

// ─── Create ───────────────────────────────────────────────────────────────────
async function create(userId, { name, type }) {
  return Category.query().insert({
    name: name.trim(),
    type,
    user_id: userId, // user-created → belongs to this user
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────
async function update(userId, categoryId, { name, type }) {
  // First verify the category exists AND belongs to this user.
  // We never let users modify system defaults (user_id = NULL).
  const category = await Category.query()
    .findById(categoryId)
    .where('user_id', userId); // this WHERE ensures ownership

  if (!category) {
    const err = new Error('Category not found or you do not have permission to edit it');
    err.statusCode = 404;
    throw err;
  }

  return Category.query()
    .patchAndFetchById(categoryId, {
      name: name?.trim() ?? category.name,
      type: type ?? category.type,
    });
  // patchAndFetch = UPDATE only the provided columns, then SELECT the updated row.
  // vs .update() which doesn't return the updated row.
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function remove(userId, categoryId) {
  const category = await Category.query()
    .findById(categoryId)
    .where('user_id', userId);

  if (!category) {
    const err = new Error('Category not found or you do not have permission to delete it');
    err.statusCode = 404;
    throw err;
  }

  await Category.query().deleteById(categoryId);
  // Transactions with this category_id will become category_id = NULL
  // (we set onDelete SET NULL in the migration — financial data is preserved!)
  return { message: 'Category deleted' };
}

module.exports = { list, create, update, remove };
