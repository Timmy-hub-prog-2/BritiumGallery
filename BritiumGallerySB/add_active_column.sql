-- SQL script to add active column to existing discount_rule records
-- Run this script if you have existing discount rules in your database

-- Add the active column with default value true
ALTER TABLE discount_rule ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

-- Update any existing records to have active = true
UPDATE discount_rule SET active = TRUE WHERE active IS NULL; 