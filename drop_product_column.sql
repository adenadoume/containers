-- Migration: Remove 'product' column from container_items table
-- This aligns the Vercel database schema with the localhost schema
-- 
-- Run this in your Vercel Supabase dashboard:
-- 1. Go to your Supabase project dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Paste this SQL and click "Run"

-- Drop the product column if it exists
ALTER TABLE container_items 
DROP COLUMN IF EXISTS product;

-- Verify the column was removed
-- You can run this query after to confirm:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'container_items'
-- ORDER BY ordinal_position;

