import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Adding paid_at column to tasks...');
    await pool.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
    `);
    
    console.log('Backfilling paid_at for existing paid tasks...');
    await pool.query(`
      UPDATE tasks SET paid_at = updated_at 
      WHERE is_paid = true AND paid_at IS NULL;
    `);
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
