// src/db/seeds/01_default_categories.js
//
// Seeds insert initial data. We're inserting default categories that
// every user can use — like "Food", "Salary", "Rent".
//
// Key: user_id is NULL for all of these.
// NULL means "belongs to nobody / belongs to everyone" — system defaults.
//
// Why seeds and not hardcoding in the app?
// Seeds run once on deploy via `npm run seed`. They're version-controlled
// and reproducible. If you ever reset the DB, you just re-seed.

/**
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  // Delete existing default categories first to avoid duplicates on re-seed.
  // Only delete rows where user_id IS NULL (i.e. system defaults).
  // We don't want to wipe out user-created categories!
  await knex('categories').whereNull('user_id').delete();

  await knex('categories').insert([
    // ── EXPENSE categories ──────────────────────────────────────────────
    { name: 'Food & Dining',       type: 'expense', user_id: null },
    { name: 'Transportation',      type: 'expense', user_id: null },
    { name: 'Housing & Rent',      type: 'expense', user_id: null },
    { name: 'Utilities',           type: 'expense', user_id: null },
    { name: 'Healthcare',          type: 'expense', user_id: null },
    { name: 'Entertainment',       type: 'expense', user_id: null },
    { name: 'Shopping',            type: 'expense', user_id: null },
    { name: 'Education',           type: 'expense', user_id: null },
    { name: 'Travel',              type: 'expense', user_id: null },
    { name: 'Personal Care',       type: 'expense', user_id: null },
    { name: 'Subscriptions',       type: 'expense', user_id: null },
    { name: 'Other Expense',       type: 'expense', user_id: null },

    // ── INCOME categories ────────────────────────────────────────────────
    { name: 'Salary',              type: 'income',  user_id: null },
    { name: 'Freelance',           type: 'income',  user_id: null },
    { name: 'Investments',         type: 'income',  user_id: null },
    { name: 'Rental Income',       type: 'income',  user_id: null },
    { name: 'Business',            type: 'income',  user_id: null },
    { name: 'Gift',                type: 'income',  user_id: null },
    { name: 'Other Income',        type: 'income',  user_id: null },
  ]);
};
