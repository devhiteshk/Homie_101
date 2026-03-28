require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');

const app = express();
app.set('trust proxy', 1);

app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'],
  credentials: true,
}));
app.use(passport.initialize());

// Health check
app.get('/ping', (req, res) => res.json({ status: 'ok', message: 'HOMIE_101 is running' }));

// Mount services
const mountServices = async () => {
  await require('./services/notes')(app);
  await require('./services/csc')(app);
};

mountServices().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`\n🚀 HOMIE_101 running on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to start services:', err);
  process.exit(1);
});
