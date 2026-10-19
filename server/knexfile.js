// knexfile.js — Knex reads this to know how to connect to the DB
// and where to find migration/seed files.
//
// Knex supports multiple "environments" (development, production).
// We switch between them using NODE_ENV.

require('dotenv').config(); // load .env so DATABASE_URL is available

/**
 * Why a separate knexfile at the root of server/?
 * Because the `knex` CLI needs it. When you run `npm run migrate`,
 * Knex looks for knexfile.js in the current directory.
 */

/** @type {import('knex').Knex.Config} */
const baseConfig = {
  client: 'pg', // use the PostgreSQL driver (the `pg` npm package)

  migrations: {
    directory: './src/db/migrations',  // where migration files live
    tableName: 'knex_migrations',      // Knex creates this table to track which migrations ran
  },

  seeds: {
    directory: './src/db/seeds',       // where seed files live
  },
};

module.exports = {
  // Development — used when NODE_ENV=development (your local machine)
  development: {
    ...baseConfig,
    connection: {
      connectionString: process.env.DATABASE_URL,
      // ssl: require is needed for Neon even in development
      ssl: { rejectUnauthorized: false },
    },
    // Pool settings: keep 2–10 connections open.
    // Why pool? Opening a DB connection is expensive (~100ms).
    // Pooling reuses open connections instead of creating new ones per request.
    pool: { min: 2, max: 10 },
  },

  // Production — used when NODE_ENV=production (Render.com)
  production: {
    ...baseConfig,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 2, max: 10 },
  },
};

