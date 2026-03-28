const express = require('express');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('../../config/db');
const registerModels = require('./models');
const searchRoutes = require('./routes/search');
const countryRoutes = require('./routes/countries');
const cityRoutes = require('./routes/cities');

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7', // sends combined `RateLimit` header (RFC-compliant)
  legacyHeaders: false,        // disables deprecated X-RateLimit-* headers
  message: { success: false, message: 'Too many requests, please try again after an hour.' },
});

module.exports = async (app) => {
  const conn = await connectDB('csc', process.env.CSC_MONGO_URI);
  const { CountryCityState } = registerModels(conn);

  const router = express.Router();
  router.use(limiter);
  router.use('/', searchRoutes(CountryCityState));
  router.use('/', countryRoutes(CountryCityState));
  router.use('/', cityRoutes(CountryCityState));

  app.use('/api/csc', router);
  console.log('[Service] CSC mounted at /api/csc');
};
