// Small helper so controllers can `throw new ApiError(404, 'Turf not found')`
// and have it turned into the right HTTP response by errorHandler.js
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = ApiError;
