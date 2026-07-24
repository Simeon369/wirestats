-- Migration 00002: Expanded Schema for advanced game tracking

-- 1. Expand games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS team_a_name TEXT NOT NULL DEFAULT 'Team A',
ADD COLUMN IF NOT EXISTS team_b_name TEXT NOT NULL DEFAULT 'Team B',
ADD COLUMN IF NOT EXISTS team_a_color TEXT NOT NULL DEFAULT '#ff0000',
ADD COLUMN IF NOT EXISTS team_b_color TEXT NOT NULL DEFAULT '#0000ff',
ADD COLUMN IF NOT EXISTS score_a INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_b INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS period INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS clock_seconds INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_running BOOLEAN NOT NULL DEFAULT false;

-- 2. Expand stat_events table
-- Allow 'sub' as an event type
ALTER TABLE public.stat_events
DROP CONSTRAINT IF EXISTS stat_events_event_type_check;

ALTER TABLE public.stat_events
ADD CONSTRAINT stat_events_event_type_check 
CHECK (event_type IN ('ft', '2pt', '3pt', 'foul', 'toggle_status', 'sub'));

-- Add points to stat_events to easily track event value
ALTER TABLE public.stat_events
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- Add player_out_id to track substitution targets
ALTER TABLE public.stat_events
ADD COLUMN IF NOT EXISTS player_out_id UUID REFERENCES public.players(id) ON DELETE SET NULL;

-- Add period to stat_events
ALTER TABLE public.stat_events
ADD COLUMN IF NOT EXISTS period INTEGER NOT NULL DEFAULT 1;

-- Add clock_snapshot to stat_events
ALTER TABLE public.stat_events
ADD COLUMN IF NOT EXISTS clock_snapshot TEXT;

-- Add team to stat_events to avoid cross-referencing players always
ALTER TABLE public.stat_events
ADD COLUMN IF NOT EXISTS team TEXT CHECK (team IN ('A', 'B'));
