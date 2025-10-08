-- Run this in Supabase SQL Editor to remove unwanted containers
-- This will delete the containers and all their items (CASCADE)

DELETE FROM containers WHERE name IN (
  'I110.9 WEST',
  'I110.8 EAST', 
  'I110.7 CENTRAL'
);

