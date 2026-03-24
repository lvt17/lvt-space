import pool from './db.js'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS personal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  token_prefix VARCHAR(8) NOT NULL,
  token_hash TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{"read","write"}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_tokens_user ON personal_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_tokens_hash ON personal_tokens(token_hash);
`

async function migrate() {
    console.log('🔄 Running PAT migration...')
    try {
        await pool.query(SCHEMA)
        console.log('✅ PAT migration complete — personal_tokens table ready')
    } catch (err) {
        console.error('❌ PAT migration failed:', err)
    } finally {
        await pool.end()
    }
}

migrate()
