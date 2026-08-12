function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// PostgreSQL error codes we want to translate into friendly HTTP responses
// instead of leaking raw 500s. Extend this as you hit new cases.
const PG_ERROR_MESSAGES = {
  23505: (err) => `Duplicate value violates a unique constraint (${err.constraint || 'unique'}).`,
  23503: (err) => `Referenced record does not exist (${err.constraint || 'foreign key'}).`,
  23514: (err) => `Value violates a check constraint (${err.constraint || 'check'}).`,
};

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.code && PG_ERROR_MESSAGES[err.code]) {
    return res.status(400).json({ error: PG_ERROR_MESSAGES[err.code](err) });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { notFound, errorHandler };
