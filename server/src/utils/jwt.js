const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'matchfix-default-jwt-secret-key-32chars!';

function sign(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verify(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { sign, verify };
