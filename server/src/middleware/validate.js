/**
 * Request validation middleware using Zod schemas.
 *
 * Usage: router.post('/route', validate({ body: mySchema }), controller)
 *
 * - Failure in `params` → AppError('INVALID_REQUEST') (malformed IDs)
 * - Failure in `body` or `query` → passes the ZodError to next() so
 *   errorHandler converts it to VALIDATION_ERROR with field details.
 */
const AppError = require('../utils/AppError');

/**
 * @param {{ body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema }} schemas
 * @returns {import('express').RequestHandler}
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      // Validate params first
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          return next(new AppError('INVALID_REQUEST'));
        }
        req.params = result.data;
      }

      // Validate query
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          return next(result.error); // ZodError → VALIDATION_ERROR
        }
        req.query = result.data;
      }

      // Validate body
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          return next(result.error); // ZodError → VALIDATION_ERROR
        }
        req.body = result.data;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = validate;
