const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matchfix',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

/**
 * Standard query helper for single statements (e.g., SELECT queries).
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === 'true') {
    console.log('Query executed', { text, duration, rowCount: res.rowCount });
  }
  return res;
}

/**
 * Check out a client from the pool.
 */
function getClient() {
  return pool.connect();
}

/**
 * Executes a callback within an explicit SQL transaction.
 * Automatically issues BEGIN, commits on return, rolls back on exception,
 * and releases the checked-out client back to the pool.
 *
 * @param {Function} callback - async (client) => any
 * @returns {Promise<any>}
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Failed to rollback transaction:', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
};