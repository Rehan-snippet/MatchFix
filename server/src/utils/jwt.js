const jwt = require('jsonwebtoken');

function getSecret() {
  return process.env.JWT_SECRET || 'matchfix-super-secret-key-change-in-production';
}

function sign(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verify(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { sign, verify, getSecret };
