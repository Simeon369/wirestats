-- Migration 00018: Add new stat types (reb, blk, stl, ast) to stat_events
-- These stat types were added to the admin tracking UI but were blocked by
-- the existing CHECK constraint on event_type.

-- Drop the old constraint that only allows the original event types
ALTER TABLE public.stat_events
DROP CONSTRAINT IF EXISTS stat_events_event_type_check;

-- Recreate it with the full set of event types including the new ones
ALTER TABLE public.stat_events
ADD CONSTRAINT stat_events_event_type_check
CHECK (event_type IN ('ft', '2pt', '3pt', 'foul', 'toggle_status', 'sub', 'reb', 'blk', 'stl', 'ast'));
