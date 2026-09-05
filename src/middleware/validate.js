const { AppError } = require('./errorHandler');

/**
 * Express middleware untuk memvalidasi input request dengan Joi.
 *
 * @param {object} schema - Joi validation schema
 * @param {'body'|'params'|'query'} [property='body'] - Bagian request yang divalidasi
 * @returns {Function} Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return next(new AppError(messages.join('; '), 400));
    }

    // Ganti nilai request dengan hasil yang sudah dibersihkan
    req[property] = value;
    next();
  };
};

module.exports = validate;