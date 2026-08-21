-- Migration 00014: Add start_date and duration_days to tournaments

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 1;
