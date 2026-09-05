-- ============================================================
-- SEED: 3 Barber untuk Hair Connect / Barberflow
-- Password default semua barber: barber123
-- Hash bcrypt (10 rounds) dari "barber123":
--   $2b$10$ip59bMgXFq500jIeOZ2hE.nqEdoWerKokCUGuBFmkCNHJ/pYNaLXe
-- ============================================================

-- Pastikan tidak double-insert jika seed dijalankan ulang
INSERT INTO users (name, email, password_hash, role, phone, is_active, is_available)
VALUES
  (
    'Agus Santoso',
    'agus@barberflow.id',
    '$2b$10$ip59bMgXFq500jIeOZ2hE.nqEdoWerKokCUGuBFmkCNHJ/pYNaLXe',
    'barber',
    '081234560001',
    TRUE,
    TRUE
  ),
  (
    'Budi Prasetyo',
    'budi@barberflow.id',
    '$2b$10$ip59bMgXFq500jIeOZ2hE.nqEdoWerKokCUGuBFmkCNHJ/pYNaLXe',
    'barber',
    '081234560002',
    TRUE,
    TRUE
  ),
  (
    'Chandra Wijaya',
    'chandra@barberflow.id',
    '$2b$10$ip59bMgXFq500jIeOZ2hE.nqEdoWerKokCUGuBFmkCNHJ/pYNaLXe',
    'barber',
    '081234560003',
    TRUE,
    TRUE
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  is_active = VALUES(is_active),
  is_available = VALUES(is_available);

-- Verifikasi hasil
SELECT id, name, email, role, is_active, is_available FROM users WHERE role = 'barber';
