// src/config/db.js
//
// This file does two things:
//   1. Creates a single Knex instance (the DB connection pool)
//   2. Binds that instance to Objection so our Models know which DB to use
//
// Why a single instance?
// If every file created its own Knex instance you'd open hundreds of
// connection pools — Neon's free tier would reject you quickly.
// One shared instance = one pool, reused across all requests.

const knex = require('knex');
const { Model } = require('objection');
const knexConfig = require('../../knexfile');

// Pick the right config based on the current environment
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Create the single shared Knex instance
const db = knex(config);

// Tell Objection to use this Knex instance for all Model queries.
// Without this line, Model.query() would throw "knex instance not bound".
Model.knex(db);

module.exports = db;
