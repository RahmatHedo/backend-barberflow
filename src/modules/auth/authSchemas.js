const Joi = require('joi');

const authSchemas = {
  login: Joi.object({
    email: Joi.string().trim().email().max(150).required().messages({
      'string.empty': 'Email wajib diisi.',
      'string.email': 'Format email tidak valid.',
    }),
    password: Joi.string().min(1).max(255).required().messages({
      'string.empty': 'Password wajib diisi.',
    }),
  }),
};

module.exports = { authSchemas };