-- Migration 00010: Add date and venue to tournaments

ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS venue TEXT;
