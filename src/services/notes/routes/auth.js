const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '48h' });

module.exports = (UserModel) => {
  const router = express.Router();

  // POST /api/notes/auth/signup
  router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
      if (await UserModel.findOne({ email })) {
        return res.status(400).json({ message: 'User already exists' });
      }
      const user = await UserModel.create({ firstName, lastName, email, password });
      res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // POST /api/notes/auth/login
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await UserModel.findOne({ email });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      res.json({ token: signToken(user._id) });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // GET /api/notes/auth/google
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  // GET /api/notes/auth/google/callback
  router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/', session: false }),
    (req, res) => {
      const token = signToken(req.user._id);
      res.redirect(`${process.env.NOTES_FRONTEND_URL || 'http://localhost:5173'}?token=${token}`);
    }
  );

  return router;
};
