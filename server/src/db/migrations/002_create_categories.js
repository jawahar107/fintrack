// Migration 002 — Create the categories table
//
// Categories can be:
//   - System defaults (user_id = NULL)  → visible to all users
//   - User-created    (user_id = <id>)  → visible only to that user
//
// This is a common pattern called "shared + personal" data.

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();

    table.string('name', 100).notNullable();

    // 'income' or 'expense' — controls which transaction types
    // can use this category.
    table.enum('type', ['income', 'expense']).notNullable();

    // Nullable FK: NULL means this is a system/default category.
    // Non-null means it belongs to a specific user.
    table
      .integer('user_id')
      .unsigned()      // FKs to SERIAL columns must be unsigned (positive only)
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')  // If a user is deleted, delete their custom categories too
      .nullable();           // NULL = default category (no owner)

    table.timestamps(true, true);

    // INDEX: When we query "give me all categories for user 5",
    // PostgreSQL uses this index to jump straight to those rows
    // instead of scanning the whole table.
    table.index(['user_id'], 'idx_categories_user_id');
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('categories');
};

