const Joi = require('joi');

const serviceSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(150).required().messages({
      'string.empty': 'Nama layanan wajib diisi.',
    }),
    description: Joi.string().trim().max(1000).allow('', null).optional(),
    duration_minutes: Joi.number().integer().positive().required().messages({
      'number.base': 'Durasi harus berupa angka.',
      'number.positive': 'Durasi harus lebih dari 0.',
    }),
    price: Joi.number().min(0).required().messages({
      'number.base': 'Harga harus berupa angka.',
      'number.min': 'Harga tidak boleh negatif.',
    }),
    display_order: Joi.number().integer().min(0).optional(),
  }),
  update: Joi.object({
    name: Joi.string().trim().min(1).max(150).optional(),
    description: Joi.string().trim().max(1000).allow('', null).optional(),
    duration_minutes: Joi.number().integer().positive().optional(),
    price: Joi.number().min(0).optional(),
    is_active: Joi.boolean().optional(),
    display_order: Joi.number().integer().min(0).optional(),
  }).min(1).messages({
    'object.min': 'Minimal satu field harus diisi untuk update.',
  }),
};

module.exports = { serviceSchemas };