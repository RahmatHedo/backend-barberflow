const { test } = require('node:test');
const assert = require('node:assert');
const { idParamSchema, phoneQuerySchema } = require('../src/validations/common');
const { authSchemas } = require('../src/modules/auth/authSchemas');
const { queueSchemas } = require('../src/modules/queue/queueSchemas');

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

test('authSchemas.login menerima email dan password valid', () => {
  const { error } = authSchemas.login.validate({ email: 'admin@hairconnect.id', password: 'admin123' });
  assert.equal(error, undefined);
});

test('authSchemas.login menolak email tidak valid', () => {
  const { error } = authSchemas.login.validate({ email: 'bukan-email', password: 'admin123' });
  assert.ok(error);
});

test('authSchemas.login menolak password kosong', () => {
  const { error } = authSchemas.login.validate({ email: 'admin@hairconnect.id', password: '' });
  assert.ok(error);
});

test('queueSchemas.joinQueue menerima payload lengkap', () => {
  const { error } = queueSchemas.joinQueue.validate({
    customer_name: 'Budi',
    customer_phone: '08123456789',
    service_id: 1,
  });
  assert.equal(error, undefined);
});

test('queueSchemas.joinQueue menolak service_id non-angka', () => {
  const { error } = queueSchemas.joinQueue.validate({
    customer_name: 'Budi',
    customer_phone: '08123456789',
    service_id: 'x',
  });
  assert.ok(error);
});

test('queueSchemas.transitionAction hanya menerima aksi valid', () => {
  assert.equal(queueSchemas.transitionAction.validate({ action: 'complete' }).error, undefined);
  assert.equal(queueSchemas.transitionAction.validate({ action: 'no-show' }).error, undefined);
  assert.ok(queueSchemas.transitionAction.validate({ action: 'hapus' }).error);
});