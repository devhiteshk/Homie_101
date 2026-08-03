/**
 * CSRF protection — Double Submit Cookie pattern
 *
 * Why not csurf? It's deprecated and archived. This implements the same
 * Double Submit Cookie pattern from scratch using Node's built-in crypto.
 *
 * How it works:
 *  1. On GET /auth/csrf-token the server generates a random token, stores
 *     it as a non-HttpOnly cookie (so JS can read it), and also returns it
 *     in the JSON body.
 *  2. On every state-mutating request (POST/PUT/DELETE/PATCH) the frontend
 *     reads the cookie and sends it as the X-CSRF-Token header.
 *  3. This middleware compares the cookie value and the header value.
 *     An attacker on another origin can trigger a request but cannot READ
 *     the csrf_token cookie (SameSite + CORS), so they cannot set the header.
 *
 * Safe methods (GET, HEAD, OPTIONS) are skipped entirely.
 * OAuth redirect routes (/auth/google, /auth/github and their callbacks)
 * are also skipped because they are browser-driven GET redirects.
 */

const crypto = require('crypto');

const IS_PROD = process.env.NODE_ENV === 'production';

// Cookie options for the CSRF token — NOT HttpOnly so JS can read it
const csrfCookieOptions = {
  httpOnly: false,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'none' : 'lax',
  maxAge: 48 * 60 * 60 * 1000, // match auth cookie lifetime
  path: '/',
};

// Routes that must be excluded from CSRF checks because they are
// browser-initiated GET redirects from the OAuth provider
const CSRF_EXEMPT_PATHS = [
  '/api/notes/auth/google',
  '/api/notes/auth/google/callback',
  '/api/notes/auth/github',
  '/api/notes/auth/github/callback',
];

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Middleware: validate CSRF token on mutating requests.
 * Attach after cookieParser().
 */
const verifyCsrf = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (CSRF_EXEMPT_PATHS.some((p) => req.path.startsWith(p))) return next();

  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }

  // Constant-time comparison to prevent timing attacks
  try {
    const cookieBuf = Buffer.from(cookieToken);
    const headerBuf = Buffer.from(headerToken);
    if (
      cookieBuf.length !== headerBuf.length ||
      !crypto.timingSafeEqual(cookieBuf, headerBuf)
    ) {
      return res.status(403).json({ message: 'CSRF token invalid' });
    }
  } catch {
    return res.status(403).json({ message: 'CSRF token invalid' });
  }

  next();
};

/**
 * Generate a new CSRF token, set it as a cookie, and return it in the body.
 * The frontend calls this once on app load and stores the value in memory.
 */
const issueCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', token, csrfCookieOptions);
  res.json({ csrfToken: token });
};

module.exports = { verifyCsrf, issueCsrfToken, csrfCookieOptions };
