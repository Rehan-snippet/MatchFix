const SandboxGateway = require('./SandboxGateway');

/**
 * Returns the active payment gateway adapter based on PAYMENT_GATEWAY env var.
 * Swapping to a real gateway in production = set PAYMENT_GATEWAY=stripe / sslcommerz
 * and implement StripeGateway / SSLCommerzGateway.
 */
function getGateway() {
  const gw = process.env.PAYMENT_GATEWAY || 'sandbox';
  switch (gw.toLowerCase()) {
    case 'sandbox':
      return new SandboxGateway();
    default:
      return new SandboxGateway();
  }
}

module.exports = { getGateway };
