/**
 * Abstract payment gateway interface.
 * All gateways must implement these methods.
 */
class BaseGateway {
  /**
   * Initiate a payment intent.
   * @param {object} intent - { user_id, booking_id, order_id, amount, currency, method }
   * @returns {Promise<{ gateway_ref: string, checkout_url: string|null, status: string }>}
   */
  async initiate(intent) {
    throw new Error('initiate() must be implemented by gateway adapter');
  }

  /**
   * Verify a payment using gateway's reference.
   * @param {string} gatewayRef - Gateway's transaction ID
   * @param {string} [cardNumber] - Optional card number for sandbox simulation
   * @returns {Promise<{ status: 'completed'|'failed'|'pending', label?: string, error?: string }>}
   */
  async verify(gatewayRef, cardNumber) {
    throw new Error('verify() must be implemented by gateway adapter');
  }
}

module.exports = BaseGateway;
