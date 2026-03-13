-- Migration: Add user_id to all tables + Enable RLS
-- Run this in Supabase SQL Editor

-- 1. Add user_id column to all tables (nullable first for existing data)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE income_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON daily_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_income_records_user_id ON income_records(user_id);
CREATE INDEX IF NOT EXISTS idx_checklists_user_id ON checklists(user_id);

-- 3. Enable Row Level Security on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any (safe to run)
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view own daily_tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can insert own daily_tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can update own daily_tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can delete own daily_tasks" ON daily_tasks;

DROP POLICY IF EXISTS "Users can view own income_records" ON income_records;
DROP POLICY IF EXISTS "Users can insert own income_records" ON income_records;
DROP POLICY IF EXISTS "Users can update own income_records" ON income_records;
DROP POLICY IF EXISTS "Users can delete own income_records" ON income_records;

DROP POLICY IF EXISTS "Users can view own checklists" ON checklists;
DROP POLICY IF EXISTS "Users can insert own checklists" ON checklists;
DROP POLICY IF EXISTS "Users can update own checklists" ON checklists;
DROP POLICY IF EXISTS "Users can delete own checklists" ON checklists;

-- 5. Create RLS Policies — tasks
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS Policies — daily_tasks
CREATE POLICY "Users can view own daily_tasks" ON daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily_tasks" ON daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily_tasks" ON daily_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily_tasks" ON daily_tasks FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS Policies — income_records
CREATE POLICY "Users can view own income_records" ON income_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income_records" ON income_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income_records" ON income_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income_records" ON income_records FOR DELETE USING (auth.uid() = user_id);

-- 8. Create RLS Policies — checklists
CREATE POLICY "Users can view own checklists" ON checklists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checklists" ON checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checklists" ON checklists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checklists" ON checklists FOR DELETE USING (auth.uid() = user_id);

-- 9. (Optional) Assign existing data to a specific user
-- Replace 'YOUR_USER_UUID_HERE' with your actual user ID from auth.users
-- You can find it in Supabase Dashboard > Authentication > Users
-- UPDATE tasks SET user_id = 'YOUR_USER_UUID_HERE' WHERE user_id IS NULL;
-- UPDATE daily_tasks SET user_id = 'YOUR_USER_UUID_HERE' WHERE user_id IS NULL;
-- UPDATE income_records SET user_id = 'YOUR_USER_UUID_HERE' WHERE user_id IS NULL;
-- UPDATE checklists SET user_id = 'YOUR_USER_UUID_HERE' WHERE user_id IS NULL;
