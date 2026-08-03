const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { connectDB } = require('../../config/db');
const registerModels = require('./models');
const configurePassport = require('./config/passport');
const protect = require('./middlewares/auth');
const { verifyCsrf } = require('./middlewares/csrf');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const fileRoutes = require('./routes/file');
const gptRoutes = require('./routes/gpt');

// Rate limiter: 100 requests per 15 min for general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

module.exports = async (app) => {
  const conn = await connectDB('notes', process.env.NOTES_MONGO_URI);
  const { User, Project, File } = registerModels(conn);

  configurePassport(passport, User);

  const protectMiddleware = protect(User);
  const router = express.Router();

  // Security headers
  router.use(helmet());

  // Rate limiting
  router.use('/auth', authLimiter);
  router.use(apiLimiter);

  // CSRF validation on all state-mutating requests
  router.use(verifyCsrf);

  // Routes
  router.use('/auth', authRoutes(protectMiddleware));
  router.use('/', projectRoutes(Project, File, protectMiddleware));
  router.use('/', fileRoutes(File, Project, protectMiddleware));
  router.use('/', gptRoutes(protectMiddleware));

  app.use('/api/notes', router);
  console.log('[Service] Notes mounted at /api/notes');
};
