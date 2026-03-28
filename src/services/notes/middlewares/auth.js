const jwt = require('jsonwebtoken');

const protect = (UserModel) => async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await UserModel.findById(decoded.id).select('-password');
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized' });
  }
};

module.exports = protect;
