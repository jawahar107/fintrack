// src/server.js — Entry point of the application
//
// WHY is this file separate from app.js?
// app.js exports the Express app (pure HTTP handler, no server).
// server.js imports that app and calls app.listen() to actually
// bind to a port.
//
// This separation means:
//   - Tests can import app.js without starting a real server
//   - app.js stays clean and reusable

require('dotenv').config(); // Must be FIRST — loads .env before anything else reads process.env

// This import also runs Model.knex(db) which binds Objection to our DB pool.
// If we skip this, all Model.query() calls throw "knex not bound".
require('./config/db');

const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Graceful shutdown — when Render or your terminal sends SIGTERM (kill signal),
// we finish handling in-flight requests before shutting down.
// Without this, active requests get cut off mid-flight.
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

