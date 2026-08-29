-- Migration 00020: Update global player_stats_summary view to include
-- the new stat types (reb, blk, stl, ast) alongside the original columns.

CREATE OR REPLACE VIEW public.player_stats_summary AS
SELECT
  p.id                                                          AS player_id,
  p.full_name,
  p.jersey_name,
  p.position,
  COUNT(DISTINCT gr.game_id)                                    AS games_played,

  -- Scoring
  COALESCE(SUM(
    CASE
      WHEN e.event_type = '2pt' THEN 2
      WHEN e.event_type = '3pt' THEN 3
      WHEN e.event_type = 'ft'  THEN 1
      ELSE 0
    END
  ), 0)                                                         AS total_points,
  COALESCE(SUM(CASE WHEN e.event_type = '3pt'  THEN 1 ELSE 0 END), 0) AS three_pointers_made,

  -- New stats
  COALESCE(SUM(CASE WHEN e.event_type = 'reb'  THEN 1 ELSE 0 END), 0) AS total_rebounds,
  COALESCE(SUM(CASE WHEN e.event_type = 'ast'  THEN 1 ELSE 0 END), 0) AS total_assists,
  COALESCE(SUM(CASE WHEN e.event_type = 'stl'  THEN 1 ELSE 0 END), 0) AS total_steals,
  COALESCE(SUM(CASE WHEN e.event_type = 'blk'  THEN 1 ELSE 0 END), 0) AS total_blocks,
  COALESCE(SUM(CASE WHEN e.event_type = 'foul' THEN 1 ELSE 0 END), 0) AS total_fouls

FROM public.players p
LEFT JOIN public.game_rosters gr ON p.id = gr.player_id
LEFT JOIN public.stat_events e   ON gr.game_id = e.game_id AND gr.player_id = e.player_id
GROUP BY p.id, p.full_name, p.jersey_name, p.position;
