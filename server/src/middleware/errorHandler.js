function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// PostgreSQL error codes translated into friendly HTTP responses
const PG_ERROR_MESSAGES = {
  23505: (err) => `Duplicate value violates unique constraint (${err.constraint || 'unique'}).`,
  23503: (err) => `Referenced record does not exist (${err.constraint || 'foreign key'}).`,
  23514: (err) => `Value violates check constraint (${err.constraint || 'check'}).`,
  '23P01': (err) => err.message || 'Time slot already booked or conflicts with an existing reservation.',
  P0001: (err) => err.message || 'Operation rejected by business rule validation.',
};

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.code && PG_ERROR_MESSAGES[err.code]) {
    const status = err.code === '23P01' ? 409 : 400;
    return res.status(status).json({ error: PG_ERROR_MESSAGES[err.code](err) });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { notFound, errorHandler };
