// src/middleware/auth.js
//
// JWT verification middleware — the "bouncer" for protected routes.
//
// HOW IT WORKS:
//   1. Client sends request with header: Authorization: Bearer <token>
//   2. This middleware extracts the token
//   3. jwt.verify() checks the signature using JWT_SECRET
//   4. If valid → decode payload → inject as req.user → call next()
//   5. If invalid/expired → send 401 Unauthorized immediately
//
// Any route that needs authentication does:
//   router.get('/transactions', authenticate, transactionController.list)
//   The middleware runs BEFORE the controller.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticate(req, res, next) {
  try {
    // 1. Extract token from the Authorization header
    //    Header format: "Bearer eyJhbGciOiJIUzI1NiIs..."
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1]; // grab the part after "Bearer "

    // 2. Verify the token's signature and expiry.
    //    jwt.verify() throws if token is invalid or expired —
    //    our global errorHandler catches JsonWebTokenError and TokenExpiredError.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Optionally fetch fresh user data from DB.
    //    This catches the case where a user was deleted after the token was issued.
    //    For performance you could skip this and just use the decoded payload,
    //    but checking the DB is safer for auth-sensitive apps.
    const user = await User.query().findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: 'Access denied. User no longer exists.',
      });
    }

    // 4. Inject user info into req so controllers can use it
    //    without hitting the DB again.
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next(); // ← hand off to the next middleware or controller
  } catch (err) {
    // jwt.verify() throws JsonWebTokenError or TokenExpiredError —
    // these are handled in errorHandler.js
    next(err);
  }
}

module.exports = { authenticate };

