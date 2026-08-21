-- 1. Teams Table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#000000',
  logo_url TEXT
);

-- 2. Team Rosters
CREATE TABLE team_rosters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(team_id, player_id)
);

-- 3. Tournaments Table
CREATE TABLE tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('ROUND_ROBIN', 'SINGLE_ELIMINATION', 'HYBRID')),
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED')),
  period_type TEXT DEFAULT 'QUARTER' CHECK (period_type IN ('QUARTER', 'HALF')),
  period_length_mins INT DEFAULT 10,
  foul_limit INT DEFAULT 5
);


-- 2. Tournament Teams Junction
CREATE TABLE tournament_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  group_name TEXT DEFAULT 'Group A',
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  points_for INT DEFAULT 0,
  points_against INT DEFAULT 0,
  point_differential INT DEFAULT 0,
  UNIQUE(tournament_id, team_id)
);

-- 3. Game Tournament Linkage
ALTER TABLE games 
ADD COLUMN tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
ADD COLUMN round_name TEXT,
ADD COLUMN team_a_id UUID REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN team_b_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- 4. Tournament Player Stats Summary View
CREATE OR REPLACE VIEW tournament_player_leaderboard AS
SELECT 
  p.id AS player_id,
  p.full_name,
  p.jersey_name,
  p.position,
  CASE WHEN gr.team = 'A' THEN g.team_a_id ELSE g.team_b_id END AS team_id,
  g.tournament_id,
  COUNT(DISTINCT gr.game_id) AS games_played,
  COALESCE(SUM(CASE WHEN e.event_type = '2pt' THEN 2 WHEN e.event_type = '3pt' THEN 3 WHEN e.event_type = 'ft' THEN 1 ELSE 0 END), 0) AS total_points,
  COALESCE(SUM(CASE WHEN e.event_type = '3pt' THEN 1 ELSE 0 END), 0) AS three_pointers_made,
  COALESCE(SUM(CASE WHEN e.event_type = 'foul' THEN 1 ELSE 0 END), 0) AS total_fouls
FROM players p
JOIN game_rosters gr ON p.id = gr.player_id
JOIN games g ON gr.game_id = g.id
LEFT JOIN stat_events e ON gr.game_id = e.game_id AND gr.player_id = e.player_id
WHERE g.tournament_id IS NOT NULL AND g.status = 'finished'
GROUP BY p.id, p.full_name, p.jersey_name, p.position, CASE WHEN gr.team = 'A' THEN g.team_a_id ELSE g.team_b_id END, g.tournament_id;
