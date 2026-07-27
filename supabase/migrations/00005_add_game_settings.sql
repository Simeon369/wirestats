-- Migration 00005: Add game settings to games table

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS game_time_minutes INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS periods TEXT NOT NULL DEFAULT '4 quarters',
ADD COLUMN IF NOT EXISTS total_periods INTEGER NOT NULL DEFAULT 4;
