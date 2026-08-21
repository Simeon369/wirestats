-- Migration 00015: Add match_day and match_time to games

ALTER TABLE games
ADD COLUMN IF NOT EXISTS match_day TEXT,
ADD COLUMN IF NOT EXISTS match_time TEXT;
