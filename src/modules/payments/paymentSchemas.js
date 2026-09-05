const Joi = require('joi');

const paymentMethods = ['cash', 'qris', 'e_wallet', 'bank_transfer', 'card'];

const paymentSchemas = {
  create: Joi.object({
    queue_entry_id: Joi.number().integer().positive().required().messages({
      'number.base': 'ID antrean harus berupa angka.',
      'any.required': 'ID antrean wajib diisi.',
    }),
    amount: Joi.number().positive().precision(2).required().messages({
      'number.base': 'Nominal harus berupa angka.',
      'number.positive': 'Nominal harus lebih dari 0.',
      'any.required': 'Nominal wajib diisi.',
    }),
    method: Joi.string().valid(...paymentMethods).default('cash').messages({
      'any.only': `Metode bayar harus salah satu dari: ${paymentMethods.join(', ')}.`,
    }),
    notes: Joi.string().trim().max(500).allow('', null).optional(),
  }),

  listFilters: Joi.object({
    method: Joi.string().valid(...paymentMethods).optional(),
    status: Joi.string().valid('pending', 'paid', 'refunded').optional(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    limit: Joi.number().integer().min(1).max(1000).optional(),
  }),

  settle: Joi.object({
    method: Joi.string().valid(...paymentMethods).optional(),
    amount: Joi.number().positive().precision(2).optional(),
  }).min(1).messages({
    'object.min': 'Minimal isi satu field: method atau amount.',
  }),
};

module.exports = paymentSchemas;