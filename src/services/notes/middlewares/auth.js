const jwt = require('jsonwebtoken');

const protect = (UserModel) => async (req, res, next) => {
  // Read token exclusively from HttpOnly cookie — never from Authorization header.
  // This prevents XSS attacks from stealing the token via JS.
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no session cookie' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id).select('-password -googleId -githubId');
    if (!user) return res.status(401).json({ message: 'Not authorized — user not found' });
    req.user = user;
    next();
  } catch (err) {
    // Token expired or tampered — clear the stale cookie
    res.clearCookie('auth_token', { path: '/' });
    return res.status(401).json({ message: 'Not authorized — session expired' });
  }
};

module.exports = protect;
