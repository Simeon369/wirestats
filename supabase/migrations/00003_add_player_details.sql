-- Migration 00003: Add player details to stat_events

ALTER TABLE public.stat_events
ADD COLUMN IF NOT EXISTS player_name TEXT,
ADD COLUMN IF NOT EXISTS player_number TEXT,
ADD COLUMN IF NOT EXISTS player_out_name TEXT,
ADD COLUMN IF NOT EXISTS player_out_number TEXT;
