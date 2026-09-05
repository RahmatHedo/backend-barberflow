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
      name: 'Ensure users has is_available column',
      sql: "ALTER TABLE users ADD COLUMN is_available TINYINT(1) NOT NULL DEFAULT 1",
    },
    {
      name: 'Ensure users has avatar_url column',
      sql: "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL",
    },
    {
      name: 'Ensure queue_entries has preferred_barber_id column',
      sql: "ALTER TABLE queue_entries ADD COLUMN preferred_barber_id INT NULL",
    },
    {
      name: 'Ensure queue_entries has lane_type column',
      sql: "ALTER TABLE queue_entries ADD COLUMN lane_type ENUM('request','free') NOT NULL DEFAULT 'free'",
    },
    {
      name: 'Create store_settings table',
      sql: `CREATE TABLE IF NOT EXISTS store_settings (
        id INT NOT NULL DEFAULT 1,
        is_open TINYINT(1) NOT NULL DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT NULL,
        PRIMARY KEY (id)
      )`,
    },
    {
      name: 'Seed store_settings row',
      sql: "INSERT IGNORE INTO store_settings (id, is_open) VALUES (1, 1)",
    },
    {
      name: 'Drop queue_entries.created_at (redundant with check_in_time)',
      sql: 'ALTER TABLE queue_entries DROP COLUMN created_at',
    },
    {
      name: 'Drop queue_entries.position (computed on the fly)',
      sql: 'ALTER TABLE queue_entries DROP COLUMN position',
    },
    {
      name: 'Drop queue_entries.estimated_wait_minutes (computed on the fly)',
      sql: 'ALTER TABLE queue_entries DROP COLUMN estimated_wait_minutes',
    },
    {
      name: 'Tighten queue_logs.action enum (remove unused values)',
      sql: "ALTER TABLE queue_logs MODIFY action ENUM('joined','called','completed','cancelled','no_show') NOT NULL",
    },
    {
      name: 'Index queue_entries on (status, preferred_barber_id)',
      sql: 'ALTER TABLE queue_entries ADD INDEX idx_status_preferred (status, preferred_barber_id)',
    },
  ];

  for (const step of steps) {
    try {
      await connection.execute(step.sql);
      console.log('OK:', step.name);
    } catch (err) {
      // Kolom/tabel sudah tidak ada, atau index/kolom sudah ada = skip aman.
      const skip = [
        'ER_DUP_FIELDNAME',        // kolom sudah ada
        'ER_TABLE_EXISTS_ERROR',   // tabel sudah ada
        'ER_CANT_DROP_FIELD_OR_KEY', // kolom sudah di-drop
        'ER_DUP_KEYNAME',          // index sudah ada
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