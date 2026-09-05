const Joi = require('joi');
const { phoneNumber, requiredId, optionalId } = require('../../validations/common');

const queueSchemas = {
  transitionAction: Joi.object({
    action: Joi.string().valid('complete', 'no-show', 'cancel').required().messages({
      'any.only': 'Aksi harus salah satu dari: complete, no-show, cancel.',
      'any.required': 'Field action wajib diisi.',
    }),
  }),
  joinQueue: Joi.object({
    customer_name: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Nama pelanggan wajib diisi.',
    }),
    customer_phone: phoneNumber.required(),
    service_id: requiredId,
    preferred_barber_id: optionalId.optional(),
    notes: Joi.string().trim().max(1000).allow('', null).optional(),
  }),
};

module.exports = { queueSchemas };