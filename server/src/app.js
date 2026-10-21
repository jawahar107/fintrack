// src/app.js — Express application
//
// This file configures the Express app: middleware stack + routes.
// It does NOT start the server (that's server.js's job).
// This makes the app importable and testable without binding to a port.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

// helmet() automatically sets ~15 secure HTTP response headers.
// Examples of what it adds:
//   X-Content-Type-Options: nosniff      → prevents MIME-type sniffing attacks
//   X-Frame-Options: DENY                → prevents clickjacking (iframe embedding)
//   Strict-Transport-Security            → forces HTTPS
// Without helmet, browsers have no instructions on these security policies.
app.use(helmet());

// CORS — Cross-Origin Resource Sharing
// Browsers BLOCK requests from a different origin (domain/port) by default.
// Our React app runs on localhost:5173 and our API on localhost:5000 —
// that's two different origins, so we need CORS to allow it.
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // allow cookies / Authorization header to be sent
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// General limiter — applies to all routes.
// 100 requests per 15 minutes per IP is generous for normal use
// but blocks bots hammering your API.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,  // sends rate limit info in response headers
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth endpoints — prevents brute-force login attacks.
// 10 attempts per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

app.use('/api', generalLimiter); // apply general limit to all /api routes

// ─── Body Parsing ─────────────────────────────────────────────────────────────

// Parse incoming JSON bodies — without this, req.body is undefined.
// When your React app sends POST /api/auth/register with a JSON body,
// Express needs this middleware to parse it into a JS object.
app.use(express.json({ limit: '10kb' })); // 10kb limit prevents huge payload attacks

// ─── Health Check ─────────────────────────────────────────────────────────────

// A simple endpoint to verify the server is running.
// Used by Render.com (and you) to confirm the deployment is live.
// No auth needed — just returns 200 OK.
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
// We'll plug in real routes as we build each phase.
// For now the placeholders are here so the server starts without errors.

// Apply the stricter limiter specifically to auth routes
app.use('/api/auth', authLimiter);

// Route modules (we'll create these in Phase 3 & 4)
// app.use('/api/auth',         require('./routes/auth'));
// app.use('/api/categories',   require('./routes/categories'));
// app.use('/api/transactions', require('./routes/transactions'));
// app.use('/api/budgets',      require('./routes/budgets'));

// ─── 404 Handler ──────────────────────────────────────────────────────────────

// If no route matched, send a clean 404 JSON response.
// Without this, Express sends a plain HTML "Cannot GET /whatever" page —
// useless for a JSON API.
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

// MUST be last. Express knows this is an error handler because it has 4 params (err, req, res, next).
// Any time you call next(err) or throw inside an async route, it lands here.
app.use(errorHandler);

module.exports = app;

