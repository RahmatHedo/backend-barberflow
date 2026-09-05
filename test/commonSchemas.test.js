const { test } = require('node:test');
const assert = require('node:assert');
const { idParamSchema, phoneQuerySchema } = require('../src/validations/common');

test('idParamSchema menerima id angka positif', () => {
  const { error, value } = idParamSchema.validate({ id: 5 });
  assert.equal(error, undefined);
  assert.equal(value.id, 5);
});

test('idParamSchema menolak id non-angka', () => {
  const { error } = idParamSchema.validate({ id: 'abc' });
  assert.ok(error);
});

test('idParamSchema menolak id kurang dari atau sama dengan 0', () => {
  assert.ok(idParamSchema.validate({ id: 0 }).error);
  assert.ok(idParamSchema.validate({ id: -3 }).error);
});

test('phoneQuerySchema menerima nomor telepon valid', () => {
  const { error } = phoneQuerySchema.validate({ phone: '08123456789' });
  assert.equal(error, undefined);
});

test('phoneQuerySchema menolak nomor yang mengandung huruf', () => {
  const { error } = phoneQuerySchema.validate({ phone: '0812abc' });
  assert.ok(error);
});

test('phoneQuerySchema menolak nomor terlalu pendek', () => {
  const { error } = phoneQuerySchema.validate({ phone: '123' });
  assert.ok(error);
});