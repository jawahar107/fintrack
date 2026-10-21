// src/services/transactionService.js
//
// This is the most feature-rich service — it handles:
//   - Creating, updating, deleting transactions
//   - Filtering by date range, category, type, and amount
//   - Pagination (page + limit)
//   - Monthly summary (used by dashboard)
//
// KEY CONCEPT — Dynamic query building with Knex:
// Instead of many if/else SQL strings, we start with a base query
// and conditionally chain .where() / .whereBetween() / .andWhere()
// calls. Knex builds the final SQL only when .await is called.

const Transaction = require('../models/Transaction');

// ─── List (with filters + pagination) ────────────────────────────────────────
async function list(userId, filters = {}) {
  const {
    type,
    category_id,
    date_from,    // e.g. '2024-01-01'
    date_to,      // e.g. '2024-12-31'
    min_amount,
    max_amount,
    page = 1,
    limit = 20,
  } = filters;

  // Base query — always scoped to THIS user only (data isolation!)
  const query = Transaction.query()
    .where('transactions.user_id', userId)
    .withGraphFetched('[category]') // auto-JOIN category data
    .orderBy('date', 'desc')
    .orderBy('created_at', 'desc'); // tie-break same-day transactions

  // ── Apply filters only when the client sent them ──────────────────────────
  // This is the power of a query builder — each line only adds SQL if needed.

  if (type) {
    query.where('transactions.type', type); // 'income' or 'expense'
  }

  if (category_id) {
    query.where('transactions.category_id', Number(category_id));
  }

  // Date range filter — both optional, either can be used alone
  if (date_from && date_to) {
    query.whereBetween('date', [date_from, date_to]);
  } else if (date_from) {
    query.where('date', '>=', date_from);
  } else if (date_to) {
    query.where('date', '<=', date_to);
  }

  if (min_amount) {
    query.where('amount', '>=', Number(min_amount));
  }
  if (max_amount) {
    query.where('amount', '<=', Number(max_amount));
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  // We run TWO queries:
  //   1. COUNT(*) with all filters → total matching records (for frontend pagination UI)
  //   2. SELECT with LIMIT/OFFSET  → the actual page of data
  //
  // WHY clone? Objection queries are mutable. We clone the query
  // before adding pagination so the count query runs WITHOUT limit/offset.
  const countQuery = query.clone().resultSize(); // resultSize() = SELECT COUNT(*)
  const dataQuery  = query.limit(Number(limit)).offset((Number(page) - 1) * Number(limit));

  // Run both simultaneously for speed (Promise.all = parallel, not sequential)
  const [total, data] = await Promise.all([countQuery, dataQuery]);

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
    },
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────
async function create(userId, { type, amount, category_id, description, date }) {
  const transaction = await Transaction.query()
    .insert({
      user_id: userId,
      type,
      amount: Number(amount),
      category_id: category_id ? Number(category_id) : null,
      description: description?.trim() || null,
      date,
    })
    .returning('*'); // PostgreSQL returns the inserted row

  // Fetch again with category data joined
  return Transaction.query()
    .findById(transaction.id)
    .withGraphFetched('[category]');
}

// ─── Update ───────────────────────────────────────────────────────────────────
async function update(userId, transactionId, updates) {
  // Ownership check — ensure user owns this transaction
  const existing = await Transaction.query()
    .findById(transactionId)
    .where('user_id', userId);

  if (!existing) {
    const err = new Error('Transaction not found or access denied');
    err.statusCode = 404;
    throw err;
  }

  // Build update object — only include fields that were actually sent
  const updateData = {};
  if (updates.type        !== undefined) updateData.type        = updates.type;
  if (updates.amount      !== undefined) updateData.amount      = Number(updates.amount);
  if (updates.category_id !== undefined) updateData.category_id = updates.category_id ? Number(updates.category_id) : null;
  if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
  if (updates.date        !== undefined) updateData.date        = updates.date;

  await Transaction.query().patchById(transactionId, updateData);

  return Transaction.query()
    .findById(transactionId)
    .withGraphFetched('[category]');
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function remove(userId, transactionId) {
  const existing = await Transaction.query()
    .findById(transactionId)
    .where('user_id', userId);

  if (!existing) {
    const err = new Error('Transaction not found or access denied');
    err.statusCode = 404;
    throw err;
  }

  await Transaction.query().deleteById(transactionId);
  return { message: 'Transaction deleted' };
}

// ─── Summary (used by dashboard in Phase 5) ───────────────────────────────────
// Returns total income, total expense, and balance for a given month
async function getMonthlySummary(userId, year, month) {
  const db = require('../config/db');

  // month is 1-indexed (1 = January). We need first and last day of the month.
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  // new Date(year, month, 0) gives the LAST day of the previous month
  // e.g. new Date(2024, 11, 0) = Nov 30 → last day of November
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  // Raw aggregation query — sum amounts grouped by type
  const rows = await db('transactions')
    .select('type')
    .sum('amount as total')
    .where('user_id', userId)
    .whereBetween('date', [startDate, endDate])
    .groupBy('type');

  // Convert array of {type, total} rows into a clean object
  const summary = { income: 0, expense: 0 };
  rows.forEach((row) => {
    summary[row.type] = parseFloat(row.total) || 0;
  });
  summary.balance = summary.income - summary.expense;

  return summary;
}

module.exports = { list, create, update, remove, getMonthlySummary };
