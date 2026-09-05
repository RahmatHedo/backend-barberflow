require('dotenv').config();
const mysql = require('mysql2/promise');

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hair_connect',
  });

  console.log('Connected to:', process.env.DB_NAME);

  const steps = [
    {
      name: 'Create payments table',
      sql: `CREATE TABLE IF NOT EXISTS payments (
        id INT NOT NULL AUTO_INCREMENT,
        queue_entry_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        method ENUM('cash','qris','e_wallet','bank_transfer','card') NOT NULL DEFAULT 'cash',
        status ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP NULL,
        PRIMARY KEY (id),
        KEY idx_queue_entry (queue_entry_id),
        KEY idx_status (status),
        KEY idx_created_at (created_at),
        CONSTRAINT fk_payment_queue_entry
          FOREIGN KEY (queue_entry_id) REFERENCES queue_entries(id)
          ON DELETE CASCADE
      )`,
    },
  ];

  for (const step of steps) {
    try {
      await connection.execute(step.sql);
      console.log('OK:', step.name);
    } catch (err) {
      const skip = [
        'ER_TABLE_EXISTS_ERROR',
        'ER_DUP_FIELDNAME',
        'ER_DUP_KEYNAME',
      ];
      if (skip.includes(err.code)) {
        console.log('SKIP:', step.name, `(${err.code})`);
      } else {
        console.error('FAIL:', step.name, '-', err.message);
      }
    }
  }

  await connection.end();
  console.log('\nDone.');
};

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
