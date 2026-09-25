/**
 * Extracts pagination parameters from Express query string.
 * Defaults: page=1, page_size=12 (matches 2/3/4-col card grids), max 100.
 */
function parsePagination(query, defaultPageSize = 12) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.page_size, 10) || defaultPageSize));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

/**
 * Formats data and pagination metadata into a standard envelope.
 */
function paginatedResponse(rows, total, page, pageSize) {
  const totalNum = parseInt(total, 10) || 0;
  return {
    data: rows,
    pagination: {
      total: totalNum,
      page,
      page_size: pageSize,
      total_pages: Math.max(1, Math.ceil(totalNum / pageSize)),
      has_next: page * pageSize < totalNum,
      has_prev: page > 1,
    },
  };
}

module.exports = { parsePagination, paginatedResponse };
