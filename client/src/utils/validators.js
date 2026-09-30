/**
 * Client-Side Validation Utilities for MatchFix
 * Validates Email, Bangladeshi Phone Numbers, and Passwords
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const BD_PHONE_REGEX = /^(?:\+?880|880|0)?1[3-9]\d{8}$/;

/**
 * Validates email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates Bangladeshi phone numbers (013-019, 11 digits, with optional +880 or 880 prefix)
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return BD_PHONE_REGEX.test(cleaned);
}

/**
 * Normalizes BD phone to standard 11-digit local format: 01XXXXXXXXX
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return cleaned.replace(/^(?:\+?880|880)/, '0');
}

/**
 * Checks if input is either a valid email or a valid Bangladeshi phone number
 */
export function isValidEmailOrPhone(input) {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  return isValidEmail(trimmed) || isValidPhone(trimmed);
}

/**
 * Validates registration form fields
 * @param {object} form
 * @returns {{ errors: object, isValid: boolean }}
 */
export function validateRegistrationForm(form) {
  const errors = {};

  // 1. Name
  if (!form.name || form.name.trim().length < 2) {
    errors.name = 'Full name is required (at least 2 characters).';
  }

  // 2. Email
  if (!form.email || !form.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Please enter a valid email address (e.g. name@example.com).';
  }

  // 3. Phone
  if (!form.phone || !form.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!isValidPhone(form.phone)) {
    errors.phone = 'Enter a valid Bangladeshi phone number (e.g. 017XXXXXXXX).';
  }

  // 4. Password
  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  // 5. Confirm Password
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required.';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  // 6. Role-specific conditional fields
  if (form.role === 'organizer') {
    if (!form.trade_licence || !form.trade_licence.trim()) {
      errors.trade_licence = 'Trade licence number is required for organizers.';
    }
    if (!form.payout_account || !form.payout_account.trim()) {
      errors.payout_account = 'Payout account details (e.g. bKash or Bank) are required.';
    }
  } else if (form.role === 'seller') {
    if (!form.shop_name || !form.shop_name.trim()) {
      errors.shop_name = 'Shop / merchant name is required for sellers.';
    }
    if (!form.payout_account || !form.payout_account.trim()) {
      errors.payout_account = 'Payout account details (e.g. bKash or Bank) are required.';
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

/**
 * Validates login form fields
 * @param {string} identifier (email or phone)
 * @param {string} password
 * @returns {{ errors: object, isValid: boolean }}
 */
export function validateLoginForm(identifier, password) {
  const errors = {};

  if (!identifier || !identifier.trim()) {
    errors.identifier = 'Email address or phone number is required.';
  } else if (!isValidEmailOrPhone(identifier)) {
    errors.identifier = 'Please enter a valid email address or Bangladeshi phone number.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
