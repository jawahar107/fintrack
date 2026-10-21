// src/routes/auth.js
//
// Maps HTTP methods + URL paths → controller functions.
// Routes are intentionally thin — no logic here, just wiring.
//
// WHY use express.Router()?
//   Router creates a mini Express app that can be mounted at a prefix.
//   We mount this at /api/auth in app.js, so:
//     router.post('/register') → POST /api/auth/register
//     router.post('/login')    → POST /api/auth/login

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes — no token needed
router.post('/register', authController.register);
router.post('/login',    authController.login);

// Protected route — authenticate middleware runs first
// If token is invalid, authenticate sends 401 and the controller never runs
router.get('/me', authenticate, authController.getMe);

module.exports = router;
