const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('../../config/db');
const registerModels = require('./models');
const configurePassport = require('./config/passport');
const protect = require('./middlewares/auth');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const fileRoutes = require('./routes/file');
const gptRoutes = require('./routes/gpt');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

module.exports = async (app) => {
  const conn = await connectDB('notes', process.env.NOTES_MONGO_URI);
  const { User, Project, File } = registerModels(conn);

  configurePassport(passport, User);

  const protectMiddleware = protect(User);
  const router = express.Router();

  router.use(limiter);
  router.use('/auth', authRoutes(User));
  router.use('/', projectRoutes(Project, File, protectMiddleware));
  router.use('/', fileRoutes(File, Project, protectMiddleware));
  router.use('/', gptRoutes(protectMiddleware));

  app.use('/api/notes', router);
  console.log('[Service] Notes mounted at /api/notes');
};
