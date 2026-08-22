-- Drop the existing view first so we can add new columns (gender, created_at)
-- PostgreSQL does not allow changing column order via CREATE OR REPLACE VIEW
DROP VIEW IF EXISTS public.player_stats_summary;

CREATE VIEW public.player_stats_summary AS
SELECT 
  p.id AS player_id,
  p.full_name,
  p.jersey_name,
  p.position,
  p.gender,
  MAX(p.created_at) AS created_at,
  COUNT(DISTINCT gr.game_id) AS games_played,
  COALESCE(SUM(CASE WHEN e.event_type = '2pt' THEN 2 WHEN e.event_type = '3pt' THEN 3 WHEN e.event_type = 'ft' THEN 1 ELSE 0 END), 0) AS total_points,
  COALESCE(SUM(CASE WHEN e.event_type = '3pt' THEN 1 ELSE 0 END), 0) AS three_pointers_made,
  COALESCE(SUM(CASE WHEN e.event_type = 'foul' THEN 1 ELSE 0 END), 0) AS total_fouls
FROM public.players p
LEFT JOIN public.game_rosters gr ON p.id = gr.player_id
LEFT JOIN public.stat_events e ON gr.game_id = e.game_id AND gr.player_id = e.player_id
GROUP BY p.id, p.full_name, p.jersey_name, p.position, p.gender;
