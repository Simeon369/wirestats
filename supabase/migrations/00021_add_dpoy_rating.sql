-- Migration 00021: Add dpoy_rating to tournament_player_leaderboard view
-- Formula: (2.0 * STL) + (1.8 * BLK) + (1.0 * REB) - (0.5 * PF)

DROP VIEW IF EXISTS public.tournament_player_leaderboard;

CREATE OR REPLACE VIEW public.tournament_player_leaderboard AS
SELECT
  p.id                                                          AS player_id,
  p.full_name,
  p.jersey_name,
  p.position,
  CASE WHEN gr.team = 'A' THEN g.team_a_id   ELSE g.team_b_id   END AS team_id,
  CASE WHEN gr.team = 'A' THEN g.team_a_name ELSE g.team_b_name END AS team_name,
  CASE WHEN gr.team = 'A' THEN g.team_a_color ELSE g.team_b_color END AS team_color,
  g.tournament_id,
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
  COALESCE(SUM(CASE WHEN e.event_type = 'foul' THEN 1 ELSE 0 END), 0) AS total_fouls,

  -- MVP Rating formula: PTS + 1.5*AST + 1.2*REB + 2.0*STL + 1.8*BLK - 0.5*PF
  ROUND(
    COALESCE(SUM(
      CASE
        WHEN e.event_type = '2pt' THEN 2
        WHEN e.event_type = '3pt' THEN 3
        WHEN e.event_type = 'ft'  THEN 1
        ELSE 0
      END
    ), 0)
    + (1.5 * COALESCE(SUM(CASE WHEN e.event_type = 'ast'  THEN 1 ELSE 0 END), 0))
    + (1.2 * COALESCE(SUM(CASE WHEN e.event_type = 'reb'  THEN 1 ELSE 0 END), 0))
    + (2.0 * COALESCE(SUM(CASE WHEN e.event_type = 'stl'  THEN 1 ELSE 0 END), 0))
    + (1.8 * COALESCE(SUM(CASE WHEN e.event_type = 'blk'  THEN 1 ELSE 0 END), 0))
    - (0.5 * COALESCE(SUM(CASE WHEN e.event_type = 'foul' THEN 1 ELSE 0 END), 0))
  , 1)                                                          AS mvp_rating,

  -- DPOY Rating formula: (2.0 * STL) + (1.8 * BLK) + (1.0 * REB) - (0.5 * PF)
  ROUND(
    (2.0 * COALESCE(SUM(CASE WHEN e.event_type = 'stl'  THEN 1 ELSE 0 END), 0))
    + (1.8 * COALESCE(SUM(CASE WHEN e.event_type = 'blk'  THEN 1 ELSE 0 END), 0))
    + (1.0 * COALESCE(SUM(CASE WHEN e.event_type = 'reb'  THEN 1 ELSE 0 END), 0))
    - (0.5 * COALESCE(SUM(CASE WHEN e.event_type = 'foul' THEN 1 ELSE 0 END), 0))
  , 1)                                                          AS dpoy_rating

FROM public.players p
JOIN public.game_rosters gr   ON p.id = gr.player_id
JOIN public.games g           ON gr.game_id = g.id
-- Only count events that belong to this player in this game
LEFT JOIN public.stat_events e
  ON e.game_id = g.id
  AND e.player_id = p.id

WHERE
  g.tournament_id IS NOT NULL
  AND g.status = 'finished'  -- Only finished games qualify

GROUP BY
  p.id,
  p.full_name,
  p.jersey_name,
  p.position,
  CASE WHEN gr.team = 'A' THEN g.team_a_id   ELSE g.team_b_id   END,
  CASE WHEN gr.team = 'A' THEN g.team_a_name ELSE g.team_b_name END,
  CASE WHEN gr.team = 'A' THEN g.team_a_color ELSE g.team_b_color END,
  g.tournament_id

-- Must have at least 1 stat event (excludes 0-stat players)
HAVING COUNT(e.id) > 0;
