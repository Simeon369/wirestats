-- Migration 00013: Tournament Enhancements

-- Add has_third_place and category to tournaments
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS has_third_place BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add game_number and is_third_place to games
ALTER TABLE games
ADD COLUMN IF NOT EXISTS game_number INT,
ADD COLUMN IF NOT EXISTS is_third_place BOOLEAN DEFAULT FALSE;
