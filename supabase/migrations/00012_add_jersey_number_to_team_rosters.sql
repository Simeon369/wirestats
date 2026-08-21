-- Migration 00012: Add jersey_number to team_rosters

ALTER TABLE public.team_rosters
ADD COLUMN jersey_number INT;
