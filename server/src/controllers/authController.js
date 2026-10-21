// src/controllers/authController.js
//
// Controllers = HTTP layer only.
// Responsibilities:
//   1. Validate that required fields exist in req.body (basic check)
//   2. Call the service
//   3. Send the response
//
// The controller does NOT know about bcrypt, JWTs, or DB queries.
// If we ever switch from Express to Fastify, we only rewrite controllers.

const authService = require('../services/authService');

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // Basic presence validation — more thorough validation comes in Phase 10
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'name, email, and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
      });
    }

    const { token, user } = await authService.register({ name, email, password });

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (err) {
    // Pass error to the global errorHandler middleware
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'email and password are required',
      });
    }

    const { token, user } = await authService.login({ email, password });

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me — returns the current logged-in user's profile
// Protected route: requires JWT (auth middleware injects req.user)
async function getMe(req, res, next) {
  try {
    // req.user is injected by the auth middleware (Phase 3 step 5)
    // It contains { id, email } from the JWT payload
    const user = await require('../models/User').query().findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };
