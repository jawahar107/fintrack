// Migration 001 — Create the users table
//
// This is always the FIRST migration because every other table
// references users via a foreign key. You can't create a FK
// to a table that doesn't exist yet.

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('users', (table) => {
    // Auto-incrementing primary key. `increments()` creates:
    //   id SERIAL PRIMARY KEY
    // Every table needs a PK — it's how you uniquely identify a row.
    table.increments('id').primary();

    table.string('name', 100).notNullable();

    // UNIQUE ensures no two users share an email.
    // This is enforced at the DB level, not just in JS —
    // so even if two simultaneous requests slip through, the DB catches it.
    table.string('email', 255).notNullable().unique();

    // Never store the actual password! bcrypt turns it into this hash.
    table.string('password_hash', 255).notNullable();

    // timestamps(true, true) creates:
    //   created_at TIMESTAMP DEFAULT NOW()
    //   updated_at TIMESTAMP DEFAULT NOW()
    // Knex also auto-updates `updated_at` on every UPDATE.
    table.timestamps(true, true);
  });
};

/**
 * Undo everything the `up` function did.
 * Called when you run: npm run migrate:rollback
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');
};

