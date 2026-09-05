const Joi = require('joi');

const phoneNumber = Joi.string()
  .trim()
  .min(6)
  .max(20)
  .pattern(/^[0-9+\-\s]+$/)
  .messages({
    'string.pattern.base': 'Nomor telepon hanya boleh angka, tanda +, -, dan spasi.',
  });

const requiredId = Joi.number().integer().positive().required().messages({
  'number.base': 'ID harus berupa angka.',
  'number.integer': 'ID harus bilangan bulat.',
  'number.positive': 'ID harus lebih dari 0.',
});

const optionalId = Joi.number().integer().positive().allow(null).messages({
  'number.base': 'ID harus berupa angka.',
  'number.integer': 'ID harus bilangan bulat.',
  'number.positive': 'ID harus lebih dari 0.',
});

// Parameter path (mis. /api/queue/:id)
const idParamSchema = Joi.object({ id: requiredId });

// Query untuk cek antrean milik pelanggan (GET /api/queue/check)
const phoneQuerySchema = Joi.object({ phone: phoneNumber.required() });

module.exports = {
  phoneNumber,
  requiredId,
  optionalId,
  idParamSchema,
  phoneQuerySchema,
};