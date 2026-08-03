const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { issueCsrfToken, csrfCookieOptions } = require('../middlewares/csrf');

const FRONTEND_URL = process.env.NOTES_FRONTEND_URL || 'http://localhost:5173';
const IS_PROD = process.env.NODE_ENV === 'production';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '48h' });

const cookieOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'none' : 'lax',
  maxAge: 48 * 60 * 60 * 1000,
  path: '/',
};

const oauthSuccess = (req, res) => {
  const token = signToken(req.user._id);
  res
    .cookie('auth_token', token, cookieOptions)
    .redirect(`${FRONTEND_URL}/auth/callback`);
};

module.exports = (protectMiddleware) => {
  const router = express.Router();

  // ── GET /api/notes/auth/csrf-token ────────────────────────────────────────
  // Called once on app load. Issues a csrf_token cookie (non-HttpOnly) and
  // returns the same value in the body so the frontend can store it in memory.
  router.get('/csrf-token', issueCsrfToken);

  // ── GET /api/notes/auth/me ────────────────────────────────────────────────
  router.get('/me', protectMiddleware, (req, res) => {
    res.json({
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
    });
  });

  // ── POST /api/notes/auth/logout ───────────────────────────────────────────
  // Clears both the auth cookie and the CSRF cookie.
  router.post('/logout', (req, res) => {
    res
      .clearCookie('auth_token', { ...cookieOptions, maxAge: 0 })
      .clearCookie('csrf_token', { ...csrfCookieOptions, maxAge: 0 })
      .json({ message: 'Logged out successfully' });
  });

  // ── Google OAuth ──────────────────────────────────────────────────────────

  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${FRONTEND_URL}/login?error=google_failed`,
      session: false,
    }),
    oauthSuccess
  );

  // ── GitHub OAuth ──────────────────────────────────────────────────────────

  router.get('/github', (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID) {
      return res.status(503).json({ message: 'GitHub sign-in is not configured.' });
    }
    passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
  });

  router.get('/github/callback', (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID) {
      return res.redirect(`${FRONTEND_URL}/login?error=github_not_configured`);
    }
    passport.authenticate('github', {
      failureRedirect: `${FRONTEND_URL}/login?error=github_failed`,
      session: false,
    })(req, res, next);
  }, oauthSuccess);

  return router;
};
