-- Migration 00021: Add age and profile_image to players

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Drop and recreate player_stats_summary to avoid column-rename conflict
DROP VIEW IF EXISTS public.player_stats_summary;

CREATE VIEW public.player_stats_summary AS
SELECT
  p.id                                                          AS player_id,
  p.full_name,
  p.jersey_name,
  p.position,
  p.gender,
  p.age,
  p.profile_image,
  p.created_at,
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

  -- Stats
  COALESCE(SUM(CASE WHEN e.event_type = 'reb'  THEN 1 ELSE 0 END), 0) AS total_rebounds,
  COALESCE(SUM(CASE WHEN e.event_type = 'ast'  THEN 1 ELSE 0 END), 0) AS total_assists,
  COALESCE(SUM(CASE WHEN e.event_type = 'stl'  THEN 1 ELSE 0 END), 0) AS total_steals,
  COALESCE(SUM(CASE WHEN e.event_type = 'blk'  THEN 1 ELSE 0 END), 0) AS total_blocks,
  COALESCE(SUM(CASE WHEN e.event_type = 'foul' THEN 1 ELSE 0 END), 0) AS total_fouls

FROM public.players p
LEFT JOIN public.game_rosters gr ON p.id = gr.player_id
LEFT JOIN public.stat_events e   ON gr.game_id = e.game_id AND gr.player_id = e.player_id
GROUP BY p.id, p.full_name, p.jersey_name, p.position, p.gender, p.age, p.profile_image, p.created_at;

-- Drop and recreate tournament_player_leaderboard to include new fields
DROP VIEW IF EXISTS public.tournament_player_leaderboard;

CREATE VIEW public.tournament_player_leaderboard AS
SELECT
  p.id AS player_id,
  p.full_name,
  p.jersey_name,
  p.position,
  p.gender,
  p.age,
  p.profile_image,
  t.id AS team_id,
  t.tournament_id,

  COUNT(DISTINCT gr.game_id) AS games_played,

  -- Stats aggregation
  COALESCE(SUM(CASE WHEN e.event_type = '2pt' THEN 2 WHEN e.event_type = '3pt' THEN 3 WHEN e.event_type = 'ft' THEN 1 ELSE 0 END), 0) AS total_points,
  COALESCE(SUM(CASE WHEN e.event_type = '3pt'  THEN 1 ELSE 0 END), 0) AS three_pointers_made,
  COALESCE(SUM(CASE WHEN e.event_type = 'foul' THEN 1 ELSE 0 END), 0) AS total_fouls,
  COALESCE(SUM(CASE WHEN e.event_type = 'reb'  THEN 1 ELSE 0 END), 0) AS total_rebounds,
  COALESCE(SUM(CASE WHEN e.event_type = 'blk'  THEN 1 ELSE 0 END), 0) AS total_blocks,
  COALESCE(SUM(CASE WHEN e.event_type = 'stl'  THEN 1 ELSE 0 END), 0) AS total_steals,
  COALESCE(SUM(CASE WHEN e.event_type = 'ast'  THEN 1 ELSE 0 END), 0) AS total_assists

FROM public.players p
JOIN public.game_rosters gr ON p.id = gr.player_id
JOIN public.teams t ON (gr.team = 'A' AND gr.game_id IN (SELECT id FROM public.games WHERE team_a = t.id))
                    OR (gr.team = 'B' AND gr.game_id IN (SELECT id FROM public.games WHERE team_b = t.id))
LEFT JOIN public.stat_events e ON gr.game_id = e.game_id AND gr.player_id = e.player_id
GROUP BY p.id, p.full_name, p.jersey_name, p.position, p.gender, p.age, p.profile_image, t.id, t.tournament_id;
