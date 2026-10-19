// Migration 003 — Create the transactions table
//
// This is the core table of the app. Every income or expense
// a user records lives here.

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();

    // Who made this transaction? FK to users.
    // onDelete CASCADE: user deleted → their transactions deleted too.
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    // What category is this? FK to categories.
    // onDelete SET NULL: if a category is deleted, transactions keep existing
    // but their category becomes null (we don't want to lose financial records!).
    table
      .integer('category_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL');

    // Is this money coming in or going out?
    table.enum('type', ['income', 'expense']).notNullable();

    // DECIMAL(12, 2) means:
    //   - Up to 12 digits total
    //   - Always exactly 2 decimal places
    // This avoids floating point errors. 0.1 + 0.2 = 0.30 exactly.
    table.decimal('amount', 12, 2).notNullable();

    // Optional note about the transaction (e.g. "Dinner with client")
    table.string('description', 500).nullable();

    // DATE (not TIMESTAMP) — the day the transaction occurred.
    // Separate from created_at (when the user typed it in).
    // E.g. you enter last week's grocery bill today.
    table.date('date').notNullable();

    table.timestamps(true, true);

    // INDEXES — these are the columns we'll filter/sort by most often:
    //   WHERE user_id = ?            → idx_transactions_user_id
    //   WHERE category_id = ?        → idx_transactions_category_id
    //   WHERE date BETWEEN ? AND ?   → idx_transactions_date
    //   WHERE type = ?               → idx_transactions_type
    table.index(['user_id'], 'idx_transactions_user_id');
    table.index(['category_id'], 'idx_transactions_category_id');
    table.index(['date'], 'idx_transactions_date');
    table.index(['type'], 'idx_transactions_type');
    // Composite index for the most common combined query: user's transactions by date
    table.index(['user_id', 'date'], 'idx_transactions_user_date');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('transactions');
};

