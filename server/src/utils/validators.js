/**
 * MatchFix Validation Utilities
 * Validates email, Bangladeshi phone numbers, and passwords
 */

// Standard RFC-compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Bangladeshi phone regex: supports 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX with optional separators
const BD_PHONE_REGEX = /^(?:\+?880|880|0)?1[3-9]\d{8}$/;

/**
 * Validates if the string is a properly formatted email
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 150) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validates if the string is a valid Bangladeshi phone number
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return BD_PHONE_REGEX.test(cleaned);
}

/**
 * Normalizes any valid BD phone number to standard 11-digit local format: 01XXXXXXXXX
 * @param {string} phone
 * @returns {string}
 */
function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return cleaned.replace(/^(?:\+?880|880)/, '0');
}

/**
 * Validates password meets minimum security requirements (at least 6 characters, max 128)
 * @param {string} password
 * @returns {boolean}
 */
function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 128;
}

module.exports = {
  isValidEmail,
  isValidPhone,
  normalizePhone,
  isValidPassword,
  EMAIL_REGEX,
  BD_PHONE_REGEX,
};
