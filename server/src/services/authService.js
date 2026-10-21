// src/services/authService.js
//
// Business logic for authentication.
// This layer has NO knowledge of req/res — it just takes plain data,
// does work, and returns results (or throws errors).
//
// WHY bcrypt?
//   If your database is ever stolen, bcrypt-hashed passwords can't be
//   reversed. The attacker gets "$2b$10$..." strings that are useless.
//   Plain MD5 or SHA hashes can be cracked in seconds with rainbow tables.
//
// WHY JWT?
//   REST APIs are stateless — the server doesn't remember who's logged in.
//   Instead, after login the server issues a signed token. The client sends
//   it on every request. The server just verifies the signature — no session
//   storage, no DB lookup on every request.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// How many bcrypt "rounds" to use.
// More rounds = slower hash (harder to brute-force) but more CPU cost.
// 12 is a good production balance. At 12, hashing takes ~300ms.
const SALT_ROUNDS = 12;

// ─── Register ────────────────────────────────────────────────────────────────

async function register({ name, email, password }) {
  // 1. Check if email already exists — give a clear error instead of
  //    letting the DB throw a cryptic unique constraint violation.
  const existing = await User.query().findOne({ email: email.toLowerCase() });
  if (existing) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409; // Conflict
    throw error;
  }

  // 2. Hash the password before storing.
  //    bcrypt.hash() automatically generates a random salt and bakes it
  //    into the hash string — so even two users with the same password
  //    get different hashes.
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Insert into DB. Objection's .query().insert() returns the new row.
  const user = await User.query().insert({
    name,
    email: email.toLowerCase(), // always store emails lowercase
    password_hash,
  });

  // 4. Create the JWT — this is what the client stores and sends
  //    with every future request.
  const token = signToken(user.id);

  // User model's $formatJson automatically strips password_hash
  return { token, user };
}

// ─── Login ───────────────────────────────────────────────────────────────────

async function login({ email, password }) {
  // 1. Find user. We use .throwIfNotFound() which throws Objection's
  //    NotFoundError — but we catch it and rethrow with a vague message.
  //    WHY vague? Never tell attackers if the email exists or not.
  //    "Invalid email or password" gives them no info to work with.
  const user = await User.query()
    .findOne({ email: email.toLowerCase() })
    // Override the jsonSchema stripping for this ONE query
    // so we can access password_hash for comparison
    .context({ skipPasswordStrip: true });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 2. bcrypt.compare() takes the plain password and the stored hash.
  //    Internally it re-hashes the input with the same salt and compares.
  //    Returns true if they match.
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 3. Issue fresh token
  const token = signToken(user.id);

  // Strip password_hash manually since we bypassed $formatJson above
  delete user.password_hash;

  return { token, user };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

// Signs a JWT with the user's ID as the payload.
// The token is signed with JWT_SECRET — any tampering invalidates it.
function signToken(userId) {
  return jwt.sign(
    { id: userId },                      // payload — keep it minimal
    process.env.JWT_SECRET,              // secret key from .env
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = { register, login };

