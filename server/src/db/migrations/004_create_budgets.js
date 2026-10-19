// Migration 004 — Create the budgets table
//
// A budget says: "For category X in month Y, I want to spend at most $Z."
// We then compare actual spending vs this budget to fire overspend alerts.

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('budgets', (table) => {
    table.increments('id').primary();

    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('CASCADE'); // Budget deleted if category is deleted — makes sense

    // We store the FIRST DAY of the month to represent the whole month.
    // e.g. '2024-11-01' means "budget for November 2024"
    // Why not two columns (year + month)? One DATE column is easier to
    // query with BETWEEN and sort with ORDER BY.
    table.date('month').notNullable();

    // Budget limit for that month
    table.decimal('amount', 12, 2).notNullable();

    table.timestamps(true, true);

    // UNIQUE CONSTRAINT: One budget per user per category per month.
    // If you try to insert a duplicate, PostgreSQL throws an error.
    // This is a "business rule" enforced at the DB level — even if your
    // application code has a bug and sends two inserts, the DB stops it.
    table.unique(['user_id', 'category_id', 'month'], 'uq_budgets_user_category_month');

    table.index(['user_id'], 'idx_budgets_user_id');
    table.index(['user_id', 'month'], 'idx_budgets_user_month');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('budgets');
};

