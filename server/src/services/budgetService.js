// src/services/budgetService.js
//
// Budget business logic:
//   - Set a monthly budget per category
//   - Compare actual spending vs budget → overspend alert
//   - Dashboard aggregation (category-wise pie + monthly trend)

const Budget = require('../models/Budget');
const db = require('../config/db');

// Helper: normalize any date to first-of-month string 'YYYY-MM-01'
function firstOfMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

// ─── List budgets for a month with actual spending ────────────────────────────
async function listWithSpending(userId, year, month) {
  const monthDate = firstOfMonth(year, month);

  // Last day of the month for date range query
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = monthDate;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  // 1. Fetch all budgets for this user + month, with category data
  const budgets = await Budget.query()
    .where({ user_id: userId, month: monthDate })
    .withGraphFetched('[category]');

  // 2. Fetch actual spending per category this month
  const spending = await db('transactions')
    .select('category_id')
    .sum('amount as spent')
    .where({ user_id: userId, type: 'expense' })
    .whereBetween('date', [startDate, endDate])
    .groupBy('category_id');

  // Build a lookup map: { category_id → spent amount }
  const spendingMap = {};
  spending.forEach(row => {
    spendingMap[row.category_id] = parseFloat(row.spent) || 0;
  });

  // 3. Merge budgets with actual spending and add overspend flag
  return budgets.map(budget => ({
    ...budget,
    amount: parseFloat(budget.amount),
    spent: spendingMap[budget.category_id] || 0,
    remaining: parseFloat(budget.amount) - (spendingMap[budget.category_id] || 0),
    // isOverspent: true triggers the alert UI in Phase 9
    isOverspent: (spendingMap[budget.category_id] || 0) > parseFloat(budget.amount),
  }));
}

// ─── Upsert (create OR update) budget ────────────────────────────────────────
// "Upsert" = INSERT if doesn't exist, UPDATE if it does.
// Prevents duplicate budgets for the same user+category+month.
async function upsert(userId, { category_id, year, month, amount }) {
  const monthDate = firstOfMonth(year, month);

  const existing = await Budget.query().findOne({
    user_id: userId,
    category_id: Number(category_id),
    month: monthDate,
  });

  if (existing) {
    return Budget.query().patchAndFetchById(existing.id, { amount: Number(amount) });
  }

  return Budget.query()
    .insert({ user_id: userId, category_id: Number(category_id), month: monthDate, amount: Number(amount) })
    .withGraphFetched('[category]');
}

// ─── Delete budget ─────────────────────────────────────────────────────────────
async function remove(userId, budgetId) {
  const budget = await Budget.query().findById(budgetId).where('user_id', userId);
  if (!budget) {
    const err = new Error('Budget not found'); err.statusCode = 404; throw err;
  }
  await Budget.query().deleteById(budgetId);
  return { message: 'Budget deleted' };
}

// ─── Dashboard data ───────────────────────────────────────────────────────────
async function getDashboard(userId, year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = firstOfMonth(year, month);
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  // Run all queries in parallel for performance
  const [totalRows, categoryRows, trendRows] = await Promise.all([

    // 1. Total income and expense this month
    db('transactions')
      .select('type').sum('amount as total')
      .where('user_id', userId)
      .whereBetween('date', [startDate, endDate])
      .groupBy('type'),

    // 2. Expense breakdown by category (for pie chart)
    db('transactions')
      .join('categories', 'transactions.category_id', 'categories.id')
      .select('categories.name as category', 'categories.id as category_id')
      .sum('transactions.amount as total')
      .where({ 'transactions.user_id': userId, 'transactions.type': 'expense' })
      .whereBetween('transactions.date', [startDate, endDate])
      .groupBy('categories.id', 'categories.name')
      .orderBy('total', 'desc'),

    // 3. Monthly trend: last 6 months income vs expense (for line/bar chart)
    db('transactions')
      .select(
        db.raw("TO_CHAR(date, 'YYYY-MM') as month"),
        'type'
      )
      .sum('amount as total')
      .where('user_id', userId)
      .where('date', '>=', db.raw("NOW() - INTERVAL '6 months'"))
      .groupByRaw("TO_CHAR(date, 'YYYY-MM'), type")
      .orderByRaw("TO_CHAR(date, 'YYYY-MM')"),
  ]);

  // Build totals object
  const totals = { income: 0, expense: 0 };
  totalRows.forEach(r => { totals[r.type] = parseFloat(r.total) || 0; });
  totals.balance = totals.income - totals.expense;

  // Build pie chart data: [{ category: 'Food', total: 1200 }, ...]
  const pieData = categoryRows.map(r => ({
    category: r.category,
    category_id: r.category_id,
    total: parseFloat(r.total) || 0,
  }));

  // Build trend data: { '2024-10': { income: 5000, expense: 2000 }, ... }
  const trendMap = {};
  trendRows.forEach(r => {
    if (!trendMap[r.month]) trendMap[r.month] = { month: r.month, income: 0, expense: 0 };
    trendMap[r.month][r.type] = parseFloat(r.total) || 0;
  });
  const trendData = Object.values(trendMap);

  return { totals, pieData, trendData };
}

module.exports = { listWithSpending, upsert, remove, getDashboard };

