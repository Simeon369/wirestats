-- Migration 00006: Add scheduled status and start time

ALTER TABLE public.games
DROP CONSTRAINT IF EXISTS games_status_check;

ALTER TABLE public.games
ADD CONSTRAINT games_status_check CHECK (status IN ('scheduled', 'active', 'finished'));

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
