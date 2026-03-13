import pool from './db.js'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  deadline DATE,
  price BIGINT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  time VARCHAR(20),
  cost BIGINT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS income_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  received_date DATE DEFAULT CURRENT_DATE,
  amount BIGINT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`

async function migrate() {
    console.log('🔄 Running migration...')
    try {
        await pool.query(SCHEMA)
        console.log('✅ Migration complete — 3 tables ready')
    } catch (err) {
        console.error('❌ Migration failed:', err)
    } finally {
        await pool.end()
    }
}

migrate()
