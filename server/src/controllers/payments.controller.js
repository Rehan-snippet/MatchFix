const db = require('../config/db');
const { getGateway } = require('../gateways');

/**
 * Step 1: POST /api/payments/initiate
 * Creates a payment intent and returns intent_id + gateway_ref.
 * Validates ownership and state before intent creation.
 */
async function initiatePayment(req, res) {
  const { booking_id, order_id, amount, method, purpose } = req.body;

  if ((!booking_id && !order_id) || (booking_id && order_id)) {
    return res.status(400).json({ error: 'Must provide either booking_id OR order_id, not both.' });
  }
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
  }

  const numAmount = Number(amount);
  const numBookingId = booking_id ? Number(booking_id) : null;
  const numOrderId = order_id ? Number(order_id) : null;
  const intentPurpose = purpose === 'advance' ? 'advance' : 'full';

  try {
    // Validate target ownership & status
    if (numBookingId) {
      const bRes = await db.query(
        'SELECT customer_id, total_amount, status FROM bookings WHERE booking_id = $1',
        [numBookingId]
      );
      if (!bRes.rows.length) return res.status(404).json({ error: 'Booking not found.' });
      const b = bRes.rows[0];
      if (b.customer_id !== req.user.user_id) return res.status(403).json({ error: 'Unauthorized.' });
      if (b.status === 'confirmed') return res.status(400).json({ error: 'Booking is already paid and confirmed.' });
      if (b.status === 'advance_paid') return res.status(400).json({ error: 'Advance payment already settled for this booking.' });
      if (b.status === 'cancelled') return res.status(400).json({ error: 'Cannot pay for a cancelled booking.' });
      if (intentPurpose === 'advance' && numAmount >= Number(b.total_amount)) {
        return res.status(400).json({ error: 'Advance amount must be less than total booking amount.' });
      }
      if (intentPurpose === 'full' && numAmount < Number(b.total_amount)) {
        return res.status(400).json({ error: 'Full payment amount must cover the total booking amount.' });
      }
    }

    if (numOrderId) {
      const oRes = await db.query(
        'SELECT customer_id, total_amount, status FROM orders WHERE order_id = $1',
        [numOrderId]
      );
      if (!oRes.rows.length) return res.status(404).json({ error: 'Order not found.' });
      const o = oRes.rows[0];
      if (o.customer_id !== req.user.user_id) return res.status(403).json({ error: 'Unauthorized.' });
      if (o.status === 'cancelled') return res.status(400).json({ error: 'Cannot pay for a cancelled order.' });
      if (o.status === 'advance_paid') return res.status(400).json({ error: 'Advance payment already settled for this order.' });
      // Check if already paid
      const pRes = await db.query(
        "SELECT payment_id FROM payments WHERE order_id = $1 AND status = 'completed' AND purpose = 'full'",
        [numOrderId]
      );
      if (pRes.rows.length) return res.status(400).json({ error: 'Order is already settled.' });
      if (intentPurpose === 'advance' && numAmount >= Number(o.total_amount)) {
        return res.status(400).json({ error: 'Advance amount must be less than total order amount.' });
      }
      if (intentPurpose === 'full' && numAmount < Number(o.total_amount)) {
        return res.status(400).json({ error: 'Full payment amount must cover the total order amount.' });
      }
    }

    const gateway = getGateway();
    const intentData = {
      user_id: req.user.user_id,
      booking_id: numBookingId,
      order_id: numOrderId,
      amount: numAmount,
      currency: 'BDT',
      method: method || 'sandbox_card',
      purpose: intentPurpose,
    };

    const { gateway_ref, checkout_url, status } = await gateway.initiate(intentData);

    const { rows } = await db.query(
      `INSERT INTO payment_intents
        (user_id, booking_id, order_id, amount, currency, method, gateway, gateway_ref, checkout_url, status, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'initiated', $10)
       RETURNING intent_id, gateway_ref, checkout_url, expires_at, purpose`,
      [
        intentData.user_id,
        intentData.booking_id,
        intentData.order_id,
        intentData.amount,
        intentData.currency,
        intentData.method,
        process.env.PAYMENT_GATEWAY || 'sandbox',
        gateway_ref,
        checkout_url,
        intentPurpose,
      ]
    );

    return res.status(201).json({
      intent_id: rows[0].intent_id,
      gateway_ref: rows[0].gateway_ref,
      checkout_url: rows[0].checkout_url,
      expires_at: rows[0].expires_at,
      purpose: rows[0].purpose,
      message: intentPurpose === 'advance'
        ? 'Advance payment intent created. Complete payment to secure booking/order.'
        : 'Payment intent created. Complete sandbox payment to confirm.',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Step 2: POST /api/payments/confirm (Sandbox simulation)
 * Verifies sandbox test card and invokes stored procedure to atomically finalize payment.
 */
async function confirmSandboxPayment(req, res) {
  const { intent_id, card_number } = req.body;

  if (!intent_id || !card_number) {
    return res.status(400).json({ error: 'intent_id and card_number are required.' });
  }

  try {
    const { rows } = await db.query(
      'SELECT * FROM payment_intents WHERE intent_id = $1 AND user_id = $2',
      [intent_id, req.user.user_id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Payment intent not found.' });
    const intent = rows[0];

    if (intent.status === 'completed') {
      return res.status(400).json({ error: 'This payment intent has already been completed.' });
    }

    if (new Date() > new Date(intent.expires_at)) {
      await db.query(`UPDATE payment_intents SET status = 'expired' WHERE intent_id = $1`, [intent_id]);
      return res.status(400).json({ error: 'Payment session has expired. Please initiate payment again.' });
    }

    // Set processing
    await db.query(
      `UPDATE payment_intents SET status = 'processing', sandbox_card = $1 WHERE intent_id = $2`,
      [card_number.replace(/\s+/g, '').slice(-4), intent_id]
    );

    const gateway = getGateway();
    const result = await gateway.verify(intent.gateway_ref, card_number);

    if (result.status === 'completed') {
      let paymentId = null;
      await db.withTransaction(async (client) => {
        const spResult = await client.query(
          'CALL sp_record_payment($1, $2, $3, $4, $5, $6, NULL)',
          [
            req.user.user_id,
            intent.booking_id ? Number(intent.booking_id) : null,
            intent.order_id ? Number(intent.order_id) : null,
            Number(intent.amount),
            intent.method || 'card',
            intent.purpose || 'full',
          ]
        );
        paymentId = spResult.rows[0]?.p_payment_id;

        await client.query(
          `UPDATE payment_intents
           SET status = 'completed', settled_at = NOW(), error_message = NULL
           WHERE intent_id = $1`,
          [intent_id]
        );
      });

      const isAdvance = intent.purpose === 'advance';

      return res.json({
        success: true,
        status: 'completed',
        payment_id: paymentId,
        is_advance: isAdvance,
        message: isAdvance
          ? '🎉 Advance payment successful! The remaining cash balance can be settled at the venue or upon delivery.'
          : '🎉 Payment successful! Transaction has settled and booking/order is confirmed.',
      });
    } else {
      await db.query(
        `UPDATE payment_intents SET status = 'failed', error_message = $1 WHERE intent_id = $2`,
        [result.error || 'Payment failed', intent_id]
      );
      return res.status(402).json({
        status: 'failed',
        error: result.error || 'Card was declined. Please try another card.',
      });
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * Webhook handler for external production gateways (Stripe, SSLCommerz).
 */
async function handleWebhook(req, res) {
  const gateway = process.env.PAYMENT_GATEWAY || 'sandbox';
  if (gateway === 'sandbox') {
    return res.status(400).json({ error: 'Webhooks are not used in sandbox mode.' });
  }
  return res.status(501).json({ error: 'Production webhook not implemented for this gateway.' });
}

/**
 * Legacy / Direct payment fallback
 * POST /api/payments
 */
async function createPayment(req, res) {
  const { booking_id, order_id, amount, method, purpose } = req.body;

  if (!booking_id && !order_id) {
    return res.status(400).json({ error: 'Must provide either booking_id OR order_id.' });
  }
  if (booking_id && order_id) {
    return res.status(400).json({ error: 'Payment cannot settle both booking and order at the same time.' });
  }
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
  }

  try {
    const payment = await db.withTransaction(async (client) => {
      const result = await client.query(
        'CALL sp_record_payment($1, $2, $3, $4, $5, $6, NULL)',
        [
          req.user.user_id,
          booking_id ? Number(booking_id) : null,
          order_id ? Number(order_id) : null,
          Number(amount),
          method || 'card',
          purpose || 'full',
        ]
      );

      return {
        payment_id: result.rows[0]?.p_payment_id,
        status: 'completed',
      };
    });

    return res.status(201).json({
      ...payment,
      message: 'Payment verified and settled successfully.',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/payments
 */
async function listPayments(req, res) {
  const { booking_id, order_id } = req.query;

  try {
    let queryText = `
      SELECT p.*
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.booking_id
      LEFT JOIN orders o ON p.order_id = o.order_id
      WHERE (b.customer_id = $1 OR o.customer_id = $1)
    `;
    const params = [req.user.user_id];

    if (booking_id) {
      params.push(booking_id);
      queryText += ` AND p.booking_id = $${params.length}`;
    }
    if (order_id) {
      params.push(order_id);
      queryText += ` AND p.order_id = $${params.length}`;
    }

    queryText += ` ORDER BY p.created_at DESC`;

    const { rows } = await db.query(queryText, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  initiatePayment,
  confirmSandboxPayment,
  handleWebhook,
  createPayment,
  listPayments,
};