const crypto = require('crypto');
const BaseGateway = require('./BaseGateway');

/**
 * Sandbox gateway — simulates realistic payment processing without real financial transactions.
 *
 * Test cards:
 *   4242424242424242  → always succeeds
 *   4000000000000002  → always declines
 *   4000000000009995  → insufficient funds
 */
const SANDBOX_CARDS = {
  '4242424242424242': { outcome: 'completed', label: 'Visa (Success)' },
  '4000000000000002': { outcome: 'failed', label: 'Visa (Declined)', error: 'Your card was declined by the issuing bank.' },
  '4000000000009995': { outcome: 'failed', label: 'Visa (Insufficient Funds)', error: 'Insufficient funds on card.' },
};

class SandboxGateway extends BaseGateway {
  async initiate(intent) {
    const gatewayRef = `sandbox_${crypto.randomUUID()}`;
    return {
      gateway_ref: gatewayRef,
      checkout_url: null, // In sandbox, the checkout modal is handled in-app
      status: 'initiated',
    };
  }

  async verify(gatewayRef, cardNumber) {
    // Simulate brief network latency (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cleanCard = (cardNumber || '').replace(/\s+/g, '');
    const card = SANDBOX_CARDS[cleanCard];

    if (!card) {
      return {
        status: 'failed',
        error: 'Invalid test card. Please select one of the sandbox test cards.',
      };
    }

    return {
      status: card.outcome,
      label: card.label,
      error: card.error || null,
    };
  }
}

module.exports = SandboxGateway;
