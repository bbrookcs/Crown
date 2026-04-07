// Migration: Add event_location and categories columns to events table
// Run: node scripts/migrate_add_columns.js

import 'dotenv/config';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL });

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Running migration...');

    const migrations = [
      {
        desc: 'Add event_location column',
        col:  'event_location',
        sql:  `ALTER TABLE events ADD COLUMN event_location VARCHAR(255) DEFAULT NULL AFTER event_date`
      },
      {
        desc: 'Add categories column',
        col:  'categories',
        sql:  `ALTER TABLE events ADD COLUMN categories TEXT DEFAULT NULL AFTER event_location`
      }
    ];

    for (const m of migrations) {
      // Check if column already exists
      const [rows] = await conn.execute(
        `SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_NAME='events' AND COLUMN_NAME=? AND TABLE_SCHEMA=DATABASE()`,
        [m.col]
      );
      if (rows[0].c > 0) {
        console.log(`  ⏭️  ${m.desc} (already exists)`);
      } else {
        await conn.execute(m.sql);
        console.log(`  ✅ ${m.desc}`);
      }
    }

    console.log('\n✅ Migration complete!');
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch(err => { console.error('❌ Migration failed:', err); process.exit(1); });
